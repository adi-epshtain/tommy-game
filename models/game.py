from models.player import Player
from models.question import Question


class Game:
    def __init__(self, player_name: str):
        self.player = Player(player_name)
        self.correct_questions = set()
        self.current_question = self._get_new_question()
        self.winning_score = 5
        self.wrong_questions = []

    def _get_new_question(self) -> Question:
        max_num = 5 if self.player.stage == 1 else 10

        while True:
            q = Question(max_num=max_num)
            if q.text not in self.correct_questions:
                return q

    def get_question(self) -> str:
        return self.current_question.text

    def submit_answer(self, res: int) -> bool:
        correct = self.current_question.check_answer(res)
        if not correct:
            self.wrong_questions.append(self.current_question)
        if correct:
            self.player.score += 1
            self.correct_questions.add(self.current_question.text)
        else:
            if self.player.score > 0:
                self.player.score -= 1
        self.player.stage = 2 if self.player.score > 2 else 1
        self.current_question = self._get_new_question()
        return correct

    def reset(self):
        self.player.score = 0
        self.player.stage = 1
        self.wrong_questions = []
        self.current_question = self._get_new_question()
