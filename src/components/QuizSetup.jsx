import { useState } from 'react'
import './QuizSetup.css'

const ALL_TAGS = [
  'Tempo',
  'Dynamics',
  'Style/Expression',
  'Articulation',
  'Technique/Instruction',
  'Form/Direction',
  'Qualifier',
  'Theory/Harmony',
  'Language'
]

function QuizSetup({ onStartQuiz }) {
  const [numQuestions, setNumQuestions] = useState(10)
  const [selectedTags, setSelectedTags] = useState(ALL_TAGS)
  const [selectedGrade, setSelectedGrade] = useState(0)

  const handleTagToggle = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const handleSelectAll = () => {
    setSelectedTags(ALL_TAGS)
  }

  const handleDeselectAll = () => {
    setSelectedTags([])
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (selectedTags.length === 0) {
      alert('Please select at least one tag category.')
      return
    }
    if (numQuestions < 1 || numQuestions > 100) {
      alert('Please enter a number of questions between 1 and 100.')
      return
    }
    onStartQuiz({ numQuestions, selectedTags, selectedGrade })
  }

  return (
    <div className="quiz-setup">
      <form onSubmit={handleSubmit} className="setup-form">
        <div className="form-group">
          <label htmlFor="numQuestions">
            Number of Questions:
          </label>
          <input
            id="numQuestions"
            type="number"
            min="1"
            max="100"
            value={numQuestions}
            onChange={(e) => setNumQuestions(parseInt(e.target.value) || 1)}
            className="number-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="selectedGrade">
            Grade Level:
          </label>
          <select
            id="selectedGrade"
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

        <div className="form-group">
          <label>Select Tag Categories:</label>
          <div className="tag-buttons">
            <button
              type="button"
              onClick={handleSelectAll}
              className="select-all-btn"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={handleDeselectAll}
              className="deselect-all-btn"
            >
              Deselect All
            </button>
          </div>
          <div className="tag-checkboxes">
            {ALL_TAGS.map(tag => (
              <label key={tag} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={selectedTags.includes(tag)}
                  onChange={() => handleTagToggle(tag)}
                />
                <span>{tag}</span>
              </label>
            ))}
          </div>
        </div>

        <button type="submit" className="start-button">
          Start Quiz
        </button>
      </form>
    </div>
  )
}

export default QuizSetup

