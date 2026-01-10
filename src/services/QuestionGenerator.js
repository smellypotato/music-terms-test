import musicTerms from '../data/musicTerms.json'
import questionFormats from '../data/questionFormats.json'
import orderingData from '../data/orderingData.json'
import { getCanonicalTerm, getRandomAlias, termsMatch, hasAlias } from '../utils/termUtils'

/**
 * Service class for generating quiz questions
 */
class QuestionGenerator {
  constructor() {
    this.musicTerms = musicTerms
    this.questionFormats = questionFormats
    this.orderingData = orderingData
  }

  /**
   * Generate questions based on configuration
   * @param {Object} config - Quiz configuration
   * @param {number} config.numQuestions - Number of questions to generate
   * @param {string[]} config.selectedTags - Selected tag categories
   * @returns {Array} Array of generated questions
   */
  generateQuestions(config) {
    const { numQuestions, selectedTags } = config
    const availableTerms = this.musicTerms.filter(term => 
      term.tags.some(tag => selectedTags.includes(tag))
    )

    if (availableTerms.length === 0) {
      return []
    }

    const generatedQuestions = []
    const usedTerms = new Set()

    // Get applicable question formats based on selected tags
    const applicableFormats = this.questionFormats.filter(format =>
      format.applicableTags.some(tag => selectedTags.includes(tag))
    )

    for (let i = 0; i < numQuestions; i++) {
      let question = null
      let attempts = 0
      const maxAttempts = 50

      while (!question && attempts < maxAttempts) {
        const format = applicableFormats[Math.floor(Math.random() * applicableFormats.length)]
        question = this.generateQuestionByFormat(format, availableTerms, usedTerms, selectedTags)
        attempts++
      }

      if (question) {
        generatedQuestions.push(question)
        usedTerms.add(question.correctTerm)
      }
    }

    return generatedQuestions
  }

  /**
   * Generate a question based on format type
   * @param {Object} format - Question format object
   * @param {Array} availableTerms - Available terms to use
   * @param {Set} usedTerms - Set of already used terms
   * @param {string[]} selectedTags - Selected tag categories
   * @returns {Object|null} Generated question or null
   */
  generateQuestionByFormat(format, availableTerms, usedTerms, selectedTags) {
    const unusedTerms = availableTerms.filter(t => !usedTerms.has(getCanonicalTerm(t)))
    if (unusedTerms.length === 0) return null

    switch (format.generate) {
      case 'term_to_definition':
        return this.generateTermToDefinition(unusedTerms, format.type === 'multiple_choice')
      
      case 'definition_to_term':
        return this.generateDefinitionToTerm(unusedTerms, format.type === 'multiple_choice')
      
      case 'tempo_ordering':
        return this.generateTempoOrdering(availableTerms)
      
      case 'dynamics_ordering':
        return this.generateDynamicsOrdering(availableTerms)
      
      case 'similar_terms':
        return this.generateSimilarTerms(unusedTerms, selectedTags)
      
      case 'opposite_terms':
        return this.generateOppositeTerms(unusedTerms, selectedTags)
      
      case 'tag_classification':
        return this.generateTagClassification(unusedTerms)
      
      case 'context_application':
        return this.generateContextApplication(unusedTerms, selectedTags)
      
      default:
        return null
    }
  }

  /**
   * Generate term to definition question
   */
  generateTermToDefinition(terms, isMultipleChoice) {
    const term = terms[Math.floor(Math.random() * terms.length)]
    const correctAnswer = term.definition
    const displayAlias = getRandomAlias(term)
    const canonicalTerm = getCanonicalTerm(term)

    if (isMultipleChoice) {
      const wrongAnswers = this.musicTerms
        .filter(t => t.definition !== correctAnswer)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(t => t.definition)
      
      const options = [correctAnswer, ...wrongAnswers].sort(() => Math.random() - 0.5)
      
      return {
        type: 'multiple_choice',
        question: `What is the meaning of "${displayAlias}"?`,
        options,
        correctAnswer,
        correctTerm: canonicalTerm
      }
    } else {
      return {
        type: 'short_answer',
        question: `What is the meaning of "${displayAlias}"?`,
        correctAnswer,
        correctTerm: canonicalTerm
      }
    }
  }

  /**
   * Generate definition to term question
   */
  generateDefinitionToTerm(terms, isMultipleChoice) {
    const term = terms[Math.floor(Math.random() * terms.length)]
    const canonicalTerm = getCanonicalTerm(term)
    const displayAlias = getRandomAlias(term)

    const questionTemplates = [
      `Which term means "${term.definition}"?`,
      `What is the term for "${term.definition}"?`,
      `Select the term that means "${term.definition}":`,
      `Which musical term describes "${term.definition}"?`,
      `Identify the term meaning "${term.definition}":`
    ]
    const selectedQuestion = questionTemplates[Math.floor(Math.random() * questionTemplates.length)]

    if (isMultipleChoice) {
      const wrongAnswers = this.musicTerms
        .filter(t => !termsMatch(t, term))
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(t => getRandomAlias(t))
      
      const options = [displayAlias, ...wrongAnswers].sort(() => Math.random() - 0.5)
      
      return {
        type: 'multiple_choice',
        question: selectedQuestion,
        options,
        correctAnswer: displayAlias,
        correctTerm: canonicalTerm
      }
    } else {
      return {
        type: 'short_answer',
        question: selectedQuestion,
        correctAnswer: displayAlias,
        correctTerm: canonicalTerm
      }
    }
  }

  /**
   * Generate tempo ordering question
   */
  generateTempoOrdering(allTerms) {
    const tempoTerms = allTerms.filter(t => t.tags.includes('Tempo'))
    if (tempoTerms.length < 3) return null

    const tempoOrder = this.orderingData.tempo.order

    const selectedTerms = tempoTerms
      .filter(t => {
        const firstAlias = getCanonicalTerm(t).toLowerCase()
        return Object.keys(tempoOrder).some(key => firstAlias.includes(key))
      })
      .sort(() => Math.random() - 0.5)
      .slice(0, 4)

    if (selectedTerms.length < 3) return null

    const getTempoOrder = (term) => {
      const firstAlias = getCanonicalTerm(term).toLowerCase()
      for (const [key, value] of Object.entries(tempoOrder)) {
        if (firstAlias.includes(key)) return value
      }
      return 5
    }

    const correctOrder = [...selectedTerms].sort((a, b) => {
      return getTempoOrder(a) - getTempoOrder(b)
    })

    // Store term IDs (canonical terms) for ordering
    const termIds = selectedTerms.map(t => getCanonicalTerm(t))
    const correctOrderIds = correctOrder.map(t => getCanonicalTerm(t))
    
    // Create display mapping with random aliases
    const displayMap = {}
    selectedTerms.forEach(t => {
      displayMap[getCanonicalTerm(t)] = getRandomAlias(t)
    })

    return {
      type: 'ordering',
      question: 'Order these tempo terms from slowest to fastest:',
      termIds,
      displayMap,
      correctOrderIds,
      correctAnswer: correctOrderIds.join(','),
      correctTerm: correctOrderIds.join(',')
    }
  }

  /**
   * Generate dynamics ordering question
   */
  generateDynamicsOrdering(allTerms) {
    const dynamicsTerms = allTerms.filter(t => t.tags.includes('Dynamics'))
    if (dynamicsTerms.length < 3) return null

    const dynamicsRules = this.orderingData.dynamics.rules
    const defaultOrder = this.orderingData.dynamics.defaultOrder

    const getDynamicsOrder = (term) => {
      const aliases = Array.isArray(term.term) ? term.term : [term.term]
      const termLower = aliases.join(' ').toLowerCase()
      
      for (const rule of dynamicsRules) {
        const hasKeyword = rule.keywords.some(keyword => termLower.includes(keyword))
        if (hasKeyword) {
          const hasExclude = rule.exclude && rule.exclude.some(exclude => termLower.includes(exclude))
          if (!hasExclude) {
            return rule.order
          }
        }
      }
      return defaultOrder
    }

    const selectedTerms = dynamicsTerms
      .sort(() => Math.random() - 0.5)
      .slice(0, 4)

    if (selectedTerms.length < 3) return null

    const correctOrder = [...selectedTerms].sort((a, b) => {
      return getDynamicsOrder(a) - getDynamicsOrder(b)
    })

    // Store term IDs (canonical terms) for ordering
    const termIds = selectedTerms.map(t => getCanonicalTerm(t))
    const correctOrderIds = correctOrder.map(t => getCanonicalTerm(t))
    
    // Create display mapping with random aliases
    const displayMap = {}
    selectedTerms.forEach(t => {
      displayMap[getCanonicalTerm(t)] = getRandomAlias(t)
    })

    return {
      type: 'ordering',
      question: 'Order these dynamics terms from softest to loudest:',
      termIds,
      displayMap,
      correctOrderIds,
      correctAnswer: correctOrderIds.join(','),
      correctTerm: correctOrderIds.join(',')
    }
  }

  /**
   * Generate similar terms question
   */
  generateSimilarTerms(terms, selectedTags) {
    const term = terms[Math.floor(Math.random() * terms.length)]
    const canonicalTerm = getCanonicalTerm(term)
    const displayAlias = getRandomAlias(term)
    
    // Find terms with similar definitions or same tag
    const similarTerms = this.musicTerms
      .filter(t => 
        !termsMatch(t, term) && 
        (t.tags.some(tag => term.tags.includes(tag)) || 
         t.definition.toLowerCase().includes(term.definition.split(' ')[0].toLowerCase()) ||
         term.definition.toLowerCase().includes(t.definition.split(' ')[0].toLowerCase()))
      )
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)

    if (similarTerms.length < 2) return null

    // Select one of the similar terms as the correct answer
    const correctSimilarTerm = similarTerms[0]
    const correctAnswerAlias = getRandomAlias(correctSimilarTerm)
    const correctAnswerCanonical = getCanonicalTerm(correctSimilarTerm)

    // Use only similar terms as options (excluding the original term)
    const otherSimilarTerms = similarTerms.slice(1)
    
    // If we don't have enough similar terms, add some unrelated terms as distractors
    let options = [correctSimilarTerm, ...otherSimilarTerms]
    if (options.length < 4) {
      const unrelatedTerms = this.musicTerms
        .filter(t => !termsMatch(t, term) && !similarTerms.some(st => termsMatch(t, st)))
        .sort(() => Math.random() - 0.5)
        .slice(0, 4 - options.length)
      options = [...options, ...unrelatedTerms]
    }
    
    options = options.sort(() => Math.random() - 0.5)
    
    return {
      type: 'multiple_choice',
      question: `Which term is most similar in meaning to "${displayAlias}"?`,
      options: options.map(t => getRandomAlias(t)),
      correctAnswer: correctAnswerAlias,
      correctTerm: correctAnswerCanonical
    }
  }

  /**
   * Generate opposite terms question
   */
  generateOppositeTerms(terms, selectedTags) {
    const opposites = [
      { termAlias: 'piano', oppositeAlias: 'forte' },
      { termAlias: 'pianissimo', oppositeAlias: 'fortissimo' },
      { termAlias: 'crescendo', oppositeAlias: 'decrescendo' },
      { termAlias: 'accelerando', oppositeAlias: 'rallentando' },
      { termAlias: 'legato', oppositeAlias: 'staccato' },
      { termAlias: 'lento', oppositeAlias: 'presto' },
      { termAlias: 'adagio', oppositeAlias: 'allegro' }
    ]

    const availableOpposites = opposites.filter(pair => {
      const termObj = terms.find(t => hasAlias(t, pair.termAlias))
      const oppositeObj = this.musicTerms.find(t => hasAlias(t, pair.oppositeAlias))
      return termObj && oppositeObj
    })

    if (availableOpposites.length === 0) return null

    const pair = availableOpposites[Math.floor(Math.random() * availableOpposites.length)]
    const term = terms.find(t => hasAlias(t, pair.termAlias))
    const oppositeTerm = this.musicTerms.find(t => hasAlias(t, pair.oppositeAlias))

    if (!term || !oppositeTerm) return null

    const displayAlias = getRandomAlias(term)
    const oppositeDisplayAlias = getRandomAlias(oppositeTerm)

    const wrongAnswers = this.musicTerms
      .filter(t => !termsMatch(t, oppositeTerm) && !termsMatch(t, term))
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(t => getRandomAlias(t))

    const options = [oppositeDisplayAlias, ...wrongAnswers].sort(() => Math.random() - 0.5)

    return {
      type: 'multiple_choice',
      question: `Which term is the opposite of "${displayAlias}"?`,
      options,
      correctAnswer: oppositeDisplayAlias,
      correctTerm: getCanonicalTerm(oppositeTerm)
    }
  }

  /**
   * Generate tag classification question
   */
  generateTagClassification(terms) {
    const term = terms[Math.floor(Math.random() * terms.length)]
    const correctTag = term.tags[0]
    const displayAlias = getRandomAlias(term)
    const canonicalTerm = getCanonicalTerm(term)

    const allTags = ['Tempo', 'Dynamics', 'Style/Expression', 'Articulation', 
                     'Technique/Instruction', 'Form/Direction', 'Qualifier', 'Theory/Harmony']
    const wrongTags = allTags.filter(tag => tag !== correctTag)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)

    const options = [correctTag, ...wrongTags].sort(() => Math.random() - 0.5)

    return {
      type: 'multiple_choice',
      question: `Which tag category does "${displayAlias}" belong to?`,
      options,
      correctAnswer: correctTag,
      correctTerm: canonicalTerm
    }
  }

  /**
   * Generate context application question
   */
  generateContextApplication(terms, selectedTags) {
    const contexts = [
      { description: 'The music should gradually get louder', termAliases: ['crescendo'] },
      { description: 'The music should gradually get softer', termAliases: ['decrescendo', 'diminuendo'] },
      { description: 'Play at a walking pace', termAliases: ['andante'] },
      { description: 'Play very fast', termAliases: ['presto', 'prestissimo', 'vivace', 'vivo'] },
      { description: 'Play smoothly and connected', termAliases: ['legato'] },
      { description: 'Play with short, detached notes', termAliases: ['staccato'] },
      { description: 'Play with expression', termAliases: ['espressivo', 'con espressione'] },
      { description: 'Play sweetly', termAliases: ['dolce'] },
      { description: 'Play with fire and energy', termAliases: ['con fuoco'] },
      { description: 'Play slowly and solemnly', termAliases: ['grave', 'adagio'] }
    ]

    const availableContexts = contexts.filter(ctx =>
      ctx.termAliases.some(alias => terms.some(term => hasAlias(term, alias)))
    )

    if (availableContexts.length === 0) return null

    const context = availableContexts[Math.floor(Math.random() * availableContexts.length)]
    const correctTerm = terms.find(t => context.termAliases.some(alias => hasAlias(t, alias)))

    if (!correctTerm) return null

    const displayAlias = getRandomAlias(correctTerm)

    const wrongAnswers = this.musicTerms
      .filter(t => !context.termAliases.some(alias => hasAlias(t, alias)))
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(t => getRandomAlias(t))

    const options = [displayAlias, ...wrongAnswers].sort(() => Math.random() - 0.5)

    return {
      type: 'multiple_choice',
      question: `Which term would be most suitable for: "${context.description}"?`,
      options,
      correctAnswer: displayAlias,
      correctTerm: getCanonicalTerm(correctTerm)
    }
  }
}

// Export singleton instance
export default new QuestionGenerator()

