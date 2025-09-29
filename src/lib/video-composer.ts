import ffmpeg from 'fluent-ffmpeg'
import { promises as fs } from 'fs'
import path from 'path'
import { VideoCompositionOptions } from '@/types'

interface SubtitleEntry {
  startTime: number
  endTime: number
  text: string
}

interface SubtitleTrack {
  language: string
  entries: SubtitleEntry[]
}

export class VideoComposer {
  private tempDir: string

  constructor() {
    this.tempDir = path.join(process.cwd(), 'temp')
  }

  private async ensureTempDir() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true })
    } catch (error) {
      // Directory might already exist
    }
  }

  private getVideoDimensions(aspectRatio: string): { width: number; height: number } {
    switch (aspectRatio) {
      case '16:9':
        return { width: 1920, height: 1080 }
      case '9:16':
        return { width: 1080, height: 1920 }
      case '1:1':
        return { width: 1024, height: 1024 }
      default:
        return { width: 1920, height: 1080 }
    }
  }

  private async downloadFile(url: string, localPath: string): Promise<void> {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.status}`)
    }
    const buffer = await response.arrayBuffer()
    await fs.writeFile(localPath, Buffer.from(buffer))
  }

  private formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    const milliseconds = Math.floor((seconds % 1) * 1000)
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`
  }

  private generateSRTContent(subtitleTrack: SubtitleTrack): string {
    return subtitleTrack.entries.map((entry, index) => {
      const startTime = this.formatTime(entry.startTime)
      const endTime = this.formatTime(entry.endTime)
      return `${index + 1}\n${startTime} --> ${endTime}\n${entry.text}\n`
    }).join('\n')
  }

  private generateWebVTTContent(subtitleTrack: SubtitleTrack): string {
    const header = 'WEBVTT\n\n'
    const entries = subtitleTrack.entries.map(entry => {
      const startTime = this.formatTime(entry.startTime).replace(',', '.')
      const endTime = this.formatTime(entry.endTime).replace(',', '.')
      return `${startTime} --> ${endTime}\n${entry.text}\n`
    }).join('\n')
    
    return header + entries
  }

  private async createSubtitleFile(
    subtitleTrack: SubtitleTrack, 
    outputDir: string, 
    format: 'srt' | 'vtt' = 'srt'
  ): Promise<string> {
    const filename = `subtitles_${subtitleTrack.language}.${format}`
    const filepath = path.join(outputDir, filename)
    
    const content = format === 'srt' 
      ? this.generateSRTContent(subtitleTrack)
      : this.generateWebVTTContent(subtitleTrack)
    
    await fs.writeFile(filepath, content, 'utf-8')
    return filepath
  }

  private generateSubtitleTrack(
    scenes: any[], 
    language: string = 'en'
  ): SubtitleTrack {
    const entries: SubtitleEntry[] = []
    let currentTime = 0
    
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i]
      const duration = scene.duration || 20 // Default 20 seconds if not specified
      
      // Use scene caption as subtitle text, or narration if caption is not available
      const text = scene.caption || scene.narration || `Scene ${i + 1}`
      
      // Add a small buffer to ensure subtitle timing accuracy
      const startTime = Math.max(0, currentTime)
      const endTime = currentTime + duration
      
      entries.push({
        startTime: startTime,
        endTime: endTime,
        text: text
      })
      
      currentTime += duration
    }
    
    return {
      language,
      entries
    }
  }

  private async createWhiteboardClip(
    imagePath: string,
    audioPath: string,
    caption: string,
    duration: number,
    outputPath: string,
    dimensions: { width: number; height: number },
    steps?: string[]
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log(`[DEBUG] Creating whiteboard clip:`)
      console.log(`  - Image: ${imagePath}`)
      console.log(`  - Audio: ${audioPath}`)
      console.log(`  - Duration: ${duration}s`)
      console.log(`  - Dimensions: ${dimensions.width}x${dimensions.height}`)
      console.log(`  - FFmpeg command will create ${duration}s video from static image`)
      
      const command = ffmpeg()
      
      command.input(imagePath)
      command.input(audioPath)
      
      // Create video from static image with audio duration
      command
        .outputOptions([
          '-map', '0:v',
          '-map', '1:a',
          '-c:v', 'libx264',
          '-c:a', 'aac',
          '-vf', `scale=${dimensions.width}:${dimensions.height},setsar=1:1,loop=loop=-1:size=1:start=0`,
          '-t', duration.toString(),
          '-r', '30',
          '-pix_fmt', 'yuv420p'
        ])
        .output(outputPath)
        .on('end', () => {
          console.log(`[DEBUG] Whiteboard clip created successfully: ${outputPath}`)
          resolve()
        })
        .on('error', (err) => {
          console.error(`[DEBUG] FFmpeg error creating whiteboard clip:`, err)
          reject(new Error(`FFmpeg failed: ${err.message}`))
        })
        .run()
    })
  }

  private async createAvatarClip(
    avatarVideoPath: string,
    duration: number,
    outputPath: string,
    dimensions: { width: number; height: number }
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const command = ffmpeg()
      command.input(avatarVideoPath)
      const filters = [
        `[0:v]scale=${dimensions.width}:${dimensions.height}:force_original_aspect_ratio=decrease,pad=${dimensions.width}:${dimensions.height}:(ow-iw)/2:(oh-ih)/2:black[scaled]`,
        `[scaled]fade=t=in:st=0:d=0.2,fade=t=out:st=${Math.max(0, duration - 0.3)}:d=0.3[vout]`
      ]
      command.complexFilter(filters)
        .outputOptions([
          '-map', '[vout]',
          '-map', '0:a?',
          '-c:v', 'libx264',
          '-c:a', 'aac',
          '-t', duration.toString(),
          '-r', '30'
        ])
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .run()
    })
  }

  private async createVeo3Clip(
    videoPath: string,
    audioPath: string,
    duration: number,
    outputPath: string,
    dimensions: { width: number; height: number }
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log(`[DEBUG] Creating Veo3 clip:`)
      console.log(`  - Video: ${videoPath}`)
      console.log(`  - Audio: ${audioPath}`)
      console.log(`  - Duration: ${duration}s`)
      console.log(`  - Dimensions: ${dimensions.width}x${dimensions.height}`)
      
      const command = ffmpeg()
      command.input(videoPath)
      command.input(audioPath)
      
      // Scale the Veo3 video to match dimensions and add audio
      command
        .outputOptions([
          '-map', '0:v',
          '-map', '1:a',
          '-c:v', 'libx264',
          '-c:a', 'aac',
          '-vf', `scale=${dimensions.width}:${dimensions.height}:force_original_aspect_ratio=decrease,pad=${dimensions.width}:${dimensions.height}:(ow-iw)/2:(oh-ih)/2:black`,
          '-t', duration.toString(),
          '-r', '30',
          '-pix_fmt', 'yuv420p'
        ])
        .output(outputPath)
        .on('end', () => {
          console.log(`[DEBUG] Veo3 clip created successfully: ${outputPath}`)
          resolve()
        })
        .on('error', (err) => {
          console.error(`[DEBUG] FFmpeg error creating Veo3 clip:`, err)
          reject(new Error(`FFmpeg failed: ${err.message}`))
        })
        .run()
    })
  }

  private async createWhiteboardAnimationClip(
    videoPath: string,
    audioPath: string,
    duration: number,
    outputPath: string,
    dimensions: { width: number; height: number }
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log(`[DEBUG] Creating whiteboard animation clip:`)
      console.log(`  - Video: ${videoPath}`)
      console.log(`  - Audio: ${audioPath}`)
      console.log(`  - Duration: ${duration}s`)
      console.log(`  - Dimensions: ${dimensions.width}x${dimensions.height}`)
      
      const command = ffmpeg()
      command.input(videoPath)
      command.input(audioPath)
      
      // Scale the whiteboard animation video to match dimensions and add audio
      command
        .outputOptions([
          '-map', '0:v',
          '-map', '1:a',
          '-c:v', 'libx264',
          '-c:a', 'aac',
          '-vf', `scale=${dimensions.width}:${dimensions.height}:force_original_aspect_ratio=decrease,pad=${dimensions.width}:${dimensions.height}:(ow-iw)/2:(oh-ih)/2:white`,
          '-t', duration.toString(),
          '-r', '30',
          '-pix_fmt', 'yuv420p'
        ])
        .output(outputPath)
        .on('end', () => {
          console.log(`[DEBUG] Whiteboard animation clip created successfully: ${outputPath}`)
          resolve()
        })
        .on('error', (err) => {
          console.error(`[DEBUG] FFmpeg error creating whiteboard animation clip:`, err)
          reject(new Error(`FFmpeg failed: ${err.message}`))
        })
        .run()
    })
  }

  private async createPauseClip(duration: number, outputPath: string, dimensions: { width: number; height: number }): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        // Create a simple black image file first
        const blackImagePath = path.join(path.dirname(outputPath), 'black.png')
        
        // Create a 1x1 black pixel and scale it up
        await new Promise((resolveImg, rejectImg) => {
          ffmpeg()
            .input('testsrc2=size=1x1:duration=1')
            .complexFilter([
              `[0:v]eq=brightness=-1:contrast=0,scale=${dimensions.width}:${dimensions.height}[v]`
            ])
            .outputOptions([
              '-map', '[v]',
              '-frames:v', '1',
              '-pix_fmt', 'yuv420p'
            ])
            .output(blackImagePath)
            .on('end', () => resolveImg())
            .on('error', (err) => rejectImg(err))
            .run()
        })
        
        // Now create the pause clip using the black image
        ffmpeg()
          .input(blackImagePath)
          .input('anullsrc=channel_layout=stereo:sample_rate=48000')
          .outputOptions([
            '-c:v', 'libx264',
            '-c:a', 'aac',
            '-t', duration.toString(),
            '-r', '30',
            '-pix_fmt', 'yuv420p',
            '-loop', '1'
          ])
          .output(outputPath)
          .on('end', () => {
            // Clean up the temporary black image
            fs.unlink(blackImagePath).catch(() => {})
            resolve()
          })
          .on('error', (err) => {
            console.error('Error creating pause clip:', err)
            reject(err)
          })
          .run()
      } catch (error) {
        reject(error)
      }
    })
  }

  private async concatenateClips(clipPaths: string[], outputPath: string, dimensions: { width: number; height: number }, subtitleFiles?: string[], multiLanguageAudioFiles?: { [language: string]: string[] }): Promise<void> {
    // Use concat demuxer for better reliability
    const concatFile = path.join(path.dirname(outputPath), 'concat.txt')
    const concatContent = clipPaths.map(p => `file '${p}'`).join('\n')
    
    // Write concat file
    await fs.writeFile(concatFile, concatContent)
    
    return new Promise((resolve, reject) => {
      const command = ffmpeg()
        .input(concatFile)
        .inputOptions(['-f', 'concat', '-safe', '0'])
      
      // For now, skip multi-language audio to fix the immediate error
      // TODO: Re-implement multi-language audio with proper FFmpeg syntax
      const outputOptions = [
        '-c:v', 'libx264', // Use H.264 codec for better compatibility
        '-c:a', 'aac',     // Use AAC codec for audio
        '-pix_fmt', 'yuv420p', // Use standard pixel format for QuickTime compatibility
        '-movflags', '+faststart',
        '-profile:v', 'high', // Use high profile for better compatibility
        '-level', '4.1'       // Use level 4.1 for broad device support
      ]
      
      // Temporarily disable subtitle embedding to fix video corruption issue
      // TODO: Re-implement subtitle embedding with proper FFmpeg syntax
      if (subtitleFiles && subtitleFiles.length > 0) {
        console.log(`[FFMPEG DEBUG] Subtitle files found but temporarily disabled:`, subtitleFiles)
        // subtitleFiles.forEach((subtitleFile, index) => {
        //   command.input(subtitleFile)
        //   // Map subtitle file to subtitle stream
        //   outputOptions.push('-map', `${index + 1}:s`)
        //   outputOptions.push(`-c:s:${index}`, 'mov_text') // Use mov_text codec for embedded subtitles
        // })
      }
      
      // Debug logging
      console.log(`[FFMPEG DEBUG] Output path: ${outputPath}`)
      console.log(`[FFMPEG DEBUG] Output options:`, outputOptions)
      console.log(`[FFMPEG DEBUG] Subtitle files:`, subtitleFiles)
      console.log(`[FFMPEG DEBUG] Multi-language audio files:`, multiLanguageAudioFiles)
      
      command
        .outputOptions(outputOptions)
        .output(outputPath)
        .on('start', (commandLine) => {
          console.log(`[FFMPEG DEBUG] Command: ${commandLine}`)
        })
        .on('end', async () => {
          console.log(`[FFMPEG DEBUG] FFmpeg completed successfully`)
          // Clean up concat file
          try {
            await fs.unlink(concatFile)
          } catch (e) {
            // Ignore cleanup errors
          }
          resolve()
        })
        .on('error', async (err) => {
          console.error(`[FFMPEG DEBUG] FFmpeg error:`, err)
          console.error(`[FFMPEG DEBUG] Error message:`, err.message)
          // Clean up concat file
          try {
            await fs.unlink(concatFile)
          } catch (e) {
            // Ignore cleanup errors
          }
          reject(err)
        })
        .run()
    })
  }

  async recomposeVideo(
    jobId: string,
    aspectRatio: string,
    editedAssets: Array<{ id: string; currentUrl: string; type: string; sceneIndex: number }>,
    allAssets: Array<{ id: string; url: string; kind: string; meta?: any }>,
    languages: string[] = ['en']
  ): Promise<Buffer> {
    await this.ensureTempDir()
    
    const dimensions = this.getVideoDimensions(aspectRatio)
    const tempJobDir = path.join(this.tempDir, `recompose_${jobId}`)
    await fs.mkdir(tempJobDir, { recursive: true })

    try {
      // Create a map of edited assets for quick lookup
      const editedAssetMap = new Map(editedAssets.map(asset => [asset.id, asset.currentUrl]))
      
      // Get audio assets (sorted by scene index)
      const audioAssets = allAssets.filter(asset => 
        asset.kind === 'AUDIO'
      ).sort((a, b) => (a.meta?.sceneIndex || 0) - (b.meta?.sceneIndex || 0))

      // Get image assets (sorted by scene index)
      const imageAssets = allAssets.filter(asset => 
        asset.kind === 'IMAGE'
      ).sort((a, b) => (a.meta?.sceneIndex || 0) - (b.meta?.sceneIndex || 0))

      // Get video assets (sorted by scene index) - for avatar and Veo3 videos
      const videoAssets = allAssets.filter(asset => 
        asset.kind === 'VIDEO'
      ).sort((a, b) => (a.meta?.sceneIndex || 0) - (b.meta?.sceneIndex || 0))

      console.log(`Recomposing video with ${audioAssets.length} audio assets, ${imageAssets.length} image assets, and ${videoAssets.length} video assets`)

      // Create scene clips
      const sceneClips: string[] = []
      
      for (let i = 0; i < Math.max(audioAssets.length, imageAssets.length, videoAssets.length); i++) {
        const audioAsset = audioAssets[i]
        const imageAsset = imageAssets[i]
        const videoAsset = videoAssets[i]
        
        if (!audioAsset) {
          console.warn(`Missing audio asset for scene ${i}`)
          continue
        }

        const clipPath = path.join(tempJobDir, `scene_${i}_clip.mp4`)
        
        // Use edited URLs if available, otherwise use original URLs
        const audioUrl = editedAssetMap.get(audioAsset.id) || audioAsset.url
        
        console.log(`Processing scene ${i}:`)
        console.log(`  - Audio: ${audioUrl}`)
        console.log(`  - Image: ${imageAsset ? (editedAssetMap.get(imageAsset.id) || imageAsset.url) : 'none'}`)
        console.log(`  - Video: ${videoAsset ? (editedAssetMap.get(videoAsset.id) || videoAsset.url) : 'none'}`)

        // Download audio
        const audioPath = path.join(tempJobDir, `scene_${i}_audio.mp3`)
        await this.downloadFile(audioUrl, audioPath)

        // Determine asset type and create appropriate clip
        if (videoAsset) {
          // Handle video assets (avatar or Veo3)
          const videoUrl = editedAssetMap.get(videoAsset.id) || videoAsset.url
          const videoPath = path.join(tempJobDir, `scene_${i}_video.mp4`)
          await this.downloadFile(videoUrl, videoPath)
          
          if (videoAsset.meta?.type === 'avatar') {
            // Create avatar clip
            console.log(`Creating avatar clip for scene ${i}`)
            await this.createAvatarClip(videoPath, 20, clipPath, dimensions)
          } else if (videoAsset.meta?.type === 'veo3') {
            // Create Veo3 clip
            console.log(`Creating Veo3 clip for scene ${i}`)
            await this.createVeo3Clip(videoPath, audioPath, 20, clipPath, dimensions)
          } else if (videoAsset.meta?.type === 'whiteboard') {
            // Create whiteboard animation clip
            console.log(`Creating whiteboard animation clip for scene ${i}`)
            await this.createWhiteboardAnimationClip(videoPath, audioPath, 20, clipPath, dimensions)
          } else {
            // Default video clip
            console.log(`Creating default video clip for scene ${i}`)
            await this.createAvatarClip(videoPath, 20, clipPath, dimensions)
          }
        } else if (imageAsset) {
          // Handle image assets (whiteboard style)
          const imageUrl = editedAssetMap.get(imageAsset.id) || imageAsset.url
          const imagePath = path.join(tempJobDir, `scene_${i}_image.jpg`)
          await this.downloadFile(imageUrl, imagePath)
          
          console.log(`Creating whiteboard clip for scene ${i}`)
          await this.createWhiteboardClip(
            imagePath,
            audioPath,
            `Scene ${i + 1}`,
            20, // Default duration
            clipPath,
            dimensions
          )
        } else {
          console.warn(`No visual asset found for scene ${i}, skipping`)
          continue
        }

        sceneClips.push(clipPath)
      }

      // Generate subtitle tracks for each language
      const subtitleFiles: string[] = []
      
      for (const langCode of languages) {
        const subtitleTrack = this.generateSubtitleTrack(
          allAssets.map(asset => ({
            caption: asset.meta?.caption || 'Scene',
            duration: 20 // Default duration
          })),
          langCode
        )
        
        // Create subtitle file for this language
        const subtitleFile = await this.createSubtitleFile(subtitleTrack, tempJobDir, 'srt')
        subtitleFiles.push(subtitleFile)
      }
      
      // For now, skip multi-language audio to fix the immediate error
      // TODO: Re-implement multi-language audio with proper FFmpeg syntax
      
      // Concatenate all clips with subtitles only
      const outputPath = path.join(tempJobDir, 'recomposed_video.mp4')
      await this.concatenateClips(sceneClips, outputPath, dimensions, subtitleFiles)

      // Read the final video
      const videoBuffer = await fs.readFile(outputPath)
      
      // Clean up temp files
      await fs.rm(tempJobDir, { recursive: true, force: true })
      
      return videoBuffer

    } catch (error) {
      console.error('Video recomposition failed:', error)
      // Clean up temp files on error
      await fs.rm(tempJobDir, { recursive: true, force: true })
      throw error
    }
  }

  async composeVideo(options: VideoCompositionOptions, languages: string[] = ['en']): Promise<Buffer> {
    await this.ensureTempDir()
    
    const dimensions = this.getVideoDimensions(options.aspectRatio)
    const jobId = `job_${Date.now()}`
    const tempJobDir = path.join(this.tempDir, jobId)
    await fs.mkdir(tempJobDir, { recursive: true })

    try {
      // Write all assets to temp files
      const sceneClips: string[] = []
      
      for (let i = 0; i < options.scenes.length; i++) {
        const scene: any = options.scenes[i]
        const clipPath = path.join(tempJobDir, `scene_${i}_clip.mp4`)

        try {
          if (scene.kind === 'AVATAR') {
            const avatarVideoPath = path.join(tempJobDir, `scene_${i}_avatar.mp4`)
            await fs.writeFile(avatarVideoPath, scene.avatarVideoBuffer)
            await this.createAvatarClip(avatarVideoPath, scene.duration, clipPath, dimensions)
          } else if (scene.kind === 'VEO3_VIDEO') {
            const videoPath = path.join(tempJobDir, `scene_${i}_video.mp4`)
            const audioPath = path.join(tempJobDir, `scene_${i}_audio.mp3`)
            await fs.writeFile(videoPath, scene.videoBuffer)
            await fs.writeFile(audioPath, scene.audioBuffer)
            await this.createVeo3Clip(videoPath, audioPath, scene.duration, clipPath, dimensions)
          } else if (scene.kind === 'WHITEBOARD_ANIMATION') {
            const videoPath = path.join(tempJobDir, `scene_${i}_video.mp4`)
            const audioPath = path.join(tempJobDir, `scene_${i}_audio.mp3`)
            await fs.writeFile(videoPath, scene.videoBuffer)
            await fs.writeFile(audioPath, scene.audioBuffer)
            await this.createWhiteboardAnimationClip(videoPath, audioPath, scene.duration, clipPath, dimensions)
          } else {
            const imagePath = path.join(tempJobDir, `scene_${i}_image.jpg`)
            const audioPath = path.join(tempJobDir, `scene_${i}_audio.mp3`)
            
            console.log(`[DEBUG] Writing scene ${i + 1} assets:`)
            console.log(`  - Image buffer size: ${scene.imageBuffer.length} bytes`)
            console.log(`  - Audio buffer size: ${scene.audioBuffer.length} bytes`)
            
            await fs.writeFile(imagePath, scene.imageBuffer)
            await fs.writeFile(audioPath, scene.audioBuffer)
            
            // Check if files were written successfully
            const imageStats = await fs.stat(imagePath)
            const audioStats = await fs.stat(audioPath)
            console.log(`[DEBUG] Files written:`)
            console.log(`  - Image file size: ${imageStats.size} bytes`)
            console.log(`  - Audio file size: ${audioStats.size} bytes`)
            
            // Verify image file is not empty and has valid content
            if (imageStats.size === 0) {
              throw new Error(`Image file is empty: ${imagePath}`)
            }
            
            // Check if it's a valid image by reading the first few bytes
            const imageBuffer = await fs.readFile(imagePath)
            const isJPEG = imageBuffer[0] === 0xFF && imageBuffer[1] === 0xD8
            const isPNG = imageBuffer[0] === 0x89 && imageBuffer[1] === 0x50
            console.log(`[DEBUG] Image format check: JPEG=${isJPEG}, PNG=${isPNG}`)
            
            await this.createWhiteboardClip(imagePath, audioPath, scene.caption, scene.duration, clipPath, dimensions, scene.steps)
          }

          sceneClips.push(clipPath)
          console.log(`Scene ${i + 1} clip created successfully`)
        } catch (sceneError) {
          console.error(`Failed to create scene ${i + 1} clip:`, sceneError)
          throw new Error(`Failed to create scene ${i + 1} clip: ${sceneError instanceof Error ? sceneError.message : 'Unknown error'}`)
        }
      }

      // Generate subtitle tracks for each language
      const subtitleFiles: string[] = []
      
      for (const langCode of languages) {
        const subtitleTrack = this.generateSubtitleTrack(options.scenes, langCode)
        
        // Create subtitle file for this language
        const subtitleFile = await this.createSubtitleFile(subtitleTrack, tempJobDir, 'srt')
        subtitleFiles.push(subtitleFile)
      }
      
      // For now, skip multi-language audio to fix the immediate error
      // TODO: Re-implement multi-language audio with proper FFmpeg syntax
      
      // Concatenate all clips with subtitles only
      console.log(`Concatenating ${sceneClips.length} clips with ${subtitleFiles.length} subtitle tracks...`)
      const finalVideoPath = path.join(tempJobDir, 'final_video.mp4')
      await this.concatenateClips(sceneClips, finalVideoPath, dimensions, subtitleFiles)

      // Read final video
      console.log('Reading final video...')
      const videoBuffer = await fs.readFile(finalVideoPath)
      console.log(`Final video size: ${videoBuffer.length} bytes`)
      return videoBuffer

    } finally {
      // Clean up temp files
      try {
        await fs.rm(tempJobDir, { recursive: true, force: true })
      } catch (error) {
        console.warn('Failed to clean up temp directory:', error)
      }
    }
  }
}

export const videoComposer = new VideoComposer()
