import { useState, useEffect } from 'react'
import './QuizAllQuestions.css'
import Cheatsheet from './Cheatsheet'

function QuizAllQuestions({ questions, answers, onAnswerChange, onSubmit, selectedTags = [], onBack }) {
  const [showCheatsheet, setShowCheatsheet] = useState(false)
  const [orderingStates, setOrderingStates] = useState({})
  
  const handleAnswer = (questionIndex, answer) => {
    onAnswerChange(questionIndex, answer)
  }
  
  const getOrderingState = (questionIndex, termIds, currentAnswer) => {
    if (orderingStates[questionIndex]) {
      return orderingStates[questionIndex]
    }
    // Initialize with current answer or random order
    if (currentAnswer && currentAnswer.trim()) {
      const order = currentAnswer.split(',').map(id => id.trim()).filter(id => id)
      if (order.length === termIds.length) {
        return order
      }
    }
    // Return shuffled termIds
    return [...termIds].sort(() => Math.random() - 0.5)
  }
  
  const updateOrderingState = (questionIndex, newOrder) => {
    setOrderingStates(prev => ({
      ...prev,
      [questionIndex]: newOrder
    }))
  }
  
  // Initialize ordering states for all ordering questions
  useEffect(() => {
    setOrderingStates(prev => {
      const newStates = { ...prev }
      let hasChanges = false
      
      questions.forEach((question, index) => {
        if (question.type === 'ordering' && !newStates[index]) {
          const termIds = question.termIds || []
          const currentAnswer = answers[index]
          
          // Initialize with current answer or random order
          let order
          if (currentAnswer && currentAnswer.trim()) {
            order = currentAnswer.split(',').map(id => id.trim()).filter(id => id)
            if (order.length !== termIds.length) {
              order = [...termIds].sort(() => Math.random() - 0.5)
            }
          } else {
            order = [...termIds].sort(() => Math.random() - 0.5)
          }
          
          newStates[index] = order
          hasChanges = true
        }
      })
      
      return hasChanges ? newStates : prev
    })
  }, [questions, answers])

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
        const order = getOrderingState(index, termIds, currentAnswer)
        
        // Determine ordering type from question text
        const isTempo = question.question.toLowerCase().includes('tempo') || 
                       question.question.toLowerCase().includes('slowest') || 
                       question.question.toLowerCase().includes('fastest')
        const isDynamics = question.question.toLowerCase().includes('dynamics') || 
                          question.question.toLowerCase().includes('softest') || 
                          question.question.toLowerCase().includes('loudest')
        
        const leftLabel = isTempo ? 'Slowest' : isDynamics ? 'Softest' : 'Lowest'
        const rightLabel = isTempo ? 'Fastest' : isDynamics ? 'Loudest' : 'Highest'
        
        const handleSwap = (containerIndex, direction) => {
          const newOrder = [...order]
          if (direction === 'left' && containerIndex > 0) {
            // Swap with left container
            [newOrder[containerIndex], newOrder[containerIndex - 1]] = 
            [newOrder[containerIndex - 1], newOrder[containerIndex]]
          } else if (direction === 'right' && containerIndex < newOrder.length - 1) {
            // Swap with right container
            [newOrder[containerIndex], newOrder[containerIndex + 1]] = 
            [newOrder[containerIndex + 1], newOrder[containerIndex]]
          }
          updateOrderingState(index, newOrder)
          handleAnswer(index, newOrder.join(','))
        }
        
        return (
          <div key={index} className="all-questions-item">
            <div className="question-number">{index + 1}.</div>
            <div className="question-content">
              <div className="question-text">{question.question}</div>
              <div className="ordering-containers-wrapper">
                <div className="ordering-label-left">{leftLabel}</div>
                <div className="ordering-containers">
                  {order.map((termId, containerIndex) => {
                    const displayName = displayMap[termId] || termId
                    const isLeftmost = containerIndex === 0
                    const isRightmost = containerIndex === order.length - 1
                    
                    return (
                      <div key={termId} className="ordering-container">
                        {!isLeftmost && (
                          <button
                            type="button"
                            onClick={() => handleSwap(containerIndex, 'left')}
                            className="swap-button"
                            title="Move left"
                          >
                            ←
                          </button>
                        )}
                        <div className="ordering-term-display">
                          {displayName}
                        </div>
                        {!isRightmost && (
                          <button
                            type="button"
                            onClick={() => handleSwap(containerIndex, 'right')}
                            className="swap-button"
                            title="Move right"
                          >
                            →
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
                <div className="ordering-label-right">{rightLabel}</div>
              </div>
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

