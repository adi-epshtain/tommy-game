from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, TIMESTAMP, JSON, Table
from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy.sql import func

Base = declarative_base()

# Many-to-many relationship table for players and dinosaurs
player_dinosaurs = Table(
    'player_dinosaurs',
    Base.metadata,
    Column('player_id', Integer, ForeignKey('players.id'), primary_key=True),
    Column('dinosaur_id', Integer, ForeignKey('dinosaurs.id'), primary_key=True),
    Column('unlocked_at', TIMESTAMP, server_default=func.now())
)


class Player(Base):
    __tablename__ = "players"

    id = Column(Integer, primary_key=True)
    name = Column(String(50), unique=True, nullable=False)
    age = Column(Integer)
    created_at = Column(TIMESTAMP, server_default=func.now())
    password = Column(String(255), nullable=False)
    excluded_from_leaderboard = Column(Boolean, default=False)
    selected_dinosaur_id = Column(Integer, ForeignKey('dinosaurs.id'), nullable=True)

    sessions = relationship("PlayerSession", back_populates="player")
    dinosaurs = relationship("Dinosaur", secondary=player_dinosaurs, back_populates="players")
    selected_dinosaur = relationship("Dinosaur", foreign_keys=[selected_dinosaur_id], post_update=True)


class Game(Base):
    __tablename__ = "games"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    winning_score = Column(Integer, default=2)
    created_at = Column(TIMESTAMP, server_default=func.now())

    questions = relationship("Question", back_populates="game")
    sessions = relationship("PlayerSession", back_populates="game")


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True)
    game_id = Column(Integer, ForeignKey("games.id"))
    text = Column(Text, nullable=False)
    correct_answer = Column(Integer, nullable=False)
    difficulty = Column(Integer, default=1)
    extra_data = Column(JSON, nullable=True)  # Flexibility for different games
    created_at = Column(TIMESTAMP, server_default=func.now())

    game = relationship("Game", back_populates="questions")
    answers = relationship("PlayerAnswer", back_populates="question")


class PlayerSession(Base):
    __tablename__ = "player_sessions"

    id = Column(Integer, primary_key=True)
    player_id = Column(Integer, ForeignKey("players.id"))
    game_id = Column(Integer, ForeignKey("games.id"))
    score = Column(Integer, default=0)
    stage = Column(Integer, default=1)
    started_at = Column(TIMESTAMP, server_default=func.now())
    ended_at = Column(TIMESTAMP, nullable=True)

    player = relationship("Player", back_populates="sessions")
    game = relationship("Game", back_populates="sessions")
    answers = relationship("PlayerAnswer", back_populates="session")


class PlayerAnswer(Base):
    __tablename__ = "player_answers"

    id = Column(Integer, primary_key=True)
    session_id = Column(Integer, ForeignKey("player_sessions.id"))
    question_id = Column(Integer, ForeignKey("questions.id"))
    player_answer = Column(Integer)
    is_correct = Column(Boolean)
    answered_at = Column(TIMESTAMP, server_default=func.now())

    session = relationship("PlayerSession", back_populates="answers")
    question = relationship("Question", back_populates="answers")


class Dinosaur(Base):
    __tablename__ = "dinosaurs"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False, unique=True)
    image_path = Column(String(255), nullable=False)  # Path to dinosaur image
    description = Column(Text, nullable=True)
    rarity = Column(String(20), default='common')  # common, rare, epic, legendary
    created_at = Column(TIMESTAMP, server_default=func.now())

    players = relationship("Player", secondary=player_dinosaurs, back_populates="dinosaurs")
