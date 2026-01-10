import './Results.css'

function Results({ questions, answers, onReset }) {
  const results = questions.map((question, index) => {
    const userAnswer = answers[index]
    const isCorrect = checkAnswer(question, userAnswer)
    return {
      question,
      userAnswer,
      isCorrect,
      correctAnswer: question.correctAnswer
    }
  })

  const correctCount = results.filter(r => r.isCorrect).length
  const incorrectCount = results.length - correctCount
  const percentage = Math.round((correctCount / results.length) * 100)

  function checkAnswer(question, userAnswer) {
    if (!userAnswer || userAnswer === '') return false

    if (question.type === 'ordering') {
      const userOrder = userAnswer.split(',').map(s => s.trim()).filter(s => s)
      const correctOrder = question.correctOrderIds || []
      return JSON.stringify(userOrder) === JSON.stringify(correctOrder)
    } else if (question.type === 'short_answer') {
      const userLower = userAnswer.toLowerCase().trim()
      const correctLower = question.correctAnswer.toLowerCase().trim()
      // Allow for some flexibility in short answers
      return userLower === correctLower || 
             userLower.includes(correctLower) || 
             correctLower.includes(userLower)
    } else {
      return userAnswer === question.correctAnswer
    }
  }

  const formatOrderingAnswer = (answer, question) => {
    if (!answer) return '(No answer provided)'
    if (question.type !== 'ordering' || !question.displayMap) return answer
    
    const termIds = answer.split(',').map(s => s.trim()).filter(s => s)
    return termIds.map((id, idx) => `${idx + 1}. ${question.displayMap[id] || id}`).join(', ')
  }

  return (
    <div className="results">
      <div className="results-summary">
        <h2>Quiz Results</h2>
        <div className="score">
          <div className="score-item correct">
            <span className="score-label">Correct:</span>
            <span className="score-value">{correctCount}</span>
          </div>
          <div className="score-item incorrect">
            <span className="score-label">Incorrect:</span>
            <span className="score-value">{incorrectCount}</span>
          </div>
          <div className="score-item percentage">
            <span className="score-label">Score:</span>
            <span className="score-value">{percentage}%</span>
          </div>
        </div>
      </div>

      <div className="results-details">
        <h3>Question Review</h3>
        {results.map((result, index) => (
          <div
            key={index}
            className={`result-item ${result.isCorrect ? 'correct' : 'incorrect'}`}
          >
            <div className="result-header">
              <span className="result-number">Question {index + 1}</span>
              <span className={`result-status ${result.isCorrect ? 'correct' : 'incorrect'}`}>
                {result.isCorrect ? '✓ Correct' : '✗ Incorrect'}
              </span>
            </div>
            
            <div className="result-question">
              <strong>Question:</strong> {result.question.question}
            </div>

            {result.question.type === 'multiple_choice' && (
              <div className="result-options">
                <strong>Options:</strong>
                <ul>
                  {result.question.options.map((option, optIndex) => (
                    <li
                      key={optIndex}
                      className={
                        option === result.correctAnswer
                          ? 'correct-option'
                          : option === result.userAnswer && !result.isCorrect
                          ? 'incorrect-option'
                          : ''
                      }
                    >
                      {option}
                      {option === result.correctAnswer && ' ✓'}
                      {option === result.userAnswer && !result.isCorrect && ' ✗ (Your answer)'}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.question.type === 'ordering' && result.question.displayMap && (
              <div className="result-ordering-info">
                <strong>Terms to order:</strong>
                <ul>
                  {result.question.termIds.map((termId, idx) => (
                    <li key={termId}>
                      {result.question.displayMap[termId] || termId}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="result-answer">
              <div className="answer-item">
                <strong>Your Answer:</strong>{' '}
                <span className={result.isCorrect ? 'correct-text' : 'incorrect-text'}>
                  {result.question.type === 'ordering' 
                    ? formatOrderingAnswer(result.userAnswer, result.question)
                    : result.userAnswer || '(No answer provided)'}
                </span>
              </div>
              {!result.isCorrect && (
                <div className="answer-item">
                  <strong>Correct Answer:</strong>{' '}
                  <span className="correct-text">
                    {result.question.type === 'ordering'
                      ? formatOrderingAnswer(result.correctAnswer, result.question)
                      : result.correctAnswer}
                  </span>
                </div>
              )}
            </div>

            {result.question.correctTerm && (
              <div className="result-term">
                <strong>Term:</strong> {result.question.correctTerm}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="results-actions">
        <button onClick={onReset} className="reset-button">
          Start New Quiz
        </button>
      </div>
    </div>
  )
}

export default Results

