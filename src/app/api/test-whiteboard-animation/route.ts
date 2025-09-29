import { NextRequest, NextResponse } from 'next/server'
import { generateImage, generateSpeech } from '@/lib/openai'
import { videoComposer } from '@/lib/video-composer'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt = 'A simple plant diagram' } = body
    
    console.log(`Testing whiteboard animation for: "${prompt}"`)

    // Generate image and audio
    const imageBuffer = await generateImage(`Whiteboard line-art, black marker on white background, no color. ${prompt}`)
    const audioBuffer = await generateSpeech('This is a test narration for the whiteboard animation.', 'alloy')
    
    console.log(`Image generated, size: ${imageBuffer.length} bytes`)
    console.log(`Audio generated, size: ${audioBuffer.length} bytes`)

    // Create whiteboard scene
    const whiteboardScene = {
      kind: 'WHITEBOARD',
      sceneId: 'test_scene',
      imageBuffer,
      audioBuffer,
      caption: 'Test whiteboard animation',
      duration: 5, // 5 seconds
      steps: ['Step 1: Draw the outline', 'Step 2: Add details', 'Step 3: Complete the drawing']
    }

    const compositionOptions = {
      aspectRatio: '16:9' as const,
      scenes: [whiteboardScene]
    }

    console.log('Creating whiteboard animation with subtitles...')
    const finalVideoBuffer = await videoComposer.composeVideo(compositionOptions, ['en'])
    console.log(`Whiteboard animation created with subtitles, size: ${finalVideoBuffer.length} bytes`)

    // Convert to base64
    const videoBase64 = finalVideoBuffer.toString('base64')
    
    return NextResponse.json({
      success: true,
      originalImage: `data:image/jpeg;base64,${imageBuffer.toString('base64')}`,
      video: `data:video/mp4;base64,${videoBase64}`,
      videoSize: finalVideoBuffer.length
    })

  } catch (error) {
    console.error('Whiteboard animation test failed:', error)
    
    return NextResponse.json(
      { 
        error: 'Whiteboard animation test failed', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
