import { NextRequest, NextResponse } from 'next/server'
import { simpleProcessor } from '@/lib/simple-processor'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params

    console.log(`Fetching job with ID: ${jobId}`)
    const job = await simpleProcessor.getJob(jobId)

    if (!job) {
      console.log(`Job not found: ${jobId}`)
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    console.log(`Job found: ${jobId}, status: ${job.status}`)
    if (job.status === 'FAILED') {
      const failedStep = job.steps?.find(s => s.status === 'FAILED')
      return NextResponse.json({
        ...job,
        failedStep: failedStep?.type,
        failedError: failedStep?.error
      }, { status: 200 })
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
