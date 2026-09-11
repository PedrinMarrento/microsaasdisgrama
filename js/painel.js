// ==========================================
// CONFIGURAÇÃO SUPABASE
// ==========================================

// ==========================================
// CONFIGURAÇÃO SUPABASE
// ==========================================

const SUPABASE_URL =
  "https://pdmpyietjlwqfqxdcztd.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_qhcsSm4VcaZcIP_d5JBYRQ_5jmCo0WT";

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );
// ==========================================
// ELEMENTOS
// ==========================================

const loading =
  document.getElementById("loading");

const nomeUsuario =
  document.getElementById("nomeUsuario");

const emailUsuario =
  document.getElementById("emailUsuario");

const planoBadge =
  document.getElementById("planoBadge");

const planoAtual =
  document.getElementById("planoAtual");

const btnAssinar =
  document.getElementById("btnAssinar");

const btnSair =
  document.getElementById("btnSair");


// ==========================================
// CARREGAR PAINEL
// ==========================================

async function carregarPainel() {

  try {

    const {
      data: { user },
      error: userError
    } =
      await supabaseClient.auth.getUser();


    if (userError || !user) {

      window.location.href =
        "login.html";

      return;
    }


    emailUsuario.textContent =
      user.email;


    const nome =
      user.user_metadata?.name ||
      user.user_metadata?.nome ||
      user.email.split("@")[0];


    nomeUsuario.textContent =
      `Olá, ${nome}`;


    // =====================================
    // BUSCAR PROFILE
    // =====================================

    const {
      data: profile,
      error: profileError
    } =
      await supabaseClient
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();


    if (profileError) {

      console.error(
        "Erro profile:",
        profileError
      );

      throw profileError;
    }


    const plan =
      (
        profile?.plan || "free"
      ).toLowerCase();


    configurarPlano(plan);


    // futuramente carregamos
    // números reais daqui
    await carregarEstatisticas(user.id);


  } catch (error) {

    console.error(
      "Erro ao carregar painel:",
      error
    );

    alert(
      "Erro ao carregar seu painel."
    );

  } finally {

    loading.style.display =
      "none";

  }
}


// ==========================================
// CONFIGURAR FREE / PRO
// ==========================================

function configurarPlano(plan) {

  const isPro =
    plan === "pro";


  planoAtual.textContent =
    isPro ? "PRO" : "FREE";


  planoBadge.textContent =
    isPro ? "PRO" : "FREE";


  if (isPro) {

    planoBadge.classList.remove(
      "plano-free"
    );

    planoBadge.classList.add(
      "plano-pro"
    );


    btnAssinar.style.display =
      "none";

  } else {

    planoBadge.classList.remove(
      "plano-pro"
    );

    planoBadge.classList.add(
      "plano-free"
    );


    btnAssinar.style.display =
      "inline-block";
  }


  // =====================================
  // RECURSOS PRO
  // =====================================

  const recursosPro =
    document.querySelectorAll(
      '[data-pro="true"]'
    );


  recursosPro.forEach(
    recurso => {

      const botao =
        recurso.querySelector(
          "[data-pro-button]"
        );


      if (isPro) {

        recurso.classList.remove(
          "bloqueado"
        );

        if (botao) {

          botao.disabled = false;

          botao.onclick = () => {

            alert(
              "Recurso PRO liberado!"
            );

          };
        }

      } else {

        recurso.classList.add(
          "bloqueado"
        );


        if (botao) {

          botao.disabled = false;

          botao.onclick = () => {

            window.location.href =
              "planos.html";

          };
        }

      }

    }
  );
}


// ==========================================
// ESTATÍSTICAS
// ==========================================

async function carregarEstatisticas(
  userId
) {

  try {

    // CLIENTES

    const {
      count: clientesCount
    } =
      await supabaseClient
        .from("clientes")
        .select(
          "*",
          {
            count: "exact",
            head: true
          }
        );


    if (
      clientesCount !== null
    ) {

      document.getElementById(
        "totalClientes"
      ).textContent =
        clientesCount;

    }


  } catch (error) {

    console.log(
      "Estatísticas ainda não configuradas:",
      error
    );

  }
}


// ==========================================
// LOGOUT
// ==========================================

btnSair.addEventListener(
  "click",
  async () => {

    await supabaseClient.auth.signOut();

    window.location.href =
      "login.html";

  }
);


// ==========================================
// INICIAR
// ==========================================

carregarPainel();