export interface CreateJobRequest {
  prompt: string
  aspectRatio?: '16:9' | '9:16' | '1:1'
  duration?: number // in seconds
  languages?: string[]
  voiceId?: string
}

export interface JobResponse {
  id: string
  prompt: string
  aspectRatio: string
  duration: number
  languages: string[]
  voiceId?: string
  status: 'QUEUED' | 'RUNNING' | 'FAILED' | 'DONE'
  totalCost: number
  resultUrl?: string // For backward compatibility
  resultUrls?: { [language: string]: string }
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
  scenes: Array<{
    sceneId: string
    imageBuffer: Buffer
    videoBuffer?: Buffer
    audioBuffer: Buffer
    caption: string
    duration: number
  }>
}
