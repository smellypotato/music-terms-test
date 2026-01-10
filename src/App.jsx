import { useState } from 'react'
import './App.css'
import QuizSetup from './components/QuizSetup'
import QuizAllQuestions from './components/QuizAllQuestions'
import PrintableQuiz from './components/PrintableQuiz'
import Results from './components/Results'
import questionGenerator from './services/QuestionGenerator'

function App() {
  const [quizState, setQuizState] = useState('setup') // 'setup', 'quiz', 'printable', 'results'
  const [quizConfig, setQuizConfig] = useState(null)
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState([])
  const [showAnswers, setShowAnswers] = useState(false)

  const handleStartQuiz = (config) => {
    setQuizConfig(config)
    const generatedQuestions = questionGenerator.generateQuestions(config)
    setQuestions(generatedQuestions)
    setAnswers(new Array(generatedQuestions.length).fill(null))
    setQuizState('quiz')
  }

  const handleAnswerChange = (questionIndex, answer) => {
    const newAnswers = [...answers]
    newAnswers[questionIndex] = answer
    setAnswers(newAnswers)
  }

  const handleSubmitQuiz = () => {
    setQuizState('results')
  }

  const handleViewPrintable = () => {
    setQuizState('printable')
    setShowAnswers(false)
  }

  const handleViewAnswerKey = () => {
    setQuizState('printable')
    setShowAnswers(true)
  }

  const handleReset = () => {
    setQuizState('setup')
    setQuizConfig(null)
    setQuestions([])
    setAnswers([])
    setShowAnswers(false)
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Music Terms Quiz</h1>
      </header>
      
      {quizState === 'setup' && (
        <QuizSetup onStartQuiz={handleStartQuiz} />
      )}
      
      {quizState === 'quiz' && (
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
            selectedTags={quizConfig?.selectedTags || []}
            onBack={handleReset}
          />
        </>
      )}
      
      {quizState === 'printable' && (
        <>
          <div className="printable-actions-bar">
            <button onClick={() => setQuizState('quiz')} className="action-button">
              ← Back to Quiz
            </button>
            {!showAnswers && (
              <button onClick={handleViewAnswerKey} className="action-button">
                🔑 View Answer Key
              </button>
            )}
            {showAnswers && (
              <button onClick={() => setShowAnswers(false)} className="action-button">
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
      )}
      
      {quizState === 'results' && (
        <Results
          questions={questions}
          answers={answers}
          onReset={handleReset}
        />
      )}
    </div>
  )
}

export default App
