import { NextRequest, NextResponse } from 'next/server'
import { simpleProcessor } from '@/lib/simple-processor'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: jobId } = params

    console.log(`Retrying job: ${jobId}`)
    
    // Get the current job to check its status
    const job = await simpleProcessor.getJob(jobId)
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    if (job.status !== 'FAILED') {
      return NextResponse.json(
        { error: 'Job is not in failed state' },
        { status: 400 }
      )
    }

    // Reset status and clear any RUNNING step to FAILED for clarity
    try {
      await simpleProcessor.updateJob(jobId, { status: 'RUNNING' })
    } catch (e) {
      console.error('Failed to update job status before retry:', e)
      // Continue anyway
    }
    
    // Start processing in the background (don't await)
    simpleProcessor.processJob(jobId).catch(error => {
      console.error(`Retry processing failed for job ${jobId}:`, error)
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Job retry initiated',
      jobId 
    })

  } catch (error) {
    console.error('Error retrying job:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to retry job' },
      { status: 500 }
    )
  }
}
