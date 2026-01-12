import './ShortAnswerQuestion.css'
import './QuizAllQuestions.css'

function ShortAnswerQuestion({ 
  question, 
  answer, 
  onAnswerChange, 
  questionIndex,
  isDebugMode,
  questionGrade
}) {
  const handleChange = (e) => {
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
        value={answer || ''}
        onChange={handleChange}
        className="all-short-answer-input"
        placeholder="Enter your answer..."
      />
    </div>
  )
}

export default ShortAnswerQuestion
