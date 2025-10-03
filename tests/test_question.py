import pytest

from models.question import Question


class TestQuestion:
    def test_question_prevents_negative_subtraction_results(self):
        question = Question(max_num=5)
        if question.operation == "-":
            assert question.x >= question.y

    def test_question_rejects_none_as_answer(self):
        question = Question(max_num=5)
        with pytest.raises(Exception) as exc_info:
            question.check_answer(None)
        assert "Please insert an answer" in str(exc_info.value)
