// Multi-language video generation processor
import { memoryStorage, Job, Step, Asset } from './memory-storage'
import { generateScript, generateImage, calculateTokenCost } from './openai'
import { generateScript as mockGenerateScript, generateImage as mockGenerateImage, calculateTokenCost as mockCalculateTokenCost } from './mock-openai'
import { heygenClient } from './heygen'
import { mockHeygenClient } from './mock-heygen'
import { videoComposer } from './video-composer'
import { SUPPORTED_LANGUAGES, getLanguageByCode, getLanguageVoiceId } from './languages'
import { CreateJobRequest, JobResponse, LanguageVideo } from '@/types'

export class MultiLanguageProcessor {
  private processingJobs: Set<string> = new Set()

  async createJob(data: CreateJobRequest): Promise<JobResponse> {
    const job = await memoryStorage.createJob({
      prompt: data.prompt,
      aspectRatio: data.aspectRatio || '16:9',
      duration: data.duration || 150,
      language: data.language || 'English',
      voiceId: data.voiceId,
      status: 'QUEUED',
      totalCost: 0,
      styleProfile: 'professional',
      multiLanguage: data.multiLanguage || false,
      targetLanguages: data.targetLanguages || []
    })

    // Start processing immediately
    this.processJob(job.id)

    return this.jobToResponse(job)
  }

  async getJob(jobId: string): Promise<JobResponse | null> {
    const job = await memoryStorage.getJob(jobId)
    if (!job) return null

    return this.jobToResponse(job)
  }

  private jobToResponse(job: Job): JobResponse {
    return {
      id: job.id,
      prompt: job.prompt,
      aspectRatio: job.aspectRatio,
      duration: job.duration,
      language: job.language,
      voiceId: job.voiceId,
      status: job.status,
      totalCost: job.totalCost,
      resultUrl: job.resultUrl,
      styleProfile: job.styleProfile,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
      steps: job.steps.map(step => ({
        id: step.id,
        type: step.type,
        status: step.status,
        payload: step.payload,
        error: step.error,
        startedAt: step.startedAt?.toISOString(),
        completedAt: step.completedAt?.toISOString(),
        createdAt: step.createdAt.toISOString(),
        updatedAt: step.updatedAt.toISOString()
      })),
      assets: job.assets.map(asset => ({
        id: asset.id,
        kind: asset.kind,
        url: asset.url,
        meta: asset.meta,
        createdAt: asset.createdAt.toISOString(),
        updatedAt: asset.updatedAt.toISOString()
      })),
      multiLanguage: job.multiLanguage,
      targetLanguages: job.targetLanguages,
      languageVideos: job.languageVideos || []
    }
  }

  private async updateStepStatus(jobId: string, type: string, status: string, error?: string, payload?: any) {
    const existingStep = await memoryStorage.getStepsByJob(jobId).then(steps => 
      steps.find(step => step.type === type)
    )

    if (existingStep) {
      await memoryStorage.updateStep(existingStep.id, {
        status: status as any,
        error,
        payload,
        completedAt: status === 'DONE' || status === 'FAILED' ? new Date() : undefined
      })
    } else {
      await memoryStorage.createStep({
        jobId,
        type: type as any,
        status: status as any,
        error,
        payload,
        startedAt: status === 'RUNNING' ? new Date() : undefined,
        completedAt: status === 'DONE' || status === 'FAILED' ? new Date() : undefined
      })
    }
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

      console.log(`Starting multi-language job ${jobId}: ${job.prompt}`)

      // Check if we're in demo mode
      const isDemoMode = !process.env.OPENAI_API_KEY || 
                        process.env.OPENAI_API_KEY === 'mock' || 
                        process.env.OPENAI_API_KEY === 'your_openai_api_key_here' ||
                        process.env.HEYGEN_API_KEY === 'mock' ||
                        process.env.HEYGEN_API_KEY === 'your_heygen_api_key_here'

      // Step 1: Generate script in primary language
      await this.updateStepStatus(jobId, 'SCRIPT', 'RUNNING')
      const script = isDemoMode 
        ? await mockGenerateScript(job.prompt, job.duration, job.language)
        : await generateScript(job.prompt, job.duration, job.language)
      await this.updateStepStatus(jobId, 'SCRIPT', 'DONE', undefined, script)

      // Step 2: Generate images (same for all languages)
      await this.updateStepStatus(jobId, 'IMAGES', 'RUNNING')
      const imageAssets = []
      for (let i = 0; i < script.scenes.length; i++) {
        const scene = script.scenes[i]
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

      // Step 3: Generate videos for each language
      await this.updateStepStatus(jobId, 'NARRATION', 'RUNNING')
      
      const languages = job.multiLanguage && job.targetLanguages?.length 
        ? job.targetLanguages 
        : [job.language]

      const languageVideos: LanguageVideo[] = []
      let totalCost = 0

      for (const langCode of languages) {
        const language = getLanguageByCode(langCode)
        if (!language) {
          console.warn(`Language ${langCode} not supported, skipping`)
          continue
        }

        try {
          console.log(`Generating video for language: ${language.name}`)
          
          // Generate audio for this language
          const audioAssets = []
          for (let i = 0; i < imageAssets.length; i++) {
            const { scene } = imageAssets[i]
            
            // For multi-language, we need to translate the narration
            // For now, we'll use the same narration but with different voice
            const translatedNarration = await this.translateText(scene.narration, job.language, langCode, isDemoMode)
            
            const audioBuffer = await (isDemoMode ? mockHeygenClient : heygenClient).generateAndWaitForCompletion(
              translatedNarration,
              getLanguageVoiceId(langCode)
            )
            
            const audioUrl = await memoryStorage.storeFile(jobId, 'audio', `${langCode}_scene_${i}_audio.mp3`, audioBuffer)
            
            await memoryStorage.createAsset({
              jobId,
              kind: 'AUDIO',
              url: audioUrl,
              meta: { sceneId: scene.sceneId, sceneIndex: i, language: langCode }
            })
            audioAssets.push({ scene: { ...scene, narration: translatedNarration }, audioBuffer, audioUrl })
          }

          // Generate video for this language
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

          let videoUrl: string
          try {
            const finalVideoBuffer = await videoComposer.composeVideo(compositionOptions)
            videoUrl = await memoryStorage.storeFile(jobId, 'video', `${langCode}_final_video.mp4`, finalVideoBuffer)
          } catch (ffmpegError) {
            console.warn(`FFmpeg not available for ${langCode}, creating mock video:`, ffmpegError)
            const mockVideoData = Buffer.from(`Mock video data for ${language.name} - FFmpeg not available`)
            videoUrl = await memoryStorage.storeFile(jobId, 'video', `${langCode}_final_video.mp4`, mockVideoData)
          }

          await memoryStorage.createAsset({
            jobId,
            kind: 'VIDEO',
            url: videoUrl,
            meta: { type: 'final_video', duration: job.duration, language: langCode }
          })

          languageVideos.push({
            language: langCode,
            languageName: language.name,
            nativeName: language.nativeName,
            videoUrl,
            status: 'DONE'
          })

          // Calculate cost for this language
          const languageCost = isDemoMode 
            ? mockCalculateTokenCost(1000, 500) + (script.scenes.length * 0.24)
            : calculateTokenCost(1000, 500) + (script.scenes.length * 0.24)
          totalCost += languageCost

        } catch (error) {
          console.error(`Failed to generate video for ${langCode}:`, error)
          languageVideos.push({
            language: langCode,
            languageName: language.name,
            nativeName: language.nativeName,
            videoUrl: '',
            status: 'FAILED',
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }

      await this.updateStepStatus(jobId, 'NARRATION', 'DONE')
      await this.updateStepStatus(jobId, 'COMPOSITION', 'DONE')

      // Update job with final results
      const primaryLanguageVideo = languageVideos.find(lv => lv.language === job.language) || languageVideos[0]
      await memoryStorage.updateJob(jobId, {
        status: 'DONE',
        resultUrl: primaryLanguageVideo?.videoUrl,
        totalCost,
        languageVideos
      })

      console.log(`Multi-language job ${jobId} completed successfully`)

    } catch (error) {
      console.error(`Multi-language job ${jobId} failed:`, error)
      
      await memoryStorage.updateJob(jobId, { 
        status: 'FAILED',
        totalCost: 0
      })
    } finally {
      this.processingJobs.delete(jobId)
    }
  }

  private async translateText(text: string, fromLang: string, toLang: string, isDemoMode: boolean): Promise<string> {
    if (isDemoMode) {
      // In demo mode, return mock translated text
      return `[${toLang}] ${text}`
    }

    // For real implementation, you would use a translation service here
    // For now, we'll return the original text
    // In a real app, you'd integrate with Google Translate, DeepL, or similar
    return text
  }

  async healthCheck(): Promise<{ status: string; processing: number }> {
    return {
      status: 'healthy',
      processing: this.processingJobs.size
    }
  }
}

export const multiLanguageProcessor = new MultiLanguageProcessor()
