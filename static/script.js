let playerName = "";
let currentQuestionId = null;
const MATH_GAME = "Math Game";

async function loginUser() {
  const name = document.getElementById("name").value;
  const password = document.getElementById("password").value;

  const response = await fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json"},
    body: JSON.stringify({ name, password })
  });

  if (!response.ok) {
    alert("שם משתמש או סיסמה שגויים");
    return;
  }

  const data = await response.json();
  // 👇 כאן שומרים את ה־token בדפדפן
  localStorage.setItem("token", data.access_token);

  // ✅ מעבירים את המשתמש לעמוד הראשי של המשחק
  window.location.href = "/";
}

async function startGame(playerName, playerAge = 5) {
  if (!playerName) return alert("שם השחקן לא ידוע");
  fetch(`/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + localStorage.getItem("token")
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
  headers: { "Content-Type": "application/json",
              "Authorization": "Bearer " + localStorage.getItem("token")},
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


async function getPlayerNameAndStartGame() {
  const token = localStorage.getItem("token");
  if (!token) return;
  const response = await fetch("/api/player_info", {
    headers: { "Authorization": "Bearer " + token }
  });
  if (response.ok) {
    const data = await response.json();
    playerName = data.name;   // משתמשים במשתנה הגלובלי

    // התחלת המשחק אוטומטית
    await startGame(playerName);
  }
}


document.addEventListener("DOMContentLoaded", getPlayerNameAndStartGame);
