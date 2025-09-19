import OpenAI from 'openai'
import { ScriptResponse, ScriptScene } from '@/types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const STYLE_PROFILE = "Modern medical infographic style, high contrast, minimal text, friendly but professional icons, clean typography, muted color palette with accent colors, flat design with subtle shadows, consistent visual language"

export async function generateScript(
  prompt: string,
  targetDuration: number,
  language: string = 'English'
): Promise<ScriptResponse> {
  const systemPrompt = `You are a professional video script writer. Create a structured explainer video script based on the user's prompt.

Requirements:
- Generate exactly 6-8 scenes
- Total duration should be ${targetDuration} seconds (±10%)
- Each scene should be 15-30 seconds long
- Narration should be 125-160 words per minute (speech rate)
- Use clear, engaging language in ${language}
- Each scene should have a clear goal and purpose
- Include on-screen captions that complement the narration
- Provide detailed image descriptions for visual generation

Return a JSON object with this exact structure:
{
  "title": "Video Title",
  "totalDuration": ${targetDuration},
  "scenes": [
    {
      "sceneId": "scene_1",
      "goal": "One sentence describing what this scene accomplishes",
      "narration": "The spoken narration text for this scene",
      "caption": "On-screen text caption (keep it short and impactful)",
      "imageDescription": "Detailed description for image generation",
      "duration": 20
    }
  ]
}`

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 2000,
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error('No content generated from OpenAI')
  }

  try {
    const script = JSON.parse(content) as ScriptResponse
    return script
  } catch (error) {
    throw new Error(`Failed to parse OpenAI response: ${error}`)
  }
}

export async function generateImage(
  description: string,
  styleProfile: string = STYLE_PROFILE
): Promise<Buffer> {
  const prompt = `${styleProfile}. ${description}. High quality, professional, clean composition.`

  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt,
    n: 1,
    size: '1024x1024',
    quality: 'hd',
    response_format: 'b64_json',
  })

  const imageData = response.data[0]?.b64_json
  if (!imageData) {
    throw new Error('No image data generated from OpenAI')
  }

  return Buffer.from(imageData, 'base64')
}

export async function generateVideo(
  description: string,
  styleProfile: string = STYLE_PROFILE,
  duration: number = 5
): Promise<Buffer> {
  const prompt = `${styleProfile}. ${description}. Create a short video clip that demonstrates this concept. Professional, educational, smooth motion.`

  try {
    const response = await openai.videos.generate({
      model: 'sora', // Using Sora for video generation
      prompt,
      duration: Math.min(duration, 10), // Max 10 seconds
      size: '1024x1024',
      quality: 'hd',
    })

    // Download the video from the URL
    const videoResponse = await fetch(response.data[0].url)
    if (!videoResponse.ok) {
      throw new Error('Failed to download generated video')
    }

    return Buffer.from(await videoResponse.arrayBuffer())
  } catch (error) {
    // Fallback to image generation if video generation fails
    console.warn('Video generation failed, falling back to image:', error)
    return generateImage(description, styleProfile)
  }
}

export function calculateTokenCost(
  promptTokens: number,
  completionTokens: number,
  model: string = 'gpt-4'
): number {
  // Approximate costs per 1K tokens (as of 2024)
  const costs = {
    'gpt-4': { input: 0.03, output: 0.06 },
    'gpt-3.5-turbo': { input: 0.001, output: 0.002 },
  }

  const modelCost = costs[model as keyof typeof costs] || costs['gpt-4']
  const inputCost = (promptTokens / 1000) * modelCost.input
  const outputCost = (completionTokens / 1000) * modelCost.output

  return inputCost + outputCost
}
