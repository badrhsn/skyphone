'use client'

import { useState, useEffect } from 'react'

interface Recording {
  id: string
  twilioSid: string | null
  toNumber: string
  fromNumber: string
  duration: number
  status: string
  createdAt: string
  hasRecording: boolean
  recordingUrl: string
  recordingDuration: number
  recordingSize: string
  recordingFormat: string
}

export default function RecordingsPage() {
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    fetchRecordings()
  }, [currentPage])

  const fetchRecordings = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/recordings?page=${currentPage}&limit=10`)
      
      if (response.ok) {
        const data = await response.json()
        setRecordings(data.recordings)
      }
    } catch (error) {
      console.error('Failed to fetch recordings:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredRecordings = recordings.filter(recording =>
    recording.toNumber.includes(searchTerm) ||
    recording.fromNumber.includes(searchTerm) ||
    (recording.twilioSid && recording.twilioSid.includes(searchTerm))
  )

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handlePlayRecording = (recording: Recording) => {
    // In production, this would open an audio player or stream the file
    alert(`Playing recording for call ${recording.twilioSid}\\n\\nIn production, this would stream the audio file.`)
  }

  const handleDownloadRecording = (recording: Recording) => {
    // In production, this would download the actual file
    window.open(recording.recordingUrl, '_blank')
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">📼 Call Recordings</h1>
        <p className="mt-2 text-gray-600">
          Manage and access your call recordings
        </p>
      </header>

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">🔍 Search Recordings</h2>
        <input
          type="text"
          placeholder="Search by phone number or call ID..."
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Recordings list */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Your Recordings</h2>
          <p className="text-gray-600">{filteredRecordings.length} recording(s) found</p>
        </div>
        
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredRecordings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-6xl mb-4">💾</div>
              <p className="text-lg">No recordings found</p>
              <p className="text-sm">Your call recordings will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRecordings.map((recording) => (
                <div
                  key={recording.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <span className="font-medium text-gray-900">
                          📞 {recording.fromNumber} → {recording.toNumber}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          recording.status === 'COMPLETED' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {recording.status}
                        </span>
                        {recording.hasRecording && (
                          <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                            🎵 Recorded
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>📅 {formatDate(recording.createdAt)}</span>
                        <span>⏱️ {formatDuration(recording.duration)}</span>
                        {recording.hasRecording && (
                          <span className="text-xs">
                            {recording.recordingSize} • {recording.recordingFormat.toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>

                    {recording.hasRecording && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handlePlayRecording(recording)}
                          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
                        >
                          ▶️ Play
                        </button>
                        <button
                          onClick={() => handleDownloadRecording(recording)}
                          className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-sm"
                        >
                          📥 Download
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {filteredRecordings.length > 0 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded ${
              currentPage === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Previous
          </button>
          <span className="flex items-center px-4 py-2">
            Page {currentPage}
          </span>
          <button
            onClick={() => setCurrentPage(p => p + 1)}
            disabled={filteredRecordings.length < 10}
            className={`px-4 py-2 rounded ${
              filteredRecordings.length < 10
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}