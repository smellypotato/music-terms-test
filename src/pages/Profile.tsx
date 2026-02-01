import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import './Profile.css'

type ProfileData = {
  user_id: string
  first_name: string | null
  last_name: string | null
  alias: string | null
  is_teacher: boolean
  teacher_id: string | null
}

type TeacherData = {
  alias: string | null
  first_name: string | null
  last_name: string | null
}

type ProfileResponse = {
  profile: ProfileData | null
  teacher: TeacherData | null
}

const buildDisplayName = (data: { alias?: string | null; first_name?: string | null; last_name?: string | null }) => {
  if (data.alias) return data.alias
  const fullName = [data.first_name, data.last_name].filter(Boolean).join(' ')
  return fullName || 'Unknown'
}

export default function Profile() {
  const { user, session, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [teacher, setTeacher] = useState<TeacherData | null>(null)
  const [linkCode, setLinkCode] = useState('')
  const [linkLoading, setLinkLoading] = useState(false)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [inviteExpires, setInviteExpires] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const accessToken = session?.access_token

  const getAccessToken = async () => {
    if (accessToken) return accessToken
    const { data, error: sessionError } = await supabase.auth.getSession()
    console.log({ data, sessionError })
    if (sessionError || !data.session?.access_token) {
      return null
    }
    return data.session.access_token
  }

  const loadProfile = async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    const token = await getAccessToken()
    if (!token) {
      setError('Missing access token. Please log in again.')
      setLoading(false)
      return
    }
    const { data, error: invokeError } = await supabase.functions.invoke<ProfileResponse>(
      'get-user-profile',
      token
        ? {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        : undefined
    )
    if (invokeError) {
      setError(invokeError.message)
      setLoading(false)
      return
    }
    setProfile(data?.profile ?? null)
    setTeacher(data?.teacher ?? null)
    setLoading(false)
  }

  useEffect(() => {
    if (!authLoading && user) {
      loadProfile()
    }
  }, [authLoading, user])

  const handleLinkTeacher = async () => {
    if (!linkCode.trim()) {
      setStatusMessage('Enter a code to link a teacher.')
      return
    }
    setLinkLoading(true)
    setStatusMessage(null)
    const token = await getAccessToken()
    if (!token) {
      setStatusMessage('Missing access token. Please log in again.')
      setLinkLoading(false)
      return
    }
    const { error: invokeError } = await supabase.functions.invoke('redeem-teacher-invite', {
      body: { code: linkCode.trim() },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    setLinkLoading(false)
    if (invokeError) {
      setStatusMessage(invokeError.message)
      return
    }
    setLinkCode('')
    setStatusMessage('Teacher linked successfully.')
    await loadProfile()
  }

  const handleUnlinkTeacher = async () => {
    setLinkLoading(true)
    setStatusMessage(null)
    const token = await getAccessToken()
    if (!token) {
      setStatusMessage('Missing access token. Please log in again.')
      setLinkLoading(false)
      return
    }
    const { error: invokeError } = await supabase.functions.invoke('redeem-teacher-invite', {
      body: { action: 'unlink' },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    setLinkLoading(false)
    if (invokeError) {
      setStatusMessage(invokeError.message)
      return
    }
    setStatusMessage('Teacher unlinked.')
    await loadProfile()
  }

  const handleGenerateCode = async () => {
    setInviteLoading(true)
    setStatusMessage(null)
    const token = await getAccessToken()
    if (!token) {
      setStatusMessage('Missing access token. Please log in again.')
      setInviteLoading(false)
      return
    }
    const { data, error: invokeError } = await supabase.functions.invoke<{
      code: string
      expires_at: string
    }>('create-teacher-invite', {
      body: { expires_in_minutes: 30, max_uses: 1 },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    setInviteLoading(false)
    if (invokeError) {
      setStatusMessage(invokeError.message)
      return
    }
    setInviteCode(data?.code ?? null)
    setInviteExpires(data?.expires_at ?? null)
    setStatusMessage('Invite code generated.')
  }

  if (authLoading) {
    return <div className="profile-page">Loading…</div>
  }

  if (!user) {
    return (
      <div className="profile-page">
        <div className="profile-card">
          <h1>Profile</h1>
          <p>
            Please <Link to="/login">log in</Link> to view your profile.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="profile-page">
      <div className="profile-card">
        <h1>Profile</h1>
        {loading ? (
          <p>Loading profile…</p>
        ) : error ? (
          <p className="profile-error">{error}</p>
        ) : profile ? (
          <>
            <div className="profile-row">
              <span className="profile-label">First name</span>
              <span className="profile-value">{profile.first_name ?? '—'}</span>
            </div>
            <div className="profile-row">
              <span className="profile-label">Last name</span>
              <span className="profile-value">{profile.last_name ?? '—'}</span>
            </div>
            <div className="profile-row">
              <span className="profile-label">Display name</span>
              <span className="profile-value">{buildDisplayName(profile)}</span>
            </div>

            <div className="profile-section">
              <h2>Teacher</h2>
              {profile.teacher_id && teacher ? (
                <div className="profile-row profile-row-inline">
                  <span className="profile-value">
                    Linked to {buildDisplayName(teacher)}
                  </span>
                  <button
                    type="button"
                    className="profile-button secondary"
                    onClick={handleUnlinkTeacher}
                    disabled={linkLoading}
                  >
                    {linkLoading ? 'Unlinking…' : 'Unlink'}
                  </button>
                </div>
              ) : (
                <div className="profile-row profile-row-inline">
                  <input
                    className="profile-input"
                    type="text"
                    placeholder="Enter teacher code"
                    value={linkCode}
                    onChange={e => setLinkCode(e.target.value)}
                    disabled={linkLoading}
                  />
                  <button
                    type="button"
                    className="profile-button"
                    onClick={handleLinkTeacher}
                    disabled={linkLoading}
                  >
                    {linkLoading ? 'Linking…' : 'Link'}
                  </button>
                </div>
              )}
            </div>

            {profile.is_teacher && (
              <div className="profile-section">
                <h2>Invite students</h2>
                <button
                  type="button"
                  className="profile-button"
                  onClick={handleGenerateCode}
                  disabled={inviteLoading}
                >
                  {inviteLoading ? 'Generating…' : 'Generate invite code'}
                </button>
                {inviteCode && (
                  <div className="profile-invite">
                    <div className="profile-invite-code">{inviteCode}</div>
                    {inviteExpires && (
                      <div className="profile-invite-meta">
                        Expires at {new Date(inviteExpires).toLocaleString()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {statusMessage && <p className="profile-status">{statusMessage}</p>}
          </>
        ) : (
          <p>No profile found yet.</p>
        )}
      </div>
    </div>
  )
}
