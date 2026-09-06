const params = new URLSearchParams(window.location.search);
const token = params.get("token");

// ================================
// CARREGAR PROPOSTA
// ================================

async function loadProposal() {

  if (!token) {
    alert("Link da proposta inválido.");
    return;
  }

  const { data, error } = await supabaseClient.rpc(
    "get_public_proposal",
    {
      token: token
    }
  );

  if (error || !data || data.length === 0) {
    console.error(error);
    alert("Proposta não encontrada.");
    return;
  }

  const proposal = data[0];
  document.getElementById("businessName").textContent =
  proposal.business_name || "Proposta Comercial";

document.getElementById("businessDocument").textContent =
  proposal.business_document
    ? "CPF/CNPJ: " + proposal.business_document
    : "";

document.getElementById("businessPhone").textContent =
  proposal.business_phone
    ? "WhatsApp: " + proposal.business_phone
    : "";

document.getElementById("businessEmail").textContent =
  proposal.business_email || "";

document.getElementById("businessAddress").textContent =
  proposal.business_address || "";

  // TÍTULO
  document.getElementById("publicTitle").textContent =
    proposal.title;

  // CLIENTE
  document.getElementById("publicClient").textContent =
    proposal.client_name;

  // VALOR
  document.getElementById("publicValue").textContent =
    Number(proposal.value).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });

  // PRAZO
  document.getElementById("publicDeadline").textContent =
    proposal.deadline || "A definir";

  // DESCRIÇÃO
  document.getElementById("publicDescription").textContent =
    proposal.description;

  // OBSERVAÇÕES
  document.getElementById("publicNotes").textContent =
    proposal.notes || "Sem observações adicionais.";

  // STATUS
  updateStatusVisual(proposal.status);


  // ================================
  // WHATSAPP
  // ================================

  const whatsappBtn =
    document.getElementById("whatsappProposal");

  whatsappBtn.onclick = () => {

    const linkProposta = window.location.href;

    const valor = Number(
      proposal.value
    ).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });

   const mensagem =
  `Olá ${proposal.client_name}!\n\n` +
  `Preparei uma proposta comercial para você.\n\n` +
  `Proposta: ${proposal.title}\n` +
  `Valor: ${valor}\n` +
  `Prazo: ${proposal.deadline || "A definir"}\n\n` +
  `Você pode visualizar e responder a proposta pelo link:\n` +
  `${linkProposta}`;
    const whatsappURL =
      "https://wa.me/?text=" +
      encodeURIComponent(mensagem);

    window.open(
      whatsappURL,
      "_blank"
    );
  };
}


// ================================
// ACEITAR / RECUSAR
// ================================

async function respondProposal(status) {

  const { data, error } = await supabaseClient.rpc(
    "respond_public_proposal",
    {
      token: token,
      new_status: status
    }
  );

  if (error || !data) {

    console.error(error);

    alert(
      "Erro ao responder proposta."
    );

    return;
  }

  updateStatusVisual(status);

  if (status === "Aceita") {

    alert(
      "Proposta aceita com sucesso!"
    );

  } else {

    alert(
      "Proposta recusada."
    );

  }
}


// ================================
// BOTÃO ACEITAR
// ================================

document
  .getElementById("acceptProposal")
  .addEventListener(
    "click",
    () => {
      respondProposal("Aceita");
    }
  );


// ================================
// BOTÃO RECUSAR
// ================================

document
  .getElementById("rejectProposal")
  .addEventListener(
    "click",
    () => {
      respondProposal("Recusada");
    }
  );


// ================================
// ATUALIZAR STATUS NA TELA
// ================================

function updateStatusVisual(status) {

  const element =
    document.getElementById(
      "publicStatus"
    );

  element.textContent = status;

  element.className =
    "tag " +
    (
      status === "Aceita"
        ? "green"

        : status === "Aguardando"
        ? "orange"

        : status === "Recusada"
        ? "red"

        : "gray"
    );
}


// ================================
// INICIAR
// ================================

loadProposal();
