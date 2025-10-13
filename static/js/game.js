export const MATH_GAME = "Math Game";

let currentQuestionId = null;

export async function startGame(playerName, playerAge = 5) {
  if (!playerName) return alert("שם השחקן לא ידוע");
  fetch(`/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + localStorage.getItem("token")
    },
    body: JSON.stringify({ player_age: parseInt(playerAge) }),
  })
  .then(r => r.json())
  .then(data => {
    document.getElementById("greeting").innerText = `שלום ${playerName}`;
    document.getElementById("question").innerText = data.question;
    document.getElementById("game").style.display = "block";
    document.getElementById("answer").focus();
    currentQuestionId = data.question_id;
  })
  .catch(err => {
    console.error("שגיאה בעת התחלת המשחק:", err);
    alert("אירעה שגיאה בהתחלת המשחק");
  });
}

export function submitAnswer() {
  const answer = document.getElementById("answer").value;
  fetch(`/answer`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + localStorage.getItem("token")
    },
    body: JSON.stringify({
      answer: parseInt(answer),
      question_id: currentQuestionId,
      game_name: MATH_GAME
    }),
  })
    .then(r => r.json())
    .then(data => {
      if (data.redirect) {
        showGameEnd();
      } else {
        document.getElementById("score").innerText = "ניקוד: " + data.score;
        document.getElementById("stage").innerText = "רמה: " + data.stage;
        document.getElementById("result").innerText = data.is_correct ? "✅ נכון!" : "❌ לא נכון!";
        document.getElementById("question").innerText = data.question;
        document.getElementById("answer").value = "";
        document.getElementById("answer").focus();
        currentQuestionId = data.question_id;

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


export async function showGameEnd() {
  const token = localStorage.getItem("token");
  const response = await fetch("/api/game_end", {
    headers: { "Authorization": "Bearer " + token }
  });
  if (!response.ok) {
    alert("אירעה שגיאה בטעינת סיום המשחק");
    return;
  }
  const data = await response.json();

  document.body.innerHTML = `
    <h1>כל הכבוד ${data.player_name}!</h1>
    <h2>הניקוד שלך: ${data.score}</h2>
    <hr>
    <h2>🏆 לוח התוצאות</h2>
    <table style="margin:auto; border-collapse: collapse; width: 50%;">
      <tr><th>מקום</th><th>שם</th><th>ניקוד</th></tr>
      ${data.top_players.map((p, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${p.name}</td>
          <td>${p.score}</td>
        </tr>
      `).join('')}
    </table>
    <br>
    <img src="/static/dino.png" alt="דינוזאור חמוד" class="dino-img" />
    <br>
    <a href="/game" class="btn">שחק שוב</a>
  `;
}
