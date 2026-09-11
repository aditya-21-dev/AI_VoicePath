import './App.css'
import { useMemo, useRef, useState } from 'react'

const API_BASE_URL = 'http://localhost:8000'

const LANGUAGES = [
  { label: 'English', code: 'en' },
  { label: 'Tamil', code: 'ta' },
  { label: 'Hindi', code: 'hi' },
  { label: 'Telugu', code: 'te' },
  { label: 'Malayalam', code: 'ml' },
  { label: 'Kannada', code: 'kn' },
  { label: 'Bengali', code: 'bn' },
  { label: 'Marathi', code: 'mr' },
]

const REQUEST_TIMEOUT_MS = 45000

function requestWithTimeout(url, options = {}) {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  return fetch(url, {
    ...options,
    signal: controller.signal,
  }).finally(() => window.clearTimeout(timeoutId))
}

function getApiError(error, fallbackMessage) {
  if (error?.name === 'AbortError') {
    return 'The backend took too long to respond. Please retry.'
  }

  return error?.message || fallbackMessage
}

async function readErrorMessage(response, fallbackMessage) {
  try {
    const body = await response.json()
    return body?.detail || body?.error?.message || body?.message || fallbackMessage
  } catch {
    return fallbackMessage
  }
}

function App() {
  const mediaRecorderRef = useRef(null)
  const streamRef = useRef(null)
  const chunksRef = useRef([])
  const [selectedLanguage, setSelectedLanguage] = useState('ta')
  const [recordingState, setRecordingState] = useState('idle')
  const [audioBlob, setAudioBlob] = useState(null)
  const [transcribeStatus, setTranscribeStatus] = useState('idle')
  const [profileStatus, setProfileStatus] = useState('idle')
  const [transcriptResult, setTranscriptResult] = useState(null)
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState('')

  const selectedLanguageLabel = useMemo(
    () => LANGUAGES.find((language) => language.code === selectedLanguage)?.label,
    [selectedLanguage],
  )

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }

  const startRecording = async () => {
    setError('')
    setTranscriptResult(null)
    setProfile(null)
    setAudioBlob(null)
    chunksRef.current = []

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Audio recording is not available in this browser.')
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        if (blob.size === 0) {
          setError('No audio was captured. Please record again.')
          setAudioBlob(null)
        } else {
          setAudioBlob(blob)
        }
        setRecordingState('recorded')
        stopStream()
      }

      recorder.onerror = () => {
        setError('Recording failed. Please retry.')
        setRecordingState('idle')
        stopStream()
      }

      recorder.start()
      setRecordingState('recording')
    } catch (recordingError) {
      setRecordingState('idle')
      setError(getApiError(recordingError, 'Could not start recording. Please check microphone access.'))
      stopStream()
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
  }

  const transcribeAudio = async () => {
    if (!audioBlob || audioBlob.size === 0) {
      setError('Record audio before sending it for transcription.')
      return
    }

    setError('')
    setTranscribeStatus('loading')
    setProfile(null)

    const formData = new FormData()
    formData.append('audio', audioBlob, 'recording.webm')
    formData.append('language', selectedLanguage)

    try {
      const response = await requestWithTimeout(`${API_BASE_URL}/api/v1/transcribe`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Transcription failed. Please retry.'))
      }

      const result = await response.json()
      setTranscriptResult(result)
      setTranscribeStatus('success')
      await extractProfile(result.transcript)
    } catch (transcribeError) {
      setTranscribeStatus('error')
      setError(getApiError(transcribeError, 'Transcription failed. Please retry.'))
    }
  }

  const extractProfile = async (transcript) => {
    if (!transcript?.trim()) {
      setProfileStatus('idle')
      setError('The transcript was empty, so a profile could not be extracted.')
      return
    }

    setProfileStatus('loading')

    try {
      const response = await requestWithTimeout(`${API_BASE_URL}/api/v1/extract-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, language: selectedLanguage }),
      })

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Profile extraction failed. Please retry.'))
      }

      const result = await response.json()
      setProfile(result)
      setProfileStatus('success')
    } catch (profileError) {
      setProfileStatus('error')
      setError(getApiError(profileError, 'Profile extraction failed. Please retry.'))
    }
  }

  const retry = () => {
    if (audioBlob) {
      transcribeAudio()
    } else {
      startRecording()
    }
  }

  const skills = profile?.skills || profile?.profile?.skills || []

  return (
    <main className="app-shell">
      <section className="workspace" aria-label="VoicePath recording workspace">
        <div className="intro">
          <p className="eyebrow">VoicePath</p>
          <h1>Speak your experience into a skill profile</h1>
          <p className="lede">
            Record audio in your selected language. VoicePath sends the recording to the backend
            and shows the returned transcript, skills, evidence, and confidence.
          </p>
        </div>

        <div className="control-panel">
          <label className="field">
            <span>Language</span>
            <select
              value={selectedLanguage}
              onChange={(event) => setSelectedLanguage(event.target.value)}
              disabled={recordingState === 'recording' || transcribeStatus === 'loading'}
            >
              {LANGUAGES.map((language) => (
                <option key={language.code} value={language.code}>
                  {language.label}
                </option>
              ))}
            </select>
          </label>

          <div className="recorder">
            <div className={`recording-light ${recordingState}`} aria-hidden="true" />
            <div>
              <strong>{recordingState === 'recording' ? 'Recording' : 'Ready'}</strong>
              <span>
                {selectedLanguageLabel} sends as <code>{selectedLanguage}</code>
              </span>
            </div>
          </div>

          <div className="actions">
            {recordingState === 'recording' ? (
              <button type="button" className="primary" onClick={stopRecording}>
                Stop recording
              </button>
            ) : (
              <button type="button" className="primary" onClick={startRecording}>
                Record voice
              </button>
            )}
            <button
              type="button"
              onClick={transcribeAudio}
              disabled={!audioBlob || transcribeStatus === 'loading'}
            >
              {transcribeStatus === 'loading' ? 'Sending audio' : 'Transcribe'}
            </button>
          </div>

          {error && (
            <div className="error" role="alert">
              <span>{error}</span>
              <button type="button" onClick={retry}>
                Retry
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="results-grid" aria-label="VoicePath backend results">
        <article className="panel transcript-panel">
          <div className="panel-heading">
            <p className="eyebrow">TranscriptReview</p>
            <span>{transcribeStatus}</span>
          </div>
          <p className="transcript">
            {transcriptResult?.transcript || 'Your transcript will appear here after recording.'}
          </p>
          {transcriptResult && (
            <dl className="meta-grid">
              <div>
                <dt>Language</dt>
                <dd>{transcriptResult.language || selectedLanguage}</dd>
              </div>
              <div>
                <dt>Confidence</dt>
                <dd>{transcriptResult.confidence ?? 'Not returned'}</dd>
              </div>
            </dl>
          )}
        </article>

        <article className="panel profile-panel">
          <div className="panel-heading">
            <p className="eyebrow">SkillProfile</p>
            <span>{profileStatus}</span>
          </div>

          {profile ? (
            <>
              <dl className="meta-grid">
                <div>
                  <dt>Domain</dt>
                  <dd>{profile.domain || profile.profile?.domain || 'Not returned'}</dd>
                </div>
                <div>
                  <dt>Experience</dt>
                  <dd>{profile.experience_years ?? profile.profile?.experience_years ?? 'Not returned'}</dd>
                </div>
              </dl>

              <div className="skill-list">
                {skills.length > 0 ? (
                  skills.map((skill, index) => (
                    <div className="skill-row" key={`${skill.canonical_name || skill.raw_phrase}-${index}`}>
                      <div>
                        <strong>{skill.canonical_name || skill.raw_phrase || 'Unnamed skill'}</strong>
                        <p>{skill.evidence || 'No evidence returned.'}</p>
                      </div>
                      <div className="skill-metrics">
                        <span>{skill.inference_type || 'unknown'}</span>
                        <span>{skill.confidence ?? 'n/a'}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="empty">Extracted skills will appear here with evidence and confidence.</p>
                )}
              </div>
            </>
          ) : (
            <p className="empty">Profile extraction starts automatically after transcription succeeds.</p>
          )}
        </article>
      </section>
    </main>
  )
}

export default App
