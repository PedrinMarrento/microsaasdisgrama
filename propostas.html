// ==========================================
// CONFIGURAÇÃO SUPABASE
// ==========================================

const SUPABASE_URL =
  "https://pdmpyietjlwqfqxdcztd.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_qhcsSm4VcaZcIP_d5JBYRQ_5jmCo0WT";

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


// ==========================================
// VARIÁVEIS
// ==========================================

let usuarioAtual = null;
let clientes = [];


// ==========================================
// ELEMENTOS
// ==========================================

const clienteSelect =
  document.getElementById("cliente");

const tituloInput =
  document.getElementById("titulo");

const valorInput =
  document.getElementById("valor");

const prazoInput =
  document.getElementById("prazo");

const descricaoInput =
  document.getElementById("descricao");

const observacoesInput =
  document.getElementById("observacoes");

const btnSalvar =
  document.getElementById("btnSalvar");

const listaPropostas =
  document.getElementById("listaPropostas");


// ==========================================
// INICIAR
// ==========================================

async function iniciar() {
  try {
    const {
      data: { user },
      error
    } =
      await supabaseClient.auth.getUser();

    if (error || !user) {
      window.location.href = "login.html";
      return;
    }

    usuarioAtual = user;

    await carregarClientes();
    await carregarPropostas();

  } catch (error) {
    console.error(
      "Erro ao iniciar:",
      error
    );
  }
}


// ==========================================
// CARREGAR CLIENTES
// ==========================================

async function carregarClientes() {
  const {
    data,
    error
  } =
    await supabaseClient
      .from("clients")
      .select("*")
      .eq(
        "user_id",
        usuarioAtual.id
      )
      .order(
        "created_at",
        {
          ascending: false
        }
      );

  if (error) {
    console.error(
      "Erro ao carregar clientes:",
      error
    );

    return;
  }

  clientes = data || [];

  clienteSelect.innerHTML = `
    <option value="">
      Selecione um cliente
    </option>
  `;

  clientes.forEach(cliente => {
    const option =
      document.createElement(
        "option"
      );

    option.value =
      cliente.id;

    option.textContent =
      cliente.name;

    clienteSelect.appendChild(
      option
    );
  });
}


// ==========================================
// VERIFICAR LIMITE FREE / PRO
// ==========================================

async function podeCriarProposta() {
  const {
    data: profile,
    error: profileError
  } =
    await supabaseClient
      .from("profiles")
      .select("plan")
      .eq(
        "id",
        usuarioAtual.id
      )
      .single();

  if (profileError) {
    console.error(
      "Erro ao verificar plano:",
      profileError
    );

    alert(
      "Não foi possível verificar seu plano."
    );

    return false;
  }

  const plano =
    (
      profile?.plan ||
      "free"
    ).toLowerCase();

  if (plano === "pro") {
    return true;
  }

  const {
    count,
    error: countError
  } =
    await supabaseClient
      .from("proposals")
      .select(
        "*",
        {
          count: "exact",
          head: true
        }
      )
      .eq(
        "user_id",
        usuarioAtual.id
      );

  if (countError) {
    console.error(
      "Erro ao contar propostas:",
      countError
    );

    alert(
      "Erro ao verificar suas propostas."
    );

    return false;
  }

  if ((count || 0) >= 3) {
    alert(
      "Você atingiu o limite de 3 propostas do plano FREE.\n\n" +
      "Assine o PRO para criar propostas ilimitadas."
    );

    window.location.href =
      "planos.html";

    return false;
  }

  return true;
}


// ==========================================
// GERAR TOKEN
// ==========================================

function gerarToken() {
  if (
    window.crypto &&
    window.crypto.randomUUID
  ) {
    return crypto.randomUUID();
  }

  return (
    Date.now().toString(36) +
    Math.random()
      .toString(36)
      .substring(2, 15)
  );
}


// ==========================================
// CRIAR PROPOSTA
// ==========================================

btnSalvar.addEventListener(
  "click",
  async () => {

    const clientId =
      clienteSelect.value;

    const titulo =
      tituloInput.value.trim();

    const valor =
      Number(
        valorInput.value
      );

    const prazo =
      prazoInput.value.trim();

    const descricao =
      descricaoInput.value.trim();

    const observacoes =
      observacoesInput.value.trim();


    if (!clientId) {
      alert(
        "Selecione um cliente."
      );
      return;
    }

    if (!titulo) {
      alert(
        "Informe o título da proposta."
      );
      return;
    }

    if (
      !valor ||
      valor <= 0
    ) {
      alert(
        "Informe um valor válido."
      );
      return;
    }

    const cliente =
      clientes.find(
        item =>
          item.id === clientId
      );

    if (!cliente) {
      alert(
        "Cliente não encontrado."
      );
      return;
    }


    const permitido =
      await podeCriarProposta();

    if (!permitido) {
      return;
    }


    btnSalvar.disabled = true;
    btnSalvar.textContent =
      "Criando...";


    const token =
      gerarToken();


    const {
      error
    } =
      await supabaseClient
        .from("proposals")
        .insert({
          user_id:
            usuarioAtual.id,

          client_id:
            cliente.id,

          client_name:
            cliente.name,

          client_phone:
            cliente.phone || null,

          title:
            titulo,

          value:
            valor,

          deadline:
            prazo,

          description:
            descricao,

          notes:
            observacoes,

          token:
            token,

          status:
            "pending"
        });


    btnSalvar.disabled = false;
    btnSalvar.textContent =
      "Criar proposta";


    if (error) {
      console.error(
        "Erro ao criar proposta:",
        error
      );

      if (
        error.code === "42501" ||
        error.message
          ?.toLowerCase()
          .includes(
            "row-level security"
          )
      ) {
        alert(
          "Você atingiu o limite de 3 propostas do plano FREE.\n\n" +
          "Assine o PRO para criar propostas ilimitadas."
        );

        window.location.href =
          "planos.html";

        return;
      }

      alert(
        "Erro ao criar proposta."
      );

      return;
    }


    clienteSelect.value =
      "";

    tituloInput.value =
      "";

    valorInput.value =
      "";

    prazoInput.value =
      "";

    descricaoInput.value =
      "";

    observacoesInput.value =
      "";


    alert(
      "Proposta criada com sucesso!"
    );


    await carregarPropostas();

  }
);


// ==========================================
// CARREGAR PROPOSTAS
// ==========================================

async function carregarPropostas() {
  listaPropostas.innerHTML = `
    <p class="vazio">
      Carregando...
    </p>
  `;

  const {
    data,
    error
  } =
    await supabaseClient
      .from("proposals")
      .select("*")
      .eq(
        "user_id",
        usuarioAtual.id
      )
      .order(
        "created_at",
        {
          ascending: false
        }
      );

  if (error) {
    console.error(
      "Erro ao carregar propostas:",
      error
    );

    listaPropostas.innerHTML = `
      <p class="vazio">
        Erro ao carregar propostas.
      </p>
    `;

    return;
  }

  if (
    !data ||
    data.length === 0
  ) {
    listaPropostas.innerHTML = `
      <p class="vazio">
        Você ainda não possui propostas.
      </p>
    `;

    return;
  }

  await garantirTokens(data);

  listaPropostas.innerHTML =
    "";

  data.forEach(proposta => {

    const card =
      document.createElement(
        "div"
      );

    card.className =
      "proposta";


    const valorFormatado =
      Number(
        proposta.value || 0
      ).toLocaleString(
        "pt-BR",
        {
          style: "currency",
          currency: "BRL"
        }
      );


    const status =
      normalizarStatus(
        proposta.status
      );


    card.innerHTML = `

      <div class="proposta-info">

        <h3>
          ${escapar(
            proposta.title ||
            "Sem título"
          )}
        </h3>

        <p>
          👤 ${escapar(
            proposta.client_name ||
            "-"
          )}
        </p>

        <p>
          📞 ${escapar(
            proposta.client_phone ||
            "-"
          )}
        </p>

        <p class="valor">
          ${valorFormatado}
        </p>

        <p>
          ⏱️ Prazo:
          ${escapar(
            proposta.deadline ||
            "-"
          )}
        </p>

        <p>
          Status:
          <strong>
            ${statusLabel(status)}
          </strong>
        </p>

      </div>


      <div class="proposta-acoes">

        <a
          class="btn btn-primary"
          href="proposta.html?token=${encodeURIComponent(
            proposta.token || ""
          )}"
          target="_blank"
        >
          Abrir
        </a>

        <button
          class="btn btn-primary"
          onclick="copiarLink('${proposta.token || ""}')"
        >
          Copiar link
        </button>

        <button
          class="btn btn-danger"
          onclick="excluirProposta('${proposta.id}')"
        >
          Excluir
        </button>

      </div>

    `;

    listaPropostas.appendChild(
      card
    );
  });
}


// ==========================================
// GARANTIR TOKEN EM PROPOSTAS ANTIGAS
// ==========================================

async function garantirTokens(propostas) {
  for (
    const proposta
    of propostas
  ) {

    if (proposta.token) {
      continue;
    }

    const novoToken =
      gerarToken();

    const {
      error
    } =
      await supabaseClient
        .from("proposals")
        .update({
          token: novoToken
        })
        .eq(
          "id",
          proposta.id
        )
        .eq(
          "user_id",
          usuarioAtual.id
        );

    if (error) {
      console.error(
        "Erro ao criar token:",
        proposta.id,
        error
      );

      continue;
    }

    proposta.token =
      novoToken;
  }
}


// ==========================================
// COPIAR LINK
// ==========================================

async function copiarLink(token) {
  if (!token) {
    alert(
      "Essa proposta ainda não possui link."
    );

    return;
  }

  const link =
    `${window.location.origin}/proposta.html?token=${encodeURIComponent(token)}`;

  try {
    await navigator.clipboard
      .writeText(link);

    alert(
      "Link da proposta copiado!"
    );

  } catch (error) {
    console.error(
      "Erro ao copiar:",
      error
    );

    prompt(
      "Copie o link:",
      link
    );
  }
}


// ==========================================
// EXCLUIR PROPOSTA
// ==========================================

async function excluirProposta(id) {
  const confirmar =
    confirm(
      "Deseja excluir esta proposta?"
    );

  if (!confirmar) {
    return;
  }

  const {
    error
  } =
    await supabaseClient
      .from("proposals")
      .delete()
      .eq(
        "id",
        id
      )
      .eq(
        "user_id",
        usuarioAtual.id
      );

  if (error) {
    console.error(
      "Erro ao excluir proposta:",
      error
    );

    alert(
      "Erro ao excluir proposta."
    );

    return;
  }

  await carregarPropostas();
}


// ==========================================
// STATUS
// ==========================================

function normalizarStatus(status) {
  const valor =
    String(
      status || "pending"
    )
      .trim()
      .toLowerCase();

  if (
    valor === "accepted" ||
    valor === "aceita" ||
    valor === "aceito"
  ) {
    return "accepted";
  }

  if (
    valor === "rejected" ||
    valor === "recusada"
  ) {
    return "rejected";
  }

  return "pending";
}


function statusLabel(status) {
  if (status === "accepted") {
    return "Aceita";
  }

  if (status === "rejected") {
    return "Recusada";
  }

  return "Aguardando";
}


// ==========================================
// PROTEÇÃO HTML
// ==========================================

function escapar(valor) {
  return String(valor)

    .replaceAll(
      "&",
      "&amp;"
    )

    .replaceAll(
      "<",
      "&lt;"
    )

    .replaceAll(
      ">",
      "&gt;"
    )

    .replaceAll(
      '"',
      "&quot;"
    )

    .replaceAll(
      "'",
      "&#039;"
    );
}


// ==========================================
// FUNÇÕES GLOBAIS
// ==========================================

window.excluirProposta =
  excluirProposta;

window.copiarLink =
  copiarLink;


// ==========================================
// INICIAR
// ==========================================

iniciar();
