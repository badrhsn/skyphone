'use client'

import { useState, useEffect } from 'react'
import { Mic, Play, Download, Search } from 'lucide-react'
import PageLayout, { Card, Button } from '../../../components/PageLayout'
import { useModal } from '@/components/Modal'

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
  const { showInfo, ModalComponent } = useModal()

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
    showInfo("Recording Playback", `Playing recording for call ${recording.twilioSid}\n\nIn production, this would stream the audio file.`)
  }

  const handleDownloadRecording = (recording: Recording) => {
    // In production, this would download the actual file
    window.open(recording.recordingUrl, '_blank')
  }

  return (
    <PageLayout
      title="Call Recordings"
      description="Manage and access your call recordings"
      icon={Mic}
    >

      {/* Search */}
      <Card>
        <div className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <Search className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Search Recordings</h2>
          </div>
          <input
            type="text"
            placeholder="Search by phone number or call ID..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50/50"
          />
        </div>
      </Card>

      {/* Recordings list */}
      <Card>
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Your Recordings</h2>
          <p className="text-gray-600 mt-1">{filteredRecordings.length} recording(s) found</p>
        </div>
        
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredRecordings.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="w-16 h-16 bg-gradient-to-br from-gray-400 to-gray-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Mic className="h-8 w-8 text-white" />
              </div>
              <p className="text-lg font-medium text-gray-900 mb-2">No recordings found</p>
              <p className="text-gray-600">Your call recordings will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRecordings.map((recording) => (
                <div
                  key={recording.id}
                  className="border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-gray-300 transition-all bg-white/50 backdrop-blur-sm"
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
                        <Button
                          variant="secondary"
                          onClick={() => handlePlayRecording(recording)}
                          className="text-sm"
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Play
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => handleDownloadRecording(recording)}
                          className="text-sm"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            )}
        </div>
      </Card>      {/* Pagination */}
      {filteredRecordings.length > 0 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="secondary"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-4 py-2 text-gray-600">
            Page {currentPage}
          </span>
          <Button
            variant="secondary"
            onClick={() => setCurrentPage(p => p + 1)}
            disabled={filteredRecordings.length < 10}
          >
            Next
          </Button>
        </div>
      )}
      
      {ModalComponent}
    </PageLayout>
  )
}