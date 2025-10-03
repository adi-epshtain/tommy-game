import random
import operator

from fastapi import HTTPException

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
