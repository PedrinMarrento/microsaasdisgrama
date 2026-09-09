const upgradeBtn = document.getElementById("upgradeBtn");

upgradeBtn.addEventListener("click", async () => {
  const user = await getSessionUser();

  if (!user) return;

  upgradeBtn.disabled = true;
  upgradeBtn.textContent = "Carregando...";

  try {
    const response = await fetch("/api/create-asaas-subscription", {
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

    console.log("RESPOSTA ASAAS:", data);

    if (!response.ok) {
      console.error(data);
      alert("Erro ao criar pagamento. Veja o Console.");
      return;
    }

    if (!data.url) {
      alert("O Asaas não retornou o link de pagamento.");
      return;
    }

    window.location.href = data.url;

  } catch (error) {
    console.error("ERRO:", error);
    alert("Erro ao conectar com o Asaas.");

  } finally {
    upgradeBtn.disabled = false;
    upgradeBtn.textContent = "Assinar Pro";
  }
});
