// Simple job processor to replace Redis queue system
import { memoryStorage, Job, Step, Asset } from './memory-storage'
import { generateScript, generateImage, generateVideo, generateSpeech, calculateTokenCost, generateContentSpecificImage } from './openai'
import { VideoComposer } from './video-composer'
import { generateScript as mockGenerateScript, generateImage as mockGenerateImage, generateVideo as mockGenerateVideo, calculateTokenCost as mockCalculateTokenCost } from './mock-openai'
import { heygenClient } from './heygen'
import { mockHeygenClient } from './mock-heygen'
import { generateVeo3VideoWithScript, mockGenerateVeo3VideoWithScript } from './gemini'
import { whiteboardAnimator } from './whiteboard-animator'
import { createSceneGenerator } from './scene-generator'

export interface CreateJobRequest {
  prompt: string
  aspectRatio: '16:9' | '9:16' | '1:1'
  duration: number
  languages: string[]
  voiceId?: string
  ttsProvider?: 'heygen' | 'openai'
  openaiVoice?: string
  styleProfile?: string
  imageTheme?: string // Theme ID for consistent image generation
  imageStyle?: string
  script?: any // Pre-generated script from storyboard
  generationMode?: 'images' | 'videos' | 'whiteboard' | 'scene_generator' // Choose between image generation (ChatGPT), video generation (Veo3), whiteboard animation, or scene generator
  useAvatar?: boolean // Whether to use HeyGen avatar for audio
  avatarMode?: 'fullscreen' | 'corner' | 'alternating' // Avatar composition mode
  avatarId?: string // HeyGen avatar ID
  stickerStyle?: string
}

export interface JobResponse {
  id: string
  status: 'QUEUED' | 'RUNNING' | 'FAILED' | 'DONE'
  prompt: string
  aspectRatio: string
  duration: number
  languages: string[]
  voiceId?: string
  ttsProvider?: 'heygen' | 'openai'
  openaiVoice?: string
  totalCost: number
  resultUrls?: { [language: string]: string }
  script?: any // Include the script in the response
  createdAt: string
  updatedAt: string
  steps: Step[]
  assets: Asset[]
}

class SimpleProcessor {
  private processingJobs: Set<string> = new Set()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Clean up abandoned jobs every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupAbandonedJobs()
    }, 5 * 60 * 1000)
  }

  async createJob(request: CreateJobRequest): Promise<JobResponse> {
    console.log('Creating job with request:', {
      prompt: request.prompt,
      languages: request.languages,
      hasScript: !!request.script,
      generationMode: request.generationMode,
      useAvatar: request.useAvatar,
      avatarMode: request.avatarMode,
      avatarId: request.avatarId,
      ttsProvider: request.ttsProvider
    })
    console.log('Full request object:', JSON.stringify(request, null, 2))

    const job = await memoryStorage.createJob({
      prompt: request.prompt,
      aspectRatio: request.aspectRatio,
      duration: request.duration,
      language: request.languages.join(','), // Store all languages as comma-separated string
      voiceId: request.voiceId,
      status: 'QUEUED',
      totalCost: 0,
      styleProfile: request.styleProfile || 'Modern medical infographic style, high contrast, minimal text, friendly but professional icons, clean typography, muted color palette with accent colors',
      imageTheme: request.imageTheme || 'whiteboard', // Store the selected theme
      imageStyle: request.imageStyle || 'whiteboard_bw',
      // @ts-ignore store sticker style on job
      stickerStyle: request.stickerStyle || 'cute cartoon',
      script: request.script, // Store the script with multi-language support
      ttsProvider: request.ttsProvider || 'openai',
      openaiVoice: request.openaiVoice || 'alloy',
      generationMode: request.generationMode || 'images',
      useAvatar: request.useAvatar === true,
      avatarMode: request.avatarMode || 'fullscreen',
      avatarId: request.avatarId
    })

    console.log('Job created successfully:', job.id)
    console.log('Job details:', {
      useAvatar: job.useAvatar,
      avatarMode: job.avatarMode,
      avatarId: job.avatarId,
      ttsProvider: job.ttsProvider
    })
    console.log('Full job object:', JSON.stringify(job, null, 2))

    // Start processing immediately (no queue needed)
    this.processJob(job.id).catch(error => {
      console.error(`Job ${job.id} processing failed:`, error)
      // Update job status to failed
      memoryStorage.updateJob(job.id, { 
        status: 'FAILED',
        totalCost: 0
      }).catch(updateError => {
        console.error('Failed to update job status to FAILED:', updateError)
      })
    })

    return this.jobToResponse(job)
  }

  async getJob(jobId: string): Promise<JobResponse | null> {
    const job = await memoryStorage.getJob(jobId)
    if (!job) return null

    return this.jobToResponse(job)
  }

  async updateJob(jobId: string, updates: Partial<Job>): Promise<void> {
    await memoryStorage.updateJob(jobId, updates)
  }

  async processJob(jobId: string): Promise<void> {
    if (this.processingJobs.has(jobId)) {
      console.log(`Job ${jobId} is already being processed`)
      return // Already processing
    }

    this.processingJobs.add(jobId)
    console.log(`Starting processing for job ${jobId}`)

    try {
      const job = await memoryStorage.getJob(jobId)
      if (!job) {
        throw new Error(`Job ${jobId} not found in storage`)
      }
      
      console.log(`Found job ${jobId}:`, {
        prompt: job.prompt,
        language: job.language,
        status: job.status,
        hasScript: !!job.script
      })

      // Update job status to running
      await memoryStorage.updateJob(jobId, { status: 'RUNNING' })

      console.log(`Starting job ${jobId}: ${job.prompt}`)

      // Determine provider availability so we don't enter demo mode if OpenAI is available
      const hasOpenAI = !!process.env.OPENAI_API_KEY &&
        process.env.OPENAI_API_KEY !== 'mock' &&
        process.env.OPENAI_API_KEY !== 'your_openai_api_key_here'
      const hasHeygen = !!process.env.HEYGEN_API_KEY &&
        process.env.HEYGEN_API_KEY !== 'mock' &&
        process.env.HEYGEN_API_KEY !== 'your_heygen_api_key_here'
      const isDemoMode = !hasOpenAI && !hasHeygen

      // Get languages from the job request (we need to pass this through somehow)
      // For now, we'll use the job's language field and assume it's a comma-separated list
      const languages = job.language ? job.language.split(',') : ['en']
      console.log(`Processing job for languages: ${languages.join(', ')}`)

      // Step 1: Generate or use provided script
      await this.updateStepStatus(jobId, 'SCRIPT', 'RUNNING')
      let script
      let scriptCost = 0
      
      if (job.script) {
        // Use pre-generated script from storyboard
        script = job.script
        console.log(`Using pre-generated script with ${script.scenes?.length || 0} scenes`)
        if (script.languages) {
          console.log(`Multi-language script with languages: ${Object.keys(script.languages).join(', ')}`)
        }
        // No cost for pre-generated scripts
        scriptCost = 0
      } else {
        // Generate new script for first language only
        console.log(`Generating script for language: ${languages[0]} with theme: ${job.imageTheme || 'whiteboard'}`)
        script = hasOpenAI
          ? await generateScript(job.prompt, job.duration, languages[0], job.imageTheme || 'whiteboard')
          : await mockGenerateScript(job.prompt, job.duration, languages[0], job.imageTheme || 'whiteboard')
        console.log(`Generated new script with ${script.scenes.length} scenes`)
        
        // Calculate script cost
        scriptCost = hasOpenAI 
          ? calculateTokenCost(1000, 500)
          : mockCalculateTokenCost(1000, 500)
      }
      
      // Update job with script cost and track usage
      await memoryStorage.updateJob(jobId, { totalCost: scriptCost })
      await memoryStorage.addUsage(scriptCost)
      await this.updateStepStatus(jobId, 'SCRIPT', 'DONE', undefined, script)

      // Step 2: Generate Images or Videos (shared across all languages)
      const generationMode = job.generationMode || 'images'
      console.log(`[DEBUG] Job generation mode: ${generationMode}`)
      console.log(`[DEBUG] Job object:`, JSON.stringify(job, null, 2))
      await this.updateStepStatus(jobId, 'IMAGES', 'RUNNING')
      const imageAssets = []
      // Use the first language's scenes for image/video generation (shared)
      const scenes = script.languages ? script.languages[languages[0]]?.scenes || script.scenes : script.scenes
      console.log(`[DEBUG] Generating ${generationMode} for ${scenes.length} scenes`)
      
      // Calculate video dimensions for proper aspect ratio (replicate mapping locally)
      const getVideoDimensions = (aspect: '16:9' | '9:16' | '1:1') => {
        switch (aspect) {
          case '16:9':
            return { width: 1920, height: 1080 }
          case '9:16':
            return { width: 1080, height: 1920 }
          case '1:1':
            return { width: 1024, height: 1024 }
          default:
            return { width: 1920, height: 1080 }
        }
      }
      const dimensions = getVideoDimensions(job.aspectRatio as '16:9' | '9:16' | '1:1')
      console.log(`Video dimensions: ${dimensions.width}x${dimensions.height} (${job.aspectRatio})`)
      
      for (let i = 0; i < scenes.length; i++) {
        const scene = scenes[i]
        
        if (generationMode === 'videos') {
          // Generate Veo3 videos
          console.log(`Generating Veo3 video ${i + 1}/${scenes.length}: ${scene.narration.substring(0, 50)}...`)
          const hasGemini = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here'
          console.log(`[DEBUG] Has Gemini API key: ${hasGemini}`)
          console.log(`[DEBUG] GEMINI_API_KEY value: ${process.env.GEMINI_API_KEY ? 'SET' : 'NOT SET'}`)
          console.log(`[DEBUG] GEMINI_API_KEY length: ${process.env.GEMINI_API_KEY?.length || 0}`)
          const videoBuffer = await (hasGemini ? generateVeo3VideoWithScript(scene.narration, i, scenes.length, job.aspectRatio as '16:9' | '9:16' | '1:1') : mockGenerateVeo3VideoWithScript(scene.narration, i, scenes.length, job.aspectRatio as '16:9' | '9:16' | '1:1'))
          const videoUrl = await memoryStorage.storeFile(jobId, 'video', `scene_${i}_video.mp4`, videoBuffer)
          
          await memoryStorage.createAsset({
            jobId,
            kind: 'VIDEO',
            url: videoUrl,
            meta: { sceneId: scene.sceneId, sceneIndex: i, type: 'veo3' }
          })
          imageAssets.push({ scene, videoBuffer, videoUrl, type: 'video' })
        } else if (generationMode === 'whiteboard') {
          // Generate whiteboard animations
          console.log(`Generating whiteboard animation ${i + 1}/${scenes.length}: ${scene.narration.substring(0, 50)}...`)
          const animationResult = await whiteboardAnimator.generateWhiteboardAnimation({
            prompt: scene.narration,
            aspectRatio: job.aspectRatio as '16:9' | '9:16' | '1:1',
            duration: scene.duration || 20,
            strokeStyle: '#000000',
            lineWidth: 3,
            animationSpeed: 30
          })
          
          const videoUrl = await memoryStorage.storeFile(jobId, 'video', `scene_${i}_whiteboard.mp4`, animationResult.videoBuffer)
          const imageUrl = await memoryStorage.storeFile(jobId, 'image', `scene_${i}_whiteboard.jpg`, animationResult.imageBuffer)
          
          await memoryStorage.createAsset({
            jobId,
            kind: 'VIDEO',
            url: videoUrl,
            meta: { sceneId: scene.sceneId, sceneIndex: i, type: 'whiteboard' }
          })
          
          await memoryStorage.createAsset({
            jobId,
            kind: 'IMAGE',
            url: imageUrl,
            meta: { sceneId: scene.sceneId, sceneIndex: i, type: 'whiteboard' }
          })
          
          imageAssets.push({ 
            scene, 
            videoBuffer: animationResult.videoBuffer, 
            imageBuffer: animationResult.imageBuffer,
            videoUrl, 
            imageUrl,
            type: 'whiteboard' 
          })
        } else if (generationMode === 'scene_generator') {
          // Generate scene using AI storyboard + whiteboard with narration-first approach
          console.log(`[SCENE_GENERATOR] Generating scene ${i + 1}/${scenes.length}: ${scene.narration.substring(0, 50)}...`)
          
          const openaiApiKey = process.env.OPENAI_API_KEY
          if (!openaiApiKey) {
            throw new Error('OpenAI API key required for scene generator')
          }
          
          // Use the scene generator to create whiteboard videos with narration-first approach
          const { createSceneGenerator } = await import('./scene-generator')
          const sceneGenerator = createSceneGenerator(openaiApiKey, (job as any).stickerStyle, (job as any).imageStyle)
          
          console.log(`[SCENE_GENERATOR] Creating whiteboard animation for scene ${i + 1}: "${scene.narration}"`)
          
          // Generate the complete scene with narration-first approach
          const sceneResult = await sceneGenerator.generateScenes({
            narration: scene.narration,
            aspectRatio: job.aspectRatio as '16:9' | '9:16' | '1:1',
            duration: scene.duration || 20
          })
          
          // Get the generated scene (should be only one)
          const generatedScene = sceneResult.scenes[0]
          if (!generatedScene) {
            throw new Error(`Failed to generate scene ${i + 1}`)
          }
          
          console.log(`[SCENE_GENERATOR] Generated whiteboard video for scene ${i + 1}, size: ${generatedScene.videoBuffer.length} bytes, duration: ${generatedScene.duration}s`)
          
          // Create a placeholder image buffer (we could extract a frame from the video if needed)
          const imageBuffer = Buffer.alloc(0) // Placeholder for now
          
          const videoUrl = await memoryStorage.storeFile(jobId, 'video', `scene_${i}_generated.mp4`, generatedScene.videoBuffer)
          const imageUrl = await memoryStorage.storeFile(jobId, 'image', `scene_${i}_generated.jpg`, imageBuffer)
          
          await memoryStorage.createAsset({
            jobId,
            kind: 'VIDEO',
            url: videoUrl,
            meta: { 
              sceneId: scene.sceneId, 
              sceneIndex: i, 
              type: 'scene_generator'
            }
          })
          
          await memoryStorage.createAsset({
            jobId,
            kind: 'IMAGE',
            url: imageUrl,
            meta: { 
              sceneId: scene.sceneId, 
              sceneIndex: i, 
              type: 'scene_generator'
            }
          })
          
          imageAssets.push({ 
            scene, 
            videoBuffer: generatedScene.videoBuffer,
            audioBuffer: generatedScene.audioBuffer,
            imageBuffer: imageBuffer,
            videoUrl,
            imageUrl,
            type: 'scene_generator' 
          })
          
          console.log(`[SCENE_GENERATOR] Completed scene ${i + 1}/${scenes.length}`)
        } else {
          // Generate images (existing logic)
          console.log(`Generating image ${i + 1}/${scenes.length}: ${scene.imageDescription.substring(0, 50)}...`)
          
          // Build context for enhanced image generation
          const context = {
            originalPrompt: job.prompt,
            videoTitle: script.title,
            previousScenes: scenes.slice(0, i),
            nextScenes: scenes.slice(i + 1)
          }
          
          const imageBuffer = await (hasOpenAI ? 
            generateContentSpecificImage(
              scene.narration, 
              scene.imageDescription, 
              job.imageTheme || 'whiteboard', 
              i, 
              scenes.length, 
              dimensions,
              context
            ) : 
            mockGenerateImage(scene.imageDescription)
          )
          const imageUrl = await memoryStorage.storeFile(jobId, 'image', `scene_${i}_image.jpg`, imageBuffer)
          
          await memoryStorage.createAsset({
            jobId,
            kind: 'IMAGE',
            url: imageUrl,
            meta: { sceneId: scene.sceneId, sceneIndex: i }
          })
          imageAssets.push({ scene, imageBuffer, imageUrl, type: 'image' })
        }
      }
      
      // Update cost with image generation
      const interimImageCost = scenes.length * 0.08 // $0.08 per image
      await memoryStorage.updateJob(jobId, { totalCost: scriptCost + interimImageCost })
      await memoryStorage.addUsage(interimImageCost)
      console.log(`Images generated. Cost so far: $${(scriptCost + interimImageCost).toFixed(4)}`)
      await this.updateStepStatus(jobId, 'IMAGES', 'DONE')

      // Step 3: Generate Audio for each language
      await this.updateStepStatus(jobId, 'NARRATION', 'RUNNING')
      const resultUrls: { [language: string]: string } = {}
      
      for (const langCode of languages) {
        console.log(`Generating audio for language: ${langCode}`)
        
        // Get scenes for this language
        const langScenes = script.languages ? script.languages[langCode]?.scenes || scenes : scenes
        console.log(`Using ${langScenes.length} scenes for language ${langCode}`)
        
        const audioAssets = []
        for (let i = 0; i < langScenes.length; i++) {
          const scene = langScenes[i]
          let audioBuffer: Buffer
          
          console.log(`[AUDIO] Processing scene ${i + 1}/${langScenes.length}, job.useAvatar: ${job.useAvatar}`)
          
          if (job.useAvatar) {
            // Generate HeyGen avatar video (provides both audio and video)
            console.log(`[AVATAR] Generating HeyGen avatar video ${i + 1}/${langScenes.length}: ${scene.narration.substring(0, 50)}...`)
            console.log(`[AVATAR] Job useAvatar: ${job.useAvatar}, avatarMode: ${job.avatarMode}, avatarId: ${job.avatarId}`)
            const hasHeygen = !!process.env.HEYGEN_API_KEY && process.env.HEYGEN_API_KEY !== 'your_heygen_api_key_here'
            console.log(`[AVATAR] Has HeyGen API key: ${hasHeygen}`)
            
            if (!hasHeygen) {
              throw new Error('Avatar mode selected but HEYGEN_API_KEY is not configured. Please set up your HeyGen API key to use avatar generation.')
            }
            
            if (hasHeygen) {
              const { heygenClient } = await import('./heygen')
              const avatarId = job.avatarId || process.env.HEYGEN_AVATAR_ID || 'Lina_Dress_Sitting_Side_public'
              const voiceId = job.voiceId || process.env.HEYGEN_VOICE_ID || ''
              
              console.log(`Using avatar: ${avatarId}, voice: ${voiceId}`)
              
              try {
                // Generate avatar video
                const videoBuffer = await heygenClient.generateAvatarVideoAndWait(
                  scene.narration,
                  avatarId,
                  voiceId,
                  300000 // 5 minutes timeout
                )
              
              const videoUrl = await memoryStorage.storeFile(jobId, 'video', `${langCode}_scene_${i}_avatar.mp4`, videoBuffer)
              
              await memoryStorage.createAsset({
                jobId,
                kind: 'VIDEO',
                url: videoUrl,
                meta: { 
                  sceneId: scene.sceneId, 
                  sceneIndex: i, 
                  language: langCode,
                  type: 'avatar',
                  avatarMode: job.avatarMode || 'fullscreen',
                  avatarId,
                  voiceId
                }
              })
              
              // Extract audio from avatar video
              audioBuffer = await heygenClient.extractAudioFromMp4(videoBuffer)
              const audioUrl = await memoryStorage.storeFile(jobId, 'audio', `${langCode}_scene_${i}_audio.mp3`, audioBuffer)
              
              await memoryStorage.createAsset({
                jobId,
                kind: 'AUDIO',
                url: audioUrl,
                meta: { sceneId: scene.sceneId, sceneIndex: i, language: langCode }
              })
              
              audioAssets.push({ ...imageAssets[i], scene, audioBuffer, audioUrl, videoBuffer, videoUrl, type: 'avatar' })
              } catch (error) {
                console.error(`[AVATAR] Failed to generate avatar video for scene ${i}:`, error)
                throw new Error(`Avatar video generation failed for scene ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`)
              }
            } else {
              // Mock avatar video generation
              console.log('[AVATAR] Using mock avatar video generation')
              try {
                const mockVideoBuffer = await this.generateMockAvatarVideo(scene.narration, dimensions)
              const videoUrl = await memoryStorage.storeFile(jobId, 'video', `${langCode}_scene_${i}_avatar.mp4`, mockVideoBuffer)
              
              await memoryStorage.createAsset({
                jobId,
                kind: 'VIDEO',
                url: videoUrl,
                meta: { 
                  sceneId: scene.sceneId, 
                  sceneIndex: i, 
                  language: langCode,
                  type: 'avatar',
                  avatarMode: job.avatarMode || 'fullscreen'
                }
              })
              
              // Mock audio
              audioBuffer = Buffer.from(`Mock avatar audio for scene ${i}`)
              const audioUrl = await memoryStorage.storeFile(jobId, 'audio', `${langCode}_scene_${i}_audio.mp3`, audioBuffer)
              
              await memoryStorage.createAsset({
                jobId,
                kind: 'AUDIO',
                url: audioUrl,
                meta: { sceneId: scene.sceneId, sceneIndex: i, language: langCode }
              })
              
              audioAssets.push({ ...imageAssets[i], scene, audioBuffer, audioUrl, videoBuffer: mockVideoBuffer, videoUrl, type: 'avatar' })
              } catch (error) {
                console.error(`[AVATAR] Failed to generate mock avatar video for scene ${i}:`, error)
                throw new Error(`Mock avatar video generation failed for scene ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`)
              }
            }
          } else if (job.ttsProvider === 'openai') {
            // Use OpenAI TTS
            console.log(`Generating audio with OpenAI TTS (voice: ${job.openaiVoice || 'alloy'}) for scene ${i}`)
            audioBuffer = isDemoMode 
              ? Buffer.from(`Mock OpenAI TTS audio for scene ${i}`)
              : await generateSpeech(scene.narration, job.openaiVoice || 'alloy')
              
            const audioUrl = await memoryStorage.storeFile(jobId, 'audio', `${langCode}_scene_${i}_audio.mp3`, audioBuffer)
            
            await memoryStorage.createAsset({
              jobId,
              kind: 'AUDIO',
              url: audioUrl,
              meta: { sceneId: scene.sceneId, sceneIndex: i, language: langCode }
            })
            audioAssets.push({ ...imageAssets[i], scene, audioBuffer, audioUrl })
          } else {
            // Use HeyGen TTS (default)
            console.log(`[TTS] Generating audio with HeyGen TTS for scene ${i}`)
            console.log(`[TTS] Job useAvatar: ${job.useAvatar}, ttsProvider: ${job.ttsProvider}`)
            console.log(`[TTS] Why not using avatar? job.useAvatar is: ${job.useAvatar} (type: ${typeof job.useAvatar})`)
            audioBuffer = await (isDemoMode ? mockHeygenClient : heygenClient).generateAndWaitForCompletion(
              scene.narration,
              job.voiceId || process.env.HEYGEN_VOICE_ID || '1bd001e7e50f421d891986aad5158bc3'
            )
            
            const audioUrl = await memoryStorage.storeFile(jobId, 'audio', `${langCode}_scene_${i}_audio.mp3`, audioBuffer)
            
            await memoryStorage.createAsset({
              jobId,
              kind: 'AUDIO',
              url: audioUrl,
              meta: { sceneId: scene.sceneId, sceneIndex: i, language: langCode }
            })
            audioAssets.push({ ...imageAssets[i], scene, audioBuffer, audioUrl })
          }
        }

        // Step 4: Compose Video for this language
        let videoUrl: string
        try {
          const compositionOptions = {
            aspectRatio: job.aspectRatio as '16:9' | '9:16' | '1:1',
            scenes: (audioAssets as any[]).map((asset) => {
              if (generationMode === 'videos' && asset.type === 'video') {
                // Veo3 video scene
                return {
                  kind: 'VEO3_VIDEO' as const,
                  sceneId: asset.scene.sceneId,
                  videoBuffer: (asset as any).videoBuffer,
                  audioBuffer: (asset as any).audioBuffer,
                  caption: asset.scene.caption,
                  duration: asset.scene.duration,
                }
              } else if (generationMode === 'scene_generator' && asset.type === 'scene_generator') {
                // Scene generator video scene
                return {
                  kind: 'WHITEBOARD_ANIMATION' as const,
                  sceneId: asset.scene.sceneId,
                  videoBuffer: (asset as any).videoBuffer,
                  audioBuffer: (asset as any).audioBuffer,
                  caption: asset.scene.caption,
                  duration: asset.scene.duration,
                  imageBuffer: (asset as any).imageBuffer || Buffer.alloc(0), // Placeholder
                }
              } else {
                // Whiteboard image scene
                return {
                  kind: 'WHITEBOARD' as const,
                  sceneId: asset.scene.sceneId,
                  imageBuffer: (asset as any).imageBuffer,
                  videoBuffer: null,
                  audioBuffer: (asset as any).audioBuffer,
                  caption: asset.scene.caption,
                  duration: asset.scene.duration,
                }
              }
            }),
          }

          console.log(`Starting video composition for ${langCode} with FFmpeg...`)
          console.log(`Composition options:`, {
            aspectRatio: compositionOptions.aspectRatio,
            sceneCount: compositionOptions.scenes.length
          })
          
          const finalVideoBuffer = await new VideoComposer().composeVideo(compositionOptions, [langCode])
          console.log(`Video composition completed for ${langCode}, buffer size:`, finalVideoBuffer.length)
          videoUrl = await memoryStorage.storeFile(jobId, 'video', `${langCode}_final_video.mp4`, finalVideoBuffer)
          console.log(`Video saved for ${langCode} to:`, videoUrl)
        } catch (ffmpegError) {
          console.error(`FFmpeg error details for ${langCode}:`, ffmpegError)
          throw new Error(`Video composition failed for ${langCode}: ${ffmpegError instanceof Error ? ffmpegError.message : 'Unknown FFmpeg error'}`)
        }
        
        await memoryStorage.createAsset({
          jobId,
          kind: 'VIDEO',
          url: videoUrl,
          meta: { type: 'final_video', duration: job.duration, language: langCode }
        })

        resultUrls[langCode] = videoUrl
        console.log(`Added video URL for ${langCode}:`, videoUrl)
      }
      
      await this.updateStepStatus(jobId, 'NARRATION', 'DONE')
      await this.updateStepStatus(jobId, 'COMPOSITION', 'DONE')
      
      console.log(`All composition steps completed for job ${jobId}`)

      // Calculate total cost (per language)
      let totalCost = 0
      
      // Script generation cost (OpenAI)
      const finalScriptCost = isDemoMode 
        ? mockCalculateTokenCost(1000, 500)
        : calculateTokenCost(1000, 500)
      totalCost += finalScriptCost
      
      // Image generation cost (OpenAI DALL-E)
      const finalImageCost = scenes.length * 0.08 // $0.08 per image
      totalCost += finalImageCost
      
      // Audio generation cost (HeyGen or OpenAI TTS)
      const audioCost = scenes.length * languages.length * 0.24 // $0.24 per scene per language
      totalCost += audioCost
      
      // Video composition cost (minimal processing)
      const compositionCost = 0.01 // $0.01 per video
      totalCost += compositionCost * languages.length
      
      // Track total usage
      await memoryStorage.addUsage(audioCost + (compositionCost * languages.length))
      
      console.log('Cost breakdown:', {
        scriptCost: finalScriptCost.toFixed(4),
        imageCost: finalImageCost.toFixed(4),
        audioCost: audioCost.toFixed(4),
        compositionCost: (compositionCost * languages.length).toFixed(4),
        totalCost: totalCost.toFixed(4),
        languages: languages.length,
        scenes: scenes.length
      })

      // Update job as completed
      await memoryStorage.updateJob(jobId, {
        status: 'DONE',
        resultUrls,
        totalCost
      })

      console.log(`Job ${jobId} completed successfully with ${languages.length} language versions`)
      console.log('Result URLs:', resultUrls)
      console.log('Total cost:', totalCost)

    } catch (error) {
      console.error(`Job ${jobId} failed:`, error)
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : 'UnknownError'
      })
      
      // Get current cost before marking as failed
      const currentJob = await memoryStorage.getJob(jobId)
      const currentCost = currentJob?.totalCost || 0
      
      // Update job status to failed but keep the cost and any generated assets
      await memoryStorage.updateJob(jobId, { 
        status: 'FAILED',
        totalCost: currentCost // Keep the cost of what was generated
      })

      // Update the current step to failed
      const steps = await memoryStorage.getStepsByJob(jobId)
      const currentStep = steps.find(step => step.status === 'RUNNING')
      if (currentStep) {
        await memoryStorage.updateStep(currentStep.id, {
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
      
      console.log(`Job ${jobId} marked as FAILED. Cost incurred: $${currentCost.toFixed(4)}`)
    } finally {
      this.processingJobs.delete(jobId)
    }
  }

  private async updateStepStatus(
    jobId: string,
    stepType: 'SCRIPT' | 'IMAGES' | 'NARRATION' | 'COMPOSITION',
    status: 'PENDING' | 'RUNNING' | 'FAILED' | 'DONE',
    error?: string,
    payload?: any
  ) {
    const existingStep = await memoryStorage.getStepsByJob(jobId)
      .then(steps => steps.find(step => step.type === stepType))

    if (existingStep) {
      await memoryStorage.updateStep(existingStep.id, {
        status,
        error,
        payload,
        startedAt: status === 'RUNNING' ? new Date() : existingStep.startedAt,
        completedAt: status === 'DONE' || status === 'FAILED' ? new Date() : existingStep.completedAt,
      })
    } else {
      await memoryStorage.createStep({
        jobId,
        type: stepType,
        status,
        error,
        payload,
        startedAt: status === 'RUNNING' ? new Date() : undefined,
        completedAt: status === 'DONE' || status === 'FAILED' ? new Date() : undefined,
      })
    }
  }

  private jobToResponse(job: Job): JobResponse {
    const languages = job.language ? job.language.split(',') : [job.language || 'en']
    const resultUrls = job.resultUrls || (job.resultUrl ? { [languages[0]]: job.resultUrl } : undefined)
    
    console.log('Converting job to response:', {
      id: job.id,
      languages,
      resultUrls,
      hasResultUrls: !!job.resultUrls,
      hasResultUrl: !!job.resultUrl
    })
    
    return {
      id: job.id,
      status: job.status,
      prompt: job.prompt,
      aspectRatio: job.aspectRatio,
      duration: job.duration,
      languages,
      voiceId: job.voiceId,
      ttsProvider: job.ttsProvider,
      openaiVoice: job.openaiVoice,
      totalCost: job.totalCost,
      resultUrls,
      script: job.script, // Include the script in the response
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
      steps: job.steps,
      assets: job.assets
    }
  }

  // Clean up abandoned jobs (older than 10 minutes)
  private async cleanupAbandonedJobs() {
    try {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)
      const allJobs = await memoryStorage.getAllJobs()
      
      for (const job of allJobs) {
        if (job.status === 'RUNNING' && job.updatedAt < tenMinutesAgo) {
          console.log(`Cleaning up abandoned job: ${job.id}`)
          await memoryStorage.updateJob(job.id, { 
            status: 'FAILED',
            totalCost: 0
          })
          this.processingJobs.delete(job.id)
        }
      }
    } catch (error) {
      console.error('Error during job cleanup:', error)
    }
  }

  // Mock avatar video generation for testing
  private async generateMockAvatarVideo(text: string, dimensions: { width: number; height: number }): Promise<Buffer> {
    // Import as any to avoid TS type dependency for dev builds
    const ffmpegMod: any = await import('fluent-ffmpeg')
    const fs = await import('fs/promises')
    const path = await import('path')
    
    // Create a simple mock video with text overlay
    const tempDir = path.join(process.cwd(), 'temp', 'mock-avatar')
    await fs.mkdir(tempDir, { recursive: true })
    
    const outputPath = path.join(tempDir, `mock_avatar_${Date.now()}.mp4`)
    
    // Create a simple colored background video with text
    await new Promise<void>((resolve, reject) => {
      (ffmpegMod as any)()
        .input(`color=c=blue:size=${dimensions.width}x${dimensions.height}:duration=5`)
        .inputFormat('lavfi')
        .videoCodec('libx264')
        .outputOptions([
          '-pix_fmt yuv420p',
          '-r 30'
        ])
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', (err: any) => reject(err))
        .run()
    })
    
    const videoBuffer = await fs.readFile(outputPath)
    await fs.unlink(outputPath).catch(() => {}) // Clean up
    
    return videoBuffer
  }

  // Health check
  async healthCheck(): Promise<{ status: string; processing: number }> {
    return {
      status: 'healthy',
      processing: this.processingJobs.size
    }
  }
}

export const simpleProcessor = new SimpleProcessor()


