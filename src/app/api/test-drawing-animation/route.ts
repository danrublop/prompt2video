import { NextRequest, NextResponse } from 'next/server'
import { generateImage, generateSpeech } from '@/lib/openai'
import ffmpeg from 'fluent-ffmpeg'
import fs from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt = 'A simple plant diagram' } = body
    
    console.log(`Testing drawing animation for: "${prompt}"`)

    // Generate image and audio
    const imageBuffer = await generateImage(`Whiteboard line-art, black marker on white background, no color. ${prompt}`)
    const audioBuffer = await generateSpeech('This is a test narration for the drawing animation.', 'alloy')
    
    console.log(`Image generated, size: ${imageBuffer.length} bytes`)
    console.log(`Audio generated, size: ${audioBuffer.length} bytes`)

    // Create temp files
    const tempDir = path.join(process.cwd(), 'temp', `drawing_test_${Date.now()}`)
    await fs.mkdir(tempDir, { recursive: true })
    
    const imagePath = path.join(tempDir, 'test_image.jpg')
    const audioPath = path.join(tempDir, 'test_audio.mp3')
    const videoPath = path.join(tempDir, 'test_video.mp4')
    
    await fs.writeFile(imagePath, imageBuffer)
    await fs.writeFile(audioPath, audioBuffer)

    // Create the simplest possible video
    await new Promise((resolve, reject) => {
      const command = ffmpeg()
        .input(imagePath)
        .input(audioPath)
        .outputOptions([
          '-c:v', 'libx264',
          '-c:a', 'aac',
          '-vf', 'scale=1920:1080,fade=t=in:st=0:d=1,fade=t=out:st=4:d=1',
          '-t', '5',
          '-r', '30',
          '-pix_fmt', 'yuv420p'
        ])
        .output(videoPath)
        .on('start', (commandLine) => {
          console.log('FFmpeg command:', commandLine)
        })
        .on('progress', (progress) => {
          console.log('Processing: ' + progress.percent + '% done')
        })
        .on('end', () => {
          console.log('Drawing animation created successfully')
          resolve(undefined)
        })
        .on('error', (err) => {
          console.error('FFmpeg error:', err)
          reject(err)
        })
        .run()
    })

    // Check if video was created and has content
    const videoStats = await fs.stat(videoPath)
    console.log(`Video file size: ${videoStats.size} bytes`)

    if (videoStats.size === 0) {
      throw new Error('Video file is empty')
    }

    // Read the video
    const videoBuffer = await fs.readFile(videoPath)
    const videoBase64 = videoBuffer.toString('base64')

    // Clean up
    await fs.rm(tempDir, { recursive: true, force: true })

    return NextResponse.json({
      success: true,
      originalImage: `data:image/jpeg;base64,${imageBuffer.toString('base64')}`,
      video: `data:video/mp4;base64,${videoBase64}`,
      videoSize: videoStats.size
    })

  } catch (error) {
    console.error('Drawing animation test failed:', error)
    
    return NextResponse.json(
      { 
        error: 'Drawing animation test failed', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
