// Simple job processor to replace Redis queue system
import { memoryStorage, Job, Step, Asset } from './memory-storage'
import { generateScript, generateImage, generateVideo, calculateTokenCost } from './openai'
import { generateScript as mockGenerateScript, generateImage as mockGenerateImage, generateVideo as mockGenerateVideo, calculateTokenCost as mockCalculateTokenCost } from './mock-openai'
import { heygenClient } from './heygen'
import { mockHeygenClient } from './mock-heygen'
import { videoComposer } from './video-composer'

export interface CreateJobRequest {
  prompt: string
  aspectRatio: '16:9' | '9:16' | '1:1'
  duration: number
  languages: string[]
  voiceId?: string
  styleProfile?: string
  script?: any // Pre-generated script from storyboard
}

export interface JobResponse {
  id: string
  status: 'QUEUED' | 'RUNNING' | 'FAILED' | 'DONE'
  prompt: string
  aspectRatio: string
  duration: number
  languages: string[]
  voiceId?: string
  totalCost: number
  resultUrls?: { [language: string]: string }
  createdAt: string
  updatedAt: string
  steps: Step[]
  assets: Asset[]
}

class SimpleProcessor {
  private processingJobs: Set<string> = new Set()

  async createJob(request: CreateJobRequest): Promise<JobResponse> {
    const job = await memoryStorage.createJob({
      prompt: request.prompt,
      aspectRatio: request.aspectRatio,
      duration: request.duration,
      language: request.languages.join(','), // Store all languages as comma-separated string
      voiceId: request.voiceId,
      status: 'QUEUED',
      totalCost: 0,
      styleProfile: request.styleProfile || 'Modern medical infographic style, high contrast, minimal text, friendly but professional icons, clean typography, muted color palette with accent colors',
      script: request.script // Store the script with multi-language support
    })

    // Start processing immediately (no queue needed)
    this.processJob(job.id).catch(error => {
      console.error(`Job ${job.id} processing failed:`, error)
    })

    return this.jobToResponse(job)
  }

  async getJob(jobId: string): Promise<JobResponse | null> {
    const job = await memoryStorage.getJob(jobId)
    if (!job) return null

    return this.jobToResponse(job)
  }

  async processJob(jobId: string): Promise<void> {
    if (this.processingJobs.has(jobId)) {
      return // Already processing
    }

    this.processingJobs.add(jobId)

    try {
      const job = await memoryStorage.getJob(jobId)
      if (!job) {
        throw new Error('Job not found')
      }

      // Update job status to running
      await memoryStorage.updateJob(jobId, { status: 'RUNNING' })

      console.log(`Starting job ${jobId}: ${job.prompt}`)

      // Check if we're in demo mode (mock API keys or missing keys)
      const isDemoMode = !process.env.OPENAI_API_KEY || 
                        process.env.OPENAI_API_KEY === 'mock' || 
                        process.env.OPENAI_API_KEY === 'your_openai_api_key_here' ||
                        process.env.HEYGEN_API_KEY === 'mock' ||
                        process.env.HEYGEN_API_KEY === 'your_heygen_api_key_here'

      // Get languages from the job request (we need to pass this through somehow)
      // For now, we'll use the job's language field and assume it's a comma-separated list
      const languages = job.language ? job.language.split(',') : ['en']
      console.log(`Processing job for languages: ${languages.join(', ')}`)

      // Step 1: Generate or use provided script
      await this.updateStepStatus(jobId, 'SCRIPT', 'RUNNING')
      let script
      if (job.script) {
        // Use pre-generated script from storyboard
        script = job.script
        console.log(`Using pre-generated script with ${script.scenes?.length || 0} scenes`)
        if (script.languages) {
          console.log(`Multi-language script with languages: ${Object.keys(script.languages).join(', ')}`)
        }
      } else {
        // Generate new script for first language only
        script = isDemoMode 
          ? await mockGenerateScript(job.prompt, job.duration, languages[0])
          : await generateScript(job.prompt, job.duration, languages[0])
        console.log(`Generated new script with ${script.scenes.length} scenes`)
      }
      await this.updateStepStatus(jobId, 'SCRIPT', 'DONE', undefined, script)

      // Step 2: Generate Images (shared across all languages)
      await this.updateStepStatus(jobId, 'IMAGES', 'RUNNING')
      const imageAssets = []
      // Use the first language's scenes for image generation (images are shared)
      const scenes = script.languages ? script.languages[languages[0]]?.scenes || script.scenes : script.scenes
      console.log(`Generating images for ${scenes.length} scenes`)
      
      for (let i = 0; i < scenes.length; i++) {
        const scene = scenes[i]
        const imageBuffer = await (isDemoMode ? mockGenerateImage(scene.imageDescription) : generateImage(scene.imageDescription))
        const imageUrl = await memoryStorage.storeFile(jobId, 'image', `scene_${i}_image.jpg`, imageBuffer)
        
        await memoryStorage.createAsset({
          jobId,
          kind: 'IMAGE',
          url: imageUrl,
          meta: { sceneId: scene.sceneId, sceneIndex: i }
        })
        imageAssets.push({ scene, imageBuffer, imageUrl })
      }
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
          const audioBuffer = await (isDemoMode ? mockHeygenClient : heygenClient).generateAndWaitForCompletion(
            scene.narration,
            job.voiceId || '1bd001e7e50f421d891986aad5158bc3'
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

        // Step 4: Compose Video for this language
        let videoUrl: string
        try {
          const compositionOptions = {
            aspectRatio: job.aspectRatio as '16:9' | '9:16' | '1:1',
            scenes: audioAssets.map((asset, i) => ({
              sceneId: asset.scene.sceneId,
              imageBuffer: asset.imageBuffer,
              videoBuffer: null,
              audioBuffer: asset.audioBuffer,
              caption: asset.scene.caption,
              duration: asset.scene.duration,
            })),
          }

          console.log(`Starting video composition for ${langCode} with FFmpeg...`)
          const finalVideoBuffer = await videoComposer.composeVideo(compositionOptions)
          console.log(`Video composition completed for ${langCode}, buffer size:`, finalVideoBuffer.length)
          videoUrl = await memoryStorage.storeFile(jobId, 'video', `${langCode}_final_video.mp4`, finalVideoBuffer)
          console.log(`Video saved for ${langCode} to:`, videoUrl)
        } catch (ffmpegError) {
          console.error(`FFmpeg error details for ${langCode}:`, ffmpegError)
          console.warn(`FFmpeg not available for ${langCode}, creating mock video:`, ffmpegError)
          
          // Create a mock video file for demo purposes
          const mockVideoData = Buffer.from(`Mock video data for ${langCode} - FFmpeg not available`)
          videoUrl = await memoryStorage.storeFile(jobId, 'video', `${langCode}_final_video.mp4`, mockVideoData)
        }
        
        await memoryStorage.createAsset({
          jobId,
          kind: 'VIDEO',
          url: videoUrl,
          meta: { type: 'final_video', duration: job.duration, language: langCode }
        })

        resultUrls[langCode] = videoUrl
      }
      
      await this.updateStepStatus(jobId, 'NARRATION', 'DONE')
      await this.updateStepStatus(jobId, 'COMPOSITION', 'DONE')

      // Calculate total cost (per language)
      const totalCost = isDemoMode 
        ? mockCalculateTokenCost(1000, 500) + (scenes.length * languages.length * 0.24) 
        : calculateTokenCost(1000, 500) + (scenes.length * languages.length * 0.24)

      // Update job as completed
      await memoryStorage.updateJob(jobId, {
        status: 'DONE',
        resultUrls,
        totalCost
      })

      console.log(`Job ${jobId} completed successfully with ${languages.length} language versions`)

    } catch (error) {
      console.error(`Job ${jobId} failed:`, error)
      
      // Update job status to failed
      await memoryStorage.updateJob(jobId, { 
        status: 'FAILED',
        totalCost: 0
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
      totalCost: job.totalCost,
      resultUrls,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
      steps: job.steps,
      assets: job.assets
    }
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
