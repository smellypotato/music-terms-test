import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './AuthBar.css'

export default function AuthBar() {
  const { user, loading, signOut } = useAuth()

  if (loading) {
    return (
      <div className="auth-bar">
        <span className="auth-bar-loading">Loading…</span>
      </div>
    )
  }

  if (user) {
    const displayName =
      (user.user_metadata?.full_name as string | undefined) ??
      (user.user_metadata?.name as string | undefined) ??
      user.email ??
      'User'
    return (
      <div className="auth-bar">
        <span className="auth-bar-welcome">Welcome, {displayName}</span>
        <Link to="/profile" className="auth-bar-btn auth-bar-btn-profile">
          Profile
        </Link>
        <button
          type="button"
          className="auth-bar-btn auth-bar-btn-logout"
          onClick={() => signOut()}
        >
          Log out
        </button>
      </div>
    )
  }

  return (
    <div className="auth-bar">
      <Link to="/login" className="auth-bar-btn auth-bar-btn-login">
        Log in
      </Link>
      <Link to="/signup" className="auth-bar-btn auth-bar-btn-signup">
        Sign up
      </Link>
    </div>
  )
}
