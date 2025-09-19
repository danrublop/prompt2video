// In-memory storage system to replace PostgreSQL, Redis, and S3
import { promises as fs } from 'fs'
import path from 'path'

export interface Job {
  id: string
  prompt: string
  aspectRatio: string
  duration: number
  language: string
  voiceId?: string
  status: 'QUEUED' | 'RUNNING' | 'FAILED' | 'DONE'
  totalCost: number
  resultUrl?: string
  resultUrls?: { [language: string]: string }
  styleProfile: string
  script?: any
  createdAt: Date
  updatedAt: Date
  steps: Step[]
  assets: Asset[]
}

export interface Step {
  id: string
  jobId: string
  type: 'SCRIPT' | 'IMAGES' | 'NARRATION' | 'COMPOSITION'
  status: 'PENDING' | 'RUNNING' | 'FAILED' | 'DONE'
  payload?: any
  error?: string
  startedAt?: Date
  completedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface Asset {
  id: string
  jobId: string
  kind: 'IMAGE' | 'AUDIO' | 'VIDEO' | 'JSON'
  url: string
  meta?: any
  createdAt: Date
  updatedAt: Date
}

class MemoryStorage {
  private jobs: Map<string, Job> = new Map()
  private steps: Map<string, Step> = new Map()
  private assets: Map<string, Asset> = new Map()
  private tempDir: string

  constructor() {
    this.tempDir = path.join(process.cwd(), 'temp', 'storage')
    this.ensureTempDir()
  }

  private async ensureTempDir() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true })
    } catch (error) {
      // Directory might already exist
    }
  }

  // Job operations
  async createJob(data: Omit<Job, 'id' | 'createdAt' | 'updatedAt' | 'steps' | 'assets'>): Promise<Job> {
    const id = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date()
    
    const job: Job = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
      steps: [],
      assets: []
    }
    
    this.jobs.set(id, job)
    return job
  }

  async getJob(id: string): Promise<Job | null> {
    const job = this.jobs.get(id)
    if (!job) return null

    // Get related steps and assets
    const jobSteps = Array.from(this.steps.values()).filter(step => step.jobId === id)
    const jobAssets = Array.from(this.assets.values()).filter(asset => asset.jobId === id)

    return {
      ...job,
      steps: jobSteps,
      assets: jobAssets
    }
  }

  async updateJob(id: string, updates: Partial<Job>): Promise<Job | null> {
    const job = this.jobs.get(id)
    if (!job) return null

    const updatedJob = {
      ...job,
      ...updates,
      updatedAt: new Date()
    }

    this.jobs.set(id, updatedJob)
    return updatedJob
  }

  async deleteJob(id: string): Promise<boolean> {
    // Delete related steps and assets
    for (const [stepId, step] of this.steps.entries()) {
      if (step.jobId === id) {
        this.steps.delete(stepId)
      }
    }

    for (const [assetId, asset] of this.assets.entries()) {
      if (asset.jobId === id) {
        this.assets.delete(assetId)
      }
    }

    return this.jobs.delete(id)
  }

  // Step operations
  async createStep(data: Omit<Step, 'id' | 'createdAt' | 'updatedAt'>): Promise<Step> {
    const id = `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date()
    
    const step: Step = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now
    }
    
    this.steps.set(id, step)
    return step
  }

  async updateStep(id: string, updates: Partial<Step>): Promise<Step | null> {
    const step = this.steps.get(id)
    if (!step) return null

    const updatedStep = {
      ...step,
      ...updates,
      updatedAt: new Date()
    }

    this.steps.set(id, updatedStep)
    return updatedStep
  }

  async getStepsByJob(jobId: string): Promise<Step[]> {
    return Array.from(this.steps.values()).filter(step => step.jobId === jobId)
  }

  // Asset operations
  async createAsset(data: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>): Promise<Asset> {
    const id = `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date()
    
    const asset: Asset = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now
    }
    
    this.assets.set(id, asset)
    return asset
  }

  async getAssetsByJob(jobId: string): Promise<Asset[]> {
    return Array.from(this.assets.values()).filter(asset => asset.jobId === jobId)
  }

  // File storage operations (replacing S3)
  async storeFile(jobId: string, type: 'image' | 'audio' | 'video' | 'json', filename: string, data: Buffer): Promise<string> {
    const filePath = path.join(this.tempDir, jobId, type, filename)
    const dir = path.dirname(filePath)
    
    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(filePath, data)
    
    // Return a local file URL
    return `file://${filePath}`
  }

  async getFile(url: string): Promise<Buffer> {
    const filePath = url.replace('file://', '')
    return fs.readFile(filePath)
  }

  async deleteFile(url: string): Promise<void> {
    const filePath = url.replace('file://', '')
    try {
      await fs.unlink(filePath)
    } catch (error) {
      // File might not exist
    }
  }

  // Cleanup operations
  async cleanupJob(jobId: string): Promise<void> {
    const job = await this.getJob(jobId)
    if (!job) return

    // Delete all files
    for (const asset of job.assets) {
      await this.deleteFile(asset.url)
    }

    // Delete job directory
    const jobDir = path.join(this.tempDir, jobId)
    try {
      await fs.rm(jobDir, { recursive: true, force: true })
    } catch (error) {
      // Directory might not exist
    }

    // Delete from memory
    await this.deleteJob(jobId)
  }

  // Health check
  async healthCheck(): Promise<{ status: string; jobs: number; steps: number; assets: number }> {
    return {
      status: 'healthy',
      jobs: this.jobs.size,
      steps: this.steps.size,
      assets: this.assets.size
    }
  }
}

export const memoryStorage = new MemoryStorage()
