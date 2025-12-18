# Tommy Game - Math Quiz Platform

A web-based math quiz game platform built with FastAPI and PostgreSQL. Players solve math problems, progress through difficulty stages, and compete for high scores.

## Features

- 🔐 **User Authentication**: Secure signup/login with JWT tokens and bcrypt password hashing
- 🎮 **Math Quiz Game**: Dynamic question generation based on difficulty levels
- 📊 **Score Tracking**: Real-time score updates and session management
- 🏆 **Leaderboards**: Top player rankings
- 📈 **Player Statistics**: Historical performance tracking
- ⚙️ **Configurable Settings**: Adjustable difficulty and winning scores

## Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM for database operations
- **PostgreSQL** - Relational database
- **JWT (python-jose)** - Token-based authentication
- **bcrypt** - Password hashing
- **Uvicorn** - ASGI server

### Frontend
- **Vanilla JavaScript (ES6 modules)** - Client-side logic
- **Jinja2 Templates** - Server-side HTML rendering
- **CSS** - Styling

### Infrastructure
- **Docker & Docker Compose** - Containerization and orchestration

## Project Structure

```
tommy-game/
├── app.py                  # FastAPI application initialization
├── main.py                 # Entry point with route registration
├── database.py             # Database connection and session management
├── models.py               # SQLAlchemy ORM models
├── auth_utils.py           # JWT token generation and validation
├── logger.py               # Logging configuration
│
├── dal/                    # Data Access Layer
│   ├── player_dal.py       # Player CRUD operations
│   ├── game_dal.py         # Game management
│   ├── question_dal.py     # Question retrieval logic
│   ├── player_session_dal.py  # Session and scoring logic
│   └── player_answer_dal.py   # Answer tracking
│
├── routes/                 # API route handlers
│   ├── auth_routes.py      # Authentication endpoints
│   ├── game_api.py         # Game logic endpoints
│   └── pages.py            # HTML page routes
│
├── templates/              # Jinja2 HTML templates
│   ├── index.html          # Game page
│   ├── login.html          # Login page
│   ├── signup.html         # Signup page
│   └── player_stats.html   # Statistics page
│
├── static/                 # Static assets
│   ├── js/
│   │   ├── main.js         # Main application logic
│   │   ├── auth.js         # Authentication handlers
│   │   └── game.js         # Game mechanics
│   ├── style.css           # Stylesheet
│   └── *.png               # Images
│
├── resources/              # Data files
│   └── math_stock_questions.jsonl  # Initial question database
│
├── scripts/                # Utility scripts
│   └── init_math_game.py   # Question initialization script
│
├── tests/                  # Test files
│   ├── test_game.py
│   └── test_question.py
│
├── docker-compose.yml      # Docker orchestration
├── Dockerfile              # Container definition
└── requirements.txt        # Python dependencies
```

## Setup Instructions

### Prerequisites
- Docker and Docker Compose installed
- Python 3.11+ (for local development)

### Using Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tommy-game
   ```

2. **Create environment file** (optional, defaults are provided)
   ```bash
   # Create .env file with:
   DB_NAME=tommy_game_db
   DB_USER=postgres
   DB_PASSWORD=postgres
   DB_HOST=db
   DB_PORT=5432
   LOG_LEVEL=INFO
   ```

3. **Start the application**
   ```bash
   docker-compose up --build
   ```

4. **Access the application**
   - Web UI: http://localhost:8000
   - API Docs: http://localhost:8000/docs

### Local Development

1. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Set up PostgreSQL database**
   - Ensure PostgreSQL is running
   - Update environment variables in `.env` file

3. **Run the application**
   ```bash
   python main.py
   ```

## Data Flow

### Authentication Flow

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ 1. POST /login (username, password)
       ▼
┌──────────────────┐
│  auth_routes.py  │
│  - Validate user │
│  - Check password│
└──────┬───────────┘
       │ 2. Query player_dal
       ▼
┌──────────────────┐
│  player_dal.py   │
│  - Fetch player  │
└──────┬───────────┘
       │ 3. Return Player object
       ▼
┌──────────────────┐
│  auth_utils.py   │
│  - Generate JWT  │
└──────┬───────────┘
       │ 4. Return token
       ▼
┌─────────────┐
│   Browser   │
│ (store token│
│ in localStorage)
└─────────────┘
```

### Game Flow

#### Starting a Game Session

```
┌─────────────┐
│   Browser   │
│  (game.js)  │
└──────┬──────┘
       │ 1. POST /start
       │    Headers: Authorization: Bearer <token>
       ▼
┌──────────────────┐
│   game_api.py    │
│  - Verify token  │
│  - Get player    │
└──────┬───────────┘
       │ 2. Get/Create game
       ▼
┌──────────────────┐
│   game_dal.py    │
│  - Get game by   │
│    name          │
└──────┬───────────┘
       │ 3. Create session
       ▼
┌──────────────────────┐
│player_session_dal.py │
│  - Create new        │
│    PlayerSession     │
│  - Initialize score=0│
│    stage=1           │
└──────┬───────────────┘
       │ 4. Get random question
       ▼
┌──────────────────┐
│ question_dal.py  │
│  - Filter by     │
│    game_id       │
│  - Filter by     │
│    difficulty    │
│  - Exclude       │
│    answered      │
│  - Random select │
└──────┬───────────┘
       │ 5. Return question
       │    (if none, initialize from JSONL)
       ▼
┌─────────────┐
│   Browser   │
│ Display Q + │
│ Start timer │
└─────────────┘
```

#### Submitting an Answer

```
┌─────────────┐
│   Browser   │
│  (game.js)  │
└──────┬──────┘
       │ 1. POST /answer
       │    {answer, question_id, game_name}
       ▼
┌──────────────────┐
│   game_api.py    │
│  submit_answer() │
└──────┬───────────┘
       │ 2. Fetch question
       ▼
┌──────────────────┐
│ question_dal.py  │
│ get_question_by_ │
│ id()             │
└──────┬───────────┘
       │ 3. Get active session
       ▼
┌──────────────────────┐
│player_session_dal.py │
│ get_session_by_      │
│ player_id()          │
└──────┬───────────────┘
       │ 4. Validate answer & update score
       ▼
┌──────────────────────┐
│player_session_dal.py │
│ update_score_and_    │
│ stage()              │
│  - Compare answer    │
│  - +1 if correct     │
│  - -1 if wrong       │
│  - Update stage      │
└──────┬───────────────┘
       │ 5. Save answer record
       ▼
┌──────────────────────┐
│player_answer_dal.py  │
│ update_player_answer │
│ ()                   │
└──────┬───────────────┘
       │ 6. Check winning condition
       │    If score >= winning_score:
       │      → end_session()
       │      → Redirect to /end
       │    Else:
       │      → Get next question
       ▼
┌──────────────────┐
│ question_dal.py  │
│ get_random_      │
│ question_by_game │
└──────┬───────────┘
       │ 7. Return response
       ▼
┌─────────────┐
│   Browser   │
│ Update UI:  │
│ - Score     │
│ - Stage     │
│ - Next Q    │
│ - Wrong Qs  │
└─────────────┘
```

### Database Operations Flow

```
Application Layer (Routes)
         │
         │ Uses async functions
         ▼
Data Access Layer (DAL)
    │              │              │
    ├─ player_dal  ├─ game_dal    ├─ question_dal
    ├─ player_session_dal         └─ player_answer_dal
    │
    │ Uses SQLAlchemy ORM
    ▼
Database Session (SessionLocal)
    │
    │ SQL queries
    ▼
PostgreSQL Database
    │
    │ Returns results
    ▼
ORM Models (models.py)
    │
    │ Python objects
    ▼
Routes → JSON Response → Browser
```

## API Endpoints

### Authentication
- `POST /signup` - Create new player account
- `POST /login` - Authenticate and receive JWT token
- `POST /logout` - Clear authentication
- `GET /api/player_info` - Get current player information

### Game
- `POST /start` - Initialize a new game session
- `POST /answer` - Submit answer to current question
- `GET /end` - Game completion page
- `GET /api/game_end` - Game completion data (JSON)

### Statistics
- `GET /player_sessions_stats` - Get player's session history
- `GET /player_stats` - Player statistics page

### Settings
- `POST /set_game_settings` - Update game difficulty and winning score

### Pages
- `GET /` - Login page
- `GET /login` - Login page
- `GET /signup` - Signup page
- `GET /game` - Main game page

## Database Schema

### Players
- `id` (PK)
- `name` (unique)
- `age`
- `password` (hashed)
- `created_at`

### Games
- `id` (PK)
- `name`
- `description`
- `winning_score`
- `created_at`

### Questions
- `id` (PK)
- `game_id` (FK → Games)
- `text`
- `correct_answer`
- `difficulty`
- `extra_data` (JSON)
- `created_at`

### PlayerSessions
- `id` (PK)
- `player_id` (FK → Players)
- `game_id` (FK → Games)
- `score`
- `stage`
- `started_at`
- `ended_at`

### PlayerAnswers
- `id` (PK)
- `session_id` (FK → PlayerSessions)
- `question_id` (FK → Questions)
- `player_answer`
- `is_correct`
- `answered_at`

## Game Logic

- **Scoring**: +1 for correct answer, -1 for incorrect (minimum 0)
- **Stage Progression**: Stage increases when score > 2
- **Question Selection**: Questions filtered by difficulty matching player's current stage
- **Winning Condition**: Reach `winning_score` (default: 2)
- **Time Limits**: 10 seconds base + (difficulty - 1) * 3 seconds

## Development

### Running Tests
```bash
pytest tests/
```

### Logging
Logging is configured via `logger.py` using loguru. Set `LOG_LEVEL` environment variable (DEBUG, INFO, WARNING, ERROR, CRITICAL).

### Adding Questions
Questions are loaded from `resources/math_stock_questions.jsonl`. The format is:
```json
{"text": "What is 2 + 2?", "correct_answer": 4, "difficulty": 1}
```

## License

[Add your license here]

## Contributing

[Add contributing guidelines here]

