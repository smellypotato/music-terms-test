import type { MusicTerm } from '../types'
import type { FindTermByIdFn } from '../types'
import type { OrderingQuestion } from '../types'
import orderingData from '../data/orderingData.json'

interface OrderingDataTempoEntry {
  order: number
  description: string
}

interface OrderingDataDynamicsRule {
  ids: Array<{ id: string; description: string }>
  exclude?: string[]
  order: number
}

const data = orderingData as {
  tempo: { order: Record<string, OrderingDataTempoEntry> }
  dynamics: { rules: OrderingDataDynamicsRule[] }
}

export const getTempoOrder = (terms: MusicTerm[]): string[] => {
  const tempoOrder = data.tempo.order
  const sorted = [...terms].sort((a, b) => {
    return tempoOrder[a.id].order - tempoOrder[b.id].order
  })
  return sorted.map(t => t.id)
}

export const getDynamicsOrder = (terms: MusicTerm[]): string[] => {
  const dynamicsRules = data.dynamics.rules

  const getOrder = (term: MusicTerm): number => {
    for (const rule of dynamicsRules) {
      const matchesRule = rule.ids.some(idObj => idObj.id === term.id)
      if (matchesRule) {
        const aliases = Array.isArray(term.term) ? term.term : [term.term]
        const termLower = aliases.join(' ').toLowerCase()
        const hasExclude =
          rule.exclude && rule.exclude.some(ex => termLower.includes(ex))
        if (!hasExclude) {
          return rule.order
        }
      }
    }
    return 999
  }

  const sorted = [...terms].sort((a, b) => getOrder(a) - getOrder(b))
  return sorted.map(t => t.id)
}

export const getCorrectOrder = (
  question: OrderingQuestion,
  musicTerms: MusicTerm[],
  findTermById: FindTermByIdFn
): string[] => {
  if (question.type !== 'ordering' || !question.termIds) {
    console.warn('getCorrectOrder: Invalid question type or missing termIds', question)
    return []
  }

  const termIds = question.termIds
  const terms = termIds
    .map(id => {
      if (findTermById.length === 1) {
        return (findTermById as (id: string) => MusicTerm | undefined)(id)
      }
      return (findTermById as (musicTerms: MusicTerm[], id: string) => MusicTerm | undefined)(
        musicTerms,
        id
      )
    })
    .filter((t): t is MusicTerm => t !== undefined)

  if (terms.length === 0) {
    console.warn('getCorrectOrder: No terms found for termIds', termIds)
    return []
  }

  if (terms.length !== termIds.length) {
    console.warn(
      'getCorrectOrder: Some terms not found. Found:',
      terms.length,
      'Expected:',
      termIds.length
    )
  }

  const isTempo =
    question.question.toLowerCase().includes('tempo') ||
    question.question.toLowerCase().includes('slowest') ||
    question.question.toLowerCase().includes('fastest')

  const result = isTempo ? getTempoOrder(terms) : getDynamicsOrder(terms)

  if (result.length === 0) {
    console.warn('getCorrectOrder: Sorting returned empty array', {
      isTempo,
      termsLength: terms.length
    })
  }

  return result
}
