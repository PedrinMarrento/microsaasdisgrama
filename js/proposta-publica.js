const params = new URLSearchParams(window.location.search);
const token = params.get("token");

let propostaAtual = null;


// ==========================================
// CARREGAR PROPOSTA
// ==========================================

async function loadProposal() {

  if (!token) {
    alert("Link da proposta inválido.");
    return;
  }

  try {

    const response = await fetch(
      `/api/get-proposal?token=${encodeURIComponent(token)}`
    );

    const proposal = await response.json();

    if (!response.ok) {
      console.error(proposal);

      alert(
        proposal.error ||
        "Proposta não encontrada."
      );

      return;
    }

    propostaAtual = proposal;


    // ======================================
    // LOGO DA EMPRESA
    // ======================================

    const logoBox =
      document.getElementById(
        "businessLogoBox"
      );

    const logo =
      document.getElementById(
        "businessLogo"
      );


    if (
      proposal.business_logo &&
      logoBox &&
      logo
    ) {

      logo.src =
        proposal.business_logo;

      logoBox.style.display =
        "flex";


      // Se a imagem não carregar,
      // simplesmente esconde o espaço.

      logo.onerror = () => {

        logoBox.style.display =
          "none";

      };

    } else if (logoBox) {

      logoBox.style.display =
        "none";

    }


    // ======================================
    // EMPRESA
    // ======================================

    document.getElementById(
      "businessName"
    ).textContent =
      proposal.business_name ||
      "Proposta Comercial";


    document.getElementById(
      "businessDocument"
    ).textContent =
      proposal.business_document
        ? "CPF/CNPJ: " +
          proposal.business_document
        : "";


    document.getElementById(
      "businessPhone"
    ).textContent =
      proposal.business_phone
        ? "WhatsApp: " +
          proposal.business_phone
        : "";


    document.getElementById(
      "businessEmail"
    ).textContent =
      proposal.business_email || "";


    document.getElementById(
      "businessAddress"
    ).textContent =
      proposal.business_address || "";


    // ======================================
    // CLIENTE
    // ======================================

    document.getElementById(
      "publicClient"
    ).textContent =
      proposal.client_name ||
      "Cliente";


    // ======================================
    // TÍTULO
    // ======================================

    document.getElementById(
      "publicTitle"
    ).textContent =
      proposal.title ||
      "Proposta comercial";


    // ======================================
    // VALOR
    // ======================================

    document.getElementById(
      "publicValue"
    ).textContent =
      Number(
        proposal.value || 0
      ).toLocaleString(
        "pt-BR",
        {
          style: "currency",
          currency: "BRL"
        }
      );


    // ======================================
    // PRAZO
    // ======================================

    document.getElementById(
      "publicDeadline"
    ).textContent =
      proposal.deadline ||
      "A definir";


    // ======================================
    // DESCRIÇÃO
    // ======================================

    document.getElementById(
      "publicDescription"
    ).textContent =
      proposal.description ||
      "Sem descrição.";


    // ======================================
    // OBSERVAÇÕES
    // ======================================

    document.getElementById(
      "publicNotes"
    ).textContent =
      proposal.notes ||
      "Sem observações adicionais.";


    // ======================================
    // STATUS
    // ======================================

    updateStatusVisual(
      proposal.status
    );


    // ======================================
    // WHATSAPP
    // ======================================

    configurarWhatsApp();


  } catch (error) {

    console.error(error);

    alert(
      "Erro ao carregar proposta."
    );
  }
}


// ==========================================
// WHATSAPP
// ==========================================

function configurarWhatsApp() {

  const whatsappBtn =
    document.getElementById(
      "whatsappProposal"
    );


  whatsappBtn.onclick = () => {

    if (!propostaAtual) {
      return;
    }


    const valor =
      Number(
        propostaAtual.value || 0
      ).toLocaleString(
        "pt-BR",
        {
          style: "currency",
          currency: "BRL"
        }
      );


    const mensagem =
      `Olá ${propostaAtual.client_name || ""}!\n\n` +
      `Preparei uma proposta comercial para você.\n\n` +
      `Proposta: ${propostaAtual.title || ""}\n` +
      `Valor: ${valor}\n` +
      `Prazo: ${propostaAtual.deadline || "A definir"}\n\n` +
      `Visualize a proposta pelo link:\n` +
      `${window.location.href}`;


    const whatsappURL =
      "https://wa.me/?text=" +
      encodeURIComponent(
        mensagem
      );


    window.open(
      whatsappURL,
      "_blank"
    );
  };
}


// ==========================================
// ACEITAR PROPOSTA
// ==========================================

async function aceitarProposta() {

  const confirmar =
    confirm(
      "Deseja aceitar esta proposta?"
    );


  if (!confirmar) {
    return;
  }


  const botao =
    document.getElementById(
      "acceptProposal"
    );


  botao.disabled = true;

  botao.textContent =
    "Confirmando...";


  try {

    const response =
      await fetch(
        "/api/accept-proposal",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            token: token
          })
        }
      );


    const data =
      await response.json();


    if (!response.ok) {

      console.error(data);

      alert(
        data.error ||
        "Erro ao aceitar proposta."
      );


      botao.disabled = false;

      botao.textContent =
        "✓ Aceitar proposta";

      return;
    }


    propostaAtual.status =
      "Aceita";


    updateStatusVisual(
      "Aceita"
    );


    alert(
      "Proposta aceita com sucesso!"
    );


  } catch (error) {

    console.error(error);

    alert(
      "Erro ao aceitar proposta."
    );


    botao.disabled = false;

    botao.textContent =
      "✓ Aceitar proposta";
  }
}


// ==========================================
// RECUSAR PROPOSTA
// ==========================================

async function recusarProposta() {

  const confirmar =
    confirm(
      "Tem certeza que deseja recusar esta proposta?"
    );


  if (!confirmar) {
    return;
  }


  const botao =
    document.getElementById(
      "rejectProposal"
    );


  botao.disabled = true;

  botao.textContent =
    "Recusando...";


  try {

    const response =
      await fetch(
        "/api/reject-proposal",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            token: token
          })
        }
      );


    const data =
      await response.json();


    if (!response.ok) {

      console.error(data);

      alert(
        data.error ||
        "Erro ao recusar proposta."
      );


      botao.disabled = false;

      botao.textContent =
        "✕ Recusar";

      return;
    }


    propostaAtual.status =
      "Recusada";


    updateStatusVisual(
      "Recusada"
    );


    alert(
      "Proposta recusada."
    );


  } catch (error) {

    console.error(error);

    alert(
      "Erro ao recusar proposta."
    );


    botao.disabled = false;

    botao.textContent =
      "✕ Recusar";
  }
}


// ==========================================
// STATUS VISUAL
// ==========================================

function updateStatusVisual(status) {

  const element =
    document.getElementById(
      "publicStatus"
    );


  const aceitar =
    document.getElementById(
      "acceptProposal"
    );


  const recusar =
    document.getElementById(
      "rejectProposal"
    );


  const statusNormalizado =
    String(
      status || "Aguardando"
    )
      .trim()
      .toLowerCase();


  // ======================================
  // ACEITA
  // ======================================

  if (
    statusNormalizado === "aceita" ||
    statusNormalizado === "accepted"
  ) {

    element.textContent =
      "Aceita";


    element.className =
      "tag green";


    aceitar.disabled =
      true;


    aceitar.textContent =
      "✓ Proposta aceita";


    recusar.disabled =
      true;


    recusar.textContent =
      "✕ Recusar";


    return;
  }


  // ======================================
  // RECUSADA
  // ======================================

  if (
    statusNormalizado === "recusada" ||
    statusNormalizado === "rejected"
  ) {

    element.textContent =
      "Recusada";


    element.className =
      "tag red";


    aceitar.disabled =
      true;


    aceitar.textContent =
      "✓ Aceitar proposta";


    recusar.disabled =
      true;


    recusar.textContent =
      "✕ Proposta recusada";


    return;
  }


  // ======================================
  // AGUARDANDO
  // ======================================

  element.textContent =
    "Aguardando";


  element.className =
    "tag orange";


  aceitar.disabled =
    false;


  aceitar.textContent =
    "✓ Aceitar proposta";


  recusar.disabled =
    false;


  recusar.textContent =
    "✕ Recusar";
}


// ==========================================
// BOTÃO ACEITAR
// ==========================================

document
  .getElementById(
    "acceptProposal"
  )
  .addEventListener(
    "click",
    aceitarProposta
  );


// ==========================================
// BOTÃO RECUSAR
// ==========================================

document
  .getElementById(
    "rejectProposal"
  )
  .addEventListener(
    "click",
    recusarProposta
  );


// ==========================================
// INICIAR
// ==========================================

loadProposal();
