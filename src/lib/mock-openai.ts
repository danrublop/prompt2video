import { ScriptResponse, ScriptScene } from '@/types'

// Mock implementation for testing without OpenAI API keys
export async function generateScript(
  prompt: string,
  targetDuration: number,
  language: string = 'English'
): Promise<ScriptResponse> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Generate mock script based on prompt
  const scenes: ScriptScene[] = [
    {
      sceneId: "scene_1",
      goal: "Introduce the main concept",
      narration: `Welcome to this explanation about ${prompt.toLowerCase()}. Today we'll explore the key concepts and benefits.`,
      caption: "Introduction",
      imageDescription: `A professional infographic showing ${prompt} concept with clean, modern design`,
      duration: Math.min(20, targetDuration / 4)
    },
    {
      sceneId: "scene_2", 
      goal: "Explain the core principles",
      narration: `The fundamental principles of ${prompt.toLowerCase()} are based on proven methodologies and best practices.`,
      caption: "Core Principles",
      imageDescription: `A diagram illustrating the main principles of ${prompt} with clear visual hierarchy`,
      duration: Math.min(25, targetDuration / 4)
    },
    {
      sceneId: "scene_3",
      goal: "Show practical applications",
      narration: `In practice, ${prompt.toLowerCase()} can be applied in various scenarios to achieve remarkable results.`,
      caption: "Applications",
      imageDescription: `A showcase of real-world applications of ${prompt} with examples and case studies`,
      duration: Math.min(30, targetDuration / 4)
    },
    {
      sceneId: "scene_4",
      goal: "Highlight key benefits",
      narration: `The benefits of implementing ${prompt.toLowerCase()} include improved efficiency, better outcomes, and enhanced user experience.`,
      caption: "Key Benefits",
      imageDescription: `A benefits diagram showing the advantages of ${prompt} with icons and statistics`,
      duration: Math.min(25, targetDuration / 4)
    }
  ]

  return {
    title: `Understanding ${prompt}`,
    totalDuration: targetDuration,
    scenes
  }
}

export async function generateImage(
  description: string,
  styleProfile: string = "Modern medical infographic style"
): Promise<Buffer> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  // Create a simple mock image (1x1 pixel PNG)
  const mockImageData = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    'base64'
  )
  
  return mockImageData
}

export async function generateVideo(
  description: string,
  styleProfile: string = "Modern medical infographic style",
  duration: number = 5
): Promise<Buffer> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 3000))
  
  // For demo purposes, return the same mock image as video
  return generateImage(description, styleProfile)
}

export function calculateTokenCost(
  promptTokens: number,
  completionTokens: number,
  model: string = 'gpt-4'
): number {
  // Return mock cost for demo
  return 0.05
}
