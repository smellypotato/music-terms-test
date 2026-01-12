import './Results.css'
import musicTerms from '../data/musicTerms.json'
import orderingData from '../data/orderingData.json'
import { getCanonicalTerm, hasAlias } from '../utils/termUtils'

function Results({ questions, answers, onReset }) {
  // Helper function to find a term by alias
  const findTermByAlias = (alias) => {
    return musicTerms.find(term => {
      const aliases = Array.isArray(term.term) ? term.term : [term.term]
      return aliases.some(a => a.toLowerCase() === alias.toLowerCase())
    })
  }

  // Helper function to find a term by ID
  const findTermById = (id) => {
    return musicTerms.find(term => term.id === id)
  }

  // Helper function to find a term by definition
  const findTermByDefinition = (definition) => {
    return musicTerms.find(term => 
      term.definition.toLowerCase() === definition.toLowerCase()
    )
  }

  // Helper function to get definition display for a question
  const getDefinitionDisplay = (question, userAnswer, isCorrect) => {
    const formatId = question.formatId
    if (!formatId) return null

    // 1. term_to_definition_mc: if incorrect and non-empty, show the term related to the incorrect answer
    if (formatId === 'term_to_definition_mc' && !isCorrect && userAnswer && userAnswer.trim()) {
      const incorrectTerm = findTermByDefinition(userAnswer)
      if (incorrectTerm) {
        const termAlias = Array.isArray(incorrectTerm.term) ? incorrectTerm.term[0] : incorrectTerm.term
        return {
          title: 'Term related to your selected answer:',
          definitions: [{ term: termAlias, definition: userAnswer }]
        }
      }
    }

    // 2. definition_to_term_mc: if incorrect and non-empty, show definition of incorrect answer term
    if (formatId === 'definition_to_term_mc' && !isCorrect && userAnswer && userAnswer.trim()) {
      const incorrectTerm = findTermByAlias(userAnswer)
      if (incorrectTerm) {
        return {
          title: 'Definition of your selected answer:',
          definitions: [{ term: userAnswer, definition: incorrectTerm.definition }]
        }
      }
    }

    // 3. tempo_ordering: show definition of each term
    if (formatId === 'tempo_ordering' && question.termIds && question.displayMap) {
      const definitions = question.termIds.map(termId => {
        const term = findTermById(termId)
        return {
          term: question.displayMap[termId] || termId,
          definition: term ? term.definition : 'Definition not found'
        }
      })
      return {
        title: 'Definitions of terms:',
        definitions
      }
    }

    // 4. dynamics_ordering: show definition of each term
    if (formatId === 'dynamics_ordering' && question.termIds && question.displayMap) {
      const definitions = question.termIds.map(termId => {
        const term = findTermById(termId)
        return {
          term: question.displayMap[termId] || termId,
          definition: term ? term.definition : 'Definition not found'
        }
      })
      return {
        title: 'Definitions of terms:',
        definitions
      }
    }

    // 5. similar_terms_comparison: if incorrect, show definition of question term, correct term, and incorrect term
    if (formatId === 'similar_terms_comparison' && !isCorrect) {
      const questionTermObj = question.questionTerm ? findTermByAlias(question.questionTerm) : null
      const correctTermObj = question.correctAnswer ? findTermByAlias(question.correctAnswer) : null
      const incorrectTermObj = userAnswer ? findTermByAlias(userAnswer) : null
      
      const definitions = []
      if (questionTermObj && question.questionTerm) {
        definitions.push({ term: question.questionTerm, definition: questionTermObj.definition, label: 'Question term' })
      }
      if (correctTermObj && question.correctAnswer) {
        definitions.push({ term: question.correctAnswer, definition: correctTermObj.definition, label: 'Correct answer' })
      }
      if (incorrectTermObj && userAnswer) {
        definitions.push({ term: userAnswer, definition: incorrectTermObj.definition, label: 'Your answer' })
      }
      
      if (definitions.length > 0) {
        return { title: 'Definitions:', definitions }
      }
    }

    // 6. opposite_terms: if incorrect, show definition of question term, correct term, and incorrect term
    if (formatId === 'opposite_terms' && !isCorrect) {
      const questionTermObj = question.questionTerm ? findTermByAlias(question.questionTerm) : null
      const correctTermObj = question.correctAnswer ? findTermByAlias(question.correctAnswer) : null
      const incorrectTermObj = userAnswer ? findTermByAlias(userAnswer) : null
      
      const definitions = []
      if (questionTermObj && question.questionTerm) {
        definitions.push({ term: question.questionTerm, definition: questionTermObj.definition, label: 'Question term' })
      }
      if (correctTermObj && question.correctAnswer) {
        definitions.push({ term: question.correctAnswer, definition: correctTermObj.definition, label: 'Correct answer' })
      }
      if (incorrectTermObj && userAnswer) {
        definitions.push({ term: userAnswer, definition: incorrectTermObj.definition, label: 'Your answer' })
      }
      
      if (definitions.length > 0) {
        return { title: 'Definitions:', definitions }
      }
    }

    // 7. tag_classification: if incorrect, show definition of question term
    if (formatId === 'tag_classification' && !isCorrect) {
      const questionTermObj = question.questionTerm ? findTermByAlias(question.questionTerm) : null
      if (questionTermObj && question.questionTerm) {
        return {
          title: 'Definition of the term:',
          definitions: [{ term: question.questionTerm, definition: questionTermObj.definition }]
        }
      }
    }

    // 8. context_application: if incorrect, show definition of incorrect term
    if (formatId === 'context_application' && !isCorrect && userAnswer && userAnswer.trim()) {
      const incorrectTerm = findTermByAlias(userAnswer)
      if (incorrectTerm) {
        return {
          title: 'Definition of your selected answer:',
          definitions: [{ term: userAnswer, definition: incorrectTerm.definition }]
        }
      }
    }

    // 9. language_identification: show definition of term in question (only when incorrect)
    if (formatId === 'language_identification' && !isCorrect) {
      const questionTermObj = question.questionTerm ? findTermByAlias(question.questionTerm) : null
      if (questionTermObj && question.questionTerm) {
        return {
          title: 'Definition of the term:',
          definitions: [{ term: question.questionTerm, definition: questionTermObj.definition }]
        }
      }
    }

    // 10. same_language_term: if incorrect, show definition of incorrect term
    if (formatId === 'same_language_term' && !isCorrect && userAnswer && userAnswer.trim()) {
      const incorrectTerm = findTermByAlias(userAnswer)
      if (incorrectTerm) {
        return {
          title: 'Definition of your selected answer:',
          definitions: [{ term: userAnswer, definition: incorrectTerm.definition }]
        }
      }
    }

    return null
  }
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
        // All terms should have order values since they were filtered during generation
        return tempoOrder[a.id].order - tempoOrder[b.id].order
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

  // Helper function to get correct term display for ordering questions
  const getCorrectTerm = (question) => {
    if (question.type !== 'ordering' || !question.termIds) return null
    
    const correctOrderIds = getCorrectOrder(question)
    const correctTerms = correctOrderIds.map(id => findTermById(id)).filter(t => t !== undefined)
    return correctTerms.map(t => getCanonicalTerm(t)).join(', ')
  }

  function checkAnswer(question, userAnswer) {
    if (!userAnswer || userAnswer === '') return false

    if (question.type === 'ordering') {
      const userOrder = userAnswer.split(',').map(s => s.trim()).filter(s => s)
      const correctOrder = getCorrectOrder(question)
      return JSON.stringify(userOrder) === JSON.stringify(correctOrder)
    } else if (question.type === 'short_answer') {
      const userLower = userAnswer.toLowerCase().trim()
      const correctLower = question.correctAnswer.toLowerCase().trim()
      // Allow for some flexibility in short answers
      return userLower === correctLower || 
             userLower.includes(correctLower) || 
             correctLower.includes(userLower)
    } else {
      // For multiple choice, check by ID if available, otherwise fall back to alias matching
      if (question.correctAnswerId && question.optionToIdMap) {
        const userAnswerId = question.optionToIdMap[userAnswer]
        return userAnswerId === question.correctAnswerId
      }
      // Fallback to direct comparison for backward compatibility
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

            {result.question.type === 'multiple_choice' && (() => {
              const definitionDisplay = getDefinitionDisplay(result.question, result.userAnswer, result.isCorrect)
              
              return (
                <div className="result-options">
                  <strong>Options:</strong>
                  <ul>
                    {result.question.options.map((option, optIndex) => {
                      const isCorrect = option === result.correctAnswer
                      const isUserAnswer = option === result.userAnswer
                      const isIncorrectUserAnswer = isUserAnswer && !result.isCorrect
                      
                      // Find definition for this option
                      // Don't show definitions in MC options for similar/opposite questions
                      let optionDefinition = null
                      const formatId = result.question.formatId
                      const isSimilarOrOpposite = formatId === 'similar_terms_comparison' || formatId === 'opposite_terms'
                      
                      if (definitionDisplay && isCorrect && !isSimilarOrOpposite) {
                        // Only show definition for correct answer (not for similar/opposite questions)
                        if (definitionDisplay.definitions.some(d => d.label === 'Correct answer')) {
                          const correctDef = definitionDisplay.definitions.find(d => 
                            d.term === option && d.label === 'Correct answer'
                          )
                          if (correctDef) {
                            optionDefinition = correctDef.definition
                          }
                        }
                      }
                      
                      return (
                        <li
                          key={optIndex}
                          className={
                            isCorrect
                              ? 'correct-option'
                              : isIncorrectUserAnswer
                              ? 'incorrect-option'
                              : ''
                          }
                        >
                          {option}
                          {isCorrect && ' ✓'}
                          {isIncorrectUserAnswer && ' ✗ (Your answer)'}
                          {optionDefinition && (
                            <span className="inline-definition"> — {optionDefinition}</span>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )
            })()}

            {result.question.type === 'ordering' && result.question.displayMap && (() => {
              const definitionDisplay = getDefinitionDisplay(result.question, result.userAnswer, result.isCorrect)
              
              return (
                <div className="result-ordering-info">
                  <strong>Terms to order:</strong>
                  <ul>
                    {result.question.termIds.map((termId, idx) => {
                      const displayName = result.question.displayMap[termId] || termId
                      const termDefinition = definitionDisplay?.definitions.find(d => d.term === displayName)
                      
                      return (
                        <li key={termId}>
                          {displayName}
                          {termDefinition && (
                            <span className="inline-definition"> — {termDefinition.definition}</span>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )
            })()}

            <div className="result-answer">
              {(() => {
                const definitionDisplay = getDefinitionDisplay(result.question, result.userAnswer, result.isCorrect)
                const formatId = result.question.formatId
                const isSimilarOrOpposite = formatId === 'similar_terms_comparison' || formatId === 'opposite_terms'
                
                // Get definition for user answer (not for language_identification)
                let userAnswerDefinition = null
                const isLanguageIdentification = formatId === 'language_identification'
                
                if (definitionDisplay && !isLanguageIdentification) {
                  const userDef = definitionDisplay.definitions.find(d => 
                    d.label === 'Your answer' || 
                    (result.question.type !== 'ordering' && d.term === result.userAnswer)
                  )
                  if (userDef) {
                    userAnswerDefinition = userDef.definition
                  } else if (!result.isCorrect && definitionDisplay.definitions.length === 1) {
                    // For single definition cases
                    if (formatId === 'definition_to_term_mc') {
                      // For definition_to_term_mc, the user answer is a term, so show its definition
                      const incorrectTerm = findTermByAlias(result.userAnswer)
                      if (incorrectTerm) {
                        userAnswerDefinition = incorrectTerm.definition
                      } else {
                        userAnswerDefinition = definitionDisplay.definitions[0].definition
                      }
                    } else {
                      userAnswerDefinition = definitionDisplay.definitions[0].definition
                    }
                  }
                }
                
                // For definition_to_term_mc, if we still don't have a definition, find it directly
                if (!userAnswerDefinition && !result.isCorrect && formatId === 'definition_to_term_mc' && result.userAnswer) {
                  const incorrectTerm = findTermByAlias(result.userAnswer)
                  if (incorrectTerm) {
                    userAnswerDefinition = incorrectTerm.definition
                  }
                }
                
                // Get definition for correct answer (not for similar/opposite terms)
                let correctAnswerDefinition = null
                if (definitionDisplay && !result.isCorrect && !isSimilarOrOpposite) {
                  const correctDef = definitionDisplay.definitions.find(d => d.label === 'Correct answer')
                  if (correctDef) {
                    correctAnswerDefinition = correctDef.definition
                  }
                }
                
                // Get definition for question term (only for similar/opposite questions when incorrect, or language_identification when incorrect)
                let questionTermDefinition = null
                let questionTermLabel = null
                
                if (definitionDisplay && !result.isCorrect) {
                  if (isSimilarOrOpposite) {
                    const questionDef = definitionDisplay.definitions.find(d => d.label === 'Question term')
                    if (questionDef) {
                      questionTermDefinition = questionDef.definition
                      questionTermLabel = questionDef.term
                    }
                  } else if (isLanguageIdentification) {
                    const questionDef = definitionDisplay.definitions.find(d => !d.label || d.label === 'Question term')
                    if (questionDef) {
                      questionTermDefinition = questionDef.definition
                      questionTermLabel = questionDef.term || result.question.questionTerm
                    }
                  }
                }
                
                return (
                  <>
                    <div className="answer-item">
                      <strong>Your Answer:</strong>{' '}
                      <span className={result.isCorrect ? 'correct-text' : 'incorrect-text'}>
                        {result.question.type === 'ordering' 
                          ? formatOrderingAnswer(result.userAnswer, result.question)
                          : result.userAnswer || '(No answer provided)'}
                      </span>
                      {userAnswerDefinition && !result.isCorrect && (
                        <span className="inline-definition"> — {userAnswerDefinition}</span>
                      )}
                    </div>
                    {!result.isCorrect && (
                      <div className="answer-item">
                        <strong>Correct Answer:</strong>{' '}
                        <span className="correct-text">
                          {result.question.type === 'ordering'
                            ? formatOrderingAnswer(result.correctAnswer, result.question)
                            : result.correctAnswer}
                        </span>
                        {correctAnswerDefinition && (
                          <span className="inline-definition"> — {correctAnswerDefinition}</span>
                        )}
                      </div>
                    )}
                    {questionTermDefinition && questionTermLabel && (
                      <div className="answer-item">
                        <strong>{questionTermLabel}:</strong>{' '}
                        <span className="inline-definition">{questionTermDefinition}</span>
                      </div>
                    )}
                  </>
                )
              })()}
            </div>

            {(() => {
              const correctTerm = result.question.type === 'ordering' ? getCorrectTerm(result.question) : result.question.correctTerm
              return correctTerm && (
                <div className="result-term">
                  <strong>Term:</strong> {correctTerm}
                </div>
              )
            })()}
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

