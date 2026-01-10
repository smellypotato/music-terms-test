import { useState } from 'react'
import './Quiz.css'

function Quiz({ questions, answers, onAnswerChange, onSubmit }) {
  const [currentQuestion, setCurrentQuestion] = useState(0)

  const handleAnswer = (answer) => {
    onAnswerChange(currentQuestion, answer)
  }

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const handleSubmit = () => {
    if (window.confirm('Are you sure you want to submit the quiz? You can still review your answers.')) {
      onSubmit()
    }
  }

  const question = questions[currentQuestion]
  const currentAnswer = answers[currentQuestion]

  if (!question) {
    return <div>No questions available.</div>
  }

  const renderQuestion = () => {
    switch (question.type) {
      case 'multiple_choice':
        return (
          <div className="question-multiple-choice">
            <h3>{question.question}</h3>
            <div className="options">
              {question.options.map((option, index) => (
                <label key={index} className="option-label">
                  <input
                    type="radio"
                    name={`question-${currentQuestion}`}
                    value={option}
                    checked={currentAnswer === option}
                    onChange={() => handleAnswer(option)}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </div>
        )

      case 'short_answer':
        return (
          <div className="question-short-answer">
            <h3>{question.question}</h3>
            <input
              type="text"
              value={currentAnswer || ''}
              onChange={(e) => handleAnswer(e.target.value)}
              className="short-answer-input"
              placeholder="Enter your answer..."
            />
          </div>
        )

      case 'ordering':
        const termIds = question.termIds || []
        const displayMap = question.displayMap || {}
        const currentOrder = currentAnswer ? currentAnswer.split(',').map(id => id.trim()).filter(id => id) : []
        
        const handleOrderChange = (termId, action) => {
          let newOrder = [...currentOrder]
          const currentIndex = currentOrder.indexOf(termId)
          const isInOrder = currentIndex !== -1
          
          // Remove the term from current position if it exists
          if (isInOrder) {
            newOrder = newOrder.filter(id => id !== termId)
          }
          
          switch (action) {
            case 'top':
              newOrder.unshift(termId)
              break
            case 'up':
              if (isInOrder && currentIndex > 0) {
                // Move up one position
                newOrder.splice(currentIndex - 1, 0, termId)
              } else if (!isInOrder) {
                // Add to top if not in order
                newOrder.unshift(termId)
              } else {
                // Already at top, add to top anyway
                newOrder.unshift(termId)
              }
              break
            case 'down':
              if (isInOrder && currentIndex < currentOrder.length - 1) {
                // Move down one position
                newOrder.splice(currentIndex + 1, 0, termId)
              } else if (!isInOrder) {
                // Add to end if not in order
                newOrder.push(termId)
              } else {
                // Already at bottom, add to end anyway
                newOrder.push(termId)
              }
              break
            case 'bottom':
              newOrder.push(termId)
              break
            case 'remove':
              // Already removed above, do nothing
              break
            default:
              // If not in order, add to end
              if (!isInOrder) {
                newOrder.push(termId)
              }
          }
          
          handleAnswer(newOrder.join(','))
        }
        
        return (
          <div className="question-ordering">
            <h3>{question.question}</h3>
            <div className="ordering-instructions">
              <p>Use the buttons to reorder the terms:</p>
            </div>
            <div className="ordering-list">
              {termIds.map((termId, index) => {
                const position = currentOrder.indexOf(termId)
                const displayIndex = position !== -1 ? position + 1 : null
                const displayName = displayMap[termId] || termId
                
                return (
                  <div key={termId} className="ordering-item">
                    <span className="order-number">
                      {displayIndex ? `${displayIndex}.` : '—'}
                    </span>
                    <span className="order-term">{displayName}</span>
                    <div className="order-buttons">
                      <button
                        type="button"
                        onClick={() => handleOrderChange(termId, 'top')}
                        className="order-btn"
                      >
                        ↑ Top
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOrderChange(termId, 'up')}
                        className="order-btn"
                        disabled={position === 0}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOrderChange(termId, 'down')}
                        className="order-btn"
                        disabled={position === currentOrder.length - 1}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOrderChange(termId, 'bottom')}
                        className="order-btn"
                      >
                        ↓ Bottom
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOrderChange(termId, 'remove')}
                        className="order-btn remove"
                        disabled={position === -1}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
            {currentOrder.length > 0 && (
              <div className="current-order-preview">
                <strong>Current order:</strong>{' '}
                {currentOrder.map((id, idx) => (
                  <span key={id} className="order-preview-item">
                    {idx + 1}. {displayMap[id] || id}
                    {idx < currentOrder.length - 1 && ', '}
                  </span>
                ))}
              </div>
            )}
          </div>
        )

      default:
        return <div>Unknown question type</div>
    }
  }

  const answeredCount = answers.filter(a => a !== null && a !== '').length

  return (
    <div className="quiz">
      <div className="quiz-header">
        <div className="progress">
          Question {currentQuestion + 1} of {questions.length}
        </div>
        <div className="answered-count">
          Answered: {answeredCount} / {questions.length}
        </div>
      </div>

      <div className="question-container">
        {renderQuestion()}
      </div>

      <div className="quiz-navigation">
        <button
          type="button"
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
          className="nav-button"
        >
          Previous
        </button>
        
        <div className="question-indicators">
          {questions.map((q, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setCurrentQuestion(index)}
              className={`indicator ${index === currentQuestion ? 'active' : ''} ${
                answers[index] ? 'answered' : ''
              }`}
              title={`Question ${index + 1}`}
            >
              {index + 1}
            </button>
          ))}
        </div>

        {currentQuestion < questions.length - 1 ? (
          <button
            type="button"
            onClick={handleNext}
            className="nav-button"
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            className="submit-button"
          >
            Submit Quiz
          </button>
        )}
      </div>
    </div>
  )
}

export default Quiz

