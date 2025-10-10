let playerName = "";
let currentQuestionId = null;
const MATH_GAME = "Math Game";

function startGame() {
  playerName = document.getElementById("playerName").value;
  playerAge = document.getElementById("playerAge").value;
  if (!playerName) return alert("הכנס שם קודם!");

  fetch(`/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      player_name: playerName,
      player_age: parseInt(playerAge),
    }),
  })
    .then(r => r.json())
    .then(data => {
      document.getElementById("greeting").innerText = `שלום ${playerName}`;
      document.getElementById("question").innerText = data.question;
      document.getElementById("nameInput").style.display = "none";
      document.getElementById("game").style.display = "block";
      document.getElementById("answer").focus();

      currentQuestionId = data.question_id;
    })
    .catch(err => {
      console.error("שגיאה בעת התחלת המשחק:", err);
      alert("אירעה שגיאה בהתחלת המשחק");
    });
}

function submitAnswer() {
  const answer = document.getElementById("answer").value;
  fetch(`/answer`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({player_name: playerName,
                         answer: parseInt(answer),
                         question_id: currentQuestionId,
                         game_name: MATH_GAME })
  })
    .then(r => r.json())
    .then(data => {
      if (data.redirect) {
        window.location.href = data.redirect;
      } else {
        document.getElementById("score").innerText = "ניקוד: " + data.score;
        document.getElementById("stage").innerText = "רמה: " + data.stage;
        document.getElementById("result").innerText = data.is_correct  ? "✅ נכון!" : "❌ לא נכון!";
        document.getElementById("question").innerText = data.question;
        document.getElementById("answer").value = "";
        document.getElementById("answer").focus();
        currentQuestionId = data.question_id;

            // Update wrong questions list
            const wrongList = document.getElementById("wrong-questions");
            wrongList.innerHTML = "";
            data.wrong_questions.forEach(q => {
                const li = document.createElement("li");
                li.innerText = q;
                wrongList.appendChild(li);
            });
      }
    });
}
