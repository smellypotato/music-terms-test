/**
 * Utility functions for computing correct order of ordering questions
 */
import orderingData from '../data/orderingData.json'

/**
 * Get the correct order for tempo ordering questions
 * @param {Array} terms - Array of term objects
 * @returns {Array} Array of term IDs in correct order
 */
export const getTempoOrder = (terms) => {
  const tempoOrder = orderingData.tempo.order
  const sorted = [...terms].sort((a, b) => {
    return tempoOrder[a.id].order - tempoOrder[b.id].order
  })
  return sorted.map(t => t.id)
}

/**
 * Get the correct order for dynamics ordering questions
 * @param {Array} terms - Array of term objects
 * @returns {Array} Array of term IDs in correct order
 */
export const getDynamicsOrder = (terms) => {
  const dynamicsRules = orderingData.dynamics.rules
  
  const getOrder = (term) => {
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
    return getOrder(a) - getOrder(b)
  })
  return sorted.map(t => t.id)
}

/**
 * Get the correct order for an ordering question
 * @param {Object} question - Question object
 * @param {Array} musicTerms - Array of all music terms
 * @param {Function} findTermById - Function to find term by ID
 * @returns {Array} Array of term IDs in correct order
 */
export const getCorrectOrder = (question, musicTerms, findTermById) => {
  if (question.type !== 'ordering' || !question.termIds) {
    console.warn('getCorrectOrder: Invalid question type or missing termIds', question)
    return []
  }
  
  const termIds = question.termIds
  // findTermById is already bound (only takes id), or takes (musicTerms, id)
  // Check if it's a bound function (1 arg) or unbound (2 args)
  const terms = termIds.map(id => {
    // Try bound function first (1 argument)
    if (findTermById.length === 1) {
      return findTermById(id)
    } else {
      // Unbound function (2 arguments)
      return findTermById(musicTerms, id)
    }
  }).filter(t => t !== undefined)
  if (terms.length === 0) {
    console.warn('getCorrectOrder: No terms found for termIds', termIds)
    return []
  }
  
  if (terms.length !== termIds.length) {
    console.warn('getCorrectOrder: Some terms not found. Found:', terms.length, 'Expected:', termIds.length)
  }
  
  // Determine if it's tempo or dynamics from question text
  const isTempo = question.question.toLowerCase().includes('tempo') || 
                 question.question.toLowerCase().includes('slowest') || 
                 question.question.toLowerCase().includes('fastest')
  
  const result = isTempo ? getTempoOrder(terms) : getDynamicsOrder(terms)
  
  if (result.length === 0) {
    console.warn('getCorrectOrder: Sorting returned empty array', { isTempo, termsLength: terms.length })
  }
  
  return result
}
