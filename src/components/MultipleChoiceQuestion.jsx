import './MultipleChoiceQuestion.css'
import './QuizAllQuestions.css'

function MultipleChoiceQuestion({ 
  question, 
  answer, 
  onAnswerChange, 
  questionIndex, 
  isDebugMode, 
  getOptionGrade,
  questionGrade
}) {
  const handleChange = (option) => {
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
              <span className="option-letter">{String.fromCharCode(65 + optIndex)}.</span>
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

export default MultipleChoiceQuestion
