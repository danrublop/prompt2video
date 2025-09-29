import { NextRequest, NextResponse } from 'next/server'
import { memoryStorage } from '@/lib/memory-storage'
import { generateContentSpecificImage } from '@/lib/openai'
import { generateImage } from '@/lib/mock-openai'
import { VideoComposer } from '@/lib/video-composer'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { jobId, assetId, customPrompt, theme, sceneIndex } = body
    
    if (!jobId || !assetId || !customPrompt || !theme) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Get job details
    const job = await memoryStorage.getJob(jobId)
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    // Check if we're in demo mode
    const hasOpenAI = !!process.env.OPENAI_API_KEY &&
      process.env.OPENAI_API_KEY !== 'mock' &&
      process.env.OPENAI_API_KEY !== 'your_openai_api_key_here'
    const isDemoMode = !hasOpenAI

    // Get video dimensions for proper aspect ratio
    const videoComposer = new VideoComposer()
    const dimensions = videoComposer.getVideoDimensions(job.aspectRatio as '16:9' | '9:16' | '1:1')

    // Generate new image
    console.log(`Regenerating image for scene ${sceneIndex} with prompt: ${customPrompt}`)
    const imageBuffer = isDemoMode 
      ? await generateImage(customPrompt)
      : await generateContentSpecificImage(
          customPrompt, // Use custom prompt as narration
          customPrompt, // Use custom prompt as description
          theme,
          sceneIndex,
          job.assets?.length || 6,
          dimensions
        )

    // Store new image
    const newImageUrl = await memoryStorage.storeFile(jobId, 'image', `scene_${sceneIndex}_image_edited_${Date.now()}.jpg`, imageBuffer)

    // Update the asset in storage
    await memoryStorage.updateAsset(assetId, {
      url: newImageUrl,
      meta: { 
        ...job.assets?.find(a => a.id === assetId)?.meta,
        edited: true,
        customPrompt,
        theme,
        editedAt: new Date().toISOString()
      }
    })

    return NextResponse.json({
      success: true,
      newUrl: newImageUrl,
      message: 'Image regenerated successfully'
    })

  } catch (error) {
    console.error('Image regeneration failed:', error)
    return NextResponse.json(
      { 
        error: 'Image regeneration failed', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
