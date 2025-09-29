import { NextRequest, NextResponse } from 'next/server'
import { createSceneGenerator } from '@/lib/scene-generator'

export async function GET(
  request: NextRequest,
  { params }: { params: { sceneId: string } }
) {
  try {
    const { sceneId } = params
    const { searchParams } = new URL(request.url)
    const narration = searchParams.get('narration')
    const aspectRatio = searchParams.get('aspectRatio') as '16:9' | '9:16' | '1:1' || '16:9'

    if (!narration) {
      return NextResponse.json(
        { error: 'Narration parameter is required' },
        { status: 400 }
      )
    }

    const openaiApiKey = process.env.OPENAI_API_KEY
    if (!openaiApiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    const sceneGenerator = createSceneGenerator(openaiApiKey)
    
    // Generate a single scene
    const result = await sceneGenerator.generateScenes({
      narration,
      aspectRatio,
      duration: 10 // Single scene duration
    })

    if (result.scenes.length === 0) {
      return NextResponse.json(
        { error: 'No scenes generated' },
        { status: 404 }
      )
    }

    const scene = result.scenes[0]
    
    // Return the video buffer as a response
    return new NextResponse(scene.videoBuffer, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="scene_${sceneId}.mp4"`,
        'Cache-Control': 'public, max-age=3600'
      }
    })

  } catch (error) {
    console.error('Scene video generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate scene video' },
      { status: 500 }
    )
  }
}
