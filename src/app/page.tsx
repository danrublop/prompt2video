'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { JobResponse, CreateJobRequest } from '@/types'
import { SUPPORTED_LANGUAGES, LANGUAGE_REGIONS, getLanguagesByRegion, getPopularLanguages } from '@/lib/languages'

export default function Home() {
  const searchParams = useSearchParams()
  const [prompt, setPrompt] = useState('')
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9')
  const [duration, setDuration] = useState(60) // 1 minute in seconds
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['en'])
  const [showAllLanguages, setShowAllLanguages] = useState(false)
  const [voiceId, setVoiceId] = useState('')
  const [ttsProvider, setTtsProvider] = useState<'heygen' | 'openai'>('heygen')
  const [openaiVoice, setOpenaiVoice] = useState('alloy')
  const [currentJob, setCurrentJob] = useState<JobResponse | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoadingJob, setIsLoadingJob] = useState(false)
  const [error, setError] = useState('')
  const [abortController, setAbortController] = useState<AbortController | null>(null)
  const [totalUsage, setTotalUsage] = useState(0)

  const fetchUsage = async () => {
    try {
      const response = await fetch('/api/usage')
      if (response.ok) {
        const data = await response.json()
        setTotalUsage(data.totalUsage || 0)
      }
    } catch (error) {
      console.error('Failed to fetch usage:', error)
    }
  }

  // Check for job ID in URL parameters
  useEffect(() => {
    const jobId = searchParams.get('jobId')
    if (jobId) {
      console.log('Found job ID in URL:', jobId)
      // Add a small delay to ensure job is fully created
      setTimeout(() => {
        fetchJobStatus(jobId)
      }, 1000)
    }
  }, [searchParams])

  // Initial usage fetch on mount
  useEffect(() => {
    fetchUsage()
  }, [])

  const createJob = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt')
      return
    }

    // Redirect to storyboard page instead of creating job directly
    const params = new URLSearchParams({
      prompt: prompt.trim(),
      aspectRatio,
      duration: duration.toString(),
      languages: selectedLanguages.join(','),
      voiceId: voiceId.trim() || '',
      ttsProvider,
      openaiVoice,
    })

    window.location.href = `/storyboard?${params.toString()}`
  }

  const fetchJobStatus = async (jobId: string) => {
    setIsLoadingJob(true)
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        signal: abortController?.signal,
      })
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Job fetch failed:', response.status, errorText)
        if (response.status === 404) {
          setError('Job not found. It may have been cleaned up or expired.')
          setCurrentJob(null)
          return
        }
        throw new Error(`Failed to fetch job status: ${response.status} ${errorText}`)
      }
      const jobData = await response.json()
      console.log('Job data received:', jobData)
      console.log('Job resultUrls:', jobData.resultUrls)
      console.log('Job resultUrl:', jobData.resultUrl)
      console.log('Job status:', jobData.status)
      setCurrentJob(jobData)
      if (jobData.status === 'DONE' || jobData.status === 'FAILED') {
        // Refresh usage when a job completes
        fetchUsage()
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('Job status fetch cancelled')
      } else {
        console.error('Error fetching job status:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch job status')
      }
    } finally {
      setIsLoadingJob(false)
    }
  }

  const cancelJob = () => {
    if (abortController) {
      abortController.abort()
      setAbortController(null)
      setIsGenerating(false)
      setCurrentJob(null)
      setError('Request cancelled')
    }
  }

  // Poll for job status updates
  useEffect(() => {
    if (!currentJob || currentJob.status === 'DONE' || currentJob.status === 'FAILED') {
      return
    }

    const interval = setInterval(() => {
      fetchJobStatus(currentJob.id)
    }, 2500) // Poll every 2.5 seconds

    return () => clearInterval(interval)
  }, [currentJob?.id, currentJob?.status])


  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortController) {
        abortController.abort()
      }
    }
  }, [abortController])

  const resetForm = () => {
    if (abortController) {
      abortController.abort()
    }
    setCurrentJob(null)
    setPrompt('')
    setError('')
    setAbortController(null)
    setIsGenerating(false)
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

  const getStepStatus = (stepType: string) => {
    if (!currentJob || !currentJob.steps) return 'PENDING'
    const step = currentJob.steps.find(s => s.type === stepType)
    return step?.status || 'PENDING'
  }

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'DONE':
        return '✅'
      case 'RUNNING':
        return '⏳'
      case 'FAILED':
        return '❌'
      default:
        return '⏸️'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Prompt2Video</h1>
          <p className="text-lg text-gray-600">
            Transform your ideas into professional explainer videos with AI
          </p>
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md max-w-2xl mx-auto">
            <p className="text-blue-800 text-sm">
              <strong>Multi-Language Support:</strong> Generate videos in 100+ languages with shared visuals and localized audio. Interactive storyboard editing included!
            </p>
          </div>
          <div className="mt-4 bg-white rounded-lg shadow-md p-4 max-w-md mx-auto">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Total OpenAI Usage:</span>
              <span className="text-lg font-bold text-blue-600">${totalUsage.toFixed(4)}</span>
            </div>
            <div className="mt-2">
              <button
                onClick={async () => {
                  if (confirm('Reset usage tracking? This cannot be undone.')) {
                    try {
                      await fetch('/api/usage', { method: 'POST' })
                      setTotalUsage(0)
                    } catch (error) {
                      console.error('Failed to reset usage:', error)
                    }
                  }
                }}
                className="text-xs text-gray-500 hover:text-red-600"
              >
                Reset Usage
              </button>
            </div>
          </div>
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
                    onChange={(e) => setDuration(parseFloat(e.target.value) * 60)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isGenerating}
                  >
                    <option value={0.5}>30 seconds</option>
                    <option value={1}>1 minute</option>
                    <option value={1.5}>1.5 minutes</option>
                    <option value={2}>2 minutes</option>
                    <option value={2.5}>2.5 minutes</option>
                    <option value={3}>3 minutes</option>
                    <option value={4}>4 minutes</option>
                    <option value={5}>5 minutes</option>
                    <option value={7.5}>7.5 minutes</option>
                    <option value={10}>10 minutes</option>
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
                  Text-to-Speech Provider
                </label>
                <div className="space-y-3">
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="heygen"
                        checked={ttsProvider === 'heygen'}
                        onChange={(e) => setTtsProvider(e.target.value as 'heygen' | 'openai')}
                        disabled={isGenerating}
                        className="mr-2"
                      />
                      <span className="text-gray-700">HeyGen (Premium voices)</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="openai"
                        checked={ttsProvider === 'openai'}
                        onChange={(e) => setTtsProvider(e.target.value as 'heygen' | 'openai')}
                        disabled={isGenerating}
                        className="mr-2"
                      />
                      <span className="text-gray-700">OpenAI (Built-in voices)</span>
                    </label>
                  </div>
                  
                  {ttsProvider === 'heygen' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        HeyGen Voice ID (optional)
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
                  )}
                  
                  {ttsProvider === 'openai' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        OpenAI Voice
                      </label>
                      <select
                        value={openaiVoice}
                        onChange={(e) => setOpenaiVoice(e.target.value)}
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
                  )}
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <button
                  onClick={createJob}
                  disabled={isGenerating || !prompt.trim()}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isGenerating ? 'Creating Job...' : 'Create Storyboard'}
                </button>
                
                {isGenerating && (
                  <button
                    onClick={cancelJob}
                    className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
                  >
                    Cancel Request
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Job Status */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Status</h2>
            
            {!currentJob ? (
              <div className="text-center text-gray-500 py-8">
                No active job. Create a video to see the status here.
              </div>
            ) : (
              <div className="space-y-4">
                {/* Job Info */}
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
                    <span className="text-sm text-gray-600">
                      ${(currentJob.totalCost || 0).toFixed(4)}
                      {currentJob.status === 'RUNNING' && (
                        <span className="text-xs text-blue-600 ml-1">(updating...)</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Steps Timeline */}
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-900">Pipeline Steps</h3>
                  
                  {['SCRIPT', 'IMAGES', 'NARRATION', 'COMPOSITION'].map((stepType) => {
                    const status = getStepStatus(stepType)
                    return (
                      <div key={stepType} className="flex items-center space-x-3">
                        <span className="text-lg">{getStepIcon(status)}</span>
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

                {/* Partial Results - Show images even if job failed */}
                {currentJob.assets && currentJob.assets.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">Generated Assets</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {currentJob.assets
                        .filter(asset => asset.kind === 'IMAGE')
                        .map((asset, index) => (
                          <div key={asset.id} className="border border-gray-200 rounded-md p-2">
                            <img
                              src={asset.url}
                              alt={`Scene ${asset.meta?.sceneIndex || index + 1}`}
                              className="w-full h-32 object-cover rounded"
                            />
                            <p className="text-xs text-gray-600 mt-1">
                              Scene {asset.meta?.sceneIndex || index + 1}
                            </p>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Results */}
                {currentJob.status === 'DONE' && (currentJob.resultUrls || currentJob.resultUrl) && (
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">
                      Your Video{currentJob.languages && currentJob.languages.length > 1 ? 's' : ''}
                    </h3>
                    
                    {currentJob.resultUrls ? (
                      // Multi-language results
                      <div className="space-y-4">
                        {Object.entries(currentJob.resultUrls).map(([langCode, videoUrl]) => {
                          const lang = SUPPORTED_LANGUAGES.find(l => l.code === langCode)
                          return (
                            <div key={langCode} className="border border-gray-200 rounded-md p-4">
                              <h4 className="font-medium text-gray-900 mb-2">
                                {lang?.name || langCode} Version
                              </h4>
                              <video
                                controls
                                className="w-full rounded-md mb-3"
                                src={videoUrl}
                                poster={currentJob.assets?.find(a => a.kind === 'IMAGE')?.url}
                              >
                                Your browser does not support the video tag.
                              </video>
                              <a
                                href={`${videoUrl}?download=1`}
                                download={`video_${langCode}.mp4`}
                                className="inline-block bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 text-center transition-colors"
                              >
                                Download {lang?.name || langCode} Video
                              </a>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      // Single language result (backward compatibility)
                      <div>
                        <video
                          controls
                          className="w-full rounded-md"
                          src={currentJob.resultUrl}
                          poster={currentJob.assets?.find(a => a.kind === 'IMAGE')?.url}
                        >
                          Your browser does not support the video tag.
                        </video>
                        <div className="flex space-x-2 mt-3">
                          <a
                            href={`${currentJob.resultUrl}?download=1`}
                            download
                            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 text-center transition-colors"
                          >
                            Download Video
                          </a>
                        </div>
                      </div>
                    )}

                    <div className="flex space-x-2">
                      <button
                        onClick={resetForm}
                        className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
                      >
                        Create Another
                      </button>
                    </div>

                    {/* Assets */}
                    {currentJob.assets && currentJob.assets.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Generated Assets</h4>
                        <div className="space-y-4">
                          {currentJob.assets.map((asset) => (
                            <div key={asset.id} className="bg-gray-50 rounded-md p-4">
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
                                    className="w-full max-w-md rounded-md border border-gray-200"
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
                                  <video controls className="w-full max-w-md rounded-md">
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
                  </div>
                )}

                {currentJob.status === 'FAILED' && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <h3 className="font-medium text-red-900 mb-2">Job Failed</h3>
                    <p className="text-red-700 text-sm mb-3">
                      The job failed during processing. Check the terminal logs for detailed error information.
                    </p>
                    
                    {/* Show which step failed */}
                    {currentJob.steps && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-red-800 mb-1">Failed Step:</p>
                        {currentJob.steps
                          .filter(step => step.status === 'FAILED')
                          .map(step => (
                            <div key={step.id} className="text-sm text-red-700">
                              <span className="font-medium">{step.type}:</span> {step.error || 'Unknown error'}
                            </div>
                          ))}
                      </div>
                    )}
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={async () => {
                          if (!currentJob) return
                          setIsGenerating(true)
                          setError('')
                          
                          try {
                            // Retry the failed step by calling the processor again
                            const response = await fetch(`/api/jobs/${currentJob.id}/retry`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' }
                            })
                            
                            if (!response.ok) {
                              const errorData = await response.json()
                              throw new Error(errorData.error || 'Failed to retry job')
                            }
                            
                            // Refresh job status
                            await fetchJobStatus(currentJob.id)
                          } catch (err) {
                            console.error('Retry failed:', err)
                            setError(err instanceof Error ? err.message : 'Failed to retry job')
                          } finally {
                            setIsGenerating(false)
                          }
                        }}
                        disabled={isGenerating}
                        className="bg-blue-600 text-white py-2 px-4 rounded text-sm hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                      >
                        {isGenerating ? 'Retrying...' : 'Retry Failed Step'}
                      </button>
                      <button
                        onClick={resetForm}
                        className="bg-red-600 text-white py-2 px-4 rounded text-sm hover:bg-red-700 transition-colors"
                      >
                        Try Again
                      </button>
                      <button
                        onClick={() => {
                          setCurrentJob(null)
                          setError('')
                        }}
                        className="bg-gray-600 text-white py-2 px-4 rounded text-sm hover:bg-gray-700 transition-colors"
                      >
                        Start Over
                      </button>
                    </div>
                  </div>
                )}

                {(currentJob.status === 'QUEUED' || currentJob.status === 'RUNNING') && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                    <p className="text-yellow-800 text-sm mb-2">
                      Job is {currentJob.status.toLowerCase()}. This may take several minutes.
                    </p>
                    <button
                      onClick={cancelJob}
                      className="bg-yellow-600 text-white py-1 px-3 rounded text-sm hover:bg-yellow-700 transition-colors"
                    >
                      Cancel Job
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}