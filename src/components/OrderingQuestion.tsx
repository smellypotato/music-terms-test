import './OrderingQuestion.css'
import './QuizAllQuestions.css'
import type { OrderingQuestion as OrderQuestion } from '../types'

interface OrderingQuestionProps {
  question: OrderQuestion
  order: string[]
  onOrderChange: (newOrder: string[]) => void
  questionIndex: number
  isDebugMode: boolean
  getTermGrade: (termId: string) => number | null
}

export default function OrderingQuestion({
  question,
  order,
  onOrderChange,
  questionIndex,
  isDebugMode,
  getTermGrade
}: OrderingQuestionProps) {
  const termIds = question.termIds ?? []
  const displayMap = question.displayMap ?? {}

  const isTempo =
    question.question.toLowerCase().includes('tempo') ||
    question.question.toLowerCase().includes('slowest') ||
    question.question.toLowerCase().includes('fastest')
  const isDynamics =
    question.question.toLowerCase().includes('dynamics') ||
    question.question.toLowerCase().includes('softest') ||
    question.question.toLowerCase().includes('loudest')

  const leftLabel = isTempo ? 'Slowest' : isDynamics ? 'Softest' : 'Lowest'
  const rightLabel = isTempo ? 'Fastest' : isDynamics ? 'Loudest' : 'Highest'

  const handleSwap = (containerIndex: number, direction: 'left' | 'right') => {
    const newOrder = [...order]
    if (direction === 'left' && containerIndex > 0) {
      ;[newOrder[containerIndex], newOrder[containerIndex - 1]] = [
        newOrder[containerIndex - 1],
        newOrder[containerIndex]
      ]
    } else if (
      direction === 'right' &&
      containerIndex < newOrder.length - 1
    ) {
      ;[newOrder[containerIndex], newOrder[containerIndex + 1]] = [
        newOrder[containerIndex + 1],
        newOrder[containerIndex]
      ]
    }
    onOrderChange(newOrder)
  }

  return (
    <div className="ordering-question">
      <div className="question-header">
        <div className="question-text">{question.question}</div>
        {isDebugMode && (
          <div className="debug-grade">
            Grade:{' '}
            {termIds
              .map(id => getTermGrade(id))
              .filter(g => g !== null)
              .join(', ')}
          </div>
        )}
      </div>
      <div className="ordering-containers-wrapper">
        <div className="ordering-label-left">{leftLabel}</div>
        <div className="ordering-containers">
          {order.map((termId, containerIndex) => {
            const displayName = displayMap[termId] ?? termId
            const isLeftmost = containerIndex === 0
            const isRightmost = containerIndex === order.length - 1
            const termGrade = getTermGrade(termId)
            return (
              <div key={termId} className="ordering-container">
                {!isLeftmost && (
                  <button
                    type="button"
                    onClick={() => handleSwap(containerIndex, 'left')}
                    className="swap-button"
                    title="Move left"
                  >
                    ←
                  </button>
                )}
                <div className="ordering-term-display">
                  {displayName}
                  {isDebugMode && termGrade !== null && (
                    <div className="debug-grade-bottom">
                      Grade {termGrade}
                    </div>
                  )}
                </div>
                {!isRightmost && (
                  <button
                    type="button"
                    onClick={() => handleSwap(containerIndex, 'right')}
                    className="swap-button"
                    title="Move right"
                  >
                    →
                  </button>
                )}
              </div>
            )
          })}
        </div>
        <div className="ordering-label-right">{rightLabel}</div>
      </div>
      {isDebugMode && (
        <div className="debug-ordering-options">
          Options: {termIds.join(', ')}
        </div>
      )}
    </div>
  )
}
