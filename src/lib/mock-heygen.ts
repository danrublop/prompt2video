// Mock implementation for testing without HeyGen API keys
export class MockHeyGenClient {
  async getVoices() {
    await new Promise(resolve => setTimeout(resolve, 500))
    return [
      { voice_id: '1bd001e7e50f421d891986aad5158bc3', name: 'Professional Male', language: 'English', gender: 'male' },
      { voice_id: '2cd002e8e60f532e992097bbe6269cd4', name: 'Professional Female', language: 'English', gender: 'female' }
    ]
  }

  async generateSpeech(request: { text: string; voice_id: string }) {
    await new Promise(resolve => setTimeout(resolve, 1000))
    return {
      data: {
        video_id: `mock_${Date.now()}`,
        video_url: 'https://example.com/mock-audio.mp3',
        status: 'completed' as const
      }
    }
  }

  async getVideoStatus(videoId: string) {
    await new Promise(resolve => setTimeout(resolve, 500))
    return {
      data: {
        video_id: videoId,
        video_url: 'https://example.com/mock-audio.mp3',
        status: 'completed' as const
      }
    }
  }

  async downloadVideo(videoUrl: string): Promise<Buffer> {
    await new Promise(resolve => setTimeout(resolve, 1000))
    // Return mock audio data (silent audio)
    return Buffer.from('mock-audio-data')
  }

  async generateAndWaitForCompletion(
    text: string,
    voiceId: string = '1bd001e7e50f421d891986aad5158bc3',
    maxWaitTime: number = 300000
  ): Promise<Buffer> {
    await new Promise(resolve => setTimeout(resolve, 2000))
    return Buffer.from('mock-audio-data')
  }
}

export const mockHeygenClient = new MockHeyGenClient()


