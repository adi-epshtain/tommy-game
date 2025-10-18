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
    startTimer(data.time_limit);
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
        startTimer(data.time_limit);
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

export async function loadPlayerStats() {
      const token = localStorage.getItem("token");
      const container = document.getElementById('statsContainer');
      try {
        const response = await fetch("/player_sessions_stats", {
        headers: { "Authorization": "Bearer " + token }
        });

        if (!response.ok) {
          const err = await response.json();
          container.innerHTML = `<p style="color:red;">שגיאה: ${err.detail || response.statusText}</p>`;
          return;
        }

        const data = await response.json();
        container.innerHTML = `<h2>שחקן: ${data.player_name}</h2>`;

        data.player_stats.forEach((session, idx) => {
          const div = document.createElement('div');
          div.classList.add('session');
          div.innerHTML = `
            <h3>סשן ${idx + 1}</h3>
            <h4> זמן משחק ${session.started_at}</h4>
            <p>תשובות נכונות: ${session.correct_count}</p>
            <p>תשובות שגויות: ${session.incorrect_count}</p>
            <p>שאלות שגויות:</p>
            <ul>${session.wrong_answer.map(q => `<li>${q}</li>`).join('')}</ul>
          `;
          container.appendChild(div);
        });

      } catch (err) {
        container.innerHTML = `<p style="color:red;">שגיאה בטעינה: ${err.message}</p>`;
      }
    }

    // ברגע שהעמוד נטען — נטען אוטומטית את הנתונים
    document.addEventListener('DOMContentLoaded', loadPlayerStats);

let countdownInterval;
let isPaused = false;
let remainingTime = 0;

export function startTimer(seconds) {
  const timerDisplay = document.getElementById("timer");
  const pauseBtn = document.getElementById("pause-btn");

  clearInterval(countdownInterval);
  remainingTime = seconds;
  isPaused = false;
  if (pauseBtn) pauseBtn.innerText = "⏸️ עצור";

  timerDisplay.textContent = `⏰ זמן שנותר: ${remainingTime} שניות`;

  countdownInterval = setInterval(() => {
    if (!isPaused) {
      remainingTime -= 1;
      timerDisplay.textContent = `⏰ זמן שנותר: ${remainingTime} שניות`;

      if (remainingTime <= 0) {
        clearInterval(countdownInterval);
        timerDisplay.textContent = "⏰ נגמר הזמן!";
        onTimeUp();
      }
    }
  }, 1000);
}


function onTimeUp() {
    clearInterval(countdownInterval);
    const timerDisplay = document.getElementById("timer");
    const result = document.getElementById("result");

  // הצגת הודעה ברורה
    timerDisplay.textContent = "⏰ נגמר הזמן!";
    timerDisplay.style.color = "red";
    result.textContent = "לא הספקת בזמן 😢";
    result.style.color = "red";
    result.style.fontSize = "1.5em";

    // אפקט קצר לפני שממשיכים לשאלה הבאה
    setTimeout(() => {
    document.getElementById("answer").value = "";
    submitAnswer(); // שולחת תשובה ריקה -> נחשב כשגיאה
  }, 1500);
}

document.addEventListener("DOMContentLoaded", () => {
  const pauseBtn = document.getElementById("pause-btn");
  if (pauseBtn) {
    pauseBtn.addEventListener("click", toggleTimer);
  }
});

export function toggleTimer() {
  const pauseBtn = document.getElementById("pause-btn");
  isPaused = !isPaused;
  pauseBtn.innerText = isPaused ? "▶️ המשך" : "⏸️ עצור";
}

export async function saveSettings() {
  const token = localStorage.getItem("token");
  const difficulty = parseInt(document.getElementById("difficulty").value);
  const winningScore = parseInt(document.getElementById("winning_score").value);

  await fetch("/set_game_settings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token
    },
    body: JSON.stringify({
      difficulty: difficulty,
      winning_score: winningScore
    }),
  })
  .then(r => r.json())
  .then(data => {
    alert("🎮 ההגדרות נשמרו בהצלחה!");
  })
  .catch(err => {
    alert("שגיאה בשמירת ההגדרות");
    console.error(err);
  });
}