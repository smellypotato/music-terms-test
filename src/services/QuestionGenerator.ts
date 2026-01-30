import musicTermsData from '../data/musicTerms.json'
import questionFormatsData from '../data/questionFormats.json'
import orderingDataRaw from '../data/orderingData.json'
import compareTermsData from '../data/compareTerms.json'
import levelsData from '../data/levels.json'
import { getCanonicalTerm, getRandomAlias, termsMatch, hasAlias } from '../utils/termUtils'
import type {
  MusicTerm,
  QuizConfig,
  QuestionFormat,
  Question,
  GeneratedQuestion,
  LevelsConfig,
  CompareTermsData
} from '../types'

interface OrderingDataShape {
  tempo: { order: Record<string, { order: number; description?: string }> }
  dynamics: { rules: Array<{ ids: Array<{ id: string }>; exclude?: string[]; order: number }> }
}

const musicTerms = musicTermsData as MusicTerm[]
const questionFormats = questionFormatsData as QuestionFormat[]
const orderingData = orderingDataRaw as OrderingDataShape
const compareTerms = compareTermsData as CompareTermsData
const levels = levelsData as LevelsConfig

class QuestionGenerator {
  private musicTerms: MusicTerm[] = musicTerms
  private questionFormats: QuestionFormat[] = questionFormats
  private orderingData: OrderingDataShape = orderingData
  private compareTerms: CompareTermsData = compareTerms
  private levels: LevelsConfig = levels

  generateQuestions(config: QuizConfig): GeneratedQuestion[] {
    const {
      numQuestions,
      selectedTags,
      selectedGrade = 0,
      selectedLevel = 'beginner'
    } = config
    const languageSelected = selectedTags.includes('Language')
    const otherTags = selectedTags.filter(tag => tag !== 'Language')

    const levelConfig = this.levels[selectedLevel as keyof LevelsConfig] ?? this.levels.beginner
    const allowedQuestionTypes = levelConfig.questionTypes

    const gradeFilteredTerms = this.musicTerms.filter(term => {
      if (selectedGrade > 0) {
        const termGrade = term.grade ?? 0
        if (termGrade === 999 || termGrade > selectedGrade) return false
      }
      return true
    })

    const availableTerms = gradeFilteredTerms.filter(term => {
      if (otherTags.length === 0) return true
      return term.tags.some(tag => otherTags.includes(tag))
    })

    const termsWithLanguage = availableTerms.filter(
      term => this.getTermLanguage(term) !== null
    )

    if (availableTerms.length === 0) return []

    const generatedQuestions: GeneratedQuestion[] = []
    const usedTerms = new Set<string>()

    const applicableFormats = this.questionFormats.filter(format => {
      if (format.enabled === false) return false
      if (!allowedQuestionTypes.includes(format.type)) return false
      if (format.applicableTags.includes('Language')) return languageSelected
      return format.applicableTags.some(tag => selectedTags.includes(tag))
    })

    for (let i = 0; i < numQuestions; i++) {
      let question: GeneratedQuestion | null = null
      let attempts = 0
      const maxAttempts = 50

      while (!question && attempts < maxAttempts) {
        const format =
          applicableFormats[Math.floor(Math.random() * applicableFormats.length)]
        const termsToUse = format.applicableTags.includes('Language')
          ? termsWithLanguage
          : availableTerms
        question = this.generateQuestionByFormat(
          format,
          termsToUse,
          usedTerms,
          selectedTags,
          gradeFilteredTerms
        )
        if (question) {
          question.formatId = format.id
        }
        attempts++
      }

      if (question) {
        generatedQuestions.push(question)
        if ('correctTerm' in question && question.correctTerm) {
          usedTerms.add(question.correctTerm)
        }
      }
    }

    return generatedQuestions
  }

  getTermLanguage(term: MusicTerm): string | null {
    const languages = ['Italian', 'French', 'German', 'Latin']
    const termLanguage = term.tags.find(tag => languages.includes(tag))
    return termLanguage ?? null
  }

  formatQuestion(
    template: string,
    replacements: Record<string, string | null | undefined> = {}
  ): string {
    let formatted = template

    if (formatted.includes('{language}')) {
      if (replacements.language) {
        formatted = formatted.replace(
          '{language}',
          replacements.language.toLowerCase()
        )
      } else {
        formatted = formatted.replace(/\bthis\s+\{language\}\s+term\b/gi, 'this term')
        formatted = formatted.replace(/\{language\}\s+/gi, '')
        formatted = formatted.replace(/\s+\{language\}/gi, '')
        formatted = formatted.replace(/\{language\}/g, '')
      }
    }

    if (replacements.term !== undefined) {
      formatted = formatted.replace(/{term}/g, `"${replacements.term}"`)
    }
    if (replacements.definition !== undefined) {
      formatted = formatted.replace(/{definition}/g, `"${replacements.definition}"`)
    }
    if (replacements.description !== undefined) {
      formatted = formatted.replace(/{description}/g, `"${replacements.description}"`)
    }

    return formatted
  }

  generateQuestionByFormat(
    format: QuestionFormat,
    availableTerms: MusicTerm[],
    usedTerms: Set<string>,
    selectedTags: string[],
    gradeFilteredTerms: MusicTerm[]
  ): GeneratedQuestion | null {
    let unusedTerms = availableTerms.filter(
      t => !usedTerms.has(getCanonicalTerm(t))
    )
    if (unusedTerms.length === 0) unusedTerms = availableTerms
    if (unusedTerms.length === 0) return null

    const languageSelected = selectedTags.includes('Language')

    switch (format.generate) {
      case 'term_to_definition':
        return this.generateTermToDefinition(
          unusedTerms,
          format.type === 'multiple_choice',
          format,
          languageSelected,
          gradeFilteredTerms
        )
      case 'definition_to_term':
        return this.generateDefinitionToTerm(
          unusedTerms,
          format.type === 'multiple_choice',
          format,
          languageSelected,
          gradeFilteredTerms
        )
      case 'tempo_ordering':
        return this.generateTempoOrdering(availableTerms, format)
      case 'dynamics_ordering':
        return this.generateDynamicsOrdering(availableTerms, format)
      case 'similar_terms':
        return this.generateSimilarTerms(
          unusedTerms,
          selectedTags,
          format,
          gradeFilteredTerms
        )
      case 'opposite_terms':
        return this.generateOppositeTerms(
          unusedTerms,
          selectedTags,
          format,
          gradeFilteredTerms
        )
      case 'tag_classification':
        return this.generateTagClassification(
          unusedTerms,
          format,
          languageSelected
        )
      case 'context_application':
        return this.generateContextApplication(
          unusedTerms,
          selectedTags,
          format,
          languageSelected,
          gradeFilteredTerms
        )
      case 'language_identification':
        return this.generateLanguageIdentification(unusedTerms, format)
      case 'same_language_term':
        return this.generateSameLanguageTerm(
          unusedTerms,
          selectedTags,
          format,
          gradeFilteredTerms
        )
      default:
        return null
    }
  }

  private generateTermToDefinition(
    terms: MusicTerm[],
    isMultipleChoice: boolean,
    format: QuestionFormat,
    languageSelected: boolean,
    gradeFilteredTerms: MusicTerm[]
  ): GeneratedQuestion | null {
    const term = terms[Math.floor(Math.random() * terms.length)]
    const correctAnswer = term.definition
    const displayAlias = getRandomAlias(term)
    const canonicalTerm = getCanonicalTerm(term)
    const language = this.getTermLanguage(term)

    let descriptionArray: string[] = Array.isArray(
      languageSelected && format.descriptionWithLanguage && language
        ? format.descriptionWithLanguage
        : format.description
    )
      ? (languageSelected && format.descriptionWithLanguage && language
          ? format.descriptionWithLanguage
          : format.description) as string[]
      : [format.description as string]

    if (descriptionArray.length === 0) return null

    const questionTemplate =
      descriptionArray[Math.floor(Math.random() * descriptionArray.length)]
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

      const optionTerms = [term, ...wrongAnswerTerms].sort(
        () => Math.random() - 0.5
      )
      const options: string[] = []
      const optionToIdMap: Record<string, string> = {}
      optionTerms.forEach(optionTerm => {
        options.push(optionTerm.definition)
        optionToIdMap[optionTerm.definition] = optionTerm.id
      })

      return {
        type: 'multiple_choice',
        question: questionText,
        options,
        correctAnswer,
        correctAnswerId,
        optionToIdMap,
        correctTerm: canonicalTerm
      }
    }
    return {
      type: 'short_answer',
      question: questionText,
      correctAnswer,
      correctTerm: canonicalTerm
    }
  }

  private generateDefinitionToTerm(
    terms: MusicTerm[],
    isMultipleChoice: boolean,
    format: QuestionFormat,
    languageSelected: boolean,
    gradeFilteredTerms: MusicTerm[]
  ): GeneratedQuestion | null {
    const term = terms[Math.floor(Math.random() * terms.length)]
    const canonicalTerm = getCanonicalTerm(term)
    const displayAlias = getRandomAlias(term)
    const language = this.getTermLanguage(term)

    let descriptionArray: string[] = Array.isArray(
      languageSelected && format.descriptionWithLanguage && language
        ? format.descriptionWithLanguage
        : format.description
    )
      ? (languageSelected && format.descriptionWithLanguage && language
          ? format.descriptionWithLanguage
          : format.description) as string[]
      : [format.description as string]

    if (descriptionArray.length === 0) return null

    const questionTemplate =
      descriptionArray[Math.floor(Math.random() * descriptionArray.length)]
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

      const optionTerms = [term, ...wrongAnswerTerms].sort(
        () => Math.random() - 0.5
      )
      const options: string[] = []
      const optionToIdMap: Record<string, string> = {}
      let correctAnswerDisplay: string | null = null
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
        correctAnswer: correctAnswerDisplay!,
        correctAnswerId,
        optionToIdMap,
        correctTerm: canonicalTerm
      }
    }
    return {
      type: 'short_answer',
      question: questionText,
      correctAnswer: displayAlias,
      correctTerm: canonicalTerm
    }
  }

  private generateTempoOrdering(
    allTerms: MusicTerm[],
    format: QuestionFormat
  ): GeneratedQuestion | null {
    const tempoTerms = allTerms.filter(t => t.tags.includes('Tempo'))
    if (tempoTerms.length < 3) return null

    const tempoOrder = this.orderingData.tempo.order
    const availableTerms = tempoTerms.filter(t =>
      Object.prototype.hasOwnProperty.call(tempoOrder, t.id)
    )
    if (availableTerms.length < 3) return null

    const selectedTerms = availableTerms
      .sort(() => Math.random() - 0.5)
      .slice(0, 4)
    if (selectedTerms.length < 3) return null

    const shuffledTerms = [...selectedTerms].sort(() => Math.random() - 0.5)
    const termIds = shuffledTerms.map(t => t.id)
    const displayMap: Record<string, string> = {}
    selectedTerms.forEach(t => {
      displayMap[t.id] = getRandomAlias(t)
    })

    let questionText = 'Order these tempo terms from slowest to fastest:'
    const desc = format.description
    if (format && desc && Array.isArray(desc) && desc.length > 0) {
      questionText = desc[Math.floor(Math.random() * desc.length)]
    } else if (format && desc && !Array.isArray(desc)) {
      questionText = desc as string
    }

    return {
      type: 'ordering',
      question: questionText,
      termIds,
      displayMap
    }
  }

  private generateDynamicsOrdering(
    allTerms: MusicTerm[],
    format: QuestionFormat
  ): GeneratedQuestion | null {
    const dynamicsRules = this.orderingData.dynamics.rules
    const availableDynamicsTerms = allTerms.filter(t => {
      if (!t.tags.includes('Dynamics')) return false
      for (const rule of dynamicsRules) {
        const matchesRule = rule.ids.some(idObj => idObj.id === t.id)
        if (matchesRule) {
          const aliases = Array.isArray(t.term) ? t.term : [t.term]
          const termLower = aliases.join(' ').toLowerCase()
          const hasExclude =
            rule.exclude && rule.exclude.some(ex => termLower.includes(ex))
          if (!hasExclude) return true
        }
      }
      return false
    })

    if (availableDynamicsTerms.length < 3) return null

    const selectedTerms = availableDynamicsTerms
      .sort(() => Math.random() - 0.5)
      .slice(0, 4)
    if (selectedTerms.length < 3) return null

    const shuffledTerms = [...selectedTerms].sort(() => Math.random() - 0.5)
    const termIds = shuffledTerms.map(t => t.id)
    const displayMap: Record<string, string> = {}
    selectedTerms.forEach(t => {
      displayMap[t.id] = getRandomAlias(t)
    })

    let questionText = 'Order these dynamics terms from softest to loudest:'
    const desc = format.description
    if (format && desc && Array.isArray(desc) && desc.length > 0) {
      questionText = desc[Math.floor(Math.random() * desc.length)]
    } else if (format && desc && !Array.isArray(desc)) {
      questionText = desc as string
    }

    return {
      type: 'ordering',
      question: questionText,
      termIds,
      displayMap
    }
  }

  private generateSimilarTerms(
    terms: MusicTerm[],
    _selectedTags: string[],
    format: QuestionFormat,
    gradeFilteredTerms: MusicTerm[]
  ): GeneratedQuestion | null {
    const term = terms[Math.floor(Math.random() * terms.length)]
    const canonicalTerm = getCanonicalTerm(term)
    const displayAlias = getRandomAlias(term)
    const firstWord = term.definition.split(' ')[0]?.toLowerCase() ?? ''

    const similarTerms = gradeFilteredTerms
      .filter(
        t =>
          !termsMatch(t, term) &&
          (t.tags.some(tag => term.tags.includes(tag)) ||
            t.definition.toLowerCase().includes(firstWord) ||
            term.definition.toLowerCase().includes(t.definition.split(' ')[0]?.toLowerCase() ?? ''))
      )
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)

    if (similarTerms.length < 2) return null

    const correctSimilarTerm = similarTerms[0]
    const correctAnswerId = correctSimilarTerm.id
    const correctAnswerCanonical = getCanonicalTerm(correctSimilarTerm)
    const otherSimilarTerms = similarTerms.slice(1)
    let optionTerms: MusicTerm[] = [correctSimilarTerm, ...otherSimilarTerms]
    if (optionTerms.length < 4) {
      const unrelatedTerms = gradeFilteredTerms
        .filter(
          t =>
            !termsMatch(t, term) &&
            !similarTerms.some(st => termsMatch(t, st))
        )
        .sort(() => Math.random() - 0.5)
        .slice(0, 4 - optionTerms.length)
      optionTerms = [...optionTerms, ...unrelatedTerms]
    }
    optionTerms = optionTerms.sort(() => Math.random() - 0.5)

    const options: string[] = []
    const optionToIdMap: Record<string, string> = {}
    let correctAnswerDisplay: string | null = null
    optionTerms.forEach(optionTerm => {
      const displayedAlias = getRandomAlias(optionTerm)
      options.push(displayedAlias)
      optionToIdMap[displayedAlias] = optionTerm.id
      if (optionTerm.id === correctAnswerId) {
        correctAnswerDisplay = displayedAlias
      }
    })

    const desc = format.description
    if (!format || !desc || !Array.isArray(desc) || desc.length === 0) {
      return null
    }
    const questionText = this.formatQuestion(
      desc[Math.floor(Math.random() * desc.length)],
      { term: displayAlias }
    )

    return {
      type: 'multiple_choice',
      question: questionText,
      options,
      correctAnswer: correctAnswerDisplay!,
      correctAnswerId,
      optionToIdMap,
      correctTerm: correctAnswerCanonical,
      questionTerm: displayAlias,
      questionTermCanonical: canonicalTerm
    }
  }

  private generateOppositeTerms(
    terms: MusicTerm[],
    _selectedTags: string[],
    format: QuestionFormat,
    gradeFilteredTerms: MusicTerm[]
  ): GeneratedQuestion | null {
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

    const optionTerms = [oppositeTerm, ...wrongAnswerTerms].sort(
      () => Math.random() - 0.5
    )
    const options: string[] = []
    const optionToIdMap: Record<string, string> = {}
    let correctAnswerDisplay: string | null = null
    optionTerms.forEach(optionTerm => {
      const displayedAlias = getRandomAlias(optionTerm)
      options.push(displayedAlias)
      optionToIdMap[displayedAlias] = optionTerm.id
      if (optionTerm.id === oppositeId) correctAnswerDisplay = displayedAlias
    })

    const desc = format.description
    if (!format || !desc || !Array.isArray(desc) || desc.length === 0) {
      return null
    }
    const questionText = this.formatQuestion(
      desc[Math.floor(Math.random() * desc.length)],
      { term: displayAlias }
    )

    return {
      type: 'multiple_choice',
      question: questionText,
      options,
      correctAnswer: correctAnswerDisplay!,
      correctAnswerId: oppositeId,
      optionToIdMap,
      correctTerm: getCanonicalTerm(oppositeTerm),
      questionTerm: displayAlias,
      questionTermCanonical: getCanonicalTerm(term)
    }
  }

  private generateTagClassification(
    terms: MusicTerm[],
    format: QuestionFormat,
    languageSelected: boolean
  ): GeneratedQuestion | null {
    const term = terms[Math.floor(Math.random() * terms.length)]
    const languages = ['Italian', 'French', 'German', 'Latin']
    const correctTag = term.tags.find(
      tag => !languages.includes(tag) && tag !== 'Language'
    )
    if (!correctTag) return null
    const displayAlias = getRandomAlias(term)
    const canonicalTerm = getCanonicalTerm(term)
    const language = this.getTermLanguage(term)

    const allTags = [
      'Tempo',
      'Dynamics',
      'Style/Expression',
      'Articulation',
      'Technique/Instruction',
      'Form/Direction',
      'Qualifier',
      'Theory/Harmony'
    ]
    const wrongTags = allTags
      .filter(tag => tag !== correctTag)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
    const options = [correctTag, ...wrongTags].sort(() => Math.random() - 0.5)

    let descriptionArray: string[] = Array.isArray(
      languageSelected && format.descriptionWithLanguage && language
        ? format.descriptionWithLanguage
        : format.description
    )
      ? (languageSelected && format.descriptionWithLanguage && language
          ? format.descriptionWithLanguage
          : format.description) as string[]
      : [format.description as string]
    if (descriptionArray.length === 0) return null

    const questionText = this.formatQuestion(
      descriptionArray[Math.floor(Math.random() * descriptionArray.length)],
      { language: languageSelected && language ? language : null, term: displayAlias }
    )

    return {
      type: 'multiple_choice',
      question: questionText,
      options,
      correctAnswer: correctTag,
      correctTerm: canonicalTerm
    }
  }

  private generateContextApplication(
    terms: MusicTerm[],
    _selectedTags: string[],
    format: QuestionFormat,
    languageSelected: boolean,
    gradeFilteredTerms: MusicTerm[]
  ): GeneratedQuestion | null {
    const contexts: Array<{ description: string; termAliases: string[] }> = [
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
      ctx.termAliases.some(alias => terms.some(t => hasAlias(t, alias)))
    )
    if (availableContexts.length === 0) return null

    const context = availableContexts[Math.floor(Math.random() * availableContexts.length)]
    const correctTerm = terms.find(t =>
      context.termAliases.some(alias => hasAlias(t, alias))
    )
    if (!correctTerm) return null

    const displayAlias = getRandomAlias(correctTerm)
    const language = this.getTermLanguage(correctTerm)
    const correctAnswerId = correctTerm.id
    const wrongAnswerTerms = gradeFilteredTerms
      .filter(
        t => !context.termAliases.some(alias => hasAlias(t, alias))
      )
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)

    const optionTerms = [correctTerm, ...wrongAnswerTerms].sort(
      () => Math.random() - 0.5
    )
    const options: string[] = []
    const optionToIdMap: Record<string, string> = {}
    let correctAnswerDisplay: string | null = null
    optionTerms.forEach(optionTerm => {
      const displayedAlias = getRandomAlias(optionTerm)
      options.push(displayedAlias)
      optionToIdMap[displayedAlias] = optionTerm.id
      if (optionTerm.id === correctAnswerId) correctAnswerDisplay = displayedAlias
    })

    let descriptionArray: string[] = Array.isArray(
      languageSelected && format.descriptionWithLanguage && language
        ? format.descriptionWithLanguage
        : format.description
    )
      ? (languageSelected && format.descriptionWithLanguage && language
          ? format.descriptionWithLanguage
          : format.description) as string[]
      : [format.description as string]
    if (descriptionArray.length === 0) return null

    const questionText = this.formatQuestion(
      descriptionArray[Math.floor(Math.random() * descriptionArray.length)],
      {
        language: languageSelected && language ? language : null,
        description: context.description
      }
    )

    return {
      type: 'multiple_choice',
      question: questionText,
      options,
      correctAnswer: correctAnswerDisplay!,
      correctAnswerId,
      optionToIdMap,
      correctTerm: getCanonicalTerm(correctTerm)
    }
  }

  private generateLanguageIdentification(
    terms: MusicTerm[],
    format: QuestionFormat
  ): GeneratedQuestion | null {
    const term = terms[Math.floor(Math.random() * terms.length)]
    const language = this.getTermLanguage(term)
    if (!language) return null

    const displayAlias = getRandomAlias(term)
    const canonicalTerm = getCanonicalTerm(term)
    const allLanguages = ['Italian', 'French', 'German', 'Latin']
    const wrongLanguages = allLanguages
      .filter(lang => lang !== language)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
    const options = [language, ...wrongLanguages].sort(() => Math.random() - 0.5)

    const desc = format.description
    if (!format || !desc || !Array.isArray(desc) || desc.length === 0) return null
    const questionText = this.formatQuestion(
      desc[Math.floor(Math.random() * desc.length)],
      { term: displayAlias }
    )

    return {
      type: 'multiple_choice',
      question: questionText,
      options,
      correctAnswer: language,
      correctTerm: canonicalTerm,
      questionTerm: displayAlias
    }
  }

  private generateSameLanguageTerm(
    terms: MusicTerm[],
    _selectedTags: string[],
    format: QuestionFormat,
    gradeFilteredTerms: MusicTerm[]
  ): GeneratedQuestion | null {
    const termsWithLanguage = terms.filter(
      t => this.getTermLanguage(t) !== null
    )
    if (termsWithLanguage.length === 0) return null

    const term = termsWithLanguage[Math.floor(Math.random() * termsWithLanguage.length)]
    const language = this.getTermLanguage(term)
    if (!language) return null

    const displayAlias = getRandomAlias(term)
    const canonicalTerm = getCanonicalTerm(term)
    const sameLanguageTerms = gradeFilteredTerms.filter(t => {
      const tLanguage = this.getTermLanguage(t)
      return tLanguage === language && !termsMatch(t, term)
    })
    if (sameLanguageTerms.length < 3) return null

    const correctAnswerId = term.id
    const wrongAnswerTerms = sameLanguageTerms
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
    const optionTerms = [term, ...wrongAnswerTerms].sort(
      () => Math.random() - 0.5
    )
    const options: string[] = []
    const optionToIdMap: Record<string, string> = {}
    let correctAnswerDisplay: string | null = null
    optionTerms.forEach(optionTerm => {
      const displayedAlias = getRandomAlias(optionTerm)
      options.push(displayedAlias)
      optionToIdMap[displayedAlias] = optionTerm.id
      if (optionTerm.id === correctAnswerId) correctAnswerDisplay = displayedAlias
    })

    const desc = format.description
    if (!format || !desc || !Array.isArray(desc) || desc.length === 0) return null
    const questionText =
      this.formatQuestion(
        desc[Math.floor(Math.random() * desc.length)],
        { language, definition: term.definition }
      ) + '?'

    return {
      type: 'multiple_choice',
      question: questionText,
      options,
      correctAnswer: correctAnswerDisplay!,
      correctAnswerId,
      optionToIdMap,
      correctTerm: canonicalTerm
    }
  }
}

export default new QuestionGenerator()
