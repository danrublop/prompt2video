'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { SUPPORTED_LANGUAGES, LANGUAGE_GROUPS, POPULAR_LANGUAGES, getLanguageByCode } from '@/lib/languages'
import { CreateJobRequest, JobResponse, LanguageVideo } from '@/types'

export default function MultiLanguageVideoGenerator() {
  const searchParams = useSearchParams()
  const [prompt, setPrompt] = useState('')
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9')
  const [duration, setDuration] = useState(150)
  const [primaryLanguage, setPrimaryLanguage] = useState('en-US')
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['en-US'])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoadingJob, setIsLoadingJob] = useState(false)
  const [error, setError] = useState('')
  const [currentJob, setCurrentJob] = useState<JobResponse | null>(null)
  const [showLanguageSelector, setShowLanguageSelector] = useState(false)

  // Check for job ID in URL parameters
  useEffect(() => {
    const jobId = searchParams.get('jobId')
    if (jobId) {
      console.log('Found job ID in multi-language URL:', jobId)
      fetchJobStatus(jobId)
    }
  }, [searchParams])

  const fetchJobStatus = async (jobId: string) => {
    setIsLoadingJob(true)
    try {
      console.log('Fetching multi-language job status for:', jobId)
      const response = await fetch(`/api/jobs/${jobId}`)
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Job fetch failed:', response.status, errorText)
        throw new Error(`Failed to fetch job status: ${response.status} ${errorText}`)
      }
      const jobData = await response.json()
      console.log('Multi-language job data received:', jobData)
      setCurrentJob(jobData)
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

  const handleLanguageToggle = (langCode: string) => {
    if (selectedLanguages.includes(langCode)) {
      if (selectedLanguages.length > 1) { // Don't allow removing all languages
        setSelectedLanguages(selectedLanguages.filter(lang => lang !== langCode))
      }
    } else {
      setSelectedLanguages([...selectedLanguages, langCode])
    }
  }

  const generateMultiLanguageVideo = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt')
      return
    }

    if (selectedLanguages.length === 0) {
      setError('Please select at least one language')
      return
    }

    setIsGenerating(true)
    setError('')

    try {
      console.log('Creating multi-language job with languages:', selectedLanguages)
      
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          aspectRatio,
          duration,
          language: primaryLanguage,
          multiLanguage: true,
          targetLanguages: selectedLanguages,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Job creation failed:', response.status, errorText)
        throw new Error(`Failed to create job: ${response.status} ${errorText}`)
      }

      const jobData = await response.json()
      console.log('Multi-language job created successfully:', jobData)
      
      // Redirect to multi-language page with job ID
      window.location.href = `/multi-language?jobId=${jobData.id}`
    } catch (err) {
      console.error('Error creating multi-language job:', err)
      setError(err instanceof Error ? err.message : 'Failed to create job')
    } finally {
      setIsGenerating(false)
    }
  }

  const getLanguageStatusIcon = (languageVideo: LanguageVideo) => {
    switch (languageVideo.status) {
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
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Multi-Language Video Generator 🌍
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Create the same video in multiple languages with synchronized audio. 
            Perfect for global content, training materials, and multilingual marketing.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {currentJob ? 'Job Status' : 'Create Multi-Language Video'}
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
                    <span className="font-medium">Total Cost:</span>
                    <span className="text-sm text-gray-600">${(currentJob.totalCost || 0).toFixed(4)}</span>
                  </div>
                </div>

                {/* Language Videos Status */}
                {currentJob.languageVideos && currentJob.languageVideos.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-medium text-gray-900">Language Progress</h3>
                    {currentJob.languageVideos.map((langVideo) => (
                      <div key={langVideo.language} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                        <div className="flex items-center space-x-3">
                          <span className="text-lg">{getLanguageStatusIcon(langVideo)}</span>
                          <div>
                            <div className="font-medium text-sm">{langVideo.languageName}</div>
                            <div className="text-xs text-gray-500">{langVideo.nativeName}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            langVideo.status === 'DONE' ? 'bg-green-100 text-green-800' :
                            langVideo.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                            langVideo.status === 'RUNNING' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {langVideo.status}
                          </span>
                          {langVideo.status === 'DONE' && langVideo.videoUrl && (
                            <a
                              href={langVideo.videoUrl}
                              download
                              className="text-blue-600 hover:text-blue-800 text-xs"
                            >
                              Download
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

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
                    Video Prompt
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
                      Duration (seconds)
                    </label>
                    <input
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      min="30"
                      max="600"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isGenerating}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Language
                  </label>
                  <select
                    value={primaryLanguage}
                    onChange={(e) => setPrimaryLanguage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isGenerating}
                  >
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name} ({lang.nativeName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Target Languages ({selectedLanguages.length} selected)
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowLanguageSelector(!showLanguageSelector)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      {showLanguageSelector ? 'Hide' : 'Select Languages'}
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

                  <div className="flex flex-wrap gap-2 mt-2">
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

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                <button
                  onClick={generateMultiLanguageVideo}
                  disabled={isGenerating || !prompt.trim() || selectedLanguages.length === 0}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isGenerating ? 'Generating Multi-Language Videos...' : `Generate Videos in ${selectedLanguages.length} Language${selectedLanguages.length > 1 ? 's' : ''}`}
                </button>
              </div>
            )}
          </div>

          {/* Results */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Multi-Language Results</h2>
            
            {!currentJob ? (
              <div className="text-center text-gray-500 py-8">
                <div className="text-6xl mb-4">🌍</div>
                <p className="text-lg font-medium mb-2">Ready to Go Global?</p>
                <p className="text-sm">
                  Create videos in multiple languages with the same visual content but different audio tracks.
                </p>
              </div>
            ) : currentJob.status === 'DONE' && currentJob.languageVideos ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <div className="flex items-center">
                    <div className="text-green-400 mr-3">✅</div>
                    <div>
                      <h3 className="text-green-800 font-medium">Multi-Language Videos Complete!</h3>
                      <p className="text-green-700 text-sm">
                        Generated {currentJob.languageVideos.filter(lv => lv.status === 'DONE').length} videos successfully.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {currentJob.languageVideos.map((langVideo) => (
                    <div key={langVideo.language} className="border border-gray-200 rounded-md p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900">{langVideo.languageName}</h4>
                          <p className="text-sm text-gray-500">{langVideo.nativeName}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{getLanguageStatusIcon(langVideo)}</span>
                          {langVideo.status === 'DONE' && (
                            <a
                              href={langVideo.videoUrl}
                              download={`video_${langVideo.language}.mp4`}
                              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                            >
                              Download
                            </a>
                          )}
                        </div>
                      </div>
                      {langVideo.error && (
                        <p className="text-red-600 text-sm">{langVideo.error}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                {isGenerating ? 'Generating your multi-language videos...' : 'No videos generated yet.'}
              </div>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-4xl mb-4">🎬</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Same Visual Content</h3>
            <p className="text-gray-600 text-sm">
              All language versions use the same images and video composition for consistency.
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-4">🎵</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Localized Audio</h3>
            <p className="text-gray-600 text-sm">
              Each video gets native language narration with appropriate voice characteristics.
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Efficient Processing</h3>
            <p className="text-gray-600 text-sm">
              Generate multiple language versions simultaneously for faster delivery.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
