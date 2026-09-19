// ==========================================
// SUPABASE
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

  const {
    data: { user },
    error
  } =
    await supabaseClient.auth.getUser();

  if (error || !user) {
    window.location.href =
      "login.html";

    return;
  }

  usuarioAtual = user;

  await carregarClientes();
  await carregarPropostas();
}


// ==========================================
// CLIENTES
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

  clientes.forEach(
    cliente => {

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
    }
  );
}


// ==========================================
// VERIFICAR LIMITE FREE
// ==========================================

async function podeCriarProposta() {

  const {
    data: profile,
    error
  } =
    await supabaseClient
      .from("profiles")
      .select("plan")
      .eq(
        "id",
        usuarioAtual.id
      )
      .single();

  if (error) {

    console.error(error);

    alert(
      "Não foi possível verificar seu plano."
    );

    return false;
  }

  const plano =
    String(
      profile?.plan || "free"
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

    console.error(countError);

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
      .substring(2)
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
        "Informe o título."
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
            "Aguardando"
        });


    btnSalvar.disabled = false;

    btnSalvar.textContent =
      "Criar proposta";


    if (error) {

      console.error(error);


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

        return;
      }


      alert(
        "Erro ao criar proposta."
      );

      return;
    }


    // LIMPAR CAMPOS

    clienteSelect.value = "";

    tituloInput.value = "";

    valorInput.value = "";

    prazoInput.value = "";

    descricaoInput.value = "";

    observacoesInput.value = "";


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

    console.error(error);

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


  listaPropostas.innerHTML = "";


  data.forEach(
    proposta => {

      const card =
        document.createElement(
          "div"
        );

      card.className =
        "proposta";


      const valor =
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


      const statusHTML =
        criarStatusHTML(
          status
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
            👤
            ${escapar(
              proposta.client_name ||
              "-"
            )}
          </p>

          <p>
            📞
            ${escapar(
              proposta.client_phone ||
              "-"
            )}
          </p>

          <p class="valor">
            ${valor}
          </p>

          <p>
            ⏱️ Prazo:
            ${escapar(
              proposta.deadline ||
              "-"
            )}
          </p>

          ${statusHTML}

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
    }
  );
}


// ==========================================
// STATUS
// ==========================================

function normalizarStatus(status) {

  const valor =
    String(
      status || "Aguardando"
    )
      .trim()
      .toLowerCase();


  if (
    valor === "aceita" ||
    valor === "accepted"
  ) {
    return "Aceita";
  }


  if (
    valor === "recusada" ||
    valor === "rejected"
  ) {
    return "Recusada";
  }


  if (
    valor === "rascunho"
  ) {
    return "Rascunho";
  }


  return "Aguardando";
}


// ==========================================
// HTML DO STATUS
// ==========================================

function criarStatusHTML(status) {

  if (status === "Aceita") {

    return `
      <span
        class="
          status-badge
          status-aceita
        "
      >
        ✓ Aceita
      </span>
    `;
  }


  if (status === "Recusada") {

    return `
      <span
        class="
          status-badge
          status-recusada
        "
      >
        ✕ Recusada
      </span>
    `;
  }


  if (status === "Rascunho") {

    return `
      <span
        class="
          status-badge
          status-rascunho
        "
      >
        Rascunho
      </span>
    `;
  }


  return `
    <span
      class="
        status-badge
        status-aguardando
      "
    >
      ⏳ Aguardando
    </span>
  `;
}


// ==========================================
// GARANTIR TOKEN
// ==========================================

async function garantirTokens(
  propostas
) {

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
        "Erro ao gerar token:",
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
      "Esta proposta ainda não possui link."
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

    prompt(
      "Copie o link:",
      link
    );
  }
}


// ==========================================
// EXCLUIR
// ==========================================

async function excluirProposta(id) {

  const confirmar =
    confirm(
      "Deseja realmente excluir esta proposta?"
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

    console.error(error);

    alert(
      "Erro ao excluir proposta."
    );

    return;
  }


  await carregarPropostas();
}


// ==========================================
// GLOBAL
// ==========================================

window.copiarLink =
  copiarLink;

window.excluirProposta =
  excluirProposta;


// ==========================================
// INICIAR
// ==========================================

iniciar();
