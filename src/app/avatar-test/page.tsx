'use client'

import { useState } from 'react'

export default function WhiteboardTestPage() {
  const [prompt, setPrompt] = useState('Explain how photosynthesis works in plants')
  const [voice, setVoice] = useState('alloy')
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9')
  const [duration, setDuration] = useState(120)
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')
  const [debugInfo, setDebugInfo] = useState<any>(null)

  const generateVideo = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt')
      return
    }

    setIsGenerating(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('/api/generate-whiteboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          voice,
          aspectRatio,
          duration,
          language: 'English'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      console.error('Generation failed:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsGenerating(false)
    }
  }

  const generateSimpleVideo = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt')
      return
    }

    setIsGenerating(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('/api/generate-whiteboard-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          voice,
          aspectRatio,
          duration: Math.min(duration, 90), // Limit to 90 seconds for simple version
          language: 'English'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      console.error('Simple generation failed:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsGenerating(false)
    }
  }

  const runHealthCheck = async () => {
    try {
      const response = await fetch('/api/health-check')
      const data = await response.json()
      setDebugInfo({ healthCheck: data })
    } catch (error) {
      setDebugInfo({ healthCheck: { error: error instanceof Error ? error.message : 'Unknown error' } })
    }
  }

  const testScriptGeneration = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt')
      return
    }

    try {
      const response = await fetch('/api/test-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          duration,
          language: 'English'
        })
      })

      const data = await response.json()
      setDebugInfo({ scriptTest: data })
    } catch (error) {
      setDebugInfo({ scriptTest: { error: error instanceof Error ? error.message : 'Unknown error' } })
    }
  }

  const testOpenAI = async () => {
    try {
      const response = await fetch('/api/test-openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() || 'Test prompt' })
      })

      const data = await response.json()
      setDebugInfo({ openaiTest: data })
    } catch (error) {
      setDebugInfo({ openaiTest: { error: error instanceof Error ? error.message : 'Unknown error' } })
    }
  }

  const testSingleScene = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt')
      return
    }

    try {
      const response = await fetch('/api/test-single-scene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() })
      })

      const data = await response.json()
      setDebugInfo({ singleSceneTest: data })
    } catch (error) {
      setDebugInfo({ singleSceneTest: { error: error instanceof Error ? error.message : 'Unknown error' } })
    }
  }

  const testImage = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt')
      return
    }

    try {
      const response = await fetch('/api/test-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() })
      })

      const data = await response.json()
      setDebugInfo({ imageTest: data })
    } catch (error) {
      setDebugInfo({ imageTest: { error: error instanceof Error ? error.message : 'Unknown error' } })
    }
  }

  const testVideoFrame = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt')
      return
    }

    try {
      const response = await fetch('/api/test-video-frame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() })
      })

      const data = await response.json()
      setDebugInfo({ videoFrameTest: data })
    } catch (error) {
      setDebugInfo({ videoFrameTest: { error: error instanceof Error ? error.message : 'Unknown error' } })
    }
  }

  const testSimpleVideo = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt')
      return
    }

    try {
      const response = await fetch('/api/test-simple-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() })
      })

      const data = await response.json()
      setDebugInfo({ simpleVideoTest: data })
    } catch (error) {
      setDebugInfo({ simpleVideoTest: { error: error instanceof Error ? error.message : 'Unknown error' } })
    }
  }

  const testWhiteboardAnimation = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt')
      return
    }

    try {
      const response = await fetch('/api/test-whiteboard-animation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() })
      })

      const data = await response.json()
      setDebugInfo({ whiteboardAnimationTest: data })
    } catch (error) {
      setDebugInfo({ whiteboardAnimationTest: { error: error instanceof Error ? error.message : 'Unknown error' } })
    }
  }

  const testDrawingAnimation = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt')
      return
    }

    try {
      const response = await fetch('/api/test-drawing-animation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() })
      })

      const data = await response.json()
      setDebugInfo({ drawingAnimationTest: data })
    } catch (error) {
      setDebugInfo({ drawingAnimationTest: { error: error instanceof Error ? error.message : 'Unknown error' } })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Whiteboard Video Generator</h1>
          <p className="text-lg text-gray-600">
            Generate whiteboard drawing videos with OpenAI TTS narration
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Generate Video</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prompt *
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe what you want your video to explain..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  disabled={isGenerating}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  OpenAI Voice
                </label>
                <select
                  value={voice}
                  onChange={(e) => setVoice(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isGenerating}
                >
                  <option value="alloy">Alloy (Neutral)</option>
                  <option value="echo">Echo (Male)</option>
                  <option value="fable">Fable (British)</option>
                  <option value="onyx">Onyx (Deep)</option>
                  <option value="nova">Nova (Female)</option>
                  <option value="shimmer">Shimmer (Soft)</option>
                </select>
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
                    Duration (seconds)
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isGenerating}
                  >
                    <option value={60}>1 minute</option>
                    <option value={90}>1.5 minutes</option>
                    <option value={120}>2 minutes</option>
                    <option value={180}>3 minutes</option>
                    <option value={240}>4 minutes</option>
                    <option value={300}>5 minutes</option>
                  </select>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={generateVideo}
                    disabled={isGenerating || !prompt.trim()}
                    className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {isGenerating ? 'Generating...' : 'Full Video (6 scenes)'}
                  </button>
                  <button
                    onClick={generateSimpleVideo}
                    disabled={isGenerating || !prompt.trim()}
                    className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {isGenerating ? 'Generating...' : 'Simple Video (3 scenes)'}
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={runHealthCheck}
                    className="bg-gray-600 text-white py-1 px-3 rounded text-sm hover:bg-gray-700"
                  >
                    Health Check
                  </button>
                  <button
                    onClick={testScriptGeneration}
                    className="bg-green-600 text-white py-1 px-3 rounded text-sm hover:bg-green-700"
                  >
                    Test Script
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={testOpenAI}
                    className="bg-purple-600 text-white py-1 px-3 rounded text-sm hover:bg-purple-700"
                  >
                    Test OpenAI
                  </button>
                  <button
                    onClick={testSingleScene}
                    className="bg-orange-600 text-white py-1 px-3 rounded text-sm hover:bg-orange-700"
                  >
                    Test Single Scene
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={testImage}
                    className="bg-pink-600 text-white py-1 px-3 rounded text-sm hover:bg-pink-700"
                  >
                    Test Image
                  </button>
                  <button
                    onClick={testSimpleVideo}
                    className="bg-teal-600 text-white py-1 px-3 rounded text-sm hover:bg-teal-700"
                  >
                    Test Simple Video
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={testWhiteboardAnimation}
                    className="bg-red-600 text-white py-1 px-3 rounded text-sm hover:bg-red-700"
                  >
                    Test Whiteboard Animation
                  </button>
                  <button
                    onClick={testDrawingAnimation}
                    className="bg-yellow-600 text-white py-1 px-3 rounded text-sm hover:bg-yellow-700"
                  >
                    Test Drawing Animation
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Results</h2>
            
            {!result ? (
              <div className="text-center text-gray-500 py-8">
                {isGenerating ? (
                  <div className="space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p>Generating your avatar + whiteboard video...</p>
                    <p className="text-sm text-gray-400">This may take 2-5 minutes</p>
                  </div>
                ) : (
                  'Generate a video to see results here'
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {result.success ? (
                  <>
                    <div className="bg-green-50 border border-green-200 rounded-md p-3">
                      <p className="text-green-800 text-sm">
                        ✅ Video generated successfully!
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-medium text-gray-900">Your Video</h3>
                      <video
                        controls
                        className="w-full rounded-md"
                        src={result.video}
                      >
                        Your browser does not support the video tag.
                      </video>
                    </div>

                    {result.script && (
                      <div className="space-y-2">
                        <h3 className="font-medium text-gray-900">Generated Script</h3>
                        <div className="bg-gray-50 rounded-md p-3 max-h-40 overflow-y-auto">
                          <p className="text-sm text-gray-700 mb-2">
                            <strong>Title:</strong> {result.script.title}
                          </p>
                          <p className="text-sm text-gray-700 mb-2">
                            <strong>Duration:</strong> {result.script.totalDuration}s
                          </p>
                          <div className="space-y-1">
                            {result.script.scenes.map((scene: any, index: number) => (
                              <div key={scene.sceneId} className="text-xs text-gray-600">
                                <strong>Scene {index + 1}:</strong> {scene.narration.substring(0, 100)}...
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex space-x-2">
                      <a
                        href={result.video}
                        download="avatar-whiteboard-video.mp4"
                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 text-center transition-colors"
                      >
                        Download Video
                      </a>
                      <button
                        onClick={() => setResult(null)}
                        className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
                      >
                        Generate Another
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-red-800 text-sm">
                      ❌ Generation failed: {result.error || 'Unknown error'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Debug Info */}
          {debugInfo && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Debug Information</h2>
              
              {/* Show images if available */}
              {debugInfo.imageTest?.image && (
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Generated Image:</h4>
                  <img 
                    src={debugInfo.imageTest.image} 
                    alt="Generated whiteboard image" 
                    className="max-w-full h-auto border rounded"
                  />
                </div>
              )}
              
              {debugInfo.videoFrameTest?.originalImage && debugInfo.videoFrameTest?.videoFrame && (
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Video Frame Comparison:</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-sm font-medium mb-1">Original Image:</h5>
                      <img 
                        src={debugInfo.videoFrameTest.originalImage} 
                        alt="Original image" 
                        className="max-w-full h-auto border rounded"
                      />
                    </div>
                    <div>
                      <h5 className="text-sm font-medium mb-1">Video Frame (1 second):</h5>
                      <img 
                        src={debugInfo.videoFrameTest.videoFrame} 
                        alt="Video frame" 
                        className="max-w-full h-auto border rounded"
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {debugInfo.simpleVideoTest?.video && (
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Simple Video Test:</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-sm font-medium mb-1">Original Image:</h5>
                      <img 
                        src={debugInfo.simpleVideoTest.originalImage} 
                        alt="Original image" 
                        className="max-w-full h-auto border rounded"
                      />
                    </div>
                    <div>
                      <h5 className="text-sm font-medium mb-1">Generated Video:</h5>
                      <video 
                        src={debugInfo.simpleVideoTest.video} 
                        controls 
                        className="max-w-full h-auto border rounded"
                      />
                      <p className="text-xs text-gray-500 mt-1">Size: {debugInfo.simpleVideoTest.videoSize} bytes</p>
                    </div>
                  </div>
                </div>
              )}
              
              {debugInfo.whiteboardAnimationTest?.video && (
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Whiteboard Animation Test:</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-sm font-medium mb-1">Original Image:</h5>
                      <img 
                        src={debugInfo.whiteboardAnimationTest.originalImage} 
                        alt="Original image" 
                        className="max-w-full h-auto border rounded"
                      />
                    </div>
                    <div>
                      <h5 className="text-sm font-medium mb-1">Animation Video:</h5>
                      <video 
                        src={debugInfo.whiteboardAnimationTest.video} 
                        controls 
                        className="max-w-full h-auto border rounded"
                      />
                      <p className="text-xs text-gray-500 mt-1">Size: {debugInfo.whiteboardAnimationTest.videoSize} bytes</p>
                    </div>
                  </div>
                </div>
              )}
              
              {debugInfo.drawingAnimationTest?.video && (
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Drawing Animation Test:</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-sm font-medium mb-1">Original Image:</h5>
                      <img 
                        src={debugInfo.drawingAnimationTest.originalImage} 
                        alt="Original image" 
                        className="max-w-full h-auto border rounded"
                      />
                    </div>
                    <div>
                      <h5 className="text-sm font-medium mb-1">Drawing Animation Video:</h5>
                      <video 
                        src={debugInfo.drawingAnimationTest.video} 
                        controls 
                        className="max-w-full h-auto border rounded"
                      />
                      <p className="text-xs text-gray-500 mt-1">Size: {debugInfo.drawingAnimationTest.videoSize} bytes</p>
                      <p className="text-xs text-green-600 mt-1">This should show a smooth fade-in effect</p>
                    </div>
                  </div>
                </div>
              )}
              
              <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-96">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-md p-6">
          <h3 className="font-medium text-blue-900 mb-2">How to Use</h3>
          <div className="text-blue-800 text-sm space-y-2">
            <p><strong>1. Set Environment:</strong> Make sure your .env.local has OPENAI_API_KEY</p>
            <p><strong>2. Generate:</strong> Enter a prompt and select a voice, then click generate</p>
            <p><strong>3. Result:</strong> You'll get a whiteboard drawing video with step-by-step reveals and OpenAI TTS narration</p>
            <p><strong>4. Features:</strong> Left-to-right drawing reveal effect, sequential bullet points, and professional voice narration</p>
          </div>
        </div>
      </div>
    </div>
  )
}
