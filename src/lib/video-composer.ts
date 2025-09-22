import ffmpeg from 'fluent-ffmpeg'
import { promises as fs } from 'fs'
import path from 'path'
import { VideoCompositionOptions } from '@/types'

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

  private async createSceneClip(
    imagePath: string,
    videoPath: string | null,
    audioPath: string,
    caption: string,
    duration: number,
    outputPath: string,
    dimensions: { width: number; height: number }
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const command = ffmpeg()
      
      // Use AI-generated video if available, otherwise use image
      if (videoPath) {
        command.input(videoPath)
      } else {
        command.input(imagePath)
      }
      
      command.input(audioPath)
      
      const filters = []
      
      if (videoPath) {
        // For AI-generated videos, just scale and add text overlay
        filters.push(
          `[0:v]scale=${dimensions.width}:${dimensions.height}:force_original_aspect_ratio=decrease,pad=${dimensions.width}:${dimensions.height}:(ow-iw)/2:(oh-ih)/2:black[scaled]`,
          `[scaled]fade=t=in:st=0:d=0.3,fade=t=out:st=${duration - 0.4}:d=0.4[faded]`,
          `[faded]drawtext=text='${caption.replace(/'/g, "\\'")}':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=h-th-50:box=1:boxcolor=black@0.5:boxborderw=10[texted]`
        )
      } else {
        // For images, add Ken Burns effect
        filters.push(
          `[0:v]scale=${dimensions.width}:${dimensions.height}:force_original_aspect_ratio=decrease,pad=${dimensions.width}:${dimensions.height}:(ow-iw)/2:(oh-ih)/2:black[scaled]`,
          `[scaled]zoompan=z='min(zoom+0.0015,1.5)':d=${duration * 30}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${dimensions.width}x${dimensions.height}[zoomed]`,
          `[zoomed]fade=t=in:st=0:d=0.3,fade=t=out:st=${duration - 0.4}:d=0.4[faded]`,
          `[faded]drawtext=text='${caption.replace(/'/g, "\\'")}':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=h-th-50:box=1:boxcolor=black@0.5:boxborderw=10[texted]`
        )
      }
      
      command.complexFilter(filters)
        .outputOptions([
          '-map', '[texted]',
          '-map', '1:a',
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

  private async concatenateClips(clipPaths: string[], outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Use concat demuxer for better reliability
      const concatFile = path.join(path.dirname(outputPath), 'concat.txt')
      const concatContent = clipPaths.map(p => `file '${p}'`).join('\n')
      
      // Write concat file
      fs.writeFileSync(concatFile, concatContent)
      
      ffmpeg()
        .input(concatFile)
        .inputOptions(['-f', 'concat', '-safe', '0'])
        .outputOptions([
          '-c', 'copy', // Copy streams without re-encoding for speed
          '-movflags', '+faststart'
        ])
        .output(outputPath)
        .on('end', () => {
          // Clean up concat file
          try {
            fs.unlinkSync(concatFile)
          } catch (e) {
            // Ignore cleanup errors
          }
          resolve()
        })
        .on('error', (err) => {
          // Clean up concat file
          try {
            fs.unlinkSync(concatFile)
          } catch (e) {
            // Ignore cleanup errors
          }
          reject(err)
        })
        .run()
    })
  }

  async composeVideo(options: VideoCompositionOptions): Promise<Buffer> {
    await this.ensureTempDir()
    
    const dimensions = this.getVideoDimensions(options.aspectRatio)
    const jobId = `job_${Date.now()}`
    const tempJobDir = path.join(this.tempDir, jobId)
    await fs.mkdir(tempJobDir, { recursive: true })

    try {
      // Write all assets to temp files
      const sceneClips: string[] = []
      
      for (let i = 0; i < options.scenes.length; i++) {
        const scene = options.scenes[i]
        const imagePath = path.join(tempJobDir, `scene_${i}_image.jpg`)
        const videoPath = scene.videoBuffer ? path.join(tempJobDir, `scene_${i}_video.mp4`) : null
        const audioPath = path.join(tempJobDir, `scene_${i}_audio.mp3`)
        const clipPath = path.join(tempJobDir, `scene_${i}_clip.mp4`)

        // Write buffers to files
        await fs.writeFile(imagePath, scene.imageBuffer)
        if (scene.videoBuffer) {
          await fs.writeFile(videoPath!, scene.videoBuffer)
        }
        await fs.writeFile(audioPath, scene.audioBuffer)

        // Create scene clip
        await this.createSceneClip(
          imagePath,
          videoPath,
          audioPath,
          scene.caption,
          scene.duration,
          clipPath,
          dimensions
        )

        sceneClips.push(clipPath)
      }

      // Concatenate all clips
      const finalVideoPath = path.join(tempJobDir, 'final_video.mp4')
      await this.concatenateClips(sceneClips, finalVideoPath)

      // Read final video
      const videoBuffer = await fs.readFile(finalVideoPath)
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
