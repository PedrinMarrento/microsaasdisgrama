async function getSessionUser() {
  const {
    data: { session },
    error
  } = await supabaseClient.auth.getSession();

  if (error || !session) {
    window.location.href = "login.html";
    return null;
  }

  return session.user;
}

async function logout() {
  await supabaseClient.auth.signOut();
  window.location.href = "login.html";
}

function moneyBR(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function statusClass(status) {
  if (status === "Aceita") return "green";
  if (status === "Aguardando") return "orange";
  if (status === "Recusada") return "red";
  return "gray";
}

document.addEventListener("DOMContentLoaded", async () => {
  const user = await getSessionUser();

  if (!user) return;

  const btn = document.getElementById("logoutBtn");

  if (btn) {
    btn.addEventListener("click", logout);
  }
});