import type { MusicTerm } from '../types'

export const getCanonicalTerm = (term: MusicTerm): string => {
  return Array.isArray(term.term) ? term.term[0] : term.term
}

export const getRandomAlias = (term: MusicTerm): string => {
  const aliases = Array.isArray(term.term) ? term.term : [term.term]
  return aliases[Math.floor(Math.random() * aliases.length)]
}

export const termsMatch = (term1: MusicTerm, term2: MusicTerm): boolean => {
  const aliases1 = Array.isArray(term1.term) ? term1.term : [term1.term]
  const aliases2 = Array.isArray(term2.term) ? term2.term : [term2.term]
  return aliases1.some(a1 => aliases2.some(a2 => a1 === a2))
}

export const hasAlias = (termObj: MusicTerm, alias: string): boolean => {
  const aliases = Array.isArray(termObj.term) ? termObj.term : [termObj.term]
  return aliases.includes(alias)
}

export const findTermByAlias = (
  musicTerms: MusicTerm[],
  alias: string
): MusicTerm | undefined => {
  return musicTerms.find(term => {
    const aliases = Array.isArray(term.term) ? term.term : [term.term]
    return aliases.some(a => a.toLowerCase() === alias.toLowerCase())
  })
}

export const findTermById = (
  musicTerms: MusicTerm[],
  id: string
): MusicTerm | undefined => {
  return musicTerms.find(term => term.id === id)
}

export const findTermByDefinition = (
  musicTerms: MusicTerm[],
  definition: string
): MusicTerm | undefined => {
  return musicTerms.find(
    term => term.definition.toLowerCase() === definition.toLowerCase()
  )
}
