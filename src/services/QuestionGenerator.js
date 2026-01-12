import musicTerms from '../data/musicTerms.json'
import questionFormats from '../data/questionFormats.json'
import orderingData from '../data/orderingData.json'
import compareTerms from '../data/compareTerms.json'
import levels from '../data/levels.json'
import { getCanonicalTerm, getRandomAlias, termsMatch, hasAlias } from '../utils/termUtils'

/**
 * Service class for generating quiz questions
 */
class QuestionGenerator {
  constructor() {
    this.musicTerms = musicTerms
    this.questionFormats = questionFormats
    this.orderingData = orderingData
    this.compareTerms = compareTerms
    this.levels = levels
  }

  /**
   * Generate questions based on configuration
   * @param {Object} config - Quiz configuration
   * @param {number} config.numQuestions - Number of questions to generate
   * @param {string[]} config.selectedTags - Selected tag categories
   * @returns {Array} Array of generated questions
   */
  generateQuestions(config) {
    const { numQuestions, selectedTags, selectedGrade = 0, selectedLevel = 'beginner' } = config
    const languageSelected = selectedTags.includes('Language')
    const otherTags = selectedTags.filter(tag => tag !== 'Language')
    
    // Get allowed question types for the selected level
    const levelConfig = this.levels[selectedLevel] || this.levels.beginner
    const allowedQuestionTypes = levelConfig.questionTypes
    
    // Create grade-filtered terms for MC options (all terms, regardless of tags)
    const gradeFilteredTerms = this.musicTerms.filter(term => {
      if (selectedGrade > 0) {
        const termGrade = term.grade || 0
        if (termGrade === 999 || termGrade > selectedGrade) {
          return false
        }
      }
      return true
    })
    
    // Filter terms based on selected tags and grade (excluding Language for regular filtering)
    const availableTerms = gradeFilteredTerms.filter(term => {
      // Filter by tags
      if (otherTags.length === 0) {
        // No other tags selected - include all terms (after grade filtering)
        return true
      } else {
        // Filter by other tags
        return term.tags.some(tag => otherTags.includes(tag))
      }
    })

    // For language questions, we need terms with languages
    const termsWithLanguage = availableTerms.filter(term => this.getTermLanguage(term) !== null)

    if (availableTerms.length === 0) {
      return []
    }

    const generatedQuestions = []
    const usedTerms = new Set()

    // Get applicable question formats based on selected tags and level
    const applicableFormats = this.questionFormats.filter(format => {
      // First, check if the format's type is allowed for the selected level
      if (!allowedQuestionTypes.includes(format.type)) {
        return false
      }
      // For language-specific formats, check if Language tag is selected
      if (format.applicableTags.includes('Language')) {
        return languageSelected
      }
      // For other formats, check if any of their applicable tags are selected
      return format.applicableTags.some(tag => selectedTags.includes(tag))
    })

    for (let i = 0; i < numQuestions; i++) {
      let question = null
      let attempts = 0
      const maxAttempts = 50

      while (!question && attempts < maxAttempts) {
        const format = applicableFormats[Math.floor(Math.random() * applicableFormats.length)]
        // Use termsWithLanguage for language-specific questions, otherwise use availableTerms
        const termsToUse = format.applicableTags.includes('Language') ? termsWithLanguage : availableTerms
        question = this.generateQuestionByFormat(format, termsToUse, usedTerms, selectedTags, gradeFilteredTerms)
        if (question) {
          question.formatId = format.id
        }
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
   * Get the language of a term
   * @param {Object} term - Term object
   * @returns {string|null} Language name or null if English
   */
  getTermLanguage(term) {
    const languages = ['Italian', 'French', 'German', 'Latin']
    const termLanguage = term.tags.find(tag => languages.includes(tag))
    return termLanguage || null
  }

  /**
   * Check if Language tag is selected
   * @param {string[]} selectedTags - Selected tag categories
   * @returns {boolean} True if Language tag is selected
   */
  isLanguageSelected(selectedTags) {
    return selectedTags.includes('Language')
  }

  /**
   * Format question text with placeholders
   * @param {string} template - Question template
   * @param {object} replacements - Object with placeholder values
   * @returns {string} Formatted question text
   */
  formatQuestion(template, replacements = {}) {
    let formatted = template
    
    // Handle {language} placeholder
    if (replacements.language && formatted.includes('{language}')) {
      formatted = formatted.replace('{language}', replacements.language.toLowerCase())
    }
    
    // Handle {term} placeholder
    if (replacements.term !== undefined) {
      formatted = formatted.replace(/{term}/g, `"${replacements.term}"`)
    }
    
    // Handle {definition} placeholder
    if (replacements.definition !== undefined) {
      formatted = formatted.replace(/{definition}/g, `"${replacements.definition}"`)
    }
    
    // Handle {description} placeholder
    if (replacements.description !== undefined) {
      formatted = formatted.replace(/{description}/g, `"${replacements.description}"`)
    }
    
    return formatted
  }

  /**
   * Format question text with optional language (backward compatibility)
   * @param {string} template - Question template
   * @param {string|null} language - Language name or null
   * @returns {string} Formatted question text
   */
  formatQuestionWithLanguage(template, language) {
    return this.formatQuestion(template, { language })
  }

  /**
   * Generate a question based on format type
   * @param {Object} format - Question format object
   * @param {Array} availableTerms - Available terms to use
   * @param {Set} usedTerms - Set of already used terms
   * @param {string[]} selectedTags - Selected tag categories
   * @param {Array} gradeFilteredTerms - All terms filtered by grade (for MC options)
   * @returns {Object|null} Generated question or null
   */
  generateQuestionByFormat(format, availableTerms, usedTerms, selectedTags, gradeFilteredTerms) {
    // Filter out used terms, but allow reuse if we don't have enough unique terms
    let unusedTerms = availableTerms.filter(t => !usedTerms.has(getCanonicalTerm(t)))
    
    // If no unused terms available, allow reusing terms (for cases with few terms)
    if (unusedTerms.length === 0) {
      unusedTerms = availableTerms
    }
    
    if (unusedTerms.length === 0) return null

    const languageSelected = this.isLanguageSelected(selectedTags)

    switch (format.generate) {
      case 'term_to_definition':
        return this.generateTermToDefinition(unusedTerms, format.type === 'multiple_choice', format, languageSelected, gradeFilteredTerms)
      
      case 'definition_to_term':
        return this.generateDefinitionToTerm(unusedTerms, format.type === 'multiple_choice', format, languageSelected, gradeFilteredTerms)
      
      case 'tempo_ordering':
        return this.generateTempoOrdering(availableTerms, format)
      
      case 'dynamics_ordering':
        return this.generateDynamicsOrdering(availableTerms, format)
      
      case 'similar_terms':
        return this.generateSimilarTerms(unusedTerms, selectedTags, format, gradeFilteredTerms)
      
      case 'opposite_terms':
        return this.generateOppositeTerms(unusedTerms, selectedTags, format, gradeFilteredTerms)
      
      case 'tag_classification':
        return this.generateTagClassification(unusedTerms, format, languageSelected)
      
      case 'context_application':
        return this.generateContextApplication(unusedTerms, selectedTags, format, languageSelected, gradeFilteredTerms)
      
      case 'language_identification':
        return this.generateLanguageIdentification(unusedTerms, format)
      
      case 'same_language_term':
        return this.generateSameLanguageTerm(unusedTerms, selectedTags, format, gradeFilteredTerms)
      
      default:
        return null
    }
  }

  /**
   * Generate term to definition question
   */
  generateTermToDefinition(terms, isMultipleChoice, format, languageSelected, gradeFilteredTerms) {
    const term = terms[Math.floor(Math.random() * terms.length)]
    const correctAnswer = term.definition
    const displayAlias = getRandomAlias(term)
    const canonicalTerm = getCanonicalTerm(term)
    const language = this.getTermLanguage(term)

    // Get description array and randomly select one
    let descriptionArray = languageSelected && format.descriptionWithLanguage
      ? format.descriptionWithLanguage
      : format.description
    
    // Ensure it's an array
    if (!Array.isArray(descriptionArray)) {
      descriptionArray = [descriptionArray]
    }
    
    if (descriptionArray.length === 0) {
      return null
    }
    
    // Randomly select a description
    let questionTemplate = descriptionArray[Math.floor(Math.random() * descriptionArray.length)]
    
    // Format question with placeholders
    const questionText = this.formatQuestion(questionTemplate, {
      language: languageSelected && language ? language : null,
      term: displayAlias
    })

    if (isMultipleChoice) {
      const correctAnswerId = term.id
      const wrongAnswerTerms = gradeFilteredTerms
        .filter(t => t.definition !== correctAnswer)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
      
      // Create options with definitions and map to IDs
      const optionTerms = [term, ...wrongAnswerTerms].sort(() => Math.random() - 0.5)
      const options = []
      const optionToIdMap = {}
      
      optionTerms.forEach(optionTerm => {
        options.push(optionTerm.definition)
        optionToIdMap[optionTerm.definition] = optionTerm.id
      })
      
      return {
        type: 'multiple_choice',
        question: questionText,
        options,
        correctAnswer, // Definition string for display
        correctAnswerId, // Term ID for matching
        optionToIdMap, // Map from definition to term ID
        correctTerm: canonicalTerm
      }
    } else {
      return {
        type: 'short_answer',
        question: questionText,
        correctAnswer,
        correctTerm: canonicalTerm
      }
    }
  }

  /**
   * Generate definition to term question
   */
  generateDefinitionToTerm(terms, isMultipleChoice, format, languageSelected, gradeFilteredTerms) {
    const term = terms[Math.floor(Math.random() * terms.length)]
    const canonicalTerm = getCanonicalTerm(term)
    const displayAlias = getRandomAlias(term)
    const language = this.getTermLanguage(term)

    // Get description array and randomly select one
    let descriptionArray = languageSelected && format.descriptionWithLanguage && language
      ? format.descriptionWithLanguage
      : format.description
    
    // Ensure it's an array
    if (!Array.isArray(descriptionArray)) {
      descriptionArray = [descriptionArray]
    }
    
    if (descriptionArray.length === 0) {
      return null
    }
    
    // Randomly select from description array
    let questionTemplate = descriptionArray[Math.floor(Math.random() * descriptionArray.length)]
    // Format question with placeholders
    const questionText = this.formatQuestion(questionTemplate, {
      language: languageSelected && language ? language : null,
      definition: term.definition
    })

    if (isMultipleChoice) {
      const correctAnswerId = term.id
      const wrongAnswerTerms = gradeFilteredTerms
        .filter(t => !termsMatch(t, term))
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
      
      // Create options with displayed aliases and map to IDs
      const optionTerms = [term, ...wrongAnswerTerms].sort(() => Math.random() - 0.5)
      const options = []
      const optionToIdMap = {}
      let correctAnswerDisplay = null
      
      optionTerms.forEach(optionTerm => {
        const displayedAlias = getRandomAlias(optionTerm)
        options.push(displayedAlias)
        optionToIdMap[displayedAlias] = optionTerm.id
        if (optionTerm.id === correctAnswerId) {
          correctAnswerDisplay = displayedAlias
        }
      })
      
      return {
        type: 'multiple_choice',
        question: questionText,
        options,
        correctAnswer: correctAnswerDisplay,
        correctAnswerId,
        optionToIdMap,
        correctTerm: canonicalTerm
      }
    } else {
      return {
        type: 'short_answer',
        question: questionText,
        correctAnswer: displayAlias,
        correctTerm: canonicalTerm
      }
    }
  }

  /**
   * Generate tempo ordering question
   */
  generateTempoOrdering(allTerms, format) {
    const tempoTerms = allTerms.filter(t => t.tags.includes('Tempo'))
    if (tempoTerms.length < 3) return null

    const tempoOrder = this.orderingData.tempo.order

    // Select terms that have explicit order values
    const availableTerms = tempoTerms.filter(t => {
      return tempoOrder.hasOwnProperty(t.id)
    })
    
    if (availableTerms.length < 3) return null

    // Randomly select 4 terms
    const selectedTerms = availableTerms
      .sort(() => Math.random() - 0.5)
      .slice(0, 4)

    if (selectedTerms.length < 3) return null

    const getTempoOrder = (term) => {
      return tempoOrder[term.id]?.order
    }

    // Randomly shuffle the selected terms for initial display
    const shuffledTerms = [...selectedTerms].sort(() => Math.random() - 0.5)
    const termIds = shuffledTerms.map(t => t.id)
    
    // Create display mapping with random aliases
    const displayMap = {}
    selectedTerms.forEach(t => {
      displayMap[t.id] = getRandomAlias(t)
    })

    // Get description array and randomly select one
    let questionText = 'Order these tempo terms from slowest to fastest:'
    if (format && format.description && Array.isArray(format.description) && format.description.length > 0) {
      questionText = format.description[Math.floor(Math.random() * format.description.length)]
    } else if (format && format.description && !Array.isArray(format.description)) {
      questionText = format.description
    }

    return {
      type: 'ordering',
      question: questionText,
      termIds,
      displayMap
    }
  }

  /**
   * Generate dynamics ordering question
   */
  generateDynamicsOrdering(allTerms, format) {
    const dynamicsRules = this.orderingData.dynamics.rules

    // Only include terms that match the ordering rules (fixed dynamics only)
    const availableDynamicsTerms = allTerms.filter(t => {
      if (!t.tags.includes('Dynamics')) return false
      
      // Check if term ID matches any rule
      for (const rule of dynamicsRules) {
        const matchesRule = rule.ids.some(idObj => idObj.id === t.id)
        if (matchesRule) {
          // Check exclude patterns
          const aliases = Array.isArray(t.term) ? t.term : [t.term]
          const termLower = aliases.join(' ').toLowerCase()
          const hasExclude = rule.exclude && rule.exclude.some(exclude => termLower.includes(exclude))
          if (!hasExclude) {
            return true // This term matches a rule, include it
          }
        }
      }
      return false // Term doesn't match any rule, exclude it
    })
    
    if (availableDynamicsTerms.length < 3) return null

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
      return null // Should not happen if filtering is correct
    }

    // Randomly select 4 terms
    const selectedTerms = availableDynamicsTerms
      .sort(() => Math.random() - 0.5)
      .slice(0, 4)

    if (selectedTerms.length < 3) return null

    // Randomly shuffle the selected terms for initial display
    const shuffledTerms = [...selectedTerms].sort(() => Math.random() - 0.5)
    const termIds = shuffledTerms.map(t => t.id)
    
    // Create display mapping with random aliases
    const displayMap = {}
    selectedTerms.forEach(t => {
      displayMap[t.id] = getRandomAlias(t)
    })

    // Get description array and randomly select one
    let questionText = 'Order these dynamics terms from softest to loudest:'
    if (format && format.description && Array.isArray(format.description) && format.description.length > 0) {
      questionText = format.description[Math.floor(Math.random() * format.description.length)]
    } else if (format && format.description && !Array.isArray(format.description)) {
      questionText = format.description
    }

    return {
      type: 'ordering',
      question: questionText,
      termIds,
      displayMap
    }
  }

  /**
   * Generate similar terms question
   */
  generateSimilarTerms(terms, selectedTags, format, gradeFilteredTerms) {
    const term = terms[Math.floor(Math.random() * terms.length)]
    const canonicalTerm = getCanonicalTerm(term)
    const displayAlias = getRandomAlias(term)
    
    // Find terms with similar definitions or same tag
    const similarTerms = gradeFilteredTerms
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
    const correctAnswerId = correctSimilarTerm.id
    const correctAnswerCanonical = getCanonicalTerm(correctSimilarTerm)

    // Use only similar terms as options (excluding the original term)
    const otherSimilarTerms = similarTerms.slice(1)
    
    // If we don't have enough similar terms, add some unrelated terms as distractors
    let optionTerms = [correctSimilarTerm, ...otherSimilarTerms]
    if (optionTerms.length < 4) {
      const unrelatedTerms = gradeFilteredTerms
        .filter(t => !termsMatch(t, term) && !similarTerms.some(st => termsMatch(t, st)))
        .sort(() => Math.random() - 0.5)
        .slice(0, 4 - optionTerms.length)
      optionTerms = [...optionTerms, ...unrelatedTerms]
    }
    
    optionTerms = optionTerms.sort(() => Math.random() - 0.5)
    
    // Create options with displayed aliases and map to IDs
    const options = []
    const optionToIdMap = {}
    let correctAnswerDisplay = null
    
    optionTerms.forEach(optionTerm => {
      const displayedAlias = getRandomAlias(optionTerm)
      options.push(displayedAlias)
      optionToIdMap[displayedAlias] = optionTerm.id
      if (optionTerm.id === correctAnswerId) {
        correctAnswerDisplay = displayedAlias
      }
    })
    
    // Get description array and randomly select one
    if (!format || !format.description || !Array.isArray(format.description) || format.description.length === 0) {
      return null
    }
    
    const selectedDescription = format.description[Math.floor(Math.random() * format.description.length)]
    const questionText = this.formatQuestion(selectedDescription, { term: displayAlias });
    
    return {
      type: 'multiple_choice',
      question: questionText,
      options,
      correctAnswer: correctAnswerDisplay, // Display the alias that was shown
      correctAnswerId, // Store ID for matching
      optionToIdMap, // Map from displayed alias to term ID
      correctTerm: correctAnswerCanonical,
      questionTerm: displayAlias,
      questionTermCanonical: canonicalTerm
    }
  }

  /**
   * Generate opposite terms question
   */
  generateOppositeTerms(terms, selectedTags, format, gradeFilteredTerms) {
    const opposites = this.compareTerms.opposite

    const availableOpposites = opposites.filter(pair => {
      const termObj = terms.find(t => t.id === pair.termId)
      const oppositeObj = gradeFilteredTerms.find(t => t.id === pair.oppositeId)
      return termObj && oppositeObj
    })

    if (availableOpposites.length === 0) return null

    const pair = availableOpposites[Math.floor(Math.random() * availableOpposites.length)]
    const term = terms.find(t => t.id === pair.termId)
    const oppositeTerm = gradeFilteredTerms.find(t => t.id === pair.oppositeId)

    if (!term || !oppositeTerm) return null

    const displayAlias = getRandomAlias(term)
    const oppositeId = oppositeTerm.id

    const wrongAnswerTerms = gradeFilteredTerms
      .filter(t => t.id !== oppositeId && t.id !== term.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)

    // Create options with displayed aliases and map to IDs
    const optionTerms = [oppositeTerm, ...wrongAnswerTerms].sort(() => Math.random() - 0.5)
    const options = []
    const optionToIdMap = {}
    let correctAnswerDisplay = null
    
    optionTerms.forEach(optionTerm => {
      const displayedAlias = getRandomAlias(optionTerm)
      options.push(displayedAlias)
      optionToIdMap[displayedAlias] = optionTerm.id
      if (optionTerm.id === oppositeId) {
        correctAnswerDisplay = displayedAlias
      }
    })

    // Get description array and randomly select one
    if (!format || !format.description || !Array.isArray(format.description) || format.description.length === 0) {
      return null
    }
    
    const selectedDescription = format.description[Math.floor(Math.random() * format.description.length)]
    const questionText = this.formatQuestion(selectedDescription, { term: displayAlias });

    return {
      type: 'multiple_choice',
      question: questionText,
      options,
      correctAnswer: correctAnswerDisplay,
      correctAnswerId: oppositeId,
      optionToIdMap,
      correctTerm: getCanonicalTerm(oppositeTerm),
      questionTerm: displayAlias,
      questionTermCanonical: getCanonicalTerm(term)
    }
  }

  /**
   * Generate tag classification question
   */
  generateTagClassification(terms, format, languageSelected) {
    const term = terms[Math.floor(Math.random() * terms.length)]
    // Get the first non-language tag as correct answer (category tag)
    const languages = ['Italian', 'French', 'German', 'Latin']
    const correctTag = term.tags.find(tag => !languages.includes(tag) && tag !== 'Language')
    const displayAlias = getRandomAlias(term)
    const canonicalTerm = getCanonicalTerm(term)
    const language = this.getTermLanguage(term)

    const allTags = ['Tempo', 'Dynamics', 'Style/Expression', 'Articulation', 
                     'Technique/Instruction', 'Form/Direction', 'Qualifier', 'Theory/Harmony']
    const wrongTags = allTags.filter(tag => tag !== correctTag)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)

    const options = [correctTag, ...wrongTags].sort(() => Math.random() - 0.5)

    // Get description array and randomly select one
    let descriptionArray = languageSelected && format.descriptionWithLanguage && language
      ? format.descriptionWithLanguage
      : format.description
    
    // Ensure it's an array
    if (!Array.isArray(descriptionArray)) {
      descriptionArray = [descriptionArray]
    }
    
    if (descriptionArray.length === 0) {
      return null
    }
    
    // Randomly select a description
    let questionTemplate = descriptionArray[Math.floor(Math.random() * descriptionArray.length)]
    
    // Format question with placeholders
    const questionText = this.formatQuestion(questionTemplate, {
      language: languageSelected && language ? language : null,
      term: displayAlias
    })

    return {
      type: 'multiple_choice',
      question: questionText,
      options,
      correctAnswer: correctTag,
      correctTerm: canonicalTerm
    }
  }

  /**
   * Generate context application question
   */
  generateContextApplication(terms, selectedTags, format, languageSelected, gradeFilteredTerms) {
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
    const language = this.getTermLanguage(correctTerm)

    const correctAnswerId = correctTerm.id
    const wrongAnswerTerms = gradeFilteredTerms
      .filter(t => !context.termAliases.some(alias => hasAlias(t, alias)))
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)

    // Create options with displayed aliases and map to IDs
    const optionTerms = [correctTerm, ...wrongAnswerTerms].sort(() => Math.random() - 0.5)
    const options = []
    const optionToIdMap = {}
    let correctAnswerDisplay = null
    
    optionTerms.forEach(optionTerm => {
      const displayedAlias = getRandomAlias(optionTerm)
      options.push(displayedAlias)
      optionToIdMap[displayedAlias] = optionTerm.id
      if (optionTerm.id === correctAnswerId) {
        correctAnswerDisplay = displayedAlias
      }
    })

    // Get description array and randomly select one
    let descriptionArray = languageSelected && format.descriptionWithLanguage && language
      ? format.descriptionWithLanguage
      : format.description
    
    // Ensure it's an array
    if (!Array.isArray(descriptionArray)) {
      descriptionArray = [descriptionArray]
    }
    
    if (descriptionArray.length === 0) {
      return null
    }
    
    // Randomly select a description
    let questionTemplate = descriptionArray[Math.floor(Math.random() * descriptionArray.length)]
    
    // Format question with placeholders
    const questionText = this.formatQuestion(questionTemplate, {
      language: languageSelected && language ? language : null,
      description: context.description
    })

    return {
      type: 'multiple_choice',
      question: questionText,
      options,
      correctAnswer: correctAnswerDisplay,
      correctAnswerId,
      optionToIdMap,
      correctTerm: getCanonicalTerm(correctTerm)
    }
  }

  /**
   * Generate language identification question
   */
  generateLanguageIdentification(terms, format) {
    const term = terms[Math.floor(Math.random() * terms.length)]
    const language = this.getTermLanguage(term)
    
    if (!language) return null // Skip if no language (English)

    const displayAlias = getRandomAlias(term)
    const canonicalTerm = getCanonicalTerm(term)

    const allLanguages = ['Italian', 'French', 'German', 'Latin']
    const wrongLanguages = allLanguages.filter(lang => lang !== language)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)

    const options = [language, ...wrongLanguages].sort(() => Math.random() - 0.5)

    // Get description array and randomly select one
    if (!format || !format.description || !Array.isArray(format.description) || format.description.length === 0) {
      return null
    }
    
    const selectedDescription = format.description[Math.floor(Math.random() * format.description.length)]
    const questionText = this.formatQuestion(selectedDescription, {
      term: displayAlias
    })

    return {
      type: 'multiple_choice',
      question: questionText,
      options,
      correctAnswer: language,
      correctTerm: canonicalTerm,
      questionTerm: displayAlias
    }
  }

  /**
   * Generate same language term question
   */
  generateSameLanguageTerm(terms, selectedTags, format, gradeFilteredTerms) {
    // Get a random term with a language from available terms
    const termsWithLanguage = terms.filter(t => this.getTermLanguage(t) !== null)
    if (termsWithLanguage.length === 0) return null

    const term = termsWithLanguage[Math.floor(Math.random() * termsWithLanguage.length)]
    const language = this.getTermLanguage(term)
    if (!language) return null

    const displayAlias = getRandomAlias(term)
    const canonicalTerm = getCanonicalTerm(term)

    // Find other terms in the same language (from grade-filtered terms)
    const sameLanguageTerms = gradeFilteredTerms.filter(t => {
      const tLanguage = this.getTermLanguage(t)
      return tLanguage === language && !termsMatch(t, term)
    })

    if (sameLanguageTerms.length < 3) return null

    const correctAnswerId = term.id
    // Select 3 wrong answers from same language terms
    const wrongAnswerTerms = sameLanguageTerms
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)

    // Create options with displayed aliases and map to IDs
    const optionTerms = [term, ...wrongAnswerTerms].sort(() => Math.random() - 0.5)
    const options = []
    const optionToIdMap = {}
    let correctAnswerDisplay = null
    
    optionTerms.forEach(optionTerm => {
      const displayedAlias = getRandomAlias(optionTerm)
      options.push(displayedAlias)
      optionToIdMap[displayedAlias] = optionTerm.id
      if (optionTerm.id === correctAnswerId) {
        correctAnswerDisplay = displayedAlias
      }
    })

    // Get description array and randomly select one
    if (!format || !format.description || !Array.isArray(format.description) || format.description.length === 0) {
      return null
    }
    
    const selectedDescription = format.description[Math.floor(Math.random() * format.description.length)]
    // Format question with placeholders
    const questionText = this.formatQuestion(selectedDescription, {
      language: language,
      definition: term.definition
    }) + '?'

    return {
      type: 'multiple_choice',
      question: questionText,
      options,
      correctAnswer: correctAnswerDisplay,
      correctAnswerId,
      optionToIdMap,
      correctTerm: canonicalTerm
    }
  }
}

// Export singleton instance
export default new QuestionGenerator()

