export async function loginUser() {
  const name = document.getElementById("loginName").value;
  const password = document.getElementById("loginPassword").value;

  try {
    const response = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, password })
    });

    if (!response.ok) {
      const err = await response.json();
      alert("שגיאה בהתחברות: " + (err.detail || response.statusText));
      return;
    }

    const data = await response.json();
    localStorage.setItem("token", data.access_token);
    window.location.href = "/game";
  } catch (err) {
    alert("אירעה שגיאה בהתחברות: " + err.message);
  }
}

export async function signupUser() {
  const name = document.getElementById("signupName").value;
  const age = parseInt(document.getElementById("signupAge").value);
  const password = document.getElementById("signupPassword").value;

  try {
    const response = await fetch("/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, age, password })
    });

    if (!response.ok) {
      const err = await response.json();
      alert("שגיאה בהרשמה: " + (err.detail || response.statusText));
      return;
    }

    alert("נרשמת בהצלחה! עכשיו תוכל להתחבר.");
    window.location.href = "/login";
  } catch (err) {
    alert("אירעה שגיאה בהרשמה: " + err.message);
  }
}
