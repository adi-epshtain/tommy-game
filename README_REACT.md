# React Migration Guide

The UI has been reorganized using React. Here's what changed:

## Structure

- **Frontend**: React app in `frontend/` directory
- **Backend**: FastAPI remains unchanged, serves React build from `static/react/`

## Setup

1. **Install frontend dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Development mode** (React dev server with hot reload):
   ```bash
   cd frontend
   npm run dev
   ```
   Frontend runs on `http://localhost:3000`, proxies API calls to `http://localhost:8000`

3. **Production build**:
   ```bash
   cd frontend
   npm run build
   ```
   Builds React app to `static/react/`, then run FastAPI as usual:
   ```bash
   python main.py
   ```

## Component Organization

- **Pages**: `Login`, `Signup`, `Game`, `PlayerStats`, `TopPlayers`
- **Components**: `Timer`, `Settings`, `Leaderboard`
- **Services**: Centralized API client in `services/api.js`

## Benefits

- ✅ Organized component structure
- ✅ Centralized API service layer
- ✅ React Router for navigation
- ✅ Better state management
- ✅ Reusable components
- ✅ Type-safe development (can add TypeScript later)

## Migration Notes

- Old templates in `templates/` are kept as fallback
- Old JS files in `static/js/` can be removed after testing
- CSS migrated to `frontend/src/index.css`

