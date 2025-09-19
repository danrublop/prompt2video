export interface CreateJobRequest {
  prompt: string
  aspectRatio?: '16:9' | '9:16' | '1:1'
  duration?: number // in seconds
  language?: string
  voiceId?: string
  multiLanguage?: boolean
  targetLanguages?: string[]
}

export interface JobResponse {
  id: string
  prompt: string
  aspectRatio: string
  duration: number
  language: string
  voiceId?: string
  status: 'QUEUED' | 'RUNNING' | 'FAILED' | 'DONE'
  totalCost: number
  resultUrl?: string
  styleProfile: string
  createdAt: string
  updatedAt: string
  steps: StepResponse[]
  assets: AssetResponse[]
  multiLanguage?: boolean
  targetLanguages?: string[]
  languageVideos?: LanguageVideo[]
}

export interface LanguageVideo {
  language: string
  languageName: string
  nativeName: string
  videoUrl: string
  status: 'PENDING' | 'RUNNING' | 'FAILED' | 'DONE'
  error?: string
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
  scenes: Array<{
    sceneId: string
    imageBuffer: Buffer
    videoBuffer?: Buffer
    audioBuffer: Buffer
    caption: string
    duration: number
  }>
}
