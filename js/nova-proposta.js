const clientSelect = document.getElementById("proposalClient");
const titleInput = document.getElementById("proposalTitle");
const valueInput = document.getElementById("proposalValue");
const deadlineInput = document.getElementById("proposalDeadline");
const descInput = document.getElementById("proposalDescription");
const notesInput = document.getElementById("proposalNotes");

let allClients = [];

// BUSCAR CLIENTES DO SUPABASE
async function loadClients() {
  const user = await getSessionUser();

  if (!user) return;

  const { data, error } = await supabaseClient
    .from("clients")
    .select("*")
    .order("name");

  if (error) {
    console.error("Erro ao carregar clientes:", error);
    alert("Erro ao carregar clientes.");
    return;
  }

  allClients = data || [];

  clientSelect.innerHTML =
    '<option value="">Selecione um cliente</option>' +
    allClients
      .map(
        (client) =>
          `<option value="${client.id}">
            ${client.name}${client.company ? " — " + client.company : ""}
          </option>`
      )
      .join("");
}

// ATUALIZAR PRÉVIA
function updatePreview() {
  const client = allClients.find(
    (c) => c.id === clientSelect.value
  );

  document.getElementById("previewTitle").textContent =
    titleInput.value || "Sua proposta";

  document.getElementById("previewClient").textContent =
    client
      ? client.name
      : "Cliente ainda não selecionado";

  document.getElementById("previewValue").textContent =
    moneyBR(valueInput.value);

  document.getElementById("previewDeadline").textContent =
    deadlineInput.value || "Prazo a definir";

  document.getElementById("previewDescription").textContent =
    descInput.value || "A descrição aparecerá aqui.";
}

[
  titleInput,
  valueInput,
  deadlineInput,
  descInput
].forEach((element) => {
  element.addEventListener("input", updatePreview);
});

clientSelect.addEventListener("change", updatePreview);

// SALVAR PROPOSTA NO SUPABASE
async function saveProposal(status) {
  const user = await getSessionUser();

  if (!user) return;

  const client = allClients.find(
    (c) => c.id === clientSelect.value
  );

  if (!client) {
    alert("Selecione um cliente.");
    return;
  }

  if (
    !titleInput.value.trim() ||
    !valueInput.value ||
    !descInput.value.trim()
  ) {
    alert("Preencha título, valor e descrição.");
    return;
  }

  const { data, error } = await supabaseClient
    .from("proposals")
    .insert({
      user_id: user.id,

      client_id: client.id,

      client_name: client.name,
      client_phone: client.phone || "",

      title: titleInput.value.trim(),

      value: Number(valueInput.value),

      deadline: deadlineInput.value.trim(),

      description: descInput.value.trim(),

      notes: notesInput.value.trim(),

      status: status
    })
    .select()
    .single();

  if (error) {
    console.error("Erro ao criar proposta:", error);
    alert("Erro ao criar proposta.");
    return;
  }

  // Por enquanto volta para a lista.
  // Depois vamos adaptar proposta.html para o Supabase.
  window.location.href = "propostas.html";
}

// CRIAR E ENVIAR
document
  .getElementById("proposalForm")
  .addEventListener("submit", async (event) => {
    event.preventDefault();

    await saveProposal("Aguardando");
  });

// SALVAR COMO RASCUNHO
document
  .getElementById("saveDraft")
  .addEventListener("click", async () => {
    await saveProposal("Rascunho");
  });

// INICIAR
loadClients();