# Music Terms Quiz

A React-based quiz application for testing knowledge of musical terms. Features include:

- Multiple question types (multiple choice, short answer, ordering, etc.)
- Tag-based filtering (Tempo, Dynamics, Style/Expression, etc.)
- Printable version with PDF export
- Answer key generation
- All questions on one page for easy review

## Features

- **Varied Question Types**: 
  - Term to definition (MC and short answer)
  - Definition to term (MC and short answer)
  - Tempo ordering (slowest to fastest)
  - Dynamics ordering (softest to loudest)
  - Similar terms comparison
  - Opposite terms
  - Tag classification
  - Context application

- **Term Aliases**: Each term can have multiple aliases that are randomly displayed

- **Print-Friendly**: Export quizzes and answer keys as PDF

## Setup

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## GitHub Pages

This app is configured for GitHub Pages deployment. The site will be automatically deployed when you push to the `main` branch.

### Manual Setup (if needed):

1. Go to your repository settings on GitHub
2. Navigate to "Pages" in the left sidebar
3. Under "Source", select "GitHub Actions"
4. The site will be available at: `https://smellypotato.github.io/music-terms-test/`

## Project Structure

```
src/
├── components/          # React components
│   ├── QuizSetup.jsx    # Quiz configuration
│   ├── QuizAllQuestions.jsx  # All questions view
│   ├── PrintableQuiz.jsx     # Print-friendly version
│   └── Results.jsx      # Results display
├── data/                # JSON data files
│   ├── musicTerms.json  # Music terms and definitions
│   ├── questionFormats.json  # Question format definitions
│   └── orderingData.json     # Ordering rules
├── services/            # Business logic
│   └── QuestionGenerator.js  # Question generation service
└── utils/              # Utility functions
    └── termUtils.js    # Term manipulation utilities
```

## License

MIT
