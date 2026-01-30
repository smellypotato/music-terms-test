/** Music term from data */
export interface MusicTerm {
  term: string | string[]
  definition: string
  tags: string[]
  grade?: number
  id: string
}

/** Quiz configuration from setup */
export interface QuizConfig {
  numQuestions: number
  selectedTags: string[]
  selectedGrade?: number
  selectedLevel?: 'beginner' | 'intermediate' | 'advanced'
}

/** Base question shape */
interface QuestionBase {
  type: string
  question: string
  formatId?: string
}

export interface MultipleChoiceQuestion extends QuestionBase {
  type: 'multiple_choice'
  options: string[]
  correctAnswer: string
  correctAnswerId?: string
  optionToIdMap?: Record<string, string>
  correctTerm: string
  questionTerm?: string
  questionTermCanonical?: string
}

export interface ShortAnswerQuestion extends QuestionBase {
  type: 'short_answer'
  correctAnswer: string
  correctTerm: string
}

export interface OrderingQuestion extends QuestionBase {
  type: 'ordering'
  termIds: string[]
  displayMap: Record<string, string>
}

export type Question =
  | MultipleChoiceQuestion
  | ShortAnswerQuestion
  | OrderingQuestion

/** Question as returned by generator (formatId added after generation) */
export type GeneratedQuestion = Question

/** Definition display for results (term, definition, optional label) */
export interface DefinitionDisplayItem {
  term: string
  definition: string
  label?: string
}

export interface DefinitionDisplayResult {
  title: string
  definitions: DefinitionDisplayItem[]
}

/** Find term by ID - either bound (id) => MusicTerm | undefined or (terms, id) => MusicTerm | undefined */
export type FindTermByIdFn =
  | ((id: string) => MusicTerm | undefined)
  | ((musicTerms: MusicTerm[], id: string) => MusicTerm | undefined)

/** Question format from questionFormats.json */
export interface QuestionFormat {
  id: string
  type: string
  enabled?: boolean
  description: string | string[]
  descriptionWithLanguage?: string | string[]
  applicableTags: string[]
  generate: string
}

/** Levels config */
export interface LevelsConfig {
  beginner: { questionTypes: string[] }
  intermediate: { questionTypes: string[] }
  advanced: { questionTypes: string[] }
}

/** Compare terms (opposites) */
export interface CompareTermsData {
  opposite: Array<{
    termId: string
    termDescription: string
    oppositeId: string
    oppositeDescription: string
  }>
}
