'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { SUPPORTED_LANGUAGES, LANGUAGE_REGIONS, getLanguagesByRegion, getPopularLanguages } from '@/lib/languages'

export default function DemoVideoGenerator() {
  const searchParams = useSearchParams()
  const [prompt, setPrompt] = useState('')
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9')
  const [duration, setDuration] = useState(150) // 2.5 minutes in seconds
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['en'])
  const [voiceId, setVoiceId] = useState('')
  const [showAllLanguages, setShowAllLanguages] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoadingJob, setIsLoadingJob] = useState(false)
  const [error, setError] = useState('')
  const [currentJob, setCurrentJob] = useState<any>(null)
  const [result, setResult] = useState<{
    video: string
    videos?: { [language: string]: string }
    script: any
    totalCost: number
    duration: number
    demo: boolean
    message: string
    languages?: string[]
  } | null>(null)

  // Check for job ID in URL parameters
  useEffect(() => {
    const jobId = searchParams.get('jobId')
    if (jobId) {
      console.log('Found job ID in demo URL:', jobId)
      fetchJobStatus(jobId)
    }
  }, [searchParams])

  const fetchJobStatus = async (jobId: string, retryCount = 0) => {
    setIsLoadingJob(true)
    try {
      console.log(`Fetching job status for: ${jobId} (attempt ${retryCount + 1})`)
      const response = await fetch(`/api/jobs/${jobId}`)
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Job fetch failed:', response.status, errorText)
        if (response.status === 404) {
          // If job not found and we haven't retried too many times, wait and retry
          if (retryCount < 3) {
            console.log(`Job not found, retrying in ${(retryCount + 1) * 1000}ms...`)
            setTimeout(() => {
              fetchJobStatus(jobId, retryCount + 1)
            }, (retryCount + 1) * 1000)
            return
          }
          setError('Job not found. It may have been cleaned up or expired.')
          setCurrentJob(null)
          return
        }
        throw new Error(`Failed to fetch job status: ${response.status} ${errorText}`)
      }
      const jobData = await response.json()
      console.log('Job data received:', jobData)
      console.log('Job languages:', jobData.languages)
      console.log('Job resultUrls:', jobData.resultUrls)
      setCurrentJob(jobData)
      
      // If job is done, show results
      if (jobData.status === 'DONE') {
        setResult({
          video: jobData.resultUrl || 'mock-video-url',
          videos: jobData.resultUrls,
          script: jobData.steps?.find((s: any) => s.type === 'SCRIPT')?.payload || { scenes: [] },
          totalCost: jobData.totalCost || 0,
          duration: jobData.duration || 150,
          demo: true,
          message: `Demo video${jobData.languages && jobData.languages.length > 1 ? 's' : ''} generated successfully! (This is mock data - add API keys for real generation)`,
          languages: jobData.languages || ['en']
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
      languages: selectedLanguages.join(','),
      voiceId: voiceId.trim() || '',
      demo: 'true', // Mark as demo
    })

    window.location.href = `/storyboard?${params.toString()}`
  }

  const toggleLanguage = (languageCode: string) => {
    setSelectedLanguages(prev => 
      prev.includes(languageCode) 
        ? prev.filter(lang => lang !== languageCode)
        : [...prev, languageCode]
    )
  }

  const getSelectedLanguageNames = () => {
    return selectedLanguages.map(code => {
      const lang = SUPPORTED_LANGUAGES.find(l => l.code === code)
      return lang ? lang.name : code
    }).join(', ')
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
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-yellow-800 text-sm">
              <strong>Demo Mode:</strong> This version uses mock data and simulated responses. 
              No real videos are generated. Test the multi-language workflow and storyboard editing. 
              Add your API keys to the main app for real video generation.
            </p>
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

                {/* Generate New Video Button for Failed Jobs */}
                {currentJob.status === 'FAILED' && (
                  <div className="pt-4 border-t border-gray-200">
                    <button
                      onClick={() => {
                        setCurrentJob(null)
                        setResult(null)
                        setError('')
                        setPrompt('')
                        setSelectedLanguages(['en'])
                        setShowAllLanguages(false)
                      }}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
                    >
                      Generate New Video
                    </button>
                  </div>
                )}

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

                {/* Generated Assets */}
                {currentJob.assets && currentJob.assets.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-medium text-gray-900">Generated Assets</h3>
                    <div className="space-y-3">
                      {currentJob.assets.map((asset: any) => (
                        <div key={asset.id} className="bg-gray-50 rounded-md p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">
                              {asset.kind.toLowerCase()} - Scene {asset.meta?.sceneIndex !== undefined ? asset.meta.sceneIndex + 1 : 'unknown'}
                            </span>
                            {asset.kind === 'VIDEO' && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                AI Generated
                              </span>
                            )}
                          </div>
                          
                          {asset.kind === 'IMAGE' && (
                            <div className="space-y-2">
                              <img
                                src={asset.url}
                                alt={`Scene ${asset.meta?.sceneIndex !== undefined ? asset.meta.sceneIndex + 1 : 'unknown'} image`}
                                className="w-full max-w-sm rounded-md border border-gray-200"
                                onError={(e) => {
                                  console.error('Image failed to load:', asset.url);
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                              <a
                                href={asset.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block text-blue-600 hover:text-blue-800 text-sm"
                              >
                                View Full Size
                              </a>
                            </div>
                          )}
                          
                          {asset.kind === 'AUDIO' && (
                            <div className="space-y-2">
                              <audio controls className="w-full">
                                <source src={asset.url} type="audio/mpeg" />
                                Your browser does not support the audio element.
                              </audio>
                              <a
                                href={asset.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block text-blue-600 hover:text-blue-800 text-sm"
                              >
                                Download Audio
                              </a>
                            </div>
                          )}
                          
                          {asset.kind === 'VIDEO' && (
                            <div className="space-y-2">
                              <video controls className="w-full max-w-sm rounded-md">
                                <source src={asset.url} type="video/mp4" />
                                Your browser does not support the video element.
                              </video>
                              <a
                                href={asset.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block text-blue-600 hover:text-blue-800 text-sm"
                              >
                                Download Video
                              </a>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {isLoadingJob && (
                  <div className="text-center text-gray-500 py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    Loading job status...
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-red-600 text-sm">{error}</p>
                    <button
                      onClick={() => {
                        setError('')
                        setCurrentJob(null)
                        setResult(null)
                      }}
                      className="mt-2 bg-red-600 text-white py-1 px-3 rounded text-sm hover:bg-red-700 transition-colors"
                    >
                      Start Over
                    </button>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Languages ({selectedLanguages.length} selected)
                </label>
                <div className="space-y-3">
                  {/* Selected Languages Display */}
                  {selectedLanguages.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedLanguages.map(code => {
                        const lang = SUPPORTED_LANGUAGES.find(l => l.code === code)
                        return (
                          <span
                            key={code}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                          >
                            {lang?.name || code}
                            <button
                              type="button"
                              onClick={() => toggleLanguage(code)}
                              className="ml-2 text-blue-600 hover:text-blue-800"
                              disabled={isGenerating}
                            >
                              ×
                            </button>
                          </span>
                        )
                      })}
                    </div>
                  )}

                  {/* Language Selection */}
                  <div className="border border-gray-300 rounded-md p-3 max-h-48 overflow-y-auto">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        {showAllLanguages ? 'All Languages' : 'Popular Languages'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowAllLanguages(!showAllLanguages)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                        disabled={isGenerating}
                      >
                        {showAllLanguages ? 'Show Popular' : 'Show All'}
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      {LANGUAGE_REGIONS.map(region => {
                        const languages = showAllLanguages 
                          ? getLanguagesByRegion(region)
                          : getLanguagesByRegion(region).filter(lang => 
                              getPopularLanguages().some(popular => popular.code === lang.code)
                            )
                        
                        if (languages.length === 0) return null
                        
                        return (
                          <div key={region}>
                            <div className="text-xs font-medium text-gray-500 mb-1">{region}</div>
                            <div className="grid grid-cols-1 gap-1">
                              {languages.map(lang => (
                                <label
                                  key={lang.code}
                                  className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded"
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedLanguages.includes(lang.code)}
                                    onChange={() => toggleLanguage(lang.code)}
                                    disabled={isGenerating}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="text-gray-700">{lang.name}</span>
                                  <span className="text-gray-500 text-xs">({lang.nativeName})</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
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
                    <div>Languages: {result.languages ? result.languages.length : 1}</div>
                    {result.languages && result.languages.length > 1 && (
                      <div className="mt-2">
                        <div className="text-xs font-medium text-gray-700 mb-1">Selected Languages:</div>
                        <div className="flex flex-wrap gap-1">
                          {result.languages.map(langCode => {
                            const lang = SUPPORTED_LANGUAGES.find(l => l.code === langCode)
                            return (
                              <span key={langCode} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {lang?.name || langCode}
                              </span>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Multi-Language Video Display */}
                {result.languages && result.languages.length > 1 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Generated Videos (Demo)</h4>
                    {result.languages.map((langCode) => {
                      const lang = SUPPORTED_LANGUAGES.find(l => l.code === langCode)
                      return (
                        <div key={langCode} className="border border-gray-200 rounded-md p-3">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium text-gray-900">
                              {lang?.name || langCode} Version
                            </h5>
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              Demo Video
                            </span>
                          </div>
                          <div className="bg-gray-100 rounded p-4 text-center text-gray-600 text-sm">
                            🎬 Mock video for {lang?.name || langCode} language
                            <br />
                            <span className="text-xs">(Add API keys for real video generation)</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Next Steps */}
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <h4 className="font-medium text-blue-900 mb-2">Ready for Real Generation?</h4>
                  <p className="text-blue-800 text-sm mb-2">
                    To generate actual videos in multiple languages, you'll need to:
                  </p>
                  <ul className="text-blue-800 text-xs space-y-1 list-disc list-inside">
                    <li>Add your OpenAI API key to the environment</li>
                    <li>Add your HeyGen API key to the environment</li>
                    <li>Install FFmpeg for video processing (see FFMPEG_SETUP.md)</li>
                    <li>No database or external services required!</li>
                  </ul>
                  <div className="mt-2 p-2 bg-green-100 rounded text-xs">
                    <strong>Multi-Language Support:</strong> Generate videos in 100+ languages with shared visuals and localized audio.
                  </div>
                  <div className="mt-2 p-2 bg-yellow-100 rounded text-xs">
                    <strong>Note:</strong> Without FFmpeg, the app will create mock video files for demonstration.
                  </div>
                </div>

                {/* Generate New Video Button */}
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setResult(null)
                      setCurrentJob(null)
                      setError('')
                      setPrompt('')
                      setSelectedLanguages(['en'])
                      setShowAllLanguages(false)
                    }}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
                  >
                    Generate New Video
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
