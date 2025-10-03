let playerName = "";

function startGame() {
  playerName = document.getElementById("playerName").value;
  if (!playerName) return alert("הכנס שם קודם!");

  fetch(`/start/${playerName}`)
    .then(r => r.json())
    .then(data => {
      // ברכה אישית
      document.getElementById("greeting").innerText = `שלום ${playerName}`;
      // השאלה הראשונה
      document.getElementById("question").innerText = data.question;
      // הסתרת שדה הכנסת השם
      document.getElementById("nameInput").style.display = "none";
      // הצגת המשחק
      document.getElementById("game").style.display = "block";
      // פוקוס ישר לשדה התשובה
      document.getElementById("answer").focus();
    });
}

function submitAnswer() {
  const ans = document.getElementById("answer").value;
  fetch(`/answer/${playerName}/${ans}`, { method: "POST" })
    .then(r => r.json())
    .then(data => {
      if (data.redirect) {
        window.location.href = data.redirect;
      } else {
        document.getElementById("result").innerText = data.result;
        document.getElementById("question").innerText = data.question;
        document.getElementById("answer").value = "";
        document.getElementById("answer").focus();
      }
    });
}
