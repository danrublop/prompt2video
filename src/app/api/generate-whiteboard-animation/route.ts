import { NextRequest, NextResponse } from 'next/server'
import { whiteboardAnimator } from '@/lib/whiteboard-animator'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      prompt, 
      aspectRatio = '16:9', 
      duration = 20,
      strokeStyle = '#000000',
      lineWidth = 3,
      animationSpeed = 30
    } = body
    
    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 422 }
      )
    }

    console.log(`Starting whiteboard animation generation for: "${prompt}"`)

    // Generate whiteboard animation
    const result = await whiteboardAnimator.generateWhiteboardAnimation({
      prompt: prompt.trim(),
      aspectRatio: aspectRatio as '16:9' | '9:16' | '1:1',
      duration,
      strokeStyle,
      lineWidth,
      animationSpeed
    })
    
    // Convert to base64 for response
    const videoBase64 = result.videoBuffer.toString('base64')
    const imageBase64 = result.imageBuffer.toString('base64')
    
    console.log('Whiteboard animation generation completed successfully!')

    return NextResponse.json({
      success: true,
      video: `data:video/mp4;base64,${videoBase64}`,
      image: `data:image/jpeg;base64,${imageBase64}`,
      paths: result.paths,
      duration: duration
    })

  } catch (error) {
    console.error('Whiteboard animation generation failed:', error)
    return NextResponse.json(
      { 
        error: 'Whiteboard animation generation failed', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

