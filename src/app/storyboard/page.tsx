'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface ScriptScene {
  sceneId: string
  goal: string
  narration: string
  caption: string
  imageDescription: string
  duration: number
}

interface ScriptResponse {
  title: string
  totalDuration: number
  scenes: ScriptScene[]
  demo?: boolean
}

export default function StoryboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [script, setScript] = useState<ScriptResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')
  const [editingScene, setEditingScene] = useState<number | null>(null)
  const [editedScript, setEditedScript] = useState<ScriptResponse | null>(null)

  // Get parameters from URL
  const prompt = searchParams.get('prompt') || ''
  const aspectRatio = searchParams.get('aspectRatio') || '16:9'
  const duration = parseInt(searchParams.get('duration') || '150')
  const language = searchParams.get('language') || 'en-US'
  const voiceId = searchParams.get('voiceId') || ''
  const multiLanguage = searchParams.get('multiLanguage') === 'true'
  const targetLanguages = searchParams.get('targetLanguages')?.split(',') || []

  console.log('Storyboard page parameters:', {
    prompt,
    aspectRatio,
    duration,
    language,
    voiceId,
    multiLanguage,
    targetLanguages
  })

  // Generate mock translations for multi-language mode
  const generateMockTranslations = (text: string, targetLanguages: string[]) => {
    const translations: { [key: string]: string } = {}
    
    targetLanguages.forEach(langCode => {
      // Simple mock translation based on language code
      if (langCode.startsWith('es')) {
        translations[langCode] = `[ES] ${text}`
      } else if (langCode.startsWith('fr')) {
        translations[langCode] = `[FR] ${text}`
      } else if (langCode.startsWith('de')) {
        translations[langCode] = `[DE] ${text}`
      } else if (langCode.startsWith('it')) {
        translations[langCode] = `[IT] ${text}`
      } else if (langCode.startsWith('pt')) {
        translations[langCode] = `[PT] ${text}`
      } else if (langCode.startsWith('zh')) {
        translations[langCode] = `[中文] ${text}`
      } else if (langCode.startsWith('ja')) {
        translations[langCode] = `[日本語] ${text}`
      } else if (langCode.startsWith('ko')) {
        translations[langCode] = `[한국어] ${text}`
      } else if (langCode.startsWith('ru')) {
        translations[langCode] = `[Русский] ${text}`
      } else if (langCode.startsWith('ar')) {
        translations[langCode] = `[العربية] ${text}`
      } else {
        translations[langCode] = `[${langCode.toUpperCase()}] ${text}`
      }
    })
    
    return translations
  }

  useEffect(() => {
    if (prompt) {
      generateScript()
    }
  }, [])

  const generateScript = async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/generate-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          aspectRatio,
          duration,
          language,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate script')
      }

      const data = await response.json()
      setScript(data.script)
      setEditedScript(data.script)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate script')
    } finally {
      setIsLoading(false)
    }
  }

  const regenerateScript = async () => {
    await generateScript()
  }

  const updateScene = (sceneIndex: number, field: keyof ScriptScene, value: string | number) => {
    if (!editedScript) return

    const updatedScenes = [...editedScript.scenes]
    updatedScenes[sceneIndex] = {
      ...updatedScenes[sceneIndex],
      [field]: value
    }

    setEditedScript({
      ...editedScript,
      scenes: updatedScenes
    })
  }

  const confirmAndGenerate = async () => {
    if (!editedScript) return

    setIsGenerating(true)
    setError('')

    try {
      console.log('Creating job with script:', editedScript)
      
      // Create job with the edited script
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          aspectRatio,
          duration,
          language,
          voiceId: voiceId || undefined,
          script: editedScript, // Pass the edited script
          multiLanguage,
          targetLanguages,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Job creation failed:', response.status, errorText)
        throw new Error(`Failed to create job: ${response.status} ${errorText}`)
      }

      const jobData = await response.json()
      console.log('Job created successfully:', jobData)
      
      // For demo mode, redirect to demo page with job ID instead of main page
      const isDemo = searchParams.get('demo') === 'true' || window.location.pathname.includes('/demo')
      if (isDemo) {
        router.push(`/demo?jobId=${jobData.id}`)
      } else {
        router.push(`/?jobId=${jobData.id}`)
      }
    } catch (err) {
      console.error('Error creating job:', err)
      setError(err instanceof Error ? err.message : 'Failed to create job')
    } finally {
      setIsGenerating(false)
    }
  }

  const goBack = () => {
    router.back()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Generating your storyboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
            <p className="text-red-600">{error}</p>
          </div>
          <button
            onClick={goBack}
            className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  if (!script) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No script available</p>
          <button
            onClick={goBack}
            className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Storyboard Preview</h1>
              <p className="text-lg text-gray-600 mb-2">{script.title}</p>
              <div className="flex space-x-4 text-sm text-gray-500">
                <span>Duration: {Math.round(script.totalDuration)}s</span>
                <span>Scenes: {script.scenes.length}</span>
                <span>Aspect Ratio: {aspectRatio}</span>
                <span>Language: {language}</span>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={regenerateScript}
                className="bg-yellow-600 text-white py-2 px-4 rounded-md hover:bg-yellow-700 transition-colors"
              >
                Regenerate Script
              </button>
              <button
                onClick={goBack}
                className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
              >
                Back
              </button>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <p className="text-blue-800 text-sm">
              <strong>Review and edit your storyboard below.</strong> You can modify the narration, captions, and image descriptions for each scene. 
              Once you're satisfied, click "Confirm & Generate Video" to create your video.
            </p>
            {script && script.demo && (
              <p className="text-yellow-800 text-sm mt-2 font-medium">
                🎭 Demo Mode: This is using mock data. Add your API keys for real video generation.
              </p>
            )}
            {multiLanguage && (
              <p className="text-green-800 text-sm mt-2 font-medium">
                🌍 Multi-Language: This video will be generated in {targetLanguages.length} language{targetLanguages.length !== 1 ? 's' : ''}: {targetLanguages.join(', ')}
              </p>
            )}
          </div>
        </div>

        {/* Storyboard */}
        <div className="space-y-6">
          {editedScript?.scenes.map((scene, index) => (
            <div key={scene.sceneId} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  Scene {index + 1}: {scene.goal}
                </h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">{scene.duration}s</span>
                  <button
                    onClick={() => setEditingScene(editingScene === index ? null : index)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    {editingScene === index ? 'Done Editing' : 'Edit Scene'}
                  </button>
                </div>
              </div>

              {editingScene === index ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Goal
                    </label>
                    <input
                      type="text"
                      value={scene.goal}
                      onChange={(e) => updateScene(index, 'goal', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Narration {multiLanguage && targetLanguages.length > 0 ? '(Primary Language)' : ''}
                    </label>
                    <textarea
                      value={scene.narration}
                      onChange={(e) => updateScene(index, 'narration', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                    {multiLanguage && targetLanguages.length > 0 && (
                      <div className="mt-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Translations Preview
                        </label>
                        <div className="space-y-2">
                          {targetLanguages.map((langCode) => {
                            const translations = generateMockTranslations(scene.narration, [langCode])
                            const translation = translations[langCode]
                            return (
                              <div key={langCode} className="bg-blue-50 rounded-md p-2 border border-blue-200">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-medium text-blue-800">{langCode.toUpperCase()}</span>
                                </div>
                                <p className="text-gray-700 text-xs">{translation}</p>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Caption
                    </label>
                    <input
                      type="text"
                      value={scene.caption}
                      onChange={(e) => updateScene(index, 'caption', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Image Description
                    </label>
                    <textarea
                      value={scene.imageDescription}
                      onChange={(e) => updateScene(index, 'imageDescription', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={2}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Duration (seconds)
                      </label>
                      <input
                        type="number"
                        value={scene.duration}
                        onChange={(e) => updateScene(index, 'duration', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="5"
                        max="60"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Multi-Language Narration Display */}
                  {multiLanguage && targetLanguages.length > 0 ? (
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900 mb-2">Narration (Multi-Language)</h4>
                      {targetLanguages.map((langCode) => {
                        const translations = generateMockTranslations(scene.narration, [langCode])
                        const translation = translations[langCode]
                        return (
                          <div key={langCode} className="bg-gray-50 rounded-md p-3 border-l-4 border-blue-200">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-blue-800">{langCode.toUpperCase()}</span>
                              <span className="text-xs text-gray-500">{scene.duration}s</span>
                            </div>
                            <p className="text-gray-700 text-sm">{translation}</p>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-md p-4">
                      <h4 className="font-medium text-gray-900 mb-2">Narration</h4>
                      <p className="text-gray-700">{scene.narration}</p>
                    </div>
                  )}
                  
                  <div className="bg-gray-50 rounded-md p-4">
                    <h4 className="font-medium text-gray-900 mb-2">On-Screen Caption</h4>
                    <p className="text-gray-700 font-medium">{scene.caption}</p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-md p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Visual Description</h4>
                    <p className="text-gray-700">{scene.imageDescription}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Total Duration: {Math.round(editedScript?.totalDuration || 0)}s | 
              Scenes: {editedScript?.scenes.length || 0} | 
              Estimated Cost: ${((editedScript?.scenes.length || 0) * 0.24 + 0.05).toFixed(4)}
            </div>
            <div className="flex space-x-4">
              <button
                onClick={regenerateScript}
                className="bg-yellow-600 text-white py-2 px-6 rounded-md hover:bg-yellow-700 transition-colors"
              >
                Regenerate Script
              </button>
              <button
                onClick={confirmAndGenerate}
                disabled={isGenerating}
                className="bg-green-600 text-white py-2 px-6 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isGenerating ? 'Generating Video...' : 'Confirm & Generate Video'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
