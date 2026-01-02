# React Frontend Setup

## Installation

```bash
cd frontend
npm install
```

## Development

Run the React dev server (with proxy to FastAPI backend):

```bash
npm run dev
```

The frontend will run on `http://localhost:3000` and proxy API requests to `http://localhost:8000`.

## Production Build

Build the React app for production:

```bash
npm run build
```

This will build the app into `../static/react` directory, which FastAPI will serve.

## Project Structure

```
frontend/
├── src/
│   ├── components/     # Reusable components (Timer, Settings, Leaderboard)
│   ├── pages/          # Page components (Login, Signup, Game, etc.)
│   ├── services/       # API service layer
│   ├── App.jsx         # Main app with routing
│   ├── main.jsx        # Entry point
│   └── index.css       # Global styles
├── index.html
├── vite.config.js      # Vite configuration
└── package.json
```

