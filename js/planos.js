const upgradeBtn = document.getElementById("upgradeBtn");

upgradeBtn.addEventListener("click", async () => {
  const user = await getSessionUser();

  if (!user) return;

  upgradeBtn.disabled = true;
  upgradeBtn.textContent = "Carregando...";

  try {
    const response = await fetch("/api/create-subscription", {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        email: user.email,
        userId: user.id
      })
    });

    const data = await response.json();

    if (!response.ok || !data.url) {
      console.error(data);
      alert("Erro ao iniciar assinatura.");
      return;
    }

    window.location.href = data.url;

  } catch (error) {
    console.error(error);
    alert("Erro ao conectar com o pagamento.");

  } finally {
    upgradeBtn.disabled = false;
    upgradeBtn.textContent = "Assinar Pro";
  }
});
