import pytest

from models.game import Game


class TestGame:
    def test_player_score_increases_on_correct_answer(self):
        game = Game("TestPlayer")
        question = game.current_question
        assert game.submit_answer(question.answer) is True
        assert game.player.score == 1

    def test_player_score_decreases_on_incorrect_answer(self):
        game = Game("TestPlayer")
        question = game.current_question
        incorrect_answer = question.answer + 1
        assert game.submit_answer(incorrect_answer) is False
        assert game.player.score == 0

    def test_player_stage_advances(self):
        game = Game("TestPlayer")
        for _ in range(3):
            question = game.current_question
            game.submit_answer(question.answer)
        assert game.player.stage == 2

    def test_player_stage_reverts(self):
        game = Game("TestPlayer")
        for _ in range(3):
            question = game.current_question
            game.submit_answer(question.answer)
        question = game.current_question
        incorrect_answer = question.answer + 1
        game.submit_answer(incorrect_answer)
        assert game.player.stage == 1

    def test_game_generates_unique_questions(self):
        game = Game("TestPlayer")
        seen_questions = set()
        for _ in range(10):
            question = game.current_question
            assert question.text not in seen_questions
            seen_questions.add(question.text)
            game.submit_answer(question.answer)

    def test_reset_game(self):
        game = Game("TestPlayer")

        game.player.score = 3
        game.player.stage = 2
        game.wrong_questions.append("2 + 2")

        old_question = game.current_question

        game.reset()

        assert game.player.score == 0
        assert game.player.stage == 1
        assert game.wrong_questions == []
        assert game.current_question is not None
        assert game.current_question != old_question
