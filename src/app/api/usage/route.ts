import { NextResponse } from 'next/server'
import { memoryStorage } from '@/lib/memory-storage'

export async function GET() {
  try {
    // Derive usage from all known jobs' totalCost to avoid losing data across restarts
    const jobs = await memoryStorage.getAllJobs()
    const derivedTotal = jobs.reduce((sum, job) => sum + (job.totalCost || 0), 0)
    const health = await memoryStorage.healthCheck()

    return NextResponse.json({
      totalUsage: derivedTotal,
      totalJobs: health.jobs,
      totalAssets: health.assets,
      lastUpdated: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching usage:', error)
    return NextResponse.json(
      { error: 'Failed to fetch usage data' },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    await memoryStorage.resetUsage()
    return NextResponse.json({ success: true, message: 'Usage reset successfully' })
  } catch (error) {
    console.error('Error resetting usage:', error)
    return NextResponse.json(
      { error: 'Failed to reset usage' },
      { status: 500 }
    )
  }
}
