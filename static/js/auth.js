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

async function isStrongPassword(password) {
  // לפחות 6 תווים
  if (password.length < 6) return false;

  // לפחות ספרה אחת
  if (!/[0-9]/.test(password)) return false;

  // אם עבר את כל הבדיקות, הסיסמה נחשבת חזקה
  return true;
}


export async function signupUser() {
  const name = document.getElementById("signupName").value;
  const age = parseInt(document.getElementById("signupAge").value);
  const password = document.getElementById("signupPassword").value;
  const passwordConfirm = document.getElementById("signupPasswordConfirm").value;

  if (password !== passwordConfirm) {
    alert("הסיסמאות אינן תואמות.");
    return;
  }

  if (!isStrongPassword(password)) {
    alert("הסיסמה חייבת להיות לפחות 6 תווים ולכלול ספרה.");
    return;
  }

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
