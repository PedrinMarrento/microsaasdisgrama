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


const nameInput =
  document.getElementById("name");

const companyInput =
  document.getElementById("company");

const phoneInput =
  document.getElementById("phone");

const emailInput =
  document.getElementById("email");

const btnSalvar =
  document.getElementById("btnSalvar");

const listaClientes =
  document.getElementById("listaClientes");


// ==============================
// INICIAR
// ==============================

async function iniciar() {

  const {
    data: { user }
  } =
    await supabaseClient.auth.getUser();

  if (!user) {
    window.location.href = "index.html";
    return;
  }

  usuarioAtual = user;

  await carregarClientes();
}


// ==============================
// CARREGAR CLIENTES
// ==============================

async function carregarClientes() {

  listaClientes.innerHTML =
    `<p class="vazio">Carregando...</p>`;

  const {
    data,
    error
  } =
    await supabaseClient
      .from("clients")
      .select("*")
      .eq("user_id", usuarioAtual.id)
      .order("created_at", {
        ascending: false
      });

  if (error) {
    console.error(error);

    listaClientes.innerHTML =
      `<p class="vazio">Erro ao carregar clientes.</p>`;

    return;
  }

  if (!data || data.length === 0) {

    listaClientes.innerHTML =
      `<p class="vazio">Você ainda não possui clientes.</p>`;

    return;
  }

  listaClientes.innerHTML = "";

  data.forEach(cliente => {

    const card =
      document.createElement("div");

    card.className =
      "cliente-card";

    card.innerHTML = `
      <div>
        <h3>${escapar(cliente.name || "Sem nome")}</h3>

        <p>
          ${escapar(cliente.company || "Sem empresa")}
        </p>

        <p>
          📞 ${escapar(cliente.phone || "-")}
        </p>

        <p>
          ✉️ ${escapar(cliente.email || "-")}
        </p>
      </div>

      <div class="cliente-acoes">
        <button
          class="btn btn-danger"
          onclick="excluirCliente('${cliente.id}')"
        >
          Excluir
        </button>
      </div>
    `;

    listaClientes.appendChild(card);
  });
}


// ==============================
// ADICIONAR CLIENTE
// ==============================

btnSalvar.addEventListener(
  "click",
  async () => {

    const name =
      nameInput.value.trim();

    const company =
      companyInput.value.trim();

    const phone =
      phoneInput.value.trim();

    const email =
      emailInput.value.trim();


    if (!name) {
      alert("Informe o nome do cliente.");
      return;
    }


    btnSalvar.disabled = true;
    btnSalvar.textContent = "Salvando...";


    const {
      error
    } =
      await supabaseClient
        .from("clients")
        .insert({
          user_id: usuarioAtual.id,
          name,
          company,
          phone,
          email
        });


    btnSalvar.disabled = false;
    btnSalvar.textContent =
      "Adicionar cliente";


    if (error) {

      console.error(error);

      alert(
        "Erro ao adicionar cliente."
      );

      return;
    }


    nameInput.value = "";
    companyInput.value = "";
    phoneInput.value = "";
    emailInput.value = "";


    await carregarClientes();

  }
);


// ==============================
// EXCLUIR CLIENTE
// ==============================

async function excluirCliente(id) {

  const confirmar =
    confirm(
      "Deseja realmente excluir este cliente?"
    );

  if (!confirmar) return;


  const {
    error
  } =
    await supabaseClient
      .from("clients")
      .delete()
      .eq("id", id)
      .eq("user_id", usuarioAtual.id);


  if (error) {

    console.error(error);

    alert(
      "Erro ao excluir cliente."
    );

    return;
  }


  await carregarClientes();
}


window.excluirCliente =
  excluirCliente;


// ==============================
// PROTEÇÃO HTML
// ==============================

function escapar(valor) {

  return String(valor)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


iniciar();
