import { Routes, Route } from 'react-router-dom'
import './App.css'
import QuizSetup from './components/QuizSetup'
import QuizPage from './components/QuizPage'

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Music Terms Quiz</h1>
      </header>

      <Routes>
        <Route path="/" element={<QuizSetup />} />
        <Route path="/quiz" element={<QuizPage />} />
      </Routes>
    </div>
  )
}
