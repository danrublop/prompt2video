import { NextResponse } from 'next/server'
import { getAvailableThemes } from '@/lib/themes'

export async function GET() {
  try {
    const themes = getAvailableThemes()
    return NextResponse.json({ themes })
  } catch (error) {
    console.error('Error fetching themes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch themes' },
      { status: 500 }
    )
  }
}

