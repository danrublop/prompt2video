export interface CreateJobRequest {
  prompt: string
  aspectRatio?: '16:9' | '9:16' | '1:1'
  duration?: number // in seconds
  languages?: string[]
  voiceId?: string
  imageTheme?: string // Theme ID for consistent image generation
  generationMode?: 'images' | 'videos' | 'whiteboard' | 'scene_generator' | 'scene_generator' // Choose between image generation (ChatGPT), video generation (Veo3), whiteboard animation, or scene generator
  useAvatar?: boolean // Whether to use HeyGen avatar for audio
  avatarMode?: 'fullscreen' | 'corner' | 'alternating' // Avatar composition mode
  avatarId?: string // HeyGen avatar ID
}

export interface JobResponse {
  id: string
  prompt: string
  aspectRatio: string
  duration: number
  languages: string[]
  voiceId?: string
  imageTheme?: string
  generationMode?: 'images' | 'videos' | 'whiteboard' | 'scene_generator'
  useAvatar?: boolean
  avatarMode?: 'fullscreen' | 'corner' | 'alternating'
  avatarId?: string
  status: 'QUEUED' | 'RUNNING' | 'FAILED' | 'DONE'
  totalCost: number
  resultUrl?: string // For backward compatibility
  resultUrls?: { [language: string]: string }
  script?: any // Include script in the response
  styleProfile: string
  createdAt: string
  updatedAt: string
  steps: StepResponse[]
  assets: AssetResponse[]
}

export interface StepResponse {
  id: string
  type: 'SCRIPT' | 'IMAGES' | 'NARRATION' | 'COMPOSITION'
  status: 'PENDING' | 'RUNNING' | 'FAILED' | 'DONE'
  payload?: any
  error?: string
  startedAt?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
}

export interface AssetResponse {
  id: string
  kind: 'IMAGE' | 'AUDIO' | 'VIDEO' | 'JSON'
  url: string
  meta?: any
  createdAt: string
  updatedAt: string
}

export interface ScriptScene {
  sceneId: string
  goal: string
  narration: string
  caption: string
  imageDescription: string
  duration: number
}

export interface ScriptResponse {
  title: string
  totalDuration: number
  scenes: ScriptScene[]
}

export interface VideoCompositionOptions {
  aspectRatio: '16:9' | '9:16' | '1:1'
  scenes: Array<
    |
      {
        kind: 'AVATAR'
        sceneId: string
        avatarVideoBuffer: Buffer
        caption: string
        duration: number
      }
    |
      {
        kind: 'WHITEBOARD'
        sceneId: string
        imageBuffer: Buffer
        audioBuffer: Buffer
        caption: string
        duration: number
        steps?: string[]
      }
    |
      {
        kind: 'VEO3_VIDEO'
        sceneId: string
        videoBuffer: Buffer
        audioBuffer: Buffer
        caption: string
        duration: number
      }
    |
      {
        kind: 'WHITEBOARD_ANIMATION'
        sceneId: string
        videoBuffer: Buffer
        audioBuffer: Buffer
        caption: string
        duration: number
        imageBuffer: Buffer
      }
  >
}
