from models.player import Player
from models.question import Question


class Game:
    def __init__(self, player_name: str):
        self.player = Player(player_name)
        self.correct_questions = set()
        self.current_question = None
        self.winning_score = 5
        self.wrong_questions = []

    @classmethod
    async def create(cls, player_name: str):
        self = cls(player_name)
        self.current_question = await self._get_new_question()
        return self

    async def _get_new_question(self) -> Question:
        max_num = 5 if self.player.stage == 1 else 10

        while True:
            question = Question(max_num=max_num)
            if question.text not in self.correct_questions:
                return question

    async def get_question(self) -> str:
        try:
            return self.current_question.text
        except AttributeError:
            raise Exception("No current question set")

    async def submit_answer(self, res: int) -> bool:
        correct = await self.current_question.check_answer(res)
        if not correct:
            self.wrong_questions.append(self.current_question)
        if correct:
            self.player.score += 1
            self.correct_questions.add(self.current_question.text)
        else:
            if self.player.score > 0:
                self.player.score -= 1
        self.player.stage = 2 if self.player.score > 2 else 1
        self.current_question = await self._get_new_question()
        return correct

    async def reset(self):
        self.player.score = 0
        self.player.stage = 1
        self.wrong_questions = []
        self.current_question = await self._get_new_question()
