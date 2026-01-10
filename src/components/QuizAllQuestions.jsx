import { useState } from 'react'
import './QuizAllQuestions.css'

function QuizAllQuestions({ questions, answers, onAnswerChange, onSubmit }) {
  const handleAnswer = (questionIndex, answer) => {
    onAnswerChange(questionIndex, answer)
  }

  const renderQuestion = (question, index) => {
    const currentAnswer = answers[index]

    switch (question.type) {
      case 'multiple_choice':
        return (
          <div key={index} className="all-questions-item">
            <div className="question-number">{index + 1}.</div>
            <div className="question-content">
              <div className="question-text">{question.question}</div>
              <div className="all-options">
                {question.options.map((option, optIndex) => (
                  <label key={optIndex} className="all-option-label">
                    <input
                      type="radio"
                      name={`question-${index}`}
                      value={option}
                      checked={currentAnswer === option}
                      onChange={() => handleAnswer(index, option)}
                    />
                    <span className="option-letter">{String.fromCharCode(65 + optIndex)}.</span>
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )

      case 'short_answer':
        return (
          <div key={index} className="all-questions-item">
            <div className="question-number">{index + 1}.</div>
            <div className="question-content">
              <div className="question-text">{question.question}</div>
              <input
                type="text"
                value={currentAnswer || ''}
                onChange={(e) => handleAnswer(index, e.target.value)}
                className="all-short-answer-input"
                placeholder="Enter your answer..."
              />
            </div>
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
          
          if (isInOrder) {
            newOrder = newOrder.filter(id => id !== termId)
          }
          
          switch (action) {
            case 'top':
              newOrder.unshift(termId)
              break
            case 'up':
              if (isInOrder && currentIndex > 0) {
                newOrder.splice(currentIndex - 1, 0, termId)
              } else if (!isInOrder) {
                newOrder.unshift(termId)
              } else {
                newOrder.unshift(termId)
              }
              break
            case 'down':
              if (isInOrder && currentIndex < currentOrder.length - 1) {
                newOrder.splice(currentIndex + 1, 0, termId)
              } else if (!isInOrder) {
                newOrder.push(termId)
              } else {
                newOrder.push(termId)
              }
              break
            case 'bottom':
              newOrder.push(termId)
              break
            case 'remove':
              break
            default:
              if (!isInOrder) {
                newOrder.push(termId)
              }
          }
          
          handleAnswer(index, newOrder.join(','))
        }
        
        return (
          <div key={index} className="all-questions-item">
            <div className="question-number">{index + 1}.</div>
            <div className="question-content">
              <div className="question-text">{question.question}</div>
              <div className="all-ordering-list">
                {termIds.map((termId) => {
                  const position = currentOrder.indexOf(termId)
                  const displayIndex = position !== -1 ? position + 1 : null
                  const displayName = displayMap[termId] || termId
                  
                  return (
                    <div key={termId} className="all-ordering-item">
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
    </div>
  )
}

export default QuizAllQuestions

