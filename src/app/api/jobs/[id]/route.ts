import { NextRequest, NextResponse } from 'next/server'
import { simpleProcessor } from '@/lib/simple-processor'
import { multiLanguageProcessor } from '@/lib/multi-language-processor'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params

      // Try both processors to find the job
      let job = await simpleProcessor.getJob(jobId)
      if (!job) {
        job = await multiLanguageProcessor.getJob(jobId)
      }

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(job)

  } catch (error) {
    console.error('Error fetching job:', error)
    return NextResponse.json(
      { error: 'Failed to fetch job' },
      { status: 500 }
    )
  }
}
