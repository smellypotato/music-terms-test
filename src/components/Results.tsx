import './Results.css'
import musicTermsData from '../data/musicTerms.json'
import {
  getCanonicalTerm,
  findTermByAlias,
  findTermById,
  findTermByDefinition
} from '../utils/termUtils'
import { getCorrectOrder } from '../utils/orderingUtils'
import type { MusicTerm } from '../types'
import type {
  Question,
  OrderingQuestion as OrderQuestion,
  DefinitionDisplayResult,
  DefinitionDisplayItem
} from '../types'

const musicTerms = musicTermsData as MusicTerm[]

interface ResultsProps {
  questions: Question[]
  answers: (string | null)[]
  onReset: () => void
}

interface ResultItem {
  question: Question
  userAnswer: string | null
  isCorrect: boolean
  correctAnswer: string
}

export default function Results({
  questions,
  answers,
  onReset
}: ResultsProps) {
  const findTermByAliasBound = (alias: string) =>
    findTermByAlias(musicTerms, alias)
  const findTermByIdBound = (id: string) => findTermById(musicTerms, id)
  const findTermByDefinitionBound = (definition: string) =>
    findTermByDefinition(musicTerms, definition)

  const getDefinitionDisplay = (
    question: Question,
    userAnswer: string | null,
    isCorrect: boolean
  ): DefinitionDisplayResult | null => {
    const formatId = question.formatId
    if (!formatId) return null

    if (
      formatId === 'term_to_definition_mc' &&
      !isCorrect &&
      userAnswer?.trim()
    ) {
      const incorrectTerm = findTermByDefinitionBound(userAnswer)
      if (incorrectTerm) {
        const termAlias = Array.isArray(incorrectTerm.term)
          ? incorrectTerm.term[0]
          : incorrectTerm.term
        return {
          title: 'Term related to your selected answer:',
          definitions: [{ term: termAlias, definition: userAnswer }]
        }
      }
    }

    if (
      formatId === 'definition_to_term_mc' &&
      !isCorrect &&
      userAnswer?.trim()
    ) {
      const incorrectTerm = findTermByAliasBound(userAnswer)
      if (incorrectTerm) {
        return {
          title: 'Definition of your selected answer:',
          definitions: [
            { term: userAnswer, definition: incorrectTerm.definition }
          ]
        }
      }
    }

    if (
      formatId === 'tempo_ordering' &&
      question.type === 'ordering' &&
      question.termIds &&
      question.displayMap
    ) {
      const definitions: DefinitionDisplayItem[] = question.termIds.map(
        termId => {
          const term = findTermByIdBound(termId)
          return {
            term: question.displayMap[termId] ?? termId,
            definition: term ? term.definition : 'Definition not found'
          }
        }
      )
      return { title: 'Definitions of terms:', definitions }
    }

    if (
      formatId === 'dynamics_ordering' &&
      question.type === 'ordering' &&
      question.termIds &&
      question.displayMap
    ) {
      const definitions: DefinitionDisplayItem[] = question.termIds.map(
        termId => {
          const term = findTermByIdBound(termId)
          return {
            term: question.displayMap[termId] ?? termId,
            definition: term ? term.definition : 'Definition not found'
          }
        }
      )
      return { title: 'Definitions of terms:', definitions }
    }

    if (formatId === 'similar_terms_comparison' && !isCorrect) {
      const q = question as Question & { questionTerm?: string; correctAnswer?: string }
      const questionTermObj = q.questionTerm
        ? findTermByAliasBound(q.questionTerm)
        : null
      const correctTermObj = q.correctAnswer
        ? findTermByAliasBound(q.correctAnswer)
        : null
      const incorrectTermObj = userAnswer
        ? findTermByAliasBound(userAnswer)
        : null
      const definitions: DefinitionDisplayItem[] = []
      if (questionTermObj && q.questionTerm) {
        definitions.push({
          term: q.questionTerm,
          definition: questionTermObj.definition,
          label: 'Question term'
        })
      }
      if (correctTermObj && q.correctAnswer) {
        definitions.push({
          term: q.correctAnswer,
          definition: correctTermObj.definition,
          label: 'Correct answer'
        })
      }
      if (incorrectTermObj && userAnswer) {
        definitions.push({
          term: userAnswer,
          definition: incorrectTermObj.definition,
          label: 'Your answer'
        })
      }
      if (definitions.length > 0) return { title: 'Definitions:', definitions }
    }

    if (formatId === 'opposite_terms' && !isCorrect) {
      const q = question as Question & { questionTerm?: string; correctAnswer?: string }
      const questionTermObj = q.questionTerm
        ? findTermByAliasBound(q.questionTerm)
        : null
      const correctTermObj = q.correctAnswer
        ? findTermByAliasBound(q.correctAnswer)
        : null
      const incorrectTermObj = userAnswer
        ? findTermByAliasBound(userAnswer)
        : null
      const definitions: DefinitionDisplayItem[] = []
      if (questionTermObj && q.questionTerm) {
        definitions.push({
          term: q.questionTerm,
          definition: questionTermObj.definition,
          label: 'Question term'
        })
      }
      if (correctTermObj && q.correctAnswer) {
        definitions.push({
          term: q.correctAnswer,
          definition: correctTermObj.definition,
          label: 'Correct answer'
        })
      }
      if (incorrectTermObj && userAnswer) {
        definitions.push({
          term: userAnswer,
          definition: incorrectTermObj.definition,
          label: 'Your answer'
        })
      }
      if (definitions.length > 0) return { title: 'Definitions:', definitions }
    }

    if (formatId === 'tag_classification' && !isCorrect) {
      const q = question as Question & { questionTerm?: string }
      const questionTermObj = q.questionTerm
        ? findTermByAliasBound(q.questionTerm)
        : null
      if (questionTermObj && q.questionTerm) {
        return {
          title: 'Definition of the term:',
          definitions: [
            {
              term: q.questionTerm,
              definition: questionTermObj.definition
            }
          ]
        }
      }
    }

    if (
      formatId === 'context_application' &&
      !isCorrect &&
      userAnswer?.trim()
    ) {
      const incorrectTerm = findTermByAliasBound(userAnswer)
      if (incorrectTerm) {
        return {
          title: 'Definition of your selected answer:',
          definitions: [
            { term: userAnswer, definition: incorrectTerm.definition }
          ]
        }
      }
    }

    if (formatId === 'language_identification' && !isCorrect) {
      const q = question as Question & { questionTerm?: string }
      const questionTermObj = q.questionTerm
        ? findTermByAliasBound(q.questionTerm)
        : null
      if (questionTermObj && q.questionTerm) {
        return {
          title: 'Definition of the term:',
          definitions: [
            {
              term: q.questionTerm,
              definition: questionTermObj.definition
            }
          ]
        }
      }
    }

    if (
      formatId === 'same_language_term' &&
      !isCorrect &&
      userAnswer?.trim()
    ) {
      const incorrectTerm = findTermByAliasBound(userAnswer)
      if (incorrectTerm) {
        return {
          title: 'Definition of your selected answer:',
          definitions: [
            { term: userAnswer, definition: incorrectTerm.definition }
          ]
        }
      }
    }

    return null
  }

  const getCorrectOrderBound = (question: OrderQuestion): string[] => {
    try {
      const result = getCorrectOrder(
        question,
        musicTerms,
        findTermByIdBound
      )
      if (!result?.length) {
        console.warn('getCorrectOrder returned empty array for question:', question)
        return []
      }
      return result
    } catch (error) {
      console.error('Error in getCorrectOrderBound:', error, question)
      return []
    }
  }

  const getCorrectTerm = (question: Question): string | null => {
    if (question.type !== 'ordering' || !question.termIds) return null
    const correctOrderIds = getCorrectOrderBound(question)
    const correctTerms = correctOrderIds
      .map(id => findTermByIdBound(id))
      .filter((t): t is MusicTerm => t !== undefined)
    return correctTerms.map(t => getCanonicalTerm(t)).join(', ')
  }

  function checkAnswer(question: Question, userAnswer: string | null): boolean {
    if (!userAnswer?.trim()) return false
    if (question.type === 'ordering') {
      const userOrder = userAnswer
        .split(',')
        .map(s => s.trim())
        .filter(s => s)
      const correctOrder = getCorrectOrderBound(question)
      return JSON.stringify(userOrder) === JSON.stringify(correctOrder)
    }
    if (question.type === 'short_answer') {
      const userLower = userAnswer.toLowerCase().trim()
      const correctLower = question.correctAnswer.toLowerCase().trim()
      return (
        userLower === correctLower ||
        userLower.includes(correctLower) ||
        correctLower.includes(userLower)
      )
    }
    if (
      question.correctAnswerId &&
      question.optionToIdMap
    ) {
      const userAnswerId = question.optionToIdMap[userAnswer]
      return userAnswerId === question.correctAnswerId
    }
    return userAnswer === question.correctAnswer
  }

  const results: ResultItem[] = questions.map((question, index) => {
    const userAnswer = answers[index] ?? null
    const isCorrect = checkAnswer(question, userAnswer)
    let correctAnswer: string
    if (question.type === 'ordering') {
      const correctOrderIds = getCorrectOrderBound(question)
      correctAnswer =
        correctOrderIds.length > 0
          ? correctOrderIds.join(',')
          : (question.termIds ?? []).join(',')
    } else {
      correctAnswer =
        'correctAnswer' in question ? question.correctAnswer : ''
    }
    return { question, userAnswer, isCorrect, correctAnswer }
  })

  const correctCount = results.filter(r => r.isCorrect).length
  const incorrectCount = results.length - correctCount
  const percentage = Math.round((correctCount / results.length) * 100)

  const formatOrderingAnswer = (
    answer: string | null,
    question: OrderQuestion
  ): string => {
    if (!answer?.trim()) return '(No answer provided)'
    if (!question.displayMap) return answer
    const termIds = answer
      .split(',')
      .map(s => s.trim())
      .filter(s => s)
    if (termIds.length === 0) return '(No answer provided)'
    return termIds
      .map((id, idx) => `${idx + 1}. ${question.displayMap[id] ?? id}`)
      .join(', ')
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
              <span
                className={`result-status ${result.isCorrect ? 'correct' : 'incorrect'}`}
              >
                {result.isCorrect ? '✓ Correct' : '✗ Incorrect'}
              </span>
            </div>

            <div className="result-question">
              <strong>Question:</strong> {result.question.question}
            </div>

            {result.question.type === 'multiple_choice' && (() => {
              const definitionDisplay = getDefinitionDisplay(
                result.question,
                result.userAnswer,
                result.isCorrect
              )
              return (
                <div className="result-options">
                  <strong>Options:</strong>
                  <ul>
                    {result.question.options.map((option, optIndex) => {
                      const isCorrect = option === result.correctAnswer
                      const isUserAnswer = option === result.userAnswer
                      const isIncorrectUserAnswer =
                        isUserAnswer && !result.isCorrect
                      const formatId = result.question.formatId
                      const isSimilarOrOpposite =
                        formatId === 'similar_terms_comparison' ||
                        formatId === 'opposite_terms'
                      let optionDefinition: string | null = null
                      if (
                        definitionDisplay &&
                        isCorrect &&
                        !isSimilarOrOpposite
                      ) {
                        const correctDef = definitionDisplay.definitions.find(
                          d => d.label === 'Correct answer'
                        )
                        if (
                          correctDef &&
                          correctDef.term === option &&
                          correctDef.label === 'Correct answer'
                        ) {
                          optionDefinition = correctDef.definition
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
                            <span className="inline-definition">
                              {' '}
                              — {optionDefinition}
                            </span>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )
            })()}

            {result.question.type === 'ordering' &&
              result.question.displayMap &&
              (() => {
                const definitionDisplay = getDefinitionDisplay(
                  result.question,
                  result.userAnswer,
                  result.isCorrect
                )
                return (
                  <div className="result-ordering-info">
                    <strong>Terms to order:</strong>
                    <ul>
                      {result.question.termIds.map(termId => {
                        const displayName =
                          result.question.displayMap[termId] ?? termId
                        const termDefinition =
                          definitionDisplay?.definitions.find(
                            d => d.term === displayName
                          )
                        return (
                          <li key={termId}>
                            {displayName}
                            {termDefinition && (
                              <span className="inline-definition">
                                {' '}
                                — {termDefinition.definition}
                              </span>
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
                const definitionDisplay = getDefinitionDisplay(
                  result.question,
                  result.userAnswer,
                  result.isCorrect
                )
                const formatId = result.question.formatId
                const isSimilarOrOpposite =
                  formatId === 'similar_terms_comparison' ||
                  formatId === 'opposite_terms'
                let userAnswerDefinition: string | null = null
                const isLanguageIdentification =
                  formatId === 'language_identification'
                if (definitionDisplay && !isLanguageIdentification) {
                  const userDef = definitionDisplay.definitions.find(
                    d =>
                      d.label === 'Your answer' ||
                      (result.question.type !== 'ordering' &&
                        d.term === result.userAnswer)
                  )
                  if (userDef) {
                    userAnswerDefinition = userDef.definition
                  } else if (
                    !result.isCorrect &&
                    definitionDisplay.definitions.length === 1
                  ) {
                    userAnswerDefinition =
                      definitionDisplay.definitions[0].definition
                  }
                }
                if (
                  !userAnswerDefinition &&
                  !result.isCorrect &&
                  formatId === 'definition_to_term_mc' &&
                  result.userAnswer
                ) {
                  const incorrectTerm = findTermByAlias(
                    musicTerms,
                    result.userAnswer
                  )
                  if (incorrectTerm) {
                    userAnswerDefinition = incorrectTerm.definition
                  }
                }
                let correctAnswerDefinition: string | null = null
                if (
                  definitionDisplay &&
                  !result.isCorrect &&
                  !isSimilarOrOpposite
                ) {
                  const correctDef = definitionDisplay.definitions.find(
                    d => d.label === 'Correct answer'
                  )
                  if (correctDef) correctAnswerDefinition = correctDef.definition
                }
                let questionTermDefinition: string | null = null
                let questionTermLabel: string | null = null
                if (definitionDisplay && !result.isCorrect) {
                  if (isSimilarOrOpposite) {
                    const questionDef =
                      definitionDisplay.definitions.find(
                        d => d.label === 'Question term'
                      )
                    if (questionDef) {
                      questionTermDefinition = questionDef.definition
                      questionTermLabel = questionDef.term
                    }
                  } else if (isLanguageIdentification) {
                    const q = result.question as Question & {
                      questionTerm?: string
                    }
                    const questionDef = definitionDisplay.definitions.find(
                      d => !d.label || d.label === 'Question term'
                    )
                    if (questionDef) {
                      questionTermDefinition = questionDef.definition
                      questionTermLabel = questionDef.term ?? q.questionTerm ?? null
                    }
                  }
                }
                return (
                  <>
                    <div className="answer-item">
                      <strong>Your Answer:</strong>{' '}
                      <span
                        className={
                          result.isCorrect ? 'correct-text' : 'incorrect-text'
                        }
                      >
                        {result.question.type === 'ordering'
                          ? formatOrderingAnswer(
                              result.userAnswer,
                              result.question
                            )
                          : result.userAnswer ?? '(No answer provided)'}
                      </span>
                      {userAnswerDefinition && !result.isCorrect && (
                        <span className="inline-definition">
                          {' '}
                          — {userAnswerDefinition}
                        </span>
                      )}
                    </div>
                    {!result.isCorrect && (
                      <div className="answer-item">
                        <strong>Correct Answer:</strong>{' '}
                        <span className="correct-text">
                          {result.question.type === 'ordering'
                            ? formatOrderingAnswer(
                                result.correctAnswer,
                                result.question
                              )
                            : result.correctAnswer ?? '(No correct answer)'}
                        </span>
                        {correctAnswerDefinition && (
                          <span className="inline-definition">
                            {' '}
                            — {correctAnswerDefinition}
                          </span>
                        )}
                      </div>
                    )}
                    {questionTermDefinition && questionTermLabel && (
                      <div className="answer-item">
                        <strong>{questionTermLabel}:</strong>{' '}
                        <span className="inline-definition">
                          {questionTermDefinition}
                        </span>
                      </div>
                    )}
                  </>
                )
              })()}
            </div>

            {(() => {
              const correctTerm =
                result.question.type === 'ordering'
                  ? getCorrectTerm(result.question)
                  : 'correctTerm' in result.question
                    ? result.question.correctTerm
                    : null
              return (
                correctTerm && (
                  <div className="result-term">
                    <strong>Term:</strong> {correctTerm}
                  </div>
                )
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
