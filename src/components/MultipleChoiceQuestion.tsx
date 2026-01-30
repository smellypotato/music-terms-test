import './MultipleChoiceQuestion.css'
import './QuizAllQuestions.css'
import type { MultipleChoiceQuestion as MCQuestion } from '../types'

interface MultipleChoiceQuestionProps {
  question: MCQuestion
  answer: string | null
  onAnswerChange: (questionIndex: number, answer: string) => void
  questionIndex: number
  isDebugMode: boolean
  getOptionGrade: (option: string, question: MCQuestion) => number | null
  questionGrade: number | null
}

export default function MultipleChoiceQuestion({
  question,
  answer,
  onAnswerChange,
  questionIndex,
  isDebugMode,
  getOptionGrade,
  questionGrade
}: MultipleChoiceQuestionProps) {
  const handleChange = (option: string) => {
    onAnswerChange(questionIndex, option)
  }

  return (
    <div className="multiple-choice-question">
      <div className="question-text">
        {question.question}
        {isDebugMode && questionGrade !== null && (
          <span className="debug-grade"> [Grade {questionGrade}]</span>
        )}
      </div>
      <div className="all-options">
        {question.options.map((option, optIndex) => {
          const optionGrade = getOptionGrade(option, question)
          return (
            <label key={optIndex} className="all-option-label">
              <input
                type="radio"
                name={`question-${questionIndex}`}
                value={option}
                checked={answer === option}
                onChange={() => handleChange(option)}
              />
              <span className="option-letter">
                {String.fromCharCode(65 + optIndex)}.
              </span>
              <span>{option}</span>
              {isDebugMode && optionGrade !== null && (
                <span className="debug-grade"> [G{optionGrade}]</span>
              )}
            </label>
          )
        })}
      </div>
    </div>
  )
}
