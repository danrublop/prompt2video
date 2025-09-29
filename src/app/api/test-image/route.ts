import { NextRequest, NextResponse } from 'next/server'
import { generateImage } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt = 'A simple diagram of a plant cell' } = body
    
    console.log(`Testing image generation for: "${prompt}"`)

    // Generate image
    const imageBuffer = await generateImage(`Whiteboard line-art, black marker on white background, no color. ${prompt}`)
    console.log(`Image generated, size: ${imageBuffer.length} bytes`)

    // Convert to base64 for display
    const imageBase64 = imageBuffer.toString('base64')
    
    return NextResponse.json({
      success: true,
      image: `data:image/jpeg;base64,${imageBase64}`,
      size: imageBuffer.length
    })

  } catch (error) {
    console.error('Image test failed:', error)
    
    return NextResponse.json(
      { 
        error: 'Image test failed', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
