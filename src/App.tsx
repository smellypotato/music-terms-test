import { Routes, Route } from 'react-router-dom'
import './App.css'
import QuizSetup from './components/QuizSetup'
import QuizPage from './components/QuizPage'
import AuthBar from './components/AuthBar'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Profile from './pages/Profile'

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-header-title">Music Terms Quiz</h1>
        <div className="app-header-auth">
          <AuthBar />
        </div>
      </header>

      <Routes>
        <Route path="/" element={<QuizSetup />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </div>
  )
}
