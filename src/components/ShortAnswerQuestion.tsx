import './ShortAnswerQuestion.css'
import './QuizAllQuestions.css'
import type { ShortAnswerQuestion as SAQuestion } from '../types'

interface ShortAnswerQuestionProps {
  question: SAQuestion
  answer: string | null
  onAnswerChange: (questionIndex: number, answer: string) => void
  questionIndex: number
  isDebugMode: boolean
  questionGrade: number | null
}

export default function ShortAnswerQuestion({
  question,
  answer,
  onAnswerChange,
  questionIndex,
  isDebugMode,
  questionGrade
}: ShortAnswerQuestionProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onAnswerChange(questionIndex, e.target.value)
  }

  return (
    <div className="short-answer-question">
      <div className="question-text">
        {question.question}
        {isDebugMode && questionGrade !== null && (
          <span className="debug-grade"> [Grade {questionGrade}]</span>
        )}
      </div>
      <input
        type="text"
        value={answer ?? ''}
        onChange={handleChange}
        className="all-short-answer-input"
        placeholder="Enter your answer..."
      />
    </div>
  )
}
