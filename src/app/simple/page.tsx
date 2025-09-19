'use client'

import { useState } from 'react'

export default function SimpleVideoGenerator() {
  const [prompt, setPrompt] = useState('')
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9')
  const [duration, setDuration] = useState(150) // 2.5 minutes in seconds
  const [language, setLanguage] = useState('English')
  const [voiceId, setVoiceId] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{
    video: string
    script: any
    totalCost: number
    duration: number
  } | null>(null)

  const generateVideo = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt')
      return
    }

    setIsGenerating(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          aspectRatio,
          duration,
          language,
          voiceId: voiceId.trim() || undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate video')
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate video')
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadVideo = () => {
    if (!result?.video) return
    
    const link = document.createElement('a')
    link.href = result.video
    link.download = `video-${Date.now()}.mp4`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Prompt2Video</h1>
          <p className="text-lg text-gray-600">
            Simple AI Video Generator - No Database Required
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Create Your Video</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prompt
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe what you want your video to explain..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  disabled={isGenerating}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Aspect Ratio
                  </label>
                  <select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value as '16:9' | '9:16' | '1:1')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isGenerating}
                  >
                    <option value="16:9">16:9 (Landscape)</option>
                    <option value="9:16">9:16 (Portrait)</option>
                    <option value="1:1">1:1 (Square)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (minutes)
                  </label>
                  <select
                    value={duration / 60}
                    onChange={(e) => setDuration(parseInt(e.target.value) * 60)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isGenerating}
                  >
                    <option value={2}>2 minutes</option>
                    <option value={2.5}>2.5 minutes</option>
                    <option value={3}>3 minutes</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isGenerating}
                  >
                    <option value="English">English</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                    <option value="German">German</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Voice ID (optional)
                  </label>
                  <input
                    type="text"
                    value={voiceId}
                    onChange={(e) => setVoiceId(e.target.value)}
                    placeholder="Leave empty for default"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isGenerating}
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <button
                onClick={generateVideo}
                disabled={isGenerating || !prompt.trim()}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isGenerating ? 'Generating Video...' : 'Generate Video'}
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Results</h2>
            
            {!result ? (
              <div className="text-center text-gray-500 py-8">
                {isGenerating ? 'Generating your video...' : 'No video generated yet. Enter a prompt and click Generate.'}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Video Player */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Your Video</h3>
                  <video
                    controls
                    className="w-full rounded-md"
                    src={result.video}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>

                {/* Download Button */}
                <button
                  onClick={downloadVideo}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
                >
                  Download Video
                </button>

                {/* Video Info */}
                <div className="bg-gray-50 rounded-md p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Video Details</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div>Duration: {Math.round(result.duration)} seconds</div>
                    <div>Estimated Cost: ${result.totalCost.toFixed(4)}</div>
                    <div>Scenes: {result.script.scenes.length}</div>
                  </div>
                </div>

                {/* Script Preview */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Script Preview</h4>
                  <div className="bg-gray-50 rounded-md p-3 max-h-40 overflow-y-auto">
                    <p className="text-sm text-gray-700 font-medium mb-2">{result.script.title}</p>
                    <div className="space-y-2">
                      {result.script.scenes.map((scene: any, index: number) => (
                        <div key={index} className="text-xs text-gray-600">
                          <strong>Scene {index + 1}:</strong> {scene.goal}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

