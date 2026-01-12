import { useState, useEffect } from 'react'
import './QuizAllQuestions.css'
import Cheatsheet from './Cheatsheet'
import OrderingQuestion from './OrderingQuestion'
import MultipleChoiceQuestion from './MultipleChoiceQuestion'
import ShortAnswerQuestion from './ShortAnswerQuestion'
import musicTerms from '../data/musicTerms.json'
import { getCanonicalTerm, hasAlias } from '../utils/termUtils'

function QuizAllQuestions({ questions, answers, onAnswerChange, onSubmit, selectedTags = [], onBack }) {
  const [showCheatsheet, setShowCheatsheet] = useState(false)
  
  // Check for debug mode from query parameter
  const isDebugMode = new URLSearchParams(window.location.search).get('debug') === 'true'
  
  // Helper function to get grade from a term (by canonical term or alias)
  const getTermGrade = (termIdentifier) => {
    if (!termIdentifier) return null
    const term = musicTerms.find(t => {
      const canonical = getCanonicalTerm(t)
      if (canonical === termIdentifier) return true
      if (hasAlias(t, termIdentifier)) return true
      return false
    })
    return term?.grade ?? null
  }
  
  // Helper function to get grade from an option (could be term alias or definition)
  const getOptionGrade = (option, question) => {
    // For term-based options, try to find the term by alias
    const term = musicTerms.find(t => {
      const aliases = Array.isArray(t.term) ? t.term : [t.term]
      return aliases.includes(option)
    })
    return term?.grade ?? null
  }
  
  const handleAnswer = (questionIndex, answer) => {
    onAnswerChange(questionIndex, answer)
  }

  // Parse answer string to order array for ordering questions
  const getOrderFromAnswer = (answer, termIds) => {
    if (answer && answer.trim()) {
      const parsed = answer.split(',').map(id => id.trim()).filter(id => id)
      if (parsed.length === termIds.length) {
        return parsed
      }
    }
    // Return termIds as fallback (initial order from generation)
    return [...termIds]
  }

  // Handle order change for ordering questions
  const handleOrderChange = (questionIndex, newOrder) => {
    handleAnswer(questionIndex, newOrder.join(','))
  }
  
  // Initialize answers for ordering questions that don't have an answer yet
  useEffect(() => {
    if (questions.length === 0) return
    
    const answerUpdates = []
    let needsUpdate = false
    
    questions.forEach((question, index) => {
      if (question.type === 'ordering') {
        const termIds = question.termIds || []
        const currentAnswer = answers[index]
        
        // Initialize answer if it doesn't exist or is empty
        if (!currentAnswer || !currentAnswer.trim()) {
          if (termIds.length > 0) {
            const initialAnswer = termIds.join(',')
            answerUpdates.push({ index, answer: initialAnswer })
            needsUpdate = true
          }
        }
      }
    })
    
    // Batch all updates: apply all at once to avoid closure issues
    if (needsUpdate && answerUpdates.length > 0) {
      // Apply all updates - React will batch these since they're in the same effect
      answerUpdates.forEach(({ index, answer }) => {
        onAnswerChange(index, answer)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions]) // Run when questions change

  const renderQuestion = (question, index) => {
    const currentAnswer = answers[index]

    switch (question.type) {
      case 'multiple_choice':
        const questionGrade = question.correctTerm ? getTermGrade(question.correctTerm) : null
        return (
          <div key={index} className="all-questions-item">
            <div className="question-number">{index + 1}.</div>
            <div className="question-content">
              <MultipleChoiceQuestion
                question={question}
                answer={currentAnswer}
                onAnswerChange={handleAnswer}
                questionIndex={index}
                isDebugMode={isDebugMode}
                getOptionGrade={getOptionGrade}
                questionGrade={questionGrade}
              />
            </div>
          </div>
        )

      case 'short_answer':
        const shortAnswerGrade = question.correctTerm ? getTermGrade(question.correctTerm) : null
        return (
          <div key={index} className="all-questions-item">
            <div className="question-number">{index + 1}.</div>
            <div className="question-content">
              <ShortAnswerQuestion
                question={question}
                answer={currentAnswer}
                onAnswerChange={handleAnswer}
                questionIndex={index}
                isDebugMode={isDebugMode}
                questionGrade={shortAnswerGrade}
              />
            </div>
          </div>
        )

      case 'ordering':
        const termIds = question.termIds || []
        const order = getOrderFromAnswer(currentAnswer, termIds)
        return (
          <div key={index} className="all-questions-item">
            <div className="question-number">{index + 1}.</div>
            <div className="question-content">
              <OrderingQuestion
                question={question}
                order={order}
                onOrderChange={(newOrder) => handleOrderChange(index, newOrder)}
                questionIndex={index}
                isDebugMode={isDebugMode}
                getTermGrade={getTermGrade}
              />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const answeredCount = answers.filter(a => a !== null && a !== '').length

  return (
    <div className="quiz-all-questions">
      <div className="quiz-all-header">
        <div className="progress">
          Total Questions: {questions.length} | Answered: {answeredCount} / {questions.length}
        </div>
      </div>

      <div className="all-questions-container">
        {questions.map((question, index) => renderQuestion(question, index))}
      </div>

      <div className="quiz-all-footer">
        <button
          type="button"
          onClick={onSubmit}
          className="submit-button"
        >
          Submit Quiz
        </button>
      </div>

      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="back-button"
          title="Back to Setup"
        >
          ← Back
        </button>
      )}

      <button
        type="button"
        onClick={() => setShowCheatsheet(true)}
        className="cheatsheet-button"
        title="Open Cheatsheet"
      >
        📚 Cheatsheet
      </button>

      <Cheatsheet
        isOpen={showCheatsheet}
        onClose={() => setShowCheatsheet(false)}
        selectedTags={selectedTags}
      />
    </div>
  )
}

export default QuizAllQuestions

