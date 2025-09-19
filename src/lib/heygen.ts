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

  constructor() {
    this.apiKey = process.env.HEYGEN_API_KEY!
    this.baseUrl = 'https://api.heygen.com/v1'
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'X-API-KEY': this.apiKey,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`HeyGen API error: ${response.status} ${error}`)
    }

    return response.json()
  }

  async getVoices(): Promise<HeyGenVoice[]> {
    const response = await this.makeRequest('/voice.list')
    return response.data.voices
  }

  async generateSpeech(request: HeyGenTTSRequest): Promise<HeyGenTTSResponse> {
    return this.makeRequest('/video.generate', {
      method: 'POST',
      body: JSON.stringify({
        text: request.text,
        voice_id: request.voice_id,
        speed: request.speed || 1.0,
        emotion: request.emotion || 'neutral',
      }),
    })
  }

  async getVideoStatus(videoId: string): Promise<HeyGenTTSResponse> {
    return this.makeRequest(`/video.status.get?video_id=${videoId}`)
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
    voiceId: string = '1bd001e7e50f421d891986aad5158bc3', // Default professional voice
    maxWaitTime: number = 300000 // 5 minutes
  ): Promise<Buffer> {
    // Generate speech
    const ttsResponse = await this.generateSpeech({ text, voice_id: voiceId })
    const videoId = ttsResponse.data.video_id

    // Poll for completion
    const startTime = Date.now()
    while (Date.now() - startTime < maxWaitTime) {
      const statusResponse = await this.getVideoStatus(videoId)
      
      if (statusResponse.data.status === 'completed') {
        if (!statusResponse.data.video_url) {
          throw new Error('Video completed but no URL provided')
        }
        return this.downloadVideo(statusResponse.data.video_url)
      }
      
      if (statusResponse.data.status === 'failed') {
        throw new Error('Video generation failed')
      }

      // Wait 2 seconds before next poll
      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    throw new Error('Video generation timed out')
  }
}

export const heygenClient = new HeyGenClient()
