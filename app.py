import random
import operator


class Player:
    def __init__(self, name):
        self.name = name
        self.score = 0


OPERATIONS = {"+": operator.add,
              "-": operator.sub
              }


class Question:
    def __init__(self):
        self.x = random.randint(1, 10)
        self.y = random.randint(1, 10)
        self.operation = random.choice(list(OPERATIONS.keys()))
        self.func = OPERATIONS[self.operation]

        # למנוע תוצאה שלילית בחיסור
        if self.operation == "-" and self.y > self.x:
            self.x, self.y = self.y, self.x

        self.answer = self.func(self.x, self.y)
        self.text = f"{self.x} {self.operation} {self.y} ="

    def check_answer(self, res: int):
        return res == self.answer


class Game:
    def __init__(self, player_name: str):
        self.player = Player(player_name)
        self.current_question = Question()
        self.winning_score = 2

    def get_question(self):
        return self.current_question.text

    def submit_answer(self, res: int) -> int:
        if self.current_question.check_answer(res):
            self.player.score += 1
            print(f"✔️")
        else:
            print(f"❌")
            if self.player.score > 0:
                self.player.score -= 1
        print(f"{self.player.score} ניקוד ")
        if self.player.score == self.winning_score:
            print("ניצחון 🎉")
        self.current_question = Question()
        return self.player.score

