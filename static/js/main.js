import { loginUser, signupUser, logoutUser } from './auth.js';
import { startGame, submitAnswer, showGameEnd, MATH_GAME } from './game.js';

let playerName = "";

async function getPlayerNameAndStartGame() {
  const token = localStorage.getItem("token");
  if (!token) return;
  const response = await fetch("/api/player_info", {
    headers: { "Authorization": "Bearer " + token }
  });
  if (response.ok) {
    const data = await response.json();
    playerName = data.name;
    await startGame(playerName);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form.centered-form");
  if (form) {
    form.addEventListener("submit", e => {
      e.preventDefault();
      submitAnswer();
    });
  }

  if (document.getElementById("game")) {
    getPlayerNameAndStartGame();
  }

  if (document.getElementById("loginName")) {
    document.querySelector("form").onsubmit = e => {
      e.preventDefault();
      loginUser();
    };
  }

  if (document.getElementById("signupName")) {
    document.querySelector("form").onsubmit = e => {
      e.preventDefault();
      signupUser();
    };
  }
  });


document.addEventListener("DOMContentLoaded", () => {
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", logoutUser);
    }
});
