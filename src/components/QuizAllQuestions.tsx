import { useState, useEffect } from 'react'
import './QuizAllQuestions.css'
import Cheatsheet from './Cheatsheet'
import OrderingQuestion from './OrderingQuestion'
import MultipleChoiceQuestion from './MultipleChoiceQuestion'
import ShortAnswerQuestion from './ShortAnswerQuestion'
import musicTermsData from '../data/musicTerms.json'
import { getCanonicalTerm, hasAlias } from '../utils/termUtils'
import type { MusicTerm } from '../types'
import type { Question, MultipleChoiceQuestion as MCQuestion } from '../types'

const musicTerms = musicTermsData as MusicTerm[]

interface QuizAllQuestionsProps {
  questions: Question[]
  answers: (string | null)[]
  onAnswerChange: (questionIndex: number, answer: string) => void
  onSubmit: () => void
  selectedTags?: string[]
  onBack?: () => void
}

export default function QuizAllQuestions({
  questions,
  answers,
  onAnswerChange,
  onSubmit,
  selectedTags = [],
  onBack
}: QuizAllQuestionsProps) {
  const [showCheatsheet, setShowCheatsheet] = useState(false)
  const isDebugMode =
    new URLSearchParams(window.location.search).get('debug') === 'true'

  const getTermGrade = (termIdentifier: string): number | null => {
    if (!termIdentifier) return null
    const term = musicTerms.find(t => {
      const canonical = getCanonicalTerm(t)
      if (canonical === termIdentifier) return true
      if (hasAlias(t, termIdentifier)) return true
      return false
    })
    return term?.grade ?? null
  }

  const getOptionGrade = (
    option: string,
    _question: MCQuestion
  ): number | null => {
    const term = musicTerms.find(t => {
      const aliases = Array.isArray(t.term) ? t.term : [t.term]
      return aliases.includes(option)
    })
    return term?.grade ?? null
  }

  const handleAnswer = (questionIndex: number, answer: string) => {
    onAnswerChange(questionIndex, answer)
  }

  const getOrderFromAnswer = (
    answer: string | null,
    termIds: string[]
  ): string[] => {
    if (answer?.trim()) {
      const parsed = answer
        .split(',')
        .map(id => id.trim())
        .filter(id => id)
      if (parsed.length === termIds.length) return parsed
    }
    return [...termIds]
  }

  const handleOrderChange = (questionIndex: number, newOrder: string[]) => {
    handleAnswer(questionIndex, newOrder.join(','))
  }

  useEffect(() => {
    if (questions.length === 0) return
    const answerUpdates: { index: number; answer: string }[] = []
    let needsUpdate = false
    questions.forEach((question, index) => {
      if (question.type === 'ordering') {
        const termIds = question.termIds ?? []
        const currentAnswer = answers[index]
        if (!currentAnswer?.trim() && termIds.length > 0) {
          answerUpdates.push({ index, answer: termIds.join(',') })
          needsUpdate = true
        }
      }
    })
    if (needsUpdate && answerUpdates.length > 0) {
      answerUpdates.forEach(({ index, answer }) => {
        onAnswerChange(index, answer)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions])

  const renderQuestion = (question: Question, index: number) => {
    const currentAnswer = answers[index]
    switch (question.type) {
      case 'multiple_choice': {
        const questionGrade = question.correctTerm
          ? getTermGrade(question.correctTerm)
          : null
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
      }
      case 'short_answer': {
        const shortAnswerGrade = question.correctTerm
          ? getTermGrade(question.correctTerm)
          : null
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
      }
      case 'ordering': {
        const termIds = question.termIds ?? []
        const order = getOrderFromAnswer(currentAnswer, termIds)
        return (
          <div key={index} className="all-questions-item">
            <div className="question-number">{index + 1}.</div>
            <div className="question-content">
              <OrderingQuestion
                question={question}
                order={order}
                onOrderChange={newOrder => handleOrderChange(index, newOrder)}
                questionIndex={index}
                isDebugMode={isDebugMode}
                getTermGrade={getTermGrade}
              />
            </div>
          </div>
        )
      }
      default:
        return null
    }
  }

  const answeredCount = answers.filter(
    a => a !== null && a !== ''
  ).length

  return (
    <div className="quiz-all-questions">
      <div className="quiz-all-header">
        <div className="progress">
          Total Questions: {questions.length} | Answered: {answeredCount} /{' '}
          {questions.length}
        </div>
      </div>

      <div className="all-questions-container">
        {questions.map((question, index) => renderQuestion(question, index))}
      </div>

      <div className="quiz-all-footer">
        <button type="button" onClick={onSubmit} className="submit-button">
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
