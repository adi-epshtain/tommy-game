import random
import operator

from fastapi import HTTPException


class Player:
    def __init__(self, name):
        self.name = name
        self.score = 0
        self.stage = 1


OPERATIONS = {"+": operator.add,
              "-": operator.sub
              }


class Question:
    def __init__(self, max_num=5):
        self.x = random.randint(1, max_num)
        self.y = random.randint(1, max_num)
        self.operation = random.choice(list(OPERATIONS.keys()))
        self.func = OPERATIONS[self.operation]

        # To prevent a negative result in subtraction
        if self.operation == "-" and self.y > self.x:
            self.x, self.y = self.y, self.x

        self.answer = self.func(self.x, self.y)
        self.text = f"{self.x} {self.operation} {self.y} ="

    def check_answer(self, res: int) -> bool:
        if res is None:
            raise HTTPException(status_code=400,
                                detail="Please insert an answer")
        return res == self.answer


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
        else:
            if self.player.score > 0:
                self.player.score -= 1
        self.player.stage = 2 if self.player.score > 2 else 1
        self.current_question = self._get_new_question()
        return correct
