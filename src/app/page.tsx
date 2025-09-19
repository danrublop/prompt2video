'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { JobResponse, CreateJobRequest } from '@/types'
import { SUPPORTED_LANGUAGES, LANGUAGE_GROUPS, getLanguageByCode } from '@/lib/languages'

export default function Home() {
  const searchParams = useSearchParams()
  const [prompt, setPrompt] = useState('')
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9')
  const [duration, setDuration] = useState(150) // 2.5 minutes in seconds
  const [language, setLanguage] = useState('en-US')
  const [voiceId, setVoiceId] = useState('')
  const [multiLanguage, setMultiLanguage] = useState(false)
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['en-US'])
  const [showLanguageSelector, setShowLanguageSelector] = useState(false)
  const [currentJob, setCurrentJob] = useState<JobResponse | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoadingJob, setIsLoadingJob] = useState(false)
  const [error, setError] = useState('')
  const [abortController, setAbortController] = useState<AbortController | null>(null)

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

  const handleLanguageToggle = (langCode: string) => {
    if (selectedLanguages.includes(langCode)) {
      if (selectedLanguages.length > 1) { // Don't allow removing all languages
        setSelectedLanguages(selectedLanguages.filter(lang => lang !== langCode))
      }
    } else {
      setSelectedLanguages([...selectedLanguages, langCode])
    }
  }

  const createJob = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt')
      return
    }
    
    if (multiLanguage && selectedLanguages.length === 0) {
      setError('Please select at least one language for multi-language generation')
      return
    }

    // Redirect to storyboard page instead of creating job directly
    const params = new URLSearchParams({
      prompt: prompt.trim(),
      aspectRatio,
      duration: duration.toString(),
      language,
      voiceId: voiceId.trim() || '',
      multiLanguage: multiLanguage.toString(),
      targetLanguages: selectedLanguages.join(','),
    })

    window.location.href = `/storyboard?${params.toString()}`
  }

  const fetchJobStatus = async (jobId: string) => {
    setIsLoadingJob(true)
    try {
      console.log('Fetching job status for:', jobId)
      const response = await fetch(`/api/jobs/${jobId}`, {
        signal: abortController?.signal,
      })
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Job fetch failed:', response.status, errorText)
        throw new Error(`Failed to fetch job status: ${response.status} ${errorText}`)
      }
      const jobData = await response.json()
      console.log('Job data received:', jobData)
      setCurrentJob(jobData)
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
        <div className="mt-4 space-y-3">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md max-w-2xl mx-auto">
            <p className="text-blue-800 text-sm">
              <strong>New:</strong> Interactive storyboard editing! Review and modify your video script before generation.
            </p>
          </div>
          <div className="p-3 bg-green-50 border border-green-200 rounded-md max-w-2xl mx-auto">
            <p className="text-green-800 text-sm">
              <strong>🌍 Multi-Language:</strong> Now integrated! Check the "Generate in multiple languages" option below to create videos in multiple languages simultaneously.
            </p>
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

              <div className="space-y-4">
                {/* Multi-Language Toggle */}
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="multiLanguage"
                    checked={multiLanguage}
                    onChange={(e) => setMultiLanguage(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    disabled={isGenerating}
                  />
                  <label htmlFor="multiLanguage" className="text-sm font-medium text-gray-700">
                    Generate in multiple languages 🌍
                  </label>
                </div>

                {/* Language Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {multiLanguage ? 'Target Languages' : 'Language'}
                  </label>
                  
                  {multiLanguage ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          {selectedLanguages.length} language{selectedLanguages.length !== 1 ? 's' : ''} selected
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowLanguageSelector(!showLanguageSelector)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          {showLanguageSelector ? 'Hide Languages' : 'Select Languages'}
                        </button>
                      </div>
                      
                      {showLanguageSelector && (
                        <div className="border border-gray-300 rounded-md p-4 max-h-64 overflow-y-auto">
                          <div className="space-y-4">
                            {Object.entries(LANGUAGE_GROUPS).map(([groupName, languageCodes]) => (
                              <div key={groupName}>
                                <h4 className="font-medium text-sm text-gray-700 mb-2">{groupName}</h4>
                                <div className="grid grid-cols-2 gap-2">
                                  {languageCodes.map((langCode) => {
                                    const lang = getLanguageByCode(langCode)
                                    if (!lang) return null
                                    return (
                                      <label key={langCode} className="flex items-center space-x-2 text-sm">
                                        <input
                                          type="checkbox"
                                          checked={selectedLanguages.includes(langCode)}
                                          onChange={() => handleLanguageToggle(langCode)}
                                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span>{lang.name}</span>
                                      </label>
                                    )
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        {selectedLanguages.map((langCode) => {
                          const lang = getLanguageByCode(langCode)
                          if (!lang) return null
                          return (
                            <span
                              key={langCode}
                              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {lang.name}
                              <button
                                type="button"
                                onClick={() => handleLanguageToggle(langCode)}
                                className="ml-2 text-blue-600 hover:text-blue-800"
                              >
                                ×
                              </button>
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isGenerating}
                    >
                      {SUPPORTED_LANGUAGES.slice(0, 20).map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.name} ({lang.nativeName})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Voice ID */}
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

              <div className="space-y-2">
                <button
                  onClick={createJob}
                  disabled={!prompt.trim() || (multiLanguage && selectedLanguages.length === 0)}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {multiLanguage 
                    ? `Create Storyboard (${selectedLanguages.length} language${selectedLanguages.length !== 1 ? 's' : ''})`
                    : 'Create Storyboard'
                  }
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
            
            {isLoadingJob ? (
              <div className="text-center text-gray-500 py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                Loading job status...
              </div>
            ) : !currentJob ? (
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
                    <span className="text-sm text-gray-600">${(currentJob.totalCost || 0).toFixed(4)}</span>
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

                {/* Results */}
                {currentJob.status === 'DONE' && currentJob.resultUrl && (
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">Your Video</h3>
                    
                    <video
                      controls
                      className="w-full rounded-md"
                      src={currentJob.resultUrl}
                    >
                      Your browser does not support the video tag.
                    </video>

                    <div className="flex space-x-2">
                      <a
                        href={currentJob.resultUrl}
                        download
                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 text-center transition-colors"
                      >
                        Download Video
                      </a>
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
                        <h4 className="font-medium text-gray-900 mb-2">Assets</h4>
                        <div className="space-y-2">
                          {currentJob.assets.map((asset) => (
                            <div key={asset.id} className="flex items-center justify-between bg-gray-50 rounded-md p-2">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-700">
                                  {asset.kind.toLowerCase()} - {asset.meta?.sceneId || 'unknown'}
                                </span>
                                {asset.kind === 'VIDEO' && (
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                    AI Generated
                                  </span>
                                )}
        </div>
        <a
                                href={asset.url}
          target="_blank"
          rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                {asset.kind === 'VIDEO' ? 'Play' : 'View'}
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {currentJob.status === 'FAILED' && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-red-600 text-sm">
                      Job failed. Please try again with a different prompt.
                    </p>
                    <button
                      onClick={resetForm}
                      className="mt-2 bg-red-600 text-white py-1 px-3 rounded text-sm hover:bg-red-700 transition-colors"
                    >
                      Try Again
                    </button>
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