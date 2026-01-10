import { useState } from 'react'
import musicTerms from '../data/musicTerms.json'
import './Cheatsheet.css'

const ALL_TAGS = [
  'Tempo',
  'Dynamics',
  'Style/Expression',
  'Articulation',
  'Technique/Instruction',
  'Form/Direction',
  'Qualifier',
  'Theory/Harmony',
  'Italian',
  'French',
  'German',
  'Latin'
]

function Cheatsheet({ isOpen, onClose, selectedTags = [] }) {
  const [filterTags, setFilterTags] = useState([])
  const [exactMatch, setExactMatch] = useState(false)
  const [selectedGrade, setSelectedGrade] = useState(0)

  // Filter terms: if filterTags is empty, show all; otherwise filter based on exactMatch mode
  // Also filter by grade if selected
  const filteredTerms = musicTerms.filter(term => {
    // Filter by grade: if selectedGrade > 0, only include terms with grade <= selectedGrade
    // Also exclude terms with grade 999 (unassigned/placeholder)
    if (selectedGrade > 0) {
      const termGrade = term.grade || 0
      if (termGrade === 999 || termGrade > selectedGrade) {
        return false
      }
    } else {
      // If grade is 0 (All), still exclude grade 999 terms
      if (term.grade === 999) {
        return false
      }
    }
    
    // Filter by tags
    if (filterTags.length === 0) {
      return true
    }
    // If exact match mode: term must have ALL filter tags
    // Otherwise: term must have ANY of the filter tags
    return exactMatch
      ? filterTags.every(tag => term.tags.includes(tag))
      : filterTags.some(tag => term.tags.includes(tag))
  })

  const handleTagToggle = (tag) => {
    setFilterTags(prev => 
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const handleClearFilters = () => {
    setFilterTags([])
  }

  if (!isOpen) return null

  return (
    <div className="cheatsheet-overlay" onClick={onClose}>
      <div className="cheatsheet-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cheatsheet-header">
          <h2>Music Terms Cheatsheet</h2>
          <button className="cheatsheet-close" onClick={onClose}>×</button>
        </div>
        
        <div className="cheatsheet-filters">
          <div className="filter-section">
            <label htmlFor="cheatsheet-grade-select" className="filter-section-label">
              Grade Level:
            </label>
            <select
              id="cheatsheet-grade-select"
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(parseInt(e.target.value))}
              className="grade-select"
            >
              <option value={0}>All</option>
              <option value={1}>Grade 1</option>
              <option value={2}>Grade 2</option>
              <option value={3}>Grade 3</option>
              <option value={4}>Grade 4</option>
              <option value={5}>Grade 5</option>
            </select>
          </div>
          
          <div className="filter-section">
            <div className="filter-header-row">
              <div className="filter-label">
                Filter by tags ({exactMatch ? 'exact match - all tags' : 'any tag'}):
              </div>
              <button
                className={`exact-match-toggle ${exactMatch ? 'active' : ''}`}
                onClick={() => setExactMatch(!exactMatch)}
                title={exactMatch ? 'Switch to any match mode' : 'Switch to exact match mode'}
              >
                {exactMatch ? '✓ Exact Match' : 'Any Match'}
              </button>
            </div>
            <div className="filter-tags">
              {ALL_TAGS.map(tag => (
                <label key={tag} className="filter-tag-label">
                  <input
                    type="checkbox"
                    checked={filterTags.includes(tag)}
                    onChange={() => handleTagToggle(tag)}
                  />
                  <span>{tag}</span>
                </label>
              ))}
            </div>
            {filterTags.length > 0 && (
              <button className="clear-filters-btn" onClick={handleClearFilters}>
                Clear Filters
              </button>
            )}
          </div>
        </div>

        <div className="cheatsheet-content">
          <div className="cheatsheet-count">
            Showing {filteredTerms.length} term{filteredTerms.length !== 1 ? 's' : ''}
            {selectedGrade > 0 && (
              <span> (Grade {selectedGrade} or below)</span>
            )}
            {filterTags.length > 0 && (
              <span> (matching {exactMatch ? 'all' : 'any'}: {filterTags.join(', ')})</span>
            )}
          </div>
          
          <div className="cheatsheet-terms">
            {filteredTerms.map((term, index) => {
              const allAliases = term.term.join(', ')
              const languages = term.tags.filter(tag => ['Italian', 'French', 'German', 'Latin'].includes(tag))
              const categoryTags = term.tags.filter(tag => !['Italian', 'French', 'German', 'Latin'].includes(tag))
              const termGrade = term.grade !== undefined && term.grade !== 999 ? term.grade : null
              
              return (
                <div key={index} className="cheatsheet-term">
                  <div className="term-header">
                    <div className="term-name">
                      <strong>{allAliases}</strong>
                      {termGrade !== null && (
                        <span className="term-grade"> [Grade {termGrade}]</span>
                      )}
                    </div>
                  </div>
                  <div className="term-definition">{term.definition}</div>
                  <div className="term-tags">
                    <span className="tags-label">Tags:</span>
                    {categoryTags.map((tag, tagIndex) => (
                      <span key={tagIndex} className="tag-badge category">{tag}</span>
                    ))}
                    {languages.map((lang, langIndex) => (
                      <span key={langIndex} className="tag-badge language">{lang}</span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Cheatsheet

