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

  const {
    data: { user },
    error
  } =
    await supabaseClient.auth.getUser();


  if (error || !user) {

    window.location.href =
      "index.html";

    return;
  }


  usuarioAtual = user;


  await carregarClientes();

  await carregarPropostas();
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
      "Erro clientes:",
      error
    );

    return;
  }


  clientes =
    data || [];


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


    btnSalvar.disabled = true;

    btnSalvar.textContent =
      "Criando...";


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
            cliente.phone,

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


    btnSalvar.disabled = false;

    btnSalvar.textContent =
      "Criar proposta";


    if (error) {

      console.error(
        "Erro ao criar proposta:",
        error
      );

      alert(
        "Erro ao criar proposta."
      );

      return;
    }


    clienteSelect.value = "";

    tituloInput.value = "";

    valorInput.value = "";

    prazoInput.value = "";

    descricaoInput.value = "";

    observacoesInput.value = "";


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
      "Erro propostas:",
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
            ${valor}
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
            onclick="
              excluirProposta(
                '${proposta.id}'
              )
            "
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
// EXCLUIR PROPOSTA
// ==========================================

async function excluirProposta(
  id
) {

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
      "Erro excluir:",
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
// ESCAPAR HTML
// ==========================================

function escapar(
  valor
) {

  return String(
    valor
  )
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
// INICIAR
// ==========================================

iniciar();
