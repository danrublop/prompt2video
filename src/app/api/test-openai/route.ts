import { NextRequest, NextResponse } from 'next/server'
import { generateScript, generateImage, generateSpeech, generateWhiteboardPlan } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt = 'Test prompt' } = body
    
    console.log('Testing OpenAI functions...')

    // Test 1: Script generation
    console.log('Test 1: Script generation...')
    const script = await generateScript(prompt, 60, 'English')
    console.log('✓ Script generation successful')

    // Test 2: Image generation
    console.log('Test 2: Image generation...')
    const imageBuffer = await generateImage('Simple whiteboard drawing of a house')
    console.log('✓ Image generation successful, size:', imageBuffer.length)

    // Test 3: Speech generation
    console.log('Test 3: Speech generation...')
    const audioBuffer = await generateSpeech('This is a test narration', 'alloy')
    console.log('✓ Speech generation successful, size:', audioBuffer.length)

    // Test 4: Whiteboard plan generation
    console.log('Test 4: Whiteboard plan generation...')
    const steps = await generateWhiteboardPlan('This is a test narration', 'Simple whiteboard drawing')
    console.log('✓ Whiteboard plan generation successful, steps:', steps.length)

    return NextResponse.json({
      success: true,
      message: 'All OpenAI functions working correctly',
      results: {
        script: {
          title: script.title,
          scenes: script.scenes.length
        },
        imageSize: imageBuffer.length,
        audioSize: audioBuffer.length,
        stepsCount: steps.length
      }
    })

  } catch (error) {
    console.error('OpenAI test failed:', error)
    return NextResponse.json(
      { 
        error: 'OpenAI test failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
