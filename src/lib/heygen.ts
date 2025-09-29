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
      let errorMessage = `HeyGen API error: ${response.status} ${response.statusText}`
      
      try {
        const errorData = await response.json()
        console.error(`HeyGen API Error Details:`, {
          status: response.status,
          statusText: response.statusText,
          url: url,
          error: errorData
        })
        
        // Handle specific HeyGen error codes
        if (errorData.code && errorData.message) {
          errorMessage = `HeyGen API Error (${errorData.code}): ${errorData.message}`
          
          // Add helpful context for common errors
          switch (errorData.code) {
            case '40009':
              errorMessage += ' - Check your API key'
              break
            case '400144':
              errorMessage += ' - Avatar not found, check avatar ID'
              break
            case '400116':
              errorMessage += ' - Voice not found, check voice ID'
              break
            case '40039':
              errorMessage += ' - Invalid text content'
              break
            case '400105':
              errorMessage += ' - Text contains blocked words'
              break
            case '400664':
              errorMessage += ' - Daily trial limit exceeded'
              break
            case '400118':
              errorMessage += ' - Insufficient credits'
              break
          }
        }
      } catch (parseError) {
        const errorText = await response.text()
        console.error(`HeyGen API Error Details:`, {
          status: response.status,
          statusText: response.statusText,
          url: url,
          error: errorText
        })
        errorMessage = `HeyGen API error: ${response.status} ${errorText}`
      }
      
      throw new Error(errorMessage)
    }

    return response.json()
  }

  async getVoices(): Promise<HeyGenVoice[]> {
    // Try V2 voices endpoint first, fallback to V1
    try {
      // GET /v2/voices (if available)
      const response = await this.makeRequest('/v2/voices')
      console.log('HeyGen V2 voices response structure:', JSON.stringify(response, null, 2))

      // Check for V2 response structure
      if (response?.voices && Array.isArray(response.voices)) {
        console.log(`HeyGen API key verified. Found ${response.voices.length} voices (V2).`)
        return response.voices
      }
    } catch (error) {
      console.log('V2 voices endpoint not available, trying V1...')
    }

    // Fallback to V1
    try {
      // GET /v1/voice.list
      const response = await this.makeRequest('/v1/voice.list')
      console.log('HeyGen V1 voices response structure:', JSON.stringify(response, null, 2))

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
          console.log(`HeyGen API key verified. Found ${candidate.length} voices (V1).`)
          return candidate as HeyGenVoice[]
        }
        // Some APIs return { voices: { items: [...] } }
        if (candidate && typeof candidate === 'object') {
          const maybe = (candidate as any).voices?.items || (candidate as any).items
          if (Array.isArray(maybe)) {
            console.log(`HeyGen API key verified. Found ${maybe.length} voices (V1).`)
            return maybe as HeyGenVoice[]
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch voices from both V1 and V2 endpoints:', error)
    }

    console.warn('Could not find voices array in response; proceeding with empty list')
    return []
  }

  async getAvatars(): Promise<any[]> {
    // GET /v2/avatars
    const response = await this.makeRequest('/v2/avatars')
    console.log('HeyGen avatars response structure:', JSON.stringify(response, null, 2))

    // According to V2 API docs, response structure is:
    // { avatars: [...], talking_photos: [...] }
    if (response?.avatars && Array.isArray(response.avatars)) {
      console.log(`HeyGen API key verified. Found ${response.avatars.length} avatars.`)
      return response.avatars
    }

    // Fallback for different response structures
    const candidates: unknown[] = [
      response?.data?.avatars,
      response?.data,
      response
    ]

    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        console.log(`HeyGen API key verified. Found ${candidate.length} avatars.`)
        return candidate as any[]
      }
      // Some APIs return { avatars: { items: [...] } }
      if (candidate && typeof candidate === 'object') {
        const maybe = (candidate as any).avatars?.items || (candidate as any).items
        if (Array.isArray(maybe)) {
          console.log(`HeyGen API key verified. Found ${maybe.length} avatars.`)
          return maybe as any[]
        }
      }
    }

    console.warn('Could not find avatars array in response; proceeding with empty list')
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
    // GET /v1/video_status.get?video_id=... (still using V1 for status)
    return this.makeRequest(`/v1/video_status.get?video_id=${videoId}`)
  }

  async generateAvatarVideo(
    text: string,
    options: { avatarId: string; voiceId?: string; width?: number; height?: number }
  ): Promise<{ video_id: string }> {
    // Validate required parameters
    if (!options.avatarId) {
      throw new Error('Avatar ID is required')
    }
    
    const voiceId = options.voiceId || process.env.HEYGEN_VOICE_ID
    if (!voiceId) {
      throw new Error('Voice ID is required. Set HEYGEN_VOICE_ID or provide voiceId.')
    }

    // Validate text length (HeyGen has limits)
    if (text.length > 1500) {
      throw new Error('Text input must be less than 1500 characters')
    }

    // Validate dimensions
    const width = options.width || 1280
    const height = options.height || 720
    
    if (width < 128 || width > 4096 || height < 128 || height > 4096) {
      throw new Error('Video dimensions must be between 128 and 4096 pixels')
    }
    
    if (width % 2 !== 0 || height % 2 !== 0) {
      throw new Error('Video width and height must be even numbers')
    }

    const payload = {
      caption: false, // Disable captions by default
      dimension: { 
        width, 
        height 
      },
      video_inputs: [
        {
          character: {
            type: 'avatar',
            avatar_id: options.avatarId,
            avatar_style: 'normal', // Supported: circle, normal, closeUp
            scale: 1.0, // Default scale
            offset: { x: 0.0, y: 0.0 } // Default offset
          },
          voice: {
            type: 'text',
            voice_id: voiceId,
            input_text: text,
            speed: 1.0, // Default speed (0.5-1.5)
            pitch: 0 // Default pitch (-50 to 50)
          }
        }
      ]
    }

    console.log('HeyGen avatar video generation request:', JSON.stringify(payload, null, 2))

    const resp = await this.makeRequest('/v2/video/generate', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
    
    console.log('HeyGen avatar video generation response:', JSON.stringify(resp, null, 2))
    
    // Check for video_id in various possible locations
    const videoId = resp?.video_id || resp?.data?.video_id || resp?.result?.video_id
    if (!videoId) {
      console.error('HeyGen API response structure:', resp)
      throw new Error(`No video_id returned from HeyGen API. Response: ${JSON.stringify(resp)}`)
    }
    
    return { video_id: videoId }
  }

  async waitForVideoMp4(videoId: string, maxWaitTimeMs: number = 300000): Promise<Buffer> {
    const startTime = Date.now()
    while (Date.now() - startTime < maxWaitTimeMs) {
      const statusResponse = await this.getVideoStatus(videoId)
      if (statusResponse.data.status === 'completed') {
        if (!statusResponse.data.video_url) {
          throw new Error('Video completed but no URL provided')
        }
        return await this.downloadVideo(statusResponse.data.video_url)
      }
      if (statusResponse.data.status === 'failed') {
        throw new Error('Video generation failed')
      }
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
    throw new Error('Video generation timed out')
  }

  async extractAudioFromMp4(videoBuffer: Buffer): Promise<Buffer> {
    return this.extractAudioMp3(videoBuffer)
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

  async generateAvatarVideoAndWait(
    text: string,
    avatarId: string = process.env.HEYGEN_AVATAR_ID || 'Lina_Dress_Sitting_Side_public',
    voiceId: string = process.env.HEYGEN_VOICE_ID || '',
    maxWaitTime: number = 300000 // 5 minutes
  ): Promise<Buffer> {
    console.log(`Starting HeyGen avatar video generation for text: "${text.substring(0, 50)}..." with avatar: ${avatarId}, voice: ${voiceId}`)
    
    // First, let's test if we can get avatars to verify API key
    try {
      console.log('Testing HeyGen API key by fetching avatars...')
      await this.getAvatars()
      console.log('HeyGen API key verified successfully.')
    } catch (error) {
      console.error('HeyGen API key test failed:', error)
      throw new Error(`HeyGen API key verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
    
    const effectiveVoiceId = voiceId || process.env.HEYGEN_VOICE_ID || ''
    if (!effectiveVoiceId) {
      throw new Error('Missing voiceId. Set HEYGEN_VOICE_ID or provide a voiceId.')
    }

    // Generate avatar video using the new API
    const videoResponse = await this.generateAvatarVideo(text, {
      avatarId,
      voiceId: effectiveVoiceId,
      width: 1280,
      height: 720
    })
    
    const videoId = videoResponse.video_id
    console.log(`Avatar video generation started with ID: ${videoId}`)

    // Poll for completion
    const startTime = Date.now()
    while (Date.now() - startTime < maxWaitTime) {
      const statusResponse = await this.getVideoStatus(videoId)
      
      if (statusResponse.data.status === 'completed') {
        if (!statusResponse.data.video_url) {
          throw new Error('Avatar video completed but no URL provided')
        }
        console.log(`Avatar video completed, downloading from: ${statusResponse.data.video_url}`)
        const videoBuffer = await this.downloadVideo(statusResponse.data.video_url)
        return videoBuffer // Return the full video, not just audio
      }
      
      if (statusResponse.data.status === 'failed') {
        throw new Error('Avatar video generation failed')
      }

      console.log(`Avatar video status: ${statusResponse.data.status}, waiting...`)
      // Wait 3 seconds before next poll (avatar videos take longer)
      await new Promise(resolve => setTimeout(resolve, 3000))
    }

    throw new Error('Avatar video generation timed out')
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

  // Utility method to get both avatars and voices for UI
  async getAvailableOptions(): Promise<{
    avatars: any[]
    voices: HeyGenVoice[]
  }> {
    try {
      const [avatars, voices] = await Promise.all([
        this.getAvatars(),
        this.getVoices()
      ])
      
      return { avatars, voices }
    } catch (error) {
      console.error('Failed to fetch HeyGen options:', error)
      return { avatars: [], voices: [] }
    }
  }

  // Validate avatar ID exists
  async validateAvatarId(avatarId: string): Promise<boolean> {
    try {
      const avatars = await this.getAvatars()
      return avatars.some(avatar => avatar.avatar_id === avatarId)
    } catch (error) {
      console.error('Failed to validate avatar ID:', error)
      return false
    }
  }

  // Validate voice ID exists
  async validateVoiceId(voiceId: string): Promise<boolean> {
    try {
      const voices = await this.getVoices()
      return voices.some(voice => voice.voice_id === voiceId)
    } catch (error) {
      console.error('Failed to validate voice ID:', error)
      return false
    }
  }
}

export const heygenClient = new HeyGenClient()


