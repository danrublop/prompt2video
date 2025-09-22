import OpenAI from 'openai'
import { ScriptResponse } from '@/types'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null

const STYLE_PROFILE = 'Modern, clean, professional visuals. High quality, minimal text.'

export async function generateScript(
  prompt: string,
  targetDuration: number,
  language: string = 'English'
): Promise<ScriptResponse> {
  if (!openai) {
    throw new Error('OPENAI_API_KEY not set. Cannot generate real script.')
  }

  const systemPrompt = `You are a professional video script writer. Create a structured explainer video script.

Requirements:
- Generate exactly 6 scenes
- Total duration should be ${targetDuration} seconds (±10%)
- Each scene should be 15-30 seconds long
- Narration should be 125-160 words per minute
- Use clear, engaging language in ${language}
- Each scene should have a clear goal and purpose
- Include on-screen captions and detailed image descriptions

Return a JSON object with this exact structure:
{
  "title": "Video Title",
  "totalDuration": ${targetDuration},
  "scenes": [
    {
      "sceneId": "scene_1",
      "goal": "One sentence describing what this scene accomplishes",
      "narration": "The spoken narration text for this scene",
      "caption": "On-screen text caption (short and impactful)",
      "imageDescription": "Detailed description for image generation",
      "duration": 20
    }
  ]
}`

  const resp = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 2000
  })

  let content = resp.choices[0]?.message?.content
  if (!content) throw new Error('No content from OpenAI')
  // Some models return markdown code fences. Strip them if present.
  const fenceMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenceMatch && fenceMatch[1]) {
    content = fenceMatch[1]
  }
  // As a fallback, try to isolate the first JSON object
  if (content.trim().startsWith('```')) {
    // remove any leading backticks remnants
    content = content.replace(/^```[a-zA-Z]*\n?/, '').replace(/```\s*$/, '')
  }
  // If still contains text around JSON, slice between first { and last }
  if (!content.trim().startsWith('{')) {
    const first = content.indexOf('{')
    const last = content.lastIndexOf('}')
    if (first !== -1 && last !== -1 && last > first) {
      content = content.slice(first, last + 1)
    }
  }
  return JSON.parse(content) as ScriptResponse
}

export async function generateImage(
  description: string,
  styleProfile: string = STYLE_PROFILE
): Promise<Buffer> {
  if (!openai) {
    throw new Error('OPENAI_API_KEY not set. Cannot generate real images.')
  }

  const prompt = `${styleProfile}. ${description}. High quality, professional, clean composition.`
  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt,
    n: 1,
    size: '1024x1024',
    quality: 'hd'
  })

  const imageUrl = response.data?.[0]?.url
  if (!imageUrl) throw new Error('No image URL generated from OpenAI')
  
  // Download the image from the URL
  const imageResponse = await fetch(imageUrl)
  if (!imageResponse.ok) throw new Error('Failed to download image from OpenAI')
  const imageBuffer = await imageResponse.arrayBuffer()
  return Buffer.from(imageBuffer)
}

export function calculateTokenCost(promptTokens: number, completionTokens: number): number {
  // Simple approximate costing for demonstration (adjust as needed)
  const inputCostPerToken = 0.0000015 // $ per token
  const outputCostPerToken = 0.000002  // $ per token
  return promptTokens * inputCostPerToken + completionTokens * outputCostPerToken
}

export async function generateVideo(
  description: string,
  styleProfile: string = STYLE_PROFILE,
  duration: number = 5
): Promise<Buffer> {
  // Not used in current pipeline; return empty buffer for compatibility
  return Buffer.from('')
}

export async function generateSpeech(
  text: string,
  voice: string = 'alloy'
): Promise<Buffer> {
  if (!openai) {
    throw new Error('OPENAI_API_KEY not set. Cannot generate speech.')
  }

  // Simple retry to avoid transient API hiccups
  let lastError: unknown
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await openai.audio.speech.create({
        model: 'tts-1',
        voice: voice as any,
        input: text,
        response_format: 'mp3'
      })

      const contentType = response.headers.get('content-type') || ''
      const arrayBuffer = await response.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // Validate that we received MP3 data (starts with 'ID3' or frame sync 0xFF 0xFB)
      const looksLikeMp3 =
        buffer.length > 1000 &&
        (
          (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) ||
          (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0)
        )

      if (!contentType.includes('audio') || !looksLikeMp3) {
        // Try to extract error text for debugging
        try {
          const textResponse = await openai.audio.speech.create({
            model: 'tts-1',
            voice: voice as any,
            input: text,
            response_format: 'json'
          })
          const errorText = await textResponse.text()
          throw new Error(`OpenAI TTS returned non-audio payload (content-type=${contentType}). Details: ${errorText}`)
        } catch {
          throw new Error(`OpenAI TTS returned non-audio payload (content-type=${contentType}).`)
        }
      }

      return buffer
    } catch (err) {
      lastError = err
      if (attempt === 2) break
      await new Promise(r => setTimeout(r, 300))
    }
  }

  throw lastError instanceof Error ? lastError : new Error('OpenAI TTS failed')
}


