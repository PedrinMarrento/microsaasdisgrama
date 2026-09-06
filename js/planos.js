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

    const text = await response.text();

    console.log("RESPOSTA API:", text);

    if (!response.ok) {
      alert("Erro na API. Veja o Console.");
      return;
    }

    const data = JSON.parse(text);

    if (!data.url) {
      alert("A API não retornou o link de pagamento.");
      return;
    }

    window.location.href = data.url;

  } catch (error) {
    console.error("ERRO:", error);
    alert("Erro ao conectar com o pagamento.");

  } finally {
    upgradeBtn.disabled = false;
    upgradeBtn.textContent = "Assinar Pro";
  }
});
