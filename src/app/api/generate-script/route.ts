import { NextRequest, NextResponse } from 'next/server'
import { generateScript } from '@/lib/openai'
import { generateScript as mockGenerateScript } from '@/lib/mock-openai'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, aspectRatio = '16:9', duration = 150, language = 'English' } = body
    
    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 422 }
      )
    }

    console.log(`Generating script for: "${prompt}"`)

    // Check if we're in demo mode (mock API keys or missing keys)
    const isDemoMode = !process.env.OPENAI_API_KEY || 
                      process.env.OPENAI_API_KEY === 'mock' || 
                      process.env.OPENAI_API_KEY === 'your_openai_api_key_here' ||
                      process.env.HEYGEN_API_KEY === 'mock' ||
                      process.env.HEYGEN_API_KEY === 'your_heygen_api_key_here'
    
    // Generate script only (no images, audio, or video yet)
    const script = isDemoMode 
      ? await mockGenerateScript(prompt.trim(), duration, language)
      : await generateScript(prompt.trim(), duration, language)

    return NextResponse.json({
      success: true,
      script: script,
      estimatedCost: (script.scenes.length * 0.24) + 0.05, // Approximate cost
      duration: script.totalDuration,
      sceneCount: script.scenes.length,
      demo: isDemoMode
    })

  } catch (error) {
    console.error('Script generation failed:', error)
    return NextResponse.json(
      { 
        error: 'Script generation failed', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
