'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export default function DemoVideoGenerator() {
  const searchParams = useSearchParams()
  const [prompt, setPrompt] = useState('')
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9')
  const [duration, setDuration] = useState(150) // 2.5 minutes in seconds
  const [language, setLanguage] = useState('English')
  const [voiceId, setVoiceId] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoadingJob, setIsLoadingJob] = useState(false)
  const [error, setError] = useState('')
  const [currentJob, setCurrentJob] = useState<any>(null)
  const [result, setResult] = useState<{
    video: string
    script: any
    totalCost: number
    duration: number
    demo: boolean
    message: string
  } | null>(null)

  // Check for job ID in URL parameters
  useEffect(() => {
    const jobId = searchParams.get('jobId')
    if (jobId) {
      console.log('Found job ID in demo URL:', jobId)
      fetchJobStatus(jobId)
    }
  }, [searchParams])

  const fetchJobStatus = async (jobId: string) => {
    setIsLoadingJob(true)
    try {
      console.log('Fetching job status for:', jobId)
      const response = await fetch(`/api/jobs/${jobId}`)
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Job fetch failed:', response.status, errorText)
        throw new Error(`Failed to fetch job status: ${response.status} ${errorText}`)
      }
      const jobData = await response.json()
      console.log('Job data received:', jobData)
      setCurrentJob(jobData)
      
      // If job is done, show results
      if (jobData.status === 'DONE') {
        setResult({
          video: jobData.resultUrl || 'mock-video-url',
          script: jobData.steps?.find((s: any) => s.type === 'SCRIPT')?.payload || { scenes: [] },
          totalCost: jobData.totalCost || 0,
          duration: jobData.duration || 150,
          demo: true,
          message: "Demo video generated successfully! (This is mock data - add API keys for real generation)"
        })
      }
    } catch (err) {
      console.error('Error fetching job status:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch job status')
    } finally {
      setIsLoadingJob(false)
    }
  }

  // Poll for job status updates
  useEffect(() => {
    if (!currentJob || currentJob.status === 'DONE' || currentJob.status === 'FAILED') {
      return
    }

    const interval = setInterval(() => {
      const jobId = searchParams.get('jobId')
      if (jobId) {
        fetchJobStatus(jobId)
      }
    }, 2500) // Poll every 2.5 seconds

    return () => clearInterval(interval)
  }, [currentJob?.id, currentJob?.status])

  const generateVideo = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt')
      return
    }

    // Redirect to storyboard page for demo
    const params = new URLSearchParams({
      prompt: prompt.trim(),
      aspectRatio,
      duration: duration.toString(),
      language,
      voiceId: voiceId.trim() || '',
      demo: 'true', // Mark as demo
    })

    window.location.href = `/storyboard?${params.toString()}`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Prompt2Video - Demo Mode</h1>
          <p className="text-lg text-gray-600">
            Test the app without API keys - This is a demonstration mode
          </p>
          <div className="mt-4 space-y-3">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-yellow-800 text-sm">
                <strong>Demo Mode:</strong> This version uses mock data and simulated responses. 
                No real videos are generated. Add your API keys to the main app for real video generation.
              </p>
            </div>
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-800 text-sm">
                <strong>🌍 Multi-Language:</strong> Create the same video in multiple languages! 
                <a href="/multi-language" className="text-green-600 hover:text-green-800 underline ml-1">
                  Try Multi-Language Video Generator
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {currentJob ? 'Job Status' : 'Create Your Video (Demo)'}
            </h2>
            
            {currentJob ? (
              <div className="space-y-4">
                {/* Job Status Display */}
                <div className="bg-gray-50 rounded-md p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Job ID:</span>
                    <span className="text-sm text-gray-600 font-mono">{currentJob.id}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      currentJob.status === 'DONE' ? 'bg-green-100 text-green-800' :
                      currentJob.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                      currentJob.status === 'RUNNING' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {currentJob.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Cost:</span>
                    <span className="text-sm text-gray-600">${(currentJob.totalCost || 0).toFixed(4)}</span>
                  </div>
                </div>

                {/* Steps Timeline */}
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-900">Processing Steps</h3>
                  
                  {['SCRIPT', 'IMAGES', 'NARRATION', 'COMPOSITION'].map((stepType) => {
                    const step = currentJob.steps?.find((s: any) => s.type === stepType)
                    const status = step?.status || 'PENDING'
                    return (
                      <div key={stepType} className="flex items-center space-x-3">
                        <span className="text-lg">
                          {status === 'DONE' ? '✅' :
                           status === 'RUNNING' ? '⏳' :
                           status === 'FAILED' ? '❌' : '⏸️'}
                        </span>
                        <span className="flex-1 text-sm font-medium text-gray-700">
                          {stepType.charAt(0) + stepType.slice(1).toLowerCase()}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          status === 'DONE' ? 'bg-green-100 text-green-800' :
                          status === 'FAILED' ? 'bg-red-100 text-red-800' :
                          status === 'RUNNING' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {status}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {isLoadingJob && (
                  <div className="text-center text-gray-500 py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    Loading job status...
                  </div>
                )}
              </div>
            ) : (
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
                  {isGenerating ? 'Generating Demo Video...' : 'Create Demo Storyboard'}
                </button>
              </div>
            )}
          </div>

          {/* Results */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Demo Results</h2>
            
            {!result ? (
              <div className="text-center text-gray-500 py-8">
                {isGenerating ? 'Generating your demo video...' : 'No video generated yet. Enter a prompt and click Generate.'}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Demo Notice */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <p className="text-yellow-800 text-sm font-medium">
                    {result.message}
                  </p>
                </div>

                {/* Script Preview */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Generated Script</h3>
                  <div className="bg-gray-50 rounded-md p-3">
                    <p className="text-sm text-gray-700 font-medium mb-2">{result.script.title}</p>
                    <div className="space-y-2">
                      {result.script.scenes.map((scene: any, index: number) => (
                        <div key={index} className="text-xs text-gray-600 border-l-2 border-blue-200 pl-2">
                          <div className="font-medium">Scene {index + 1}: {scene.goal}</div>
                          <div className="mt-1 text-gray-500">Narration: {scene.narration}</div>
                          <div className="mt-1 text-gray-500">Caption: {scene.caption}</div>
                          <div className="mt-1 text-gray-500">Duration: {scene.duration}s</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Video Info */}
                <div className="bg-gray-50 rounded-md p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Video Details (Simulated)</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div>Duration: {Math.round(result.duration)} seconds</div>
                    <div>Estimated Cost: ${result.totalCost.toFixed(4)}</div>
                    <div>Scenes: {result.script.scenes.length}</div>
                    <div>Aspect Ratio: {aspectRatio}</div>
                    <div>Language: {language}</div>
                  </div>
                </div>

                {/* Next Steps */}
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <h4 className="font-medium text-blue-900 mb-2">Ready for Real Generation?</h4>
                  <p className="text-blue-800 text-sm mb-2">
                    To generate actual videos, you'll need to:
                  </p>
                  <ul className="text-blue-800 text-xs space-y-1 list-disc list-inside">
                    <li>Add your OpenAI API key to the environment</li>
                    <li>Add your HeyGen API key to the environment</li>
                    <li>Install FFmpeg for video processing (see FFMPEG_SETUP.md)</li>
                    <li>No database or external services required!</li>
                  </ul>
                  <div className="mt-2 p-2 bg-yellow-100 rounded text-xs">
                    <strong>Note:</strong> Without FFmpeg, the app will create mock video files for demonstration.
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
