import { NextRequest, NextResponse } from 'next/server'
import { heygenClient } from '@/lib/heygen'

export async function GET(request: NextRequest) {
  try {
    console.log('Fetching HeyGen avatars...')
    
    const avatars = await heygenClient.getAvatars()
    
    console.log(`Successfully fetched ${avatars.length} avatars`)
    
    return NextResponse.json({
      success: true,
      avatars: avatars,
      count: avatars.length
    })
  } catch (error) {
    console.error('Error fetching HeyGen avatars:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch avatars',
      avatars: [],
      count: 0
    }, { status: 500 })
  }
}