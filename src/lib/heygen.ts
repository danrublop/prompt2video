interface HeyGenVoice {
  voice_id: string
  name: string
  language: string
  gender: string
}

interface HeyGenTTSRequest {
  text: string
  voice_id: string
  speed?: number
  emotion?: string
}

interface HeyGenTTSResponse {
  data: {
    video_id: string
    video_url?: string
    status: 'processing' | 'completed' | 'failed'
  }
}

export class HeyGenClient {
  private apiKey: string
  private baseUrl: string
  private tempDir: string

  constructor() {
    this.apiKey = process.env.HEYGEN_API_KEY || ''
    // Use root base; versioned paths are added per-endpoint
    this.baseUrl = 'https://api.heygen.com'
    this.tempDir = `${process.cwd()}/temp/heygen`
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`
    console.log(`HeyGen API Request: ${options.method || 'GET'} ${url}`)
    console.log(`API Key present: ${!!this.apiKey}`)
    console.log(`API Key length: ${this.apiKey ? this.apiKey.length : 0}`)
    if (!this.apiKey) {
      throw new Error('Missing HEYGEN_API_KEY environment variable')
    }
    
    const response = await fetch(url, {
      ...options,
      headers: {
        // HeyGen expects X-Api-Key header (case-sensitive)
        'X-Api-Key': this.apiKey,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    console.log(`HeyGen API Response: ${response.status} ${response.statusText}`)

    if (!response.ok) {
      const error = await response.text()
      console.error(`HeyGen API Error Details:`, {
        status: response.status,
        statusText: response.statusText,
        url: url,
        error: error
      })
      throw new Error(`HeyGen API error: ${response.status} ${error}`)
    }

    return response.json()
  }

  async getVoices(): Promise<HeyGenVoice[]> {
    // GET /v1/voice.list
    const response = await this.makeRequest('/v1/voice.list')
    console.log('HeyGen voices response structure:', JSON.stringify(response, null, 2))

    // Try different possible response structures and fall back safely
    const candidates: unknown[] = [
      response?.data?.voices,
      response?.voices,
      response?.data?.items,
      response?.data,
      response
    ]

    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        console.log(`HeyGen API key verified. Found ${candidate.length} voices.`)
        return candidate as HeyGenVoice[]
      }
      // Some APIs return { voices: { items: [...] } }
      if (candidate && typeof candidate === 'object') {
        const maybe = (candidate as any).voices?.items || (candidate as any).items
        if (Array.isArray(maybe)) {
          console.log(`HeyGen API key verified. Found ${maybe.length} voices.`)
          return maybe as HeyGenVoice[]
        }
      }
    }

    console.warn('Could not find voices array in response; proceeding with empty list')
    return []
  }

  async generateSpeech(request: HeyGenTTSRequest): Promise<HeyGenTTSResponse> {
    // Use /v2/video/generate with minimal video_inputs for voiceover-only
    // HeyGen requires `video_inputs`; we'll provide a single scene with text voice
    if (!request.voice_id) {
      throw new Error('HeyGen voice_id is required. Set HEYGEN_VOICE_ID or pass a voiceId.')
    }

    const voicePayload: any = {
      type: 'text',
      voice_id: request.voice_id,
      input_text: request.text,
      speed: request.speed || 1.0,
    }

    const payload = {
      video_inputs: [
        {
          voice: voicePayload,
          background: {
            type: 'color',
            value: '#000000'
          }
        }
      ],
      dimension: { width: 1280, height: 720 },
      caption: false
    }

    return this.makeRequest('/v2/video/generate', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  async getVideoStatus(videoId: string): Promise<HeyGenTTSResponse> {
    // GET /v1/video_status.get?video_id=...
    return this.makeRequest(`/v1/video_status.get?video_id=${videoId}`)
  }

  async downloadVideo(videoUrl: string): Promise<Buffer> {
    const response = await fetch(videoUrl)
    if (!response.ok) {
      throw new Error(`Failed to download video: ${response.status}`)
    }
    return Buffer.from(await response.arrayBuffer())
  }

  async generateAndWaitForCompletion(
    text: string,
    voiceId: string = process.env.HEYGEN_VOICE_ID || '',
    maxWaitTime: number = 300000 // 5 minutes
  ): Promise<Buffer> {
    console.log(`Starting HeyGen TTS generation for text: "${text.substring(0, 50)}..." with voice: ${voiceId}`)
    
    // First, let's test if we can get voices to verify API key
    try {
      console.log('Testing HeyGen API key by fetching voices...')
      await this.getVoices()
      console.log('HeyGen API key verified successfully.')
    } catch (error) {
      console.error('HeyGen API key test failed:', error)
      throw new Error(`HeyGen API key verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
    
    // Generate voiceover-only minimal video, then extract audio
    const effectiveVoiceId = voiceId || process.env.HEYGEN_VOICE_ID || ''
    if (!effectiveVoiceId) {
      throw new Error('Missing voiceId. Set HEYGEN_VOICE_ID or provide a voiceId.')
    }
    const ttsResponse = await this.generateSpeech({ text, voice_id: effectiveVoiceId })
    const videoId = ttsResponse.data.video_id

    // Poll for completion
    const startTime = Date.now()
    while (Date.now() - startTime < maxWaitTime) {
      const statusResponse = await this.getVideoStatus(videoId)
      
      if (statusResponse.data.status === 'completed') {
        if (!statusResponse.data.video_url) {
          throw new Error('Video completed but no URL provided')
        }
        const videoBuffer = await this.downloadVideo(statusResponse.data.video_url)
        return await this.extractAudioMp3(videoBuffer)
      }
      
      if (statusResponse.data.status === 'failed') {
        throw new Error('Video generation failed')
      }

      // Wait 2 seconds before next poll
      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    throw new Error('Video generation timed out')
  }

  private async extractAudioMp3(videoBuffer: Buffer): Promise<Buffer> {
    // Convert returned MP4 video into MP3 audio using ffmpeg
    const fs = await import('fs/promises')
    const path = await import('path')
    const { default: ffmpeg } = await import('fluent-ffmpeg')
    // Prefer FFMPEG_PATH env if provided; otherwise rely on system ffmpeg
    const envFfmpegPath = process.env.FFMPEG_PATH
    if (envFfmpegPath) {
      try {
        ;(ffmpeg as any).setFfmpegPath(envFfmpegPath)
        console.log('Using ffmpeg from FFMPEG_PATH:', envFfmpegPath)
      } catch (e) {
        console.warn('Failed to set ffmpeg path from FFMPEG_PATH, falling back to system ffmpeg')
      }
    }

    await fs.mkdir(this.tempDir, { recursive: true })
    const inputPath = path.join(this.tempDir, `in_${Date.now()}.mp4`)
    const outputPath = path.join(this.tempDir, `out_${Date.now()}.mp3`)
    await fs.writeFile(inputPath, videoBuffer)

    await new Promise<void>((resolve, reject) => {
      (ffmpeg as any)(inputPath)
        .noVideo()
        .audioCodec('libmp3lame')
        .format('mp3')
        .on('end', () => resolve())
        .on('error', (err: any) => reject(err))
        .save(outputPath)
    })

    try {
      const audioBuffer = await fs.readFile(outputPath)
      return audioBuffer
    } finally {
      // Best-effort cleanup
      try { await fs.unlink(inputPath) } catch {}
      try { await fs.unlink(outputPath) } catch {}
    }
  }
}

export const heygenClient = new HeyGenClient()

