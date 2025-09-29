import { ScriptScene } from '@/types'
import { extractHeaderFromNarration } from './themes'

export interface SceneGeneratorOptions {
  narration: string
  aspectRatio: '16:9' | '9:16' | '1:1'
  duration: number
}

export interface SceneGeneratorResult {
  scenes: GeneratedScene[]
  totalDuration: number
}

export interface GeneratedScene {
  sceneId: string
  narration: string
  storyboard: any
  videoBuffer: Buffer
  audioBuffer?: Buffer
  duration: number
}

/**
 * Scene Generator that takes a narration script and generates individual whiteboard scenes
 * for each segment, then compiles them into a final video composition.
 */
export class SceneGenerator {
  private openaiApiKey: string
  private stickerStyle?: string
  private imageStyle?: string

  constructor(openaiApiKey: string, stickerStyle?: string, imageStyle?: string) {
    this.openaiApiKey = openaiApiKey
    this.stickerStyle = stickerStyle
    this.imageStyle = imageStyle
  }

  /**
   * Generate scenes from a narration script with narration-first approach for accurate timing
   */
  async generateScenes(options: SceneGeneratorOptions): Promise<SceneGeneratorResult> {
    const { narration, aspectRatio, duration } = options

    // Split narration into individual scenes/segments
    const sceneSegments = this.splitNarrationIntoSegments(narration, duration)
    
    const scenes: GeneratedScene[] = []
    let totalDuration = 0

    for (let i = 0; i < sceneSegments.length; i++) {
      const segment = sceneSegments[i]
      const sceneId = `scene_${i + 1}`
      
      try {
        console.log(`[SCENE_GENERATOR] Processing scene ${i + 1}/${sceneSegments.length}: "${segment}"`)
        
        // Step 1: Generate storyboard for this scene segment
        const storyboard = await this.generateStoryboard(segment)
        console.log(`[SCENE_GENERATOR] Generated storyboard for scene ${i + 1}`)
        
        // Step 2: Generate audio narration first to get accurate duration
        console.log(`[SCENE_GENERATOR] Generating audio for scene ${i + 1} to determine duration...`)
        const audioBuffer = await this.generateAudioForScene(segment)
        const actualDuration = await this.getAudioDuration(audioBuffer)
        console.log(`[SCENE_GENERATOR] Scene ${i + 1} audio duration: ${actualDuration}s`)
        
        // Step 3: Generate whiteboard video with the correct duration
        console.log(`[SCENE_GENERATOR] Generating whiteboard video for scene ${i + 1} with duration ${actualDuration}s`)
        const videoBuffer = await this.generateWhiteboardVideoFromNarration(segment, aspectRatio, actualDuration)
        console.log(`[SCENE_GENERATOR] Generated whiteboard video for scene ${i + 1}, size: ${videoBuffer ? videoBuffer.length : 0} bytes`)
        
        const scene: GeneratedScene = {
          sceneId,
          narration: segment,
          storyboard,
          videoBuffer,
          audioBuffer,
          duration: actualDuration
        }
        
        scenes.push(scene)
        totalDuration += scene.duration
        
        console.log(`[SCENE_GENERATOR] Completed scene ${i + 1}, duration: ${scene.duration}s`)
        
      } catch (error) {
        console.error(`[SCENE_GENERATOR] Failed to generate scene ${i + 1}:`, error)
        throw error
      }
    }

    console.log(`[SCENE_GENERATOR] Generated ${scenes.length} scenes, total duration: ${totalDuration}s`)
    return {
      scenes,
      totalDuration
    }
  }

  /**
   * Split narration into logical scene segments
   */
  private splitNarrationIntoSegments(narration: string, totalDuration: number): string[] {
    // Split by sentences first, but be more aggressive about splitting
    const sentences = narration.split(/[.!?]+/).filter(s => s.trim().length > 0)
    
    console.log(`[SCENE_GENERATOR] Original narration: "${narration}"`)
    console.log(`[SCENE_GENERATOR] Split into ${sentences.length} sentences:`, sentences)
    
    // If we have multiple sentences, try to create logical segments
    if (sentences.length > 1) {
      const segments: string[] = []
      
      // Look for transition words that indicate new topics
      const transitionWords = ['first', 'then', 'next', 'finally', 'second', 'third', 'also', 'additionally', 'furthermore', 'moreover']
      
      let currentSegment = ''
      
      for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i].trim()
        if (!sentence) continue
        
        const lowerSentence = sentence.toLowerCase()
        const hasTransition = transitionWords.some(word => lowerSentence.startsWith(word))
        
        // If this sentence starts with a transition word and we have content, start a new segment
        if (hasTransition && currentSegment.trim()) {
          segments.push(currentSegment.trim())
          currentSegment = sentence
        } else {
          currentSegment += (currentSegment ? ' ' : '') + sentence
        }
      }
      
      // Add the last segment
      if (currentSegment.trim()) {
        segments.push(currentSegment.trim())
      }
      
      console.log(`[SCENE_GENERATOR] Created ${segments.length} segments:`, segments)
      return segments
    }
    
    // If only one sentence or no clear splits, return as single segment
    return [narration.trim()]
  }

  /**
   * Estimate reading time for text (words per minute)
   */
  private estimateReadingTime(text: string): number {
    const words = text.split(/\s+/).length
    const wpm = 200 // words per minute
    return (words / wpm) * 60 // return seconds
  }

  /**
   * Generate storyboard for a single scene using OpenAI
   */
  private async generateStoryboard(narration: string): Promise<any> {
    const systemPrompt = `You are a storyboard generator for whiteboard explainer videos. 
    Create a JSON storyboard that breaks down the narration into visual elements.
    
    The storyboard should include:
    - scene_duration: duration in seconds (8-15 seconds)
    - elements: array of visual elements with type, content, position, timing, and effects
    
    Element types can be:
    - "text": for titles, labels, or key phrases
    - "image": for visual representations (DALL-E will generate these)
    
    Each element needs:
    - type: "text" or "image"
    - content: the text to display or description for image generation
    - x, y: position (0.0 to 1.0, where 0.5 is center)
    - w, h: size (0.0 to 1.0, where 1.0 is full width/height)
    - start, end: timing in seconds
    - fx: animation effect ("fade", "slide_up", "none")
    
    Focus on creating clear, educational visuals that support the narration.
    Use simple, clean descriptions for images that DALL-E can generate well.
    Ensure elements don't overlap and have good spacing.
    
    Return only valid JSON, no other text.`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: narration }
        ],
        temperature: 0.3
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices[0].message.content

    try {
      return JSON.parse(content)
    } catch (error) {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
      throw new Error('Failed to parse storyboard JSON')
    }
  }

  /**
   * Generate whiteboard video for a storyboard
   * This integrates with the existing whiteboard animation system
   */
  private async generateWhiteboardVideo(storyboard: any, aspectRatio: string): Promise<Buffer> {
    // Import the whiteboard animator
    const { whiteboardAnimator } = await import('./whiteboard-animator')
    
    // Convert storyboard to whiteboard animation format
    const whiteboardOptions = {
      prompt: this.storyboardToPrompt(storyboard),
      aspectRatio: aspectRatio as '16:9' | '9:16' | '1:1',
      duration: storyboard.scene_duration || 10,
      strokeStyle: '#000000',
      lineWidth: 3,
      animationSpeed: 30
    }
    
    // Generate the whiteboard animation
    const result = await whiteboardAnimator.generateWhiteboardAnimation(whiteboardOptions)
    return result.videoBuffer
  }

  /**
   * Generate whiteboard video directly from narration using the local whiteboard system
   * This calls the Python whiteboard video generation system from the local directory
   */
  async generateWhiteboardVideoFromNarration(narration: string, aspectRatio: string, duration: number): Promise<Buffer> {
    console.log(`[SCENE_GENERATOR] Generating whiteboard video (local animator) for: "${narration.substring(0, 50)}..."`)
    const { whiteboardAnimator } = await import('./whiteboard-animator')
    const header = extractHeaderFromNarration(narration)
    const result = await whiteboardAnimator.generateWhiteboardAnimation({
      prompt: narration,
      aspectRatio: aspectRatio as '16:9' | '9:16' | '1:1',
      duration,
      strokeStyle: '#000000',
      lineWidth: 3,
      animationSpeed: 30,
      headerTitle: header,
      imageStyle: (this.imageStyle as 'whiteboard_bw' | 'whiteboard_color') || 'whiteboard_bw'
    })
    return result.videoBuffer
  }

  /**
   * Generate audio for a scene using OpenAI TTS
   */
  private async generateAudioForScene(narration: string): Promise<Buffer> {
    console.log(`[SCENE_GENERATOR] Generating audio for: "${narration.substring(0, 50)}..."`)
    
    const { generateSpeech } = await import('./openai')
    
    const audioBuffer = await generateSpeech(narration, 'alloy')
    
    console.log(`[SCENE_GENERATOR] Generated audio, size: ${audioBuffer.length} bytes`)
    return audioBuffer
  }

  /**
   * Get audio duration from buffer using ffprobe
   */
  private async getAudioDuration(audioBuffer: Buffer): Promise<number> {
    const { spawn } = await import('child_process')
    const fs = await import('fs')
    const path = await import('path')
    
    return new Promise((resolve, reject) => {
      // Create a temporary file for the audio
      const tempDir = path.join(process.cwd(), 'temp')
      const tempFile = path.join(tempDir, `temp_audio_${Date.now()}.mp3`)
      
      // Ensure temp directory exists
      fs.mkdirSync(tempDir, { recursive: true })
      
      // Write audio buffer to temp file
      fs.writeFileSync(tempFile, audioBuffer)
      
      // Use ffprobe to get duration
      const ffprobe = spawn('ffprobe', [
        '-v', 'quiet',
        '-show_entries', 'format=duration',
        '-of', 'csv=p=0',
        tempFile
      ])
      
      let output = ''
      let error = ''
      
      ffprobe.stdout.on('data', (data) => {
        output += data.toString()
      })
      
      ffprobe.stderr.on('data', (data) => {
        error += data.toString()
      })
      
      ffprobe.on('close', (code) => {
        // Clean up temp file
        try {
          fs.unlinkSync(tempFile)
        } catch (cleanupError) {
          console.warn(`[SCENE_GENERATOR] Failed to cleanup temp file: ${cleanupError}`)
        }
        
        if (code === 0) {
          const duration = parseFloat(output.trim())
          if (isNaN(duration)) {
            console.warn(`[SCENE_GENERATOR] Could not parse duration, using default 10s`)
            resolve(10)
          } else {
            console.log(`[SCENE_GENERATOR] Audio duration: ${duration}s`)
            resolve(duration)
          }
        } else {
          console.error(`[SCENE_GENERATOR] ffprobe failed: ${error}`)
          console.warn(`[SCENE_GENERATOR] Using default duration 10s`)
          resolve(10)
        }
      })
      
      ffprobe.on('error', (err) => {
        console.error(`[SCENE_GENERATOR] ffprobe error: ${err}`)
        console.warn(`[SCENE_GENERATOR] Using default duration 10s`)
        resolve(10)
      })
    })
  }

  /**
   * Convert storyboard to a prompt for whiteboard animation
   */
  private storyboardToPrompt(storyboard: any): string {
    const elements = storyboard.elements || []
    const textElements = elements.filter((el: any) => el.type === 'text')
    const imageElements = elements.filter((el: any) => el.type === 'image')
    
    let prompt = 'Create a whiteboard animation that shows: '
    
    // Add text elements
    if (textElements.length > 0) {
      prompt += textElements.map((el: any) => el.content).join(', ')
    }
    
    // Add image elements
    if (imageElements.length > 0) {
      prompt += '. Include visual elements: ' + imageElements.map((el: any) => el.content).join(', ')
    }
    
    return prompt
  }

  /**
   * Compile multiple scenes into a final video
   */
  async compileScenes(scenes: GeneratedScene[]): Promise<Buffer> {
    // This would use a video editing library to concatenate the scene videos
    // and create the final composition
    
    // For now, return a placeholder
    const finalVideo = Buffer.from('compiled video data')
    return finalVideo
  }
}

/**
 * Factory function to create a scene generator instance
 */
export function createSceneGenerator(openaiApiKey: string, stickerStyle?: string, imageStyle?: string): SceneGenerator {
  return new SceneGenerator(openaiApiKey, stickerStyle, imageStyle)
}
