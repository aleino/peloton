# Contributing to HSL Citybike Dashboard

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive feedback
- Keep discussions professional

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/peloton.git`
3. Create a branch: `git checkout -b feature/your-feature-name`
4. Set up the development environment (see QUICKSTART.md)

## Development Workflow

### 1. Make Your Changes

Follow these guidelines:
- Keep changes focused and atomic
- Write clear, self-documenting code
- Follow existing code style
- Add comments for complex logic
- Update documentation if needed

### 2. Test Your Changes

Before submitting:
```bash
# Frontend
cd frontend
npm run build  # Ensure it builds
npm run dev    # Test in browser

# Backend
cd backend
node -c server.js  # Check syntax
npm start  # Test API endpoints
```

### 3. Commit Your Changes

Use clear, descriptive commit messages:
```bash
git add .
git commit -m "Add feature: brief description"
```

Commit message format:
- `feat: ` - New feature
- `fix: ` - Bug fix
- `docs: ` - Documentation changes
- `style: ` - Code style changes (formatting, etc.)
- `refactor: ` - Code refactoring
- `test: ` - Adding tests
- `chore: ` - Maintenance tasks

Examples:
- `feat: add station search functionality`
- `fix: correct map marker positioning`
- `docs: update API endpoint documentation`

### 4. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub with:
- Clear title describing the change
- Detailed description of what and why
- Screenshots for UI changes
- Link to related issues

## Project Structure

```
peloton/
├── frontend/          # React + Vite frontend
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── App.jsx      # Main app component
│   │   └── ...
│   └── ...
├── backend/           # Express API server
│   ├── server.js      # Main server file
│   ├── schema.sql     # Database schema
│   └── ...
├── data/              # Data files and scripts
└── ...
```

## Code Style Guidelines

### JavaScript/React

- Use functional components with hooks
- Use const/let, never var
- Use arrow functions
- Keep functions small and focused
- Use meaningful variable names
- Add PropTypes or TypeScript for type checking (future)

Example:
```javascript
// Good
const handleStationClick = (station) => {
  setSelectedStation(station);
};

// Avoid
function clickStation(s) {
  selectedStation = s;  // Don't use direct assignment
}
```

### CSS

- Use meaningful class names
- Follow BEM naming convention when appropriate
- Keep specificity low
- Use CSS variables for colors/themes
- Mobile-first responsive design

Example:
```css
.station-card {
  /* Component */
}

.station-card__header {
  /* Element */
}

.station-card--selected {
  /* Modifier */
}
```

### SQL

- Use uppercase for keywords
- Indent nested queries
- Use descriptive column names
- Always use parameterized queries
- Add appropriate indexes

## Feature Development

### Adding New API Endpoints

1. Add route in `backend/server.js`
2. Implement database query
3. Add error handling
4. Document in README.md
5. Test with curl or Postman

Example:
```javascript
app.get('/api/trips/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM trips WHERE id = $1',
      [id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching trip:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### Adding New React Components

1. Create component file in `frontend/src/components/`
2. Create corresponding CSS file
3. Import and use in parent component
4. Keep components focused and reusable

Example:
```jsx
// StationStats.jsx
import './StationStats.css';

function StationStats({ stats }) {
  return (
    <div className="station-stats">
      <div className="stat">
        <span className="label">Total Bikes:</span>
        <span className="value">{stats.totalBikes}</span>
      </div>
    </div>
  );
}

export default StationStats;
```

### Database Changes

1. Update `backend/schema.sql`
2. Create migration script if needed
3. Update seed data
4. Update relevant API endpoints
5. Document changes in README

## Testing

Currently, the project uses manual testing. Future improvements:

### Backend Testing (Future)
- Add Jest for unit tests
- Add Supertest for API tests
- Test database queries

### Frontend Testing (Future)
- Add React Testing Library
- Add component tests
- Add E2E tests with Playwright

## Documentation

When adding features:
- Update README.md with usage
- Add to ARCHITECTURE.md if architectural
- Update QUICKSTART.md if setup changes
- Add to TROUBLESHOOTING.md for common issues
- Include JSDoc comments for complex functions

## Pull Request Review Process

1. **Automated Checks**
   - CI pipeline must pass
   - Code must build successfully
   - No linting errors

2. **Manual Review**
   - Code quality and style
   - Functionality works as expected
   - Documentation is updated
   - No breaking changes

3. **Feedback**
   - Address reviewer comments
   - Make requested changes
   - Re-request review

## Reporting Bugs

Use GitHub Issues with:
- Clear, descriptive title
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots if applicable
- System information (OS, Node version, etc.)
- Error messages and logs

Template:
```markdown
**Description**
Brief description of the bug

**To Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What should happen

**Actual Behavior**
What actually happens

**Screenshots**
If applicable

**Environment**
- OS: [e.g. Ubuntu 22.04]
- Node: [e.g. 18.17.0]
- Browser: [e.g. Chrome 120]
```

## Feature Requests

Use GitHub Issues with:
- Clear description of the feature
- Use case / motivation
- Proposed implementation (optional)
- Alternative solutions considered

## Areas for Contribution

Looking for ways to contribute? Consider:

### Features
- [ ] User authentication
- [ ] Trip history tracking
- [ ] Station favorites
- [ ] Real-time updates via WebSocket
- [ ] Mobile app
- [ ] Station clustering on map
- [ ] Data visualization (charts)
- [ ] Export functionality
- [ ] Multi-language support

### Improvements
- [ ] Add comprehensive tests
- [ ] Improve error handling
- [ ] Add logging
- [ ] Performance optimization
- [ ] Accessibility improvements
- [ ] Better mobile experience
- [ ] Dark mode

### Documentation
- [ ] Video tutorials
- [ ] API documentation with OpenAPI/Swagger
- [ ] Architecture diagrams
- [ ] Code examples
- [ ] Translation to other languages

## Questions?

- Open a GitHub Discussion
- Check existing issues and pull requests
- Read the documentation (README, QUICKSTART, ARCHITECTURE)
- Check TROUBLESHOOTING guide

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (ISC).

## Thank You!

Your contributions make this project better for everyone. We appreciate your time and effort! 🎉
