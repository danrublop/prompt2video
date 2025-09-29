'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { JobResponse, AssetResponse } from '@/types'
import { ImageTheme } from '@/lib/themes'

interface EditingAsset {
  id: string
  type: 'image' | 'audio' | 'video'
  sceneIndex: number
  originalUrl: string
  currentUrl: string
  isEdited: boolean
  customPrompt?: string
  customScript?: string
}

export default function VideoEditor() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.jobId as string
  
  const [job, setJob] = useState<JobResponse | null>(null)
  const [editingAssets, setEditingAssets] = useState<EditingAsset[]>([])
  const [selectedAsset, setSelectedAsset] = useState<EditingAsset | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [error, setError] = useState('')
  const [customPrompt, setCustomPrompt] = useState('')
  const [customScript, setCustomScript] = useState('')
  const [availableThemes, setAvailableThemes] = useState<ImageTheme[]>([])
  const [selectedTheme, setSelectedTheme] = useState<string>('whiteboard')
  const [script, setScript] = useState<any>(null)
  const [sceneDurations, setSceneDurations] = useState<number[]>([])

  // Calculate the start time for each scene
  const getSceneStartTime = (sceneIndex: number) => {
    return sceneDurations.slice(0, sceneIndex).reduce((sum, duration) => sum + duration, 0)
  }

  useEffect(() => {
    if (jobId) {
      fetchJobDetails()
      fetchThemes()
    }
  }, [jobId])

  const fetchJobDetails = async () => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch job details')
      }
      const jobData = await response.json()
      setJob(jobData)
      setScript(jobData.script)
      
      console.log('Job data:', jobData)
      console.log('Job duration:', jobData.duration)
      console.log('Video duration from player:', jobData.duration)
      
      // Calculate scene durations from script
      if (jobData.script) {
        const scenes = jobData.script.languages?.[jobData.languages[0]]?.scenes || jobData.script.scenes || []
        const durations = scenes.map((scene: any) => scene.duration || 20)
        setSceneDurations(durations)
      } else {
        // Default durations if no script
        const numScenes = Math.max(...(jobData.assets?.map((a: AssetResponse) => a.meta?.sceneIndex || 0) || [0])) + 1
        const defaultDuration = Math.floor(jobData.duration / numScenes)
        setSceneDurations(Array(numScenes).fill(defaultDuration))
      }
      
      // Initialize editing assets from job assets
      const assets: EditingAsset[] = jobData.assets?.map((asset: AssetResponse) => ({
        id: asset.id,
        type: asset.kind.toLowerCase() as 'image' | 'audio' | 'video',
        sceneIndex: asset.meta?.sceneIndex || 0,
        originalUrl: asset.url,
        currentUrl: asset.url,
        isEdited: false
      })) || []
      
      setEditingAssets(assets)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch job details')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchThemes = async () => {
    try {
      const response = await fetch('/api/themes')
      if (response.ok) {
        const data = await response.json()
        setAvailableThemes(data.themes || [])
      }
    } catch (error) {
      console.error('Failed to fetch themes:', error)
    }
  }

  const handleAssetClick = (asset: EditingAsset) => {
    setSelectedAsset(asset)
    if (asset.type === 'image') {
      setCustomPrompt(asset.customPrompt || '')
      setSelectedTheme('whiteboard') // Default theme
      setCustomScript('') // Clear script when switching to image
    } else if (asset.type === 'audio') {
      setCustomPrompt('') // Clear prompt when switching to audio
      // Get the original script text for this scene
      const sceneIndex = asset.sceneIndex
      let originalScript = ''
      
      console.log('Audio clicked, sceneIndex:', sceneIndex)
      console.log('Script data:', script)
      console.log('Job languages:', job?.languages)
      console.log('Job data:', job)
      
      // Try to get script from multi-language structure first
      if (script?.languages && job?.languages && job.languages.length > 0) {
        const primaryLanguage = job.languages[0]
        console.log('Primary language:', primaryLanguage)
        const languageScript = script.languages[primaryLanguage]
        console.log('Language script:', languageScript)
        if (languageScript?.scenes && languageScript.scenes[sceneIndex]) {
          originalScript = languageScript.scenes[sceneIndex].narration || ''
          console.log('Found script in language structure:', originalScript)
        }
      }
      
      // Fallback to single language script structure
      if (!originalScript && script?.scenes && script.scenes[sceneIndex]) {
        originalScript = script.scenes[sceneIndex].narration || ''
        console.log('Found script in single language structure:', originalScript)
      }
      
      // Try to get script from job.script if available
      if (!originalScript && job?.script) {
        console.log('Trying job.script:', job.script)
        if (job.script.languages && job.languages && job.languages.length > 0) {
          const primaryLanguage = job.languages[0]
          const languageScript = job.script.languages[primaryLanguage]
          if (languageScript?.scenes && languageScript.scenes[sceneIndex]) {
            originalScript = languageScript.scenes[sceneIndex].narration || ''
            console.log('Found script in job.script language structure:', originalScript)
          }
        } else if (job.script.scenes && job.script.scenes[sceneIndex]) {
          originalScript = job.script.scenes[sceneIndex].narration || ''
          console.log('Found script in job.script single language structure:', originalScript)
        }
      }
      
      // If still no script, use a placeholder
      if (!originalScript) {
        originalScript = `Scene ${sceneIndex + 1} narration - Click to edit`
        console.log('Using placeholder script:', originalScript)
      }
      
      setCustomScript(asset.customScript || originalScript)
    }
  }

  const regenerateImage = async () => {
    if (!selectedAsset || !job) return
    
    setIsRegenerating(true)
    try {
      const response = await fetch('/api/regenerate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          assetId: selectedAsset.id,
          customPrompt,
          theme: selectedTheme,
          sceneIndex: selectedAsset.sceneIndex
        })
      })

      if (!response.ok) {
        throw new Error('Failed to regenerate image')
      }

      const data = await response.json()
      
      // Update the asset in our state
      setEditingAssets(prev => prev.map(asset => 
        asset.id === selectedAsset.id 
          ? { 
              ...asset, 
              currentUrl: data.newUrl, 
              isEdited: true,
              customPrompt 
            }
          : asset
      ))

      setSelectedAsset(null)
      setCustomPrompt('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate image')
    } finally {
      setIsRegenerating(false)
    }
  }

  const regenerateAudio = async () => {
    if (!selectedAsset || !job) return
    
    console.log('Starting audio regeneration...')
    console.log('Selected asset:', selectedAsset)
    console.log('Custom script:', customScript)
    console.log('Job TTS provider:', job.ttsProvider)
    
    setIsRegenerating(true)
    try {
      const requestBody = {
        jobId,
        assetId: selectedAsset.id,
        customScript,
        sceneIndex: selectedAsset.sceneIndex,
        ttsProvider: job.ttsProvider,
        voiceId: job.voiceId,
        openaiVoice: job.openaiVoice
      }
      
      console.log('Request body:', requestBody)
      
      const response = await fetch('/api/regenerate-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Error response:', errorData)
        throw new Error(`Failed to regenerate audio: ${errorData.error || 'Unknown error'}`)
      }

      const data = await response.json()
      console.log('Success response:', data)
      
      // Update the asset in our state
      setEditingAssets(prev => prev.map(asset => 
        asset.id === selectedAsset.id 
          ? { 
              ...asset, 
              currentUrl: data.newUrl, 
              isEdited: true,
              customScript 
            }
          : asset
      ))

      setSelectedAsset(null)
      setCustomScript('')
    } catch (err) {
      console.error('Audio regeneration error:', err)
      setError(err instanceof Error ? err.message : 'Failed to regenerate audio')
    } finally {
      setIsRegenerating(false)
    }
  }

  const recomposeVideo = async () => {
    if (!job) return
    
    console.log('Starting video recomposition...')
    console.log('Edited assets:', editingAssets.filter(asset => asset.isEdited))
    
    setIsRegenerating(true)
    try {
      const editedAssets = editingAssets
        .filter(asset => asset.isEdited)
        .map(asset => ({
          id: asset.id,
          currentUrl: asset.currentUrl,
          type: asset.type,
          sceneIndex: asset.sceneIndex
        }))

      console.log('Sending edited assets to API:', editedAssets)

      const response = await fetch('/api/recompose-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          editedAssets
        })
      })

      console.log('Recompose response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Recompose error response:', errorData)
        throw new Error(`Failed to recompose video: ${errorData.error || 'Unknown error'}`)
      }

      const data = await response.json()
      console.log('Recompose success response:', data)
      
      // Update job with new video URL
      setJob(prev => prev ? { ...prev, resultUrls: data.resultUrls } : null)
      
      // Reset editing state
      setEditingAssets(prev => prev.map(asset => ({ ...asset, isEdited: false })))
      
    } catch (err) {
      console.error('Video recomposition error:', err)
      setError(err instanceof Error ? err.message : 'Failed to recompose video')
    } finally {
      setIsRegenerating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading video editor...</p>
        </div>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
            <p className="text-red-600">{error || 'Job not found'}</p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const hasEditedAssets = editingAssets.some(asset => asset.isEdited)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Video Editor</h1>
              <p className="text-lg text-gray-600 mb-2">{job.prompt}</p>
              <div className="flex space-x-4 text-sm text-gray-500">
                <span>Duration: {Math.round(job.duration)}s</span>
                <span>Status: {job.status}</span>
                <span>Aspect Ratio: {job.aspectRatio}</span>
                <span>Languages: {job.languages.length}</span>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => router.push(`/?jobId=${jobId}`)}
                className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
              >
                Back to Job
              </button>
              {hasEditedAssets && (
                <button
                  onClick={recomposeVideo}
                  disabled={isRegenerating}
                  className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                >
                  {isRegenerating ? 'Recomposing...' : 'Recompose Video'}
                </button>
              )}
            </div>
          </div>
          
          {hasEditedAssets && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-yellow-800 text-sm">
                <strong>You have unsaved changes.</strong> Click "Recompose Video" to apply your edits.
              </p>
            </div>
          )}
        </div>

        {/* Video Player */}
        {job.resultUrls && Object.keys(job.resultUrls).length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Video Preview</h2>
            <div className="space-y-4">
              {Object.entries(job.resultUrls).map(([langCode, videoUrl]) => {
                const lang = job.languages.find(l => l === langCode)
                return (
                  <div key={langCode} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">
                      {lang || langCode} Version
                    </h3>
                    <video
                      controls
                      className="w-full rounded-md"
                      src={videoUrl}
                      poster={editingAssets.find(a => a.type === 'image')?.currentUrl}
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Timeline</h2>
          
          {/* Timeline Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex space-x-4">
              <div className="text-sm font-medium text-gray-700">Tracks</div>
              <div className="text-sm text-gray-500">Click on any element to edit</div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Duration: {Math.round(job.duration)}s | Scenes: {Math.max(...editingAssets.map(a => a.sceneIndex)) + 1}
              </div>
              <div className="text-xs text-gray-400">
                ← Scroll horizontally to navigate →
              </div>
            </div>
          </div>

          {/* Timeline Grid */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="flex">
              {/* Fixed Left Column - Track Names */}
              <div className="w-32 bg-gray-50 border-r border-gray-200">
                {/* Empty corner cell */}
                <div className="h-12 border-b border-gray-200"></div>
                
                {/* Video Track Name */}
                <div className="h-16 border-b border-gray-200 flex items-center px-3">
                  <div className="text-sm font-semibold text-gray-800 flex items-center">
                    <span className="mr-2">🎬</span>Video
                  </div>
                </div>
                
                {/* Images Track Name */}
                <div className="h-16 border-b border-gray-200 flex items-center px-3">
                  <div className="text-sm font-semibold text-gray-800 flex items-center">
                    <span className="mr-2">🖼️</span>Images
                  </div>
                </div>
                
                {/* Audio Track Name */}
                <div className="h-16 border-b border-gray-200 flex items-center px-3">
                  <div className="text-sm font-semibold text-gray-800 flex items-center">
                    <span className="mr-2">🎵</span>Audio
                  </div>
                </div>
              </div>

              {/* Right Side - Fixed Header + Scrollable Content */}
              <div className="flex-1">
                {/* Fixed Top Row - Time Ruler */}
                <div className="bg-gray-50 border-b border-gray-200 p-3">
                  <div className="flex items-center space-x-8 text-xs text-gray-600 font-medium" style={{ minWidth: `${Math.max(800, job.duration * 8)}px` }}>
                    {Array.from({ length: Math.ceil(job.duration / 10) + 1 }, (_, i) => (
                      <div key={i} className="flex items-center space-x-2">
                        <div className="w-px h-4 bg-gray-400"></div>
                        <span className="text-gray-700">{i * 10}s</span>
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Debug: Job duration = {job.duration}s, Timeline width = {Math.max(800, job.duration * 8)}px
                  </div>
                </div>

                {/* Scrollable Content Area */}
                <div 
                  className="overflow-x-auto timeline-scroll relative" 
                  style={{ 
                    maxHeight: '200px'
                  }}
                >
                  {/* Vertical Divider Lines */}
                  <div className="absolute inset-0 pointer-events-none">
                    {Array.from({ length: Math.ceil(job.duration / 10) + 1 }, (_, i) => (
                      <div 
                        key={i} 
                        className="absolute top-0 bottom-0 w-px bg-gray-300"
                        style={{ left: `${(i * 10 / job.duration) * 100}%` }}
                      ></div>
                    ))}
                  </div>
                  
                  <div style={{ minWidth: `${Math.max(800, job.duration * 8)}px` }}>
                    <div className="text-xs text-gray-500 mb-2">
                      Content width: {Math.max(800, job.duration * 8)}px
                    </div>
                    {/* Video Track Content */}
                    <div className="h-16 border-b border-gray-200 flex items-center px-3">
                      <div className="w-full h-10 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg flex items-center justify-center text-sm text-gray-600 font-medium border">
                        Final Video
                      </div>
                    </div>

                    {/* Images Track Content */}
                    <div className="h-16 border-b border-gray-200 flex items-center px-3">
                      <div className="w-full relative h-10">
                        {editingAssets
                          .filter(asset => asset.type === 'image')
                          .sort((a, b) => a.sceneIndex - b.sceneIndex)
                          .map((asset) => {
                            const sceneDuration = sceneDurations[asset.sceneIndex] || 20
                            const startTime = getSceneStartTime(asset.sceneIndex)
                            const leftPosition = `${(startTime / job.duration) * 100}%`
                            const width = `${(sceneDuration / job.duration) * 100}%`
                            return (
                              <div
                                key={asset.id}
                                className={`absolute h-8 border-2 rounded-lg cursor-pointer transition-all duration-200  ${
                                  selectedAsset?.id === asset.id
                                    ? 'border-blue-500 bg-blue-100 shadow-lg ring-2 ring-blue-200'
                                    : asset.isEdited
                                    ? 'border-green-500 bg-green-100 shadow-md'
                                    : 'border-gray-300 bg-white hover:border-gray-400 hover:shadow-md'
                                }`}
                                style={{ left: leftPosition, width }}
                                onClick={() => handleAssetClick(asset)}
                              >
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <img
                                    src={asset.currentUrl}
                                    alt={`Scene ${asset.sceneIndex + 1}`}
                                    className="w-full h-full object-cover rounded-md"
                                  />
                                </div>
                                <div className="absolute top-0 left-0 bg-black bg-opacity-60 text-white text-xs px-1 rounded-br-md font-medium">
                                  {asset.sceneIndex + 1}
                                </div>
                                {asset.isEdited && (
                                  <div className="absolute top-0 right-0 bg-green-500 text-white text-xs px-1 rounded-bl-md">
                                    ✓
                                  </div>
                                )}
                              </div>
                            )
                          })}
                      </div>
                    </div>

                    {/* Audio Track Content */}
                    <div className="h-16 border-b border-gray-200 flex items-center px-3">
                      <div className="w-full relative h-10">
                        {editingAssets
                          .filter(asset => asset.type === 'audio')
                          .sort((a, b) => a.sceneIndex - b.sceneIndex)
                          .map((asset) => {
                            const sceneDuration = sceneDurations[asset.sceneIndex] || 20
                            const startTime = getSceneStartTime(asset.sceneIndex)
                            const leftPosition = `${(startTime / job.duration) * 100}%`
                            const width = `${(sceneDuration / job.duration) * 100}%`
                            return (
                              <div
                                key={asset.id}
                                className={`absolute h-8 border-2 rounded-lg cursor-pointer transition-all duration-200  ${
                                  selectedAsset?.id === asset.id
                                    ? 'border-blue-500 bg-blue-100 shadow-lg ring-2 ring-blue-200'
                                    : asset.isEdited
                                    ? 'border-green-500 bg-green-100 shadow-md'
                                    : 'border-gray-300 bg-white hover:border-gray-400 hover:shadow-md'
                                }`}
                                style={{ left: leftPosition, width }}
                                onClick={() => handleAssetClick(asset)}
                              >
                                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-purple-100 to-pink-100 rounded-md">
                                  <div className="flex items-center space-x-1 text-xs text-gray-700 font-medium">
                                    <span>🎵</span>
                                    <span>Scene {asset.sceneIndex + 1}</span>
                                  </div>
                                </div>
                                {selectedAsset?.id === asset.id && (
                                  <div className="absolute bottom-0 left-0 right-0 bg-blue-500 text-white text-xs text-center py-0.5">
                                    Script Loaded
                                  </div>
                                )}
                                {asset.isEdited && (
                                  <div className="absolute top-0 right-0 bg-green-500 text-white text-xs px-1 rounded-bl-md">
                                    ✓
                                  </div>
                                )}
                              </div>
                            )
                          })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline Footer */}
            <div className="bg-gray-50 px-4 py-2">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div>Timeline View - Click any element to edit</div>
                <div className="flex space-x-4">
                  <span>Blue = Selected</span>
                  <span>Green = Edited</span>
                  <span>White = Original</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Panel */}
        {selectedAsset && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Edit {selectedAsset.type.charAt(0).toUpperCase() + selectedAsset.type.slice(1)}
            </h2>
            
            {selectedAsset.type === 'image' && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-md p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Scene {selectedAsset.sceneIndex + 1} Image</h3>
                  <div className="text-sm text-gray-600 mb-3">
                    Edit the image description below to change how this scene looks. The image will be regenerated with the selected theme.
                  </div>
                  <div className="flex space-x-4">
                    <div className="flex-1">
                      <img
                        src={selectedAsset.currentUrl}
                        alt={`Scene ${selectedAsset.sceneIndex + 1} image`}
                        className="w-full h-32 object-cover rounded border"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-gray-600">
                        <strong>Current Theme:</strong> {availableThemes.find(t => t.id === (job?.imageTheme || 'whiteboard'))?.name || 'Whiteboard Drawing'}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Image Description
                  </label>
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Describe how you want the image to look..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Be specific about what you want to change or add to the image
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Theme
                  </label>
                  <select
                    value={selectedTheme}
                    onChange={(e) => setSelectedTheme(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {availableThemes.map(theme => (
                      <option key={theme.id} value={theme.id}>
                        {theme.name}
                      </option>
                    ))}
                  </select>
                  <div className="text-xs text-gray-500 mt-1">
                    {availableThemes.find(t => t.id === selectedTheme)?.description}
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={regenerateImage}
                    disabled={isRegenerating || !customPrompt.trim()}
                    className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                  >
                    {isRegenerating ? 'Regenerating...' : 'Regenerate Image'}
                  </button>
                  <button
                    onClick={() => setSelectedAsset(null)}
                    className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            
            {selectedAsset.type === 'audio' && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-md p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Scene {selectedAsset.sceneIndex + 1} Audio</h3>
                  <div className="text-sm text-gray-600 mb-3">
                    Edit the script text below to change what is spoken in this scene. The audio will be regenerated with the same voice settings.
                  </div>
                  <audio controls className="w-full mb-3">
                    <source src={selectedAsset.currentUrl} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Script Text
                  </label>
                  <div className="text-xs text-gray-600 mb-2">
                    The original script for this scene is loaded below. Edit it to change what will be spoken.
                  </div>
                  <textarea
                    value={customScript}
                    onChange={(e) => setCustomScript(e.target.value)}
                    placeholder="Edit the narration text for this scene..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Character count: {customScript.length}</span>
                    <span>Words: {customScript.split(/\s+/).filter(word => word.length > 0).length}</span>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={regenerateAudio}
                    disabled={isRegenerating || !customScript.trim()}
                    className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                  >
                    {isRegenerating ? 'Regenerating...' : 'Regenerate Audio'}
                  </button>
                  <button
                    onClick={() => setSelectedAsset(null)}
                    className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mt-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}
