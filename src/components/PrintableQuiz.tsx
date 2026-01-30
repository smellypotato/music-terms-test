import { useRef } from 'react'
import html2pdf from 'html2pdf.js'
import './PrintableQuiz.css'
import musicTermsData from '../data/musicTerms.json'
import { findTermById } from '../utils/termUtils'
import { getCorrectOrder } from '../utils/orderingUtils'
import type { MusicTerm } from '../types'
import type { Question, OrderingQuestion as OrderQuestion } from '../types'

const musicTerms = musicTermsData as MusicTerm[]

interface PrintableQuizProps {
  questions: Question[]
  answers: (string | null)[]
  onAnswerChange: (questionIndex: number, answer: string) => void
  showAnswers?: boolean
}

export default function PrintableQuiz({
  questions,
  answers,
  onAnswerChange,
  showAnswers = false
}: PrintableQuizProps) {
  const findTermByIdBound = (id: string) => findTermById(musicTerms, id)
  const getCorrectOrderBound = (question: OrderQuestion) =>
    getCorrectOrder(question, musicTerms, findTermByIdBound)
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    const element = printRef.current
    if (!element) return
    const opt = {
      margin: [10, 10, 10, 10] as [number, number, number, number],
      filename: 'music-terms-quiz.pdf',
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
    }
    html2pdf().set(opt).from(element).save()
  }

  const renderQuestion = (question: Question, index: number) => {
    const currentAnswer = answers[index] ?? ''
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
                      <span className="option-letter">
                        {String.fromCharCode(65 + optIndex)}.
                      </span>
                      <span className="option-text">{option}</span>
                      {showAnswers && isCorrect && (
                        <span className="answer-marker">✓</span>
                      )}
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
      case 'ordering': {
        const termIds = question.termIds ?? []
        const displayMap = question.displayMap ?? {}
        const currentOrder = currentAnswer
          ? currentAnswer.split(',').map(id => id.trim()).filter(id => id)
          : []
        const correctOrder = getCorrectOrderBound(question)
        return (
          <div key={index} className="printable-question">
            <div className="question-number">{index + 1}.</div>
            <div className="question-content">
              <div className="question-text">{question.question}</div>
              <div className="printable-ordering">
                {!showAnswers ? (
                  <>
                    <div className="ordering-terms-list">
                      {termIds.map(termId => {
                        const displayName = displayMap[termId] ?? termId
                        return (
                          <div key={termId} className="printable-order-item">
                            <span className="order-term-name">
                              {displayName}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                    <div className="ordering-blanks">
                      <p className="ordering-instruction">
                        Write the correct order below:
                      </p>
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
                      const displayName = displayMap[termId] ?? termId
                      return (
                        <div key={termId} className="order-answer-item">
                          <span className="order-position">{idx + 1}.</span>
                          <span className="order-term-name">
                            {displayName}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      }
      default:
        return null
    }
  }

  const getAnswerSummary = (question: Question, index: number): string => {
    if (question.type === 'ordering') {
      const correctOrder = getCorrectOrderBound(question)
      return correctOrder.map(id => question.displayMap[id] ?? id).join(', ')
    }
    if ('correctAnswer' in question) return question.correctAnswer
    return ''
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
            <p>
              <strong>Total Questions:</strong> {questions.length}
            </p>
            {showAnswers && <p className="answers-label">ANSWER KEY</p>}
          </div>
        </div>

        <div className="printable-questions">
          {questions.map((question, index) =>
            renderQuestion(question, index)
          )}
        </div>

        {showAnswers && (
          <div className="printable-answers-summary">
            <h2>Answer Key</h2>
            {questions.map((question, index) => (
              <div key={index} className="answer-summary-item">
                <strong>{index + 1}.</strong> {getAnswerSummary(question, index)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
