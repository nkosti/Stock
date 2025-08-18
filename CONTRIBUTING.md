# Contributing to Stock Analysis Platform

Thank you for your interest in contributing to our Stock Analysis Platform! This document provides guidelines and information for contributors.

## Getting Started

### Prerequisites
- Node.js 18.0 or higher
- Python 3.8 or higher
- Git

### Setup Development Environment

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/Stock.git
   cd Stock
   ```

3. Set up the backend:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

4. Set up the frontend:
   ```bash
   cd frontend
   npm install
   ```

5. Start development servers:
   ```bash
   # Backend (in backend directory)
   python -m uvicorn main:app --host 0.0.0.0 --port 8001
   
   # Frontend (in frontend directory)
   npm run dev
   ```

## Development Guidelines

### Code Style

**Frontend (TypeScript/React)**
- Use TypeScript for type safety
- Follow ESLint configuration
- Use functional components with hooks
- Keep components small and focused
- Use meaningful variable names

**Backend (Python)**
- Follow PEP 8 style guide
- Use type hints
- Write docstrings for functions
- Use meaningful variable names
- Keep functions small and focused

### Commit Messages
- Use clear, descriptive commit messages
- Start with a verb (add, fix, update, remove)
- Keep first line under 50 characters
- Add detailed description if needed

Example:
```
Add stock price alerts feature

- Implement alert creation and management
- Add email notifications
- Include alert history tracking
```

### Branch Naming
- `feature/description` - for new features
- `fix/description` - for bug fixes  
- `docs/description` - for documentation
- `refactor/description` - for refactoring

### Pull Requests

1. Create a feature branch from `main`
2. Make your changes
3. Test your changes thoroughly
4. Update documentation if needed
5. Submit a pull request with clear description
6. Link any related issues

### Testing

**Frontend**
- Write unit tests for components
- Test user interactions
- Ensure responsive design works

**Backend**
- Write unit tests for API endpoints
- Test edge cases and error handling
- Validate data models

## Project Structure

```
Stock/
├── frontend/                 # Next.js frontend
│   ├── src/
│   │   ├── app/             # App router pages
│   │   └── components/      # Reusable components
│   └── package.json
├── backend/                 # FastAPI backend
│   ├── routers/            # API routes
│   ├── main.py             # FastAPI app
│   └── requirements.txt
└── README.md
```

## Reporting Issues

- Use the issue templates provided
- Include clear reproduction steps
- Add screenshots for UI issues
- Specify your environment details

## Questions?

Feel free to open an issue with the `question` label if you need help or clarification.

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Follow the golden rule

Thank you for contributing! 🚀