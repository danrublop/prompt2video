import { NextRequest, NextResponse } from 'next/server'
import { memoryStorage } from '@/lib/memory-storage'
import { VideoComposer } from '@/lib/video-composer'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { jobId, editedAssets } = body
    
    console.log('Recompose video API called with:', { jobId, editedAssetsCount: editedAssets?.length })
    
    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      )
    }

    if (!editedAssets || !Array.isArray(editedAssets)) {
      return NextResponse.json(
        { error: 'Edited assets array is required' },
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

    if (job.status !== 'DONE') {
      return NextResponse.json(
        { error: 'Job must be completed before recomposing' },
        { status: 400 }
      )
    }

    console.log(`Recomposing video for job ${jobId} with ${editedAssets.length} edited assets`)

    // Get all current assets
    const allAssets = job.assets || []
    console.log(`Total assets in job: ${allAssets.length}`)

    // Create video composer instance
    const videoComposer = new VideoComposer()

    // Get languages from job
    const languages = job.language ? job.language.split(',') : ['en']
    const resultUrls: { [language: string]: string } = {}

    // Recreate video for each language
    for (const langCode of languages) {
      console.log(`Recomposing video for language: ${langCode}`)
      
      try {
        // Use the new recompose method with subtitles
        const videoBuffer = await videoComposer.recomposeVideo(
          jobId,
          job.aspectRatio,
          editedAssets,
          allAssets,
          languages
        )

        // Store the new video
        const newVideoUrl = await memoryStorage.storeFile(
          jobId, 
          'video', 
          `recomposed_${langCode}_${Date.now()}.mp4`, 
          videoBuffer
        )

        resultUrls[langCode] = newVideoUrl
        console.log(`Video recomposition completed for ${langCode}: ${newVideoUrl}`)
        
      } catch (error) {
        console.error(`Video recomposition failed for ${langCode}:`, error)
        throw new Error(`Video recomposition failed for ${langCode}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // Update job with new result URLs
    await memoryStorage.updateJob(jobId, {
      resultUrls,
      updatedAt: new Date()
    })

    return NextResponse.json({
      success: true,
      resultUrls,
      message: 'Video recomposed successfully'
    })

  } catch (error) {
    console.error('Video recomposition failed:', error)
    return NextResponse.json(
      { 
        error: 'Video recomposition failed', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
