import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import QuizAllQuestions from './QuizAllQuestions'
import PrintableQuiz from './PrintableQuiz'
import Results from './Results'
import type { QuizConfig, Question } from '../types'

interface QuizLocationState {
  quizConfig: QuizConfig
  questions: Question[]
}

type ViewMode = 'questions' | 'printable' | 'results'

export default function QuizPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as QuizLocationState | null
  const { quizConfig, questions: initialQuestions } = state ?? {}

  const [questions, setQuestions] = useState<Question[]>(initialQuestions ?? [])
  const [answers, setAnswers] = useState<(string | null)[]>(() =>
    initialQuestions?.length
      ? new Array(initialQuestions.length).fill(null)
      : []
  )
  const [viewMode, setViewMode] = useState<ViewMode>('questions')
  const [showAnswers, setShowAnswers] = useState(false)

  useEffect(() => {
    if (!quizConfig || !initialQuestions?.length) {
      navigate('/', { replace: true })
    }
  }, [quizConfig, initialQuestions, navigate])

  useEffect(() => {
    if (quizConfig && initialQuestions?.length) {
      setQuestions(initialQuestions)
      setAnswers(new Array(initialQuestions.length).fill(null))
      setViewMode('questions')
      setShowAnswers(false)
    }
  }, [quizConfig, initialQuestions])

  const handleAnswerChange = (questionIndex: number, answer: string) => {
    setAnswers(prev => {
      const next = [...prev]
      next[questionIndex] = answer
      return next
    })
  }

  const handleSubmitQuiz = () => {
    setViewMode('results')
  }

  const handleViewPrintable = () => {
    setViewMode('printable')
    setShowAnswers(false)
  }

  const handleViewAnswerKey = () => {
    setViewMode('printable')
    setShowAnswers(true)
  }

  const handleBackToSetup = () => {
    navigate('/')
  }

  if (!quizConfig || !questions.length) {
    return null
  }

  if (viewMode === 'questions') {
    return (
      <>
        <div className="quiz-actions-bar">
          <button onClick={handleViewPrintable} className="action-button">
            📄 View Printable Version
          </button>
          <button onClick={handleViewAnswerKey} className="action-button">
            🔑 View Answer Key
          </button>
        </div>
        <QuizAllQuestions
          questions={questions}
          answers={answers}
          onAnswerChange={handleAnswerChange}
          onSubmit={handleSubmitQuiz}
          selectedTags={quizConfig.selectedTags ?? []}
          onBack={handleBackToSetup}
        />
      </>
    )
  }

  if (viewMode === 'printable') {
    return (
      <>
        <div className="printable-actions-bar">
          <button
            onClick={() => setViewMode('questions')}
            className="action-button"
          >
            ← Back to Quiz
          </button>
          {!showAnswers && (
            <button onClick={handleViewAnswerKey} className="action-button">
              🔑 View Answer Key
            </button>
          )}
          {showAnswers && (
            <button
              onClick={() => setShowAnswers(false)}
              className="action-button"
            >
              📝 View Questions Only
            </button>
          )}
        </div>
        <PrintableQuiz
          questions={questions}
          answers={answers}
          onAnswerChange={handleAnswerChange}
          showAnswers={showAnswers}
        />
      </>
    )
  }

  return (
    <Results
      questions={questions}
      answers={answers}
      onReset={handleBackToSetup}
    />
  )
}
