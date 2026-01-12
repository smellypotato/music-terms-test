/**
 * Utility functions for working with music terms
 */

/**
 * Get the canonical term (first alias) from a term object
 * @param {Object} term - Term object with term array
 * @returns {string} The first alias (canonical term)
 */
export const getCanonicalTerm = (term) => {
  return Array.isArray(term.term) ? term.term[0] : term.term
}

/**
 * Get a random alias from a term object
 * @param {Object} term - Term object with term array
 * @returns {string} A randomly selected alias
 */
export const getRandomAlias = (term) => {
  const aliases = Array.isArray(term.term) ? term.term : [term.term]
  return aliases[Math.floor(Math.random() * aliases.length)]
}

/**
 * Check if two terms match (share any alias)
 * @param {Object} term1 - First term object
 * @param {Object} term2 - Second term object
 * @returns {boolean} True if terms match
 */
export const termsMatch = (term1, term2) => {
  const aliases1 = Array.isArray(term1.term) ? term1.term : [term1.term]
  const aliases2 = Array.isArray(term2.term) ? term2.term : [term2.term]
  return aliases1.some(a1 => aliases2.some(a2 => a1 === a2))
}

/**
 * Check if a term object has a specific alias
 * @param {Object} termObj - Term object
 * @param {string} alias - Alias to check for
 * @returns {boolean} True if term has the alias
 */
export const hasAlias = (termObj, alias) => {
  const aliases = Array.isArray(termObj.term) ? termObj.term : [termObj.term]
  return aliases.includes(alias)
}

/**
 * Find a term by its alias
 * @param {Array} musicTerms - Array of all music terms
 * @param {string} alias - Alias to search for
 * @returns {Object|null} Term object or null if not found
 */
export const findTermByAlias = (musicTerms, alias) => {
  return musicTerms.find(term => {
    const aliases = Array.isArray(term.term) ? term.term : [term.term]
    return aliases.some(a => a.toLowerCase() === alias.toLowerCase())
  })
}

/**
 * Find a term by its ID
 * @param {Array} musicTerms - Array of all music terms
 * @param {string} id - Term ID to search for
 * @returns {Object|null} Term object or null if not found
 */
export const findTermById = (musicTerms, id) => {
  return musicTerms.find(term => term.id === id)
}

/**
 * Find a term by its definition
 * @param {Array} musicTerms - Array of all music terms
 * @param {string} definition - Definition to search for
 * @returns {Object|null} Term object or null if not found
 */
export const findTermByDefinition = (musicTerms, definition) => {
  return musicTerms.find(term => 
    term.definition.toLowerCase() === definition.toLowerCase()
  )
}
