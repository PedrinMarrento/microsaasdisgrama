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

      window.location.href =
        "login.html";

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
// VERIFICAR LIMITE DO PLANO
// ==========================================

async function podeCriarProposta() {

  // Buscar plano do usuário

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


  // PRO NÃO TEM LIMITE

  if (plano === "pro") {

    return true;

  }


  // ==========================================
  // CONTAR PROPOSTAS DO FREE
  // ==========================================

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


  // ==========================================
  // LIMITE FREE = 3
  // ==========================================

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


    // ========================================
    // VALIDAR CAMPOS
    // ========================================

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


    // ========================================
    // VERIFICAR FREE / PRO
    // ========================================

    const permitido =
      await podeCriarProposta();


    if (!permitido) {

      return;

    }


    // ========================================
    // DESABILITAR BOTÃO
    // ========================================

    btnSalvar.disabled = true;

    btnSalvar.textContent =
      "Criando...";


    // ========================================
    // SALVAR NO SUPABASE
    // ========================================

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
            observacoes

        });


    // ========================================
    // REATIVAR BOTÃO
    // ========================================

    btnSalvar.disabled = false;

    btnSalvar.textContent =
      "Criar proposta";


    // ========================================
    // TRATAR ERRO
    // ========================================

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
          "Você não tem permissão para criar esta proposta.\n\n" +
          "Se você estiver no plano FREE, verifique se já atingiu o limite de 3 propostas."
        );

        return;
      }


      alert(
        "Erro ao criar proposta."
      );

      return;
    }


    // ========================================
    // LIMPAR FORMULÁRIO
    // ========================================

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


    // ========================================
    // ATUALIZAR LISTA
    // ========================================

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


  // ==========================================
  // NENHUMA PROPOSTA
  // ==========================================

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


  listaPropostas.innerHTML =
    "";


  // ==========================================
  // MOSTRAR PROPOSTAS
  // ==========================================

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
      )
        .toLocaleString(
          "pt-BR",
          {
            style: "currency",
            currency: "BRL"
          }
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
          ${valorFormatado}
        </p>

        <p>
          ⏱️ Prazo:
          ${escapar(
            proposta.deadline ||
            "-"
          )}
        </p>

      </div>


      <div class="proposta-acoes">

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


window.excluirProposta =
  excluirProposta;


// ==========================================
// PROTEÇÃO CONTRA HTML INJETADO
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
// INICIAR PÁGINA
// ==========================================

iniciar();
