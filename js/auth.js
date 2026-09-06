const tabLogin = document.getElementById("tabLogin");
const tabSignup = document.getElementById("tabSignup");
const loginPanel = document.getElementById("loginPanel");
const signupPanel = document.getElementById("signupPanel");
const authMessage = document.getElementById("authMessage");

function setMode(mode) {
  const signup = mode === "signup";

  tabLogin.classList.toggle("active", !signup);
  tabSignup.classList.toggle("active", signup);

  loginPanel.classList.toggle("hidden", signup);
  signupPanel.classList.toggle("hidden", !signup);

  authMessage.textContent = "";
}

tabLogin.addEventListener("click", () => setMode("login"));
tabSignup.addEventListener("click", () => setMode("signup"));

const params = new URLSearchParams(window.location.search);

if (params.get("mode") === "signup") {
  setMode("signup");
}

document
  .getElementById("signupForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document
      .getElementById("signupName")
      .value.trim();

    const email = document
      .getElementById("signupEmail")
      .value.trim()
      .toLowerCase();

    const password = document
      .getElementById("signupPassword")
      .value;

    authMessage.textContent = "Criando conta...";

    const { data, error } =
      await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name
          }
        }
      });

    if (error) {
      console.error(error);

      authMessage.textContent =
        error.message;

      return;
    }

    if (data.session) {
      window.location.href =
        "dashboard.html";
    } else {
      authMessage.textContent =
        "Conta criada! Verifique seu e-mail para confirmar o cadastro.";
    }
  });

document
  .getElementById("loginForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document
      .getElementById("loginEmail")
      .value.trim()
      .toLowerCase();

    const password = document
      .getElementById("loginPassword")
      .value;

    authMessage.textContent =
      "Entrando...";

    const { data, error } =
      await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

    if (error) {
      console.error(error);

      authMessage.textContent =
        "E-mail ou senha inválidos.";

      return;
    }

    window.location.href =
      "dashboard.html";
  });

async function checkLoggedUser() {
  const {
    data: { session }
  } = await supabaseClient.auth.getSession();

  if (session) {
    window.location.href =
      "dashboard.html";
  }
}

checkLoggedUser();