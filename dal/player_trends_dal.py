from dataclasses import dataclass
from typing import List, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, extract
from models import PlayerSession, PlayerAnswer
from dal.player_answer_dal import get_wrong_questions


@dataclass
class PeriodStats:
    period_label: str  # "01/01/2024" (week) or "01/2024" (month)
    start_date: datetime
    end_date: datetime
    total_games: int
    avg_score: float
    success_rate: float  # percentage of correct answers
    total_correct: int
    total_incorrect: int


async def get_player_trends_by_period(
    session: Session,
    player_id: int,
    period_type: str = "week"  # "week" or "month"
) -> List[PeriodStats]:
    """
    Get player statistics grouped by period (week or month).
    Returns trends showing how player performance changes over time.
    """
    # Get all completed sessions for the player
    player_sessions = (
        session.query(PlayerSession)
        .filter(
            and_(
                PlayerSession.player_id == player_id,
                PlayerSession.ended_at.isnot(None)
            )
        )
        .order_by(PlayerSession.ended_at.asc())
        .all()
    )

    if not player_sessions:
        return []

    # Group sessions by period
    period_groups: dict[str, list[PlayerSession]] = {}

    for ps in player_sessions:
        if not ps.ended_at:
            continue

        if period_type == "week":
            # ISO week format: YYYY-WNN (for grouping)
            year, week, _ = ps.ended_at.isocalendar()
            period_key = f"{year}-W{week:02d}"
        else:  # month
            year = ps.ended_at.year
            month = ps.ended_at.month
            period_key = f"{year}-{month:02d}"

        if period_key not in period_groups:
            period_groups[period_key] = []
        period_groups[period_key].append(ps)

    # Calculate stats for each period
    result: List[PeriodStats] = []

    for period_key, sessions in sorted(period_groups.items()):
        total_correct = 0
        total_incorrect = 0
        total_score = 0

        # Calculate period date range
        session_dates = [ps.ended_at for ps in sessions if ps.ended_at]
        if not session_dates:
            continue

        start_date = min(session_dates)
        end_date = max(session_dates)

        # Calculate stats from all answers in sessions
        for ps in sessions:
            total_score += ps.score or 0
            
            # Count correct/incorrect answers
            answers = session.query(PlayerAnswer).filter(
                PlayerAnswer.session_id == ps.id
            ).all()
            
            for answer in answers:
                if answer.is_correct:
                    total_correct += 1
                else:
                    total_incorrect += 1

        total_answers = total_correct + total_incorrect
        success_rate = (total_correct / total_answers * 100) if total_answers > 0 else 0.0
        avg_score = total_score / len(sessions) if sessions else 0.0

        # Format period_label as readable date
        if period_type == "week":
            # Format: DD/MM/YYYY (start date of week)
            period_label = start_date.strftime("%d/%m/%Y")
        else:  # month
            # Format: MM/YYYY (month/year)
            period_label = start_date.strftime("%m/%Y")

        result.append(PeriodStats(
            period_label=period_label,
            start_date=start_date,
            end_date=end_date,
            total_games=len(sessions),
            avg_score=round(avg_score, 2),
            success_rate=round(success_rate, 2),
            total_correct=total_correct,
            total_incorrect=total_incorrect
        ))

    return result


async def compare_player_periods(
    session: Session,
    player_id: int,
    period1_start: datetime,
    period1_end: datetime,
    period2_start: datetime,
    period2_end: datetime
) -> dict:
    """
    Compare player performance between two time periods.
    Returns statistics for both periods and the difference.
    """
    
    def get_period_stats(start_date: datetime, end_date: datetime) -> dict:
        sessions = (
            session.query(PlayerSession)
            .filter(
                and_(
                    PlayerSession.player_id == player_id,
                    PlayerSession.ended_at.isnot(None),
                    PlayerSession.ended_at >= start_date,
                    PlayerSession.ended_at <= end_date
                )
            )
            .all()
        )

        total_correct = 0
        total_incorrect = 0
        total_score = 0
        total_games = len(sessions)

        for ps in sessions:
            total_score += ps.score or 0
            
            answers = session.query(PlayerAnswer).filter(
                PlayerAnswer.session_id == ps.id
            ).all()
            
            for answer in answers:
                if answer.is_correct:
                    total_correct += 1
                else:
                    total_incorrect += 1

        total_answers = total_correct + total_incorrect
        success_rate = (total_correct / total_answers * 100) if total_answers > 0 else 0.0
        avg_score = total_score / total_games if total_games > 0 else 0.0

        return {
            "total_games": total_games,
            "avg_score": round(avg_score, 2),
            "success_rate": round(success_rate, 2),
            "total_correct": total_correct,
            "total_incorrect": total_incorrect,
            "total_answers": total_answers
        }

    period1_stats = get_period_stats(period1_start, period1_end)
    period2_stats = get_period_stats(period2_start, period2_end)

    # Calculate differences
    diff_avg_score = period2_stats["avg_score"] - period1_stats["avg_score"]
    diff_success_rate = period2_stats["success_rate"] - period1_stats["success_rate"]
    diff_total_games = period2_stats["total_games"] - period1_stats["total_games"]

    return {
        "period1": {
            "start_date": period1_start.isoformat(),
            "end_date": period1_end.isoformat(),
            **period1_stats
        },
        "period2": {
            "start_date": period2_start.isoformat(),
            "end_date": period2_end.isoformat(),
            **period2_stats
        },
        "difference": {
            "avg_score": round(diff_avg_score, 2),
            "success_rate": round(diff_success_rate, 2),
            "total_games": diff_total_games
        }
    }

