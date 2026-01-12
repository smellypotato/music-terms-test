import { useRef } from 'react'
import html2pdf from 'html2pdf.js'
import './PrintableQuiz.css'
import musicTerms from '../data/musicTerms.json'
import orderingData from '../data/orderingData.json'
import { getCanonicalTerm } from '../utils/termUtils'

function PrintableQuiz({ questions, answers, onAnswerChange, showAnswers = false }) {
  // Helper function to find a term by ID
  const findTermById = (id) => {
    return musicTerms.find(term => term.id === id)
  }

  // Helper function to compute correct order for ordering questions
  const getCorrectOrder = (question) => {
    if (question.type !== 'ordering' || !question.termIds) return []
    
    const termIds = question.termIds
    const terms = termIds.map(id => findTermById(id)).filter(t => t !== undefined)
    
    // Determine if it's tempo or dynamics from question text
    const isTempo = question.question.toLowerCase().includes('tempo') || 
                   question.question.toLowerCase().includes('slowest') || 
                   question.question.toLowerCase().includes('fastest')
    
    if (isTempo) {
      const tempoOrder = orderingData.tempo.order
      const sorted = [...terms].sort((a, b) => {
        const orderA = tempoOrder[a.id]?.order || 999
        const orderB = tempoOrder[b.id]?.order || 999
        return orderA - orderB
      })
      return sorted.map(t => t.id)
    } else {
      // Dynamics ordering
      const dynamicsRules = orderingData.dynamics.rules
      const getDynamicsOrder = (term) => {
        for (const rule of dynamicsRules) {
          const matchesRule = rule.ids.some(idObj => idObj.id === term.id)
          if (matchesRule) {
            const aliases = Array.isArray(term.term) ? term.term : [term.term]
            const termLower = aliases.join(' ').toLowerCase()
            const hasExclude = rule.exclude && rule.exclude.some(exclude => termLower.includes(exclude))
            if (!hasExclude) {
              return rule.order
            }
          }
        }
        return 999 // Should not happen if filtering is correct
      }
      const sorted = [...terms].sort((a, b) => {
        return getDynamicsOrder(a) - getDynamicsOrder(b)
      })
      return sorted.map(t => t.id)
    }
  }
  const printRef = useRef(null)

  const handlePrint = () => {
    const element = printRef.current
    const opt = {
      margin: [10, 10, 10, 10],
      filename: 'music-terms-quiz.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }

    html2pdf().set(opt).from(element).save()
  }

  const renderQuestion = (question, index) => {
    const currentAnswer = answers[index] || ''

    switch (question.type) {
      case 'multiple_choice':
        return (
          <div key={index} className="printable-question">
            <div className="question-number">{index + 1}.</div>
            <div className="question-content">
              <div className="question-text">{question.question}</div>
              <div className="printable-options">
                {question.options.map((option, optIndex) => {
                  const isCorrect = option === question.correctAnswer
                  const isSelected = currentAnswer === option
                  return (
                    <div
                      key={optIndex}
                      className={`printable-option ${showAnswers && isCorrect ? 'correct-answer' : ''} ${showAnswers && isSelected && !isCorrect ? 'incorrect-answer' : ''}`}
                    >
                      <span className="option-letter">{String.fromCharCode(65 + optIndex)}.</span>
                      <span className="option-text">{option}</span>
                      {showAnswers && isCorrect && <span className="answer-marker">✓</span>}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )

      case 'short_answer':
        return (
          <div key={index} className="printable-question">
            <div className="question-number">{index + 1}.</div>
            <div className="question-content">
              <div className="question-text">{question.question}</div>
              <div className="printable-answer-line">
                {showAnswers ? (
                  <div className="answer-text">
                    <strong>Answer:</strong> {question.correctAnswer}
                  </div>
                ) : (
                  <div className="answer-line"></div>
                )}
              </div>
            </div>
          </div>
        )

      case 'ordering':
        const termIds = question.termIds || []
        const displayMap = question.displayMap || {}
        const currentOrder = currentAnswer ? currentAnswer.split(',').map(id => id.trim()).filter(id => id) : []
        const correctOrder = getCorrectOrder(question)

        return (
          <div key={index} className="printable-question">
            <div className="question-number">{index + 1}.</div>
            <div className="question-content">
              <div className="question-text">{question.question}</div>
              <div className="printable-ordering">
                {!showAnswers ? (
                  <>
                    <div className="ordering-terms-list">
                      {termIds.map((termId) => {
                        const displayName = displayMap[termId] || termId
                        return (
                          <div key={termId} className="printable-order-item">
                            <span className="order-term-name">{displayName}</span>
                          </div>
                        )
                      })}
                    </div>
                    <div className="ordering-blanks">
                      <p className="ordering-instruction">Write the correct order below:</p>
                      {termIds.map((_, idx) => (
                        <div key={idx} className="ordering-blank">
                          {idx + 1}. _______________
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="ordering-answer-display">
                    {correctOrder.map((termId, idx) => {
                      const displayName = displayMap[termId] || termId
                      return (
                        <div key={termId} className="order-answer-item">
                          <span className="order-position">{idx + 1}.</span>
                          <span className="order-term-name">{displayName}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="printable-quiz-container">
      <div className="printable-actions">
        <button onClick={handlePrint} className="print-button">
          📄 Save as PDF
        </button>
      </div>
      
      <div ref={printRef} className="printable-content">
        <div className="printable-header">
          <h1>Music Terms Quiz</h1>
          <div className="quiz-info">
            <p><strong>Total Questions:</strong> {questions.length}</p>
            {showAnswers && <p className="answers-label">ANSWER KEY</p>}
          </div>
        </div>

        <div className="printable-questions">
          {questions.map((question, index) => renderQuestion(question, index))}
        </div>

        {showAnswers && (
          <div className="printable-answers-summary">
            <h2>Answer Key</h2>
            {questions.map((question, index) => (
              <div key={index} className="answer-summary-item">
                <strong>{index + 1}.</strong> {question.correctAnswer}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default PrintableQuiz

