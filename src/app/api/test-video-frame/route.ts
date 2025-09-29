import { NextRequest, NextResponse } from 'next/server'
import { generateImage, generateSpeech } from '@/lib/openai'
import { videoComposer } from '@/lib/video-composer'
import ffmpeg from 'fluent-ffmpeg'
import fs from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt = 'A simple plant diagram' } = body
    
    console.log(`Testing video frame extraction for: "${prompt}"`)

    // Generate image and audio
    const imageBuffer = await generateImage(`Whiteboard line-art, black marker on white background, no color. ${prompt}`)
    const audioBuffer = await generateSpeech('This is a test narration for the video.', 'alloy')
    
    console.log(`Image generated, size: ${imageBuffer.length} bytes`)
    console.log(`Audio generated, size: ${audioBuffer.length} bytes`)

    // Create temp files
    const tempDir = path.join(process.cwd(), 'temp', `test_${Date.now()}`)
    await fs.mkdir(tempDir, { recursive: true })
    
    const imagePath = path.join(tempDir, 'test_image.jpg')
    const audioPath = path.join(tempDir, 'test_audio.mp3')
    const videoPath = path.join(tempDir, 'test_video.mp4')
    
    await fs.writeFile(imagePath, imageBuffer)
    await fs.writeFile(audioPath, audioBuffer)

    // Create a simple video with the image
    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(imagePath)
        .input(audioPath)
        .outputOptions([
          '-map', '0:v',
          '-map', '1:a',
          '-c:v', 'libx264',
          '-c:a', 'aac',
          '-vf', 'scale=1920:1080',
          '-t', '5',
          '-r', '30'
        ])
        .output(videoPath)
        .on('end', () => {
          console.log('Test video created successfully')
          resolve(undefined)
        })
        .on('error', (err) => {
          console.error('FFmpeg error:', err)
          reject(err)
        })
        .run()
    })

    // Extract a frame from the video to see what it looks like
    const framePath = path.join(tempDir, 'frame.jpg')
    await new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .screenshots({
          timestamps: ['1'],
          filename: 'frame.jpg',
          folder: tempDir
        })
        .on('end', () => {
          console.log('Frame extracted successfully')
          resolve(undefined)
        })
        .on('error', (err) => {
          console.error('Frame extraction error:', err)
          reject(err)
        })
    })

    // Read the extracted frame
    const frameBuffer = await fs.readFile(framePath)
    const frameBase64 = frameBuffer.toString('base64')

    // Clean up
    await fs.rm(tempDir, { recursive: true, force: true })

    return NextResponse.json({
      success: true,
      originalImage: `data:image/jpeg;base64,${imageBuffer.toString('base64')}`,
      videoFrame: `data:image/jpeg;base64,${frameBase64}`,
      videoSize: (await fs.stat(videoPath)).size
    })

  } catch (error) {
    console.error('Video frame test failed:', error)
    
    return NextResponse.json(
      { 
        error: 'Video frame test failed', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
