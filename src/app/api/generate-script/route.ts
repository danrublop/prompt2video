import { NextRequest, NextResponse } from 'next/server'
import { generateScript } from '@/lib/openai'
import { generateScript as mockGenerateScript } from '@/lib/mock-openai'
import { SUPPORTED_LANGUAGES, getLanguageByCode } from '@/lib/languages'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, aspectRatio = '16:9', duration = 150, languages = ['en'] } = body
    
    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 422 }
      )
    }

    console.log(`Generating script for: "${prompt}" in ${languages.length} languages`)

    // Check if we're in demo mode (mock API keys or missing keys)
    const isDemoMode = !process.env.OPENAI_API_KEY || 
                      process.env.OPENAI_API_KEY === 'mock' || 
                      process.env.OPENAI_API_KEY === 'your_openai_api_key_here' ||
                      process.env.HEYGEN_API_KEY === 'mock' ||
                      process.env.HEYGEN_API_KEY === 'your_heygen_api_key_here'
    
    // Generate script for each language
    const scriptPromises = languages.map(async (langCode: string) => {
      const language = getLanguageByCode(langCode)
      const languageName = language?.name || langCode
      
      const script = isDemoMode 
        ? await mockGenerateScript(prompt.trim(), duration, languageName)
        : await generateScript(prompt.trim(), duration, languageName)
      
      return { langCode, script }
    })

    const languageScripts = await Promise.all(scriptPromises)
    
    // Create the main script (first language) and multi-language object
    const mainScript = languageScripts[0].script
    const multiLanguageScripts: { [key: string]: any } = {}
    
    languageScripts.forEach(({ langCode, script }) => {
      multiLanguageScripts[langCode] = {
        title: script.title,
        scenes: script.scenes
      }
    })

    // Add multi-language support to the main script
    const finalScript = {
      ...mainScript,
      languages: multiLanguageScripts
    }

    return NextResponse.json({
      success: true,
      script: finalScript,
      estimatedCost: (mainScript.scenes.length * languages.length * 0.24) + 0.05, // Cost per language
      duration: mainScript.totalDuration,
      sceneCount: mainScript.scenes.length,
      languageCount: languages.length,
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
