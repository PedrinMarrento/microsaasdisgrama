const conteudo =
  document.getElementById(
    "conteudo"
  );

const params =
  new URLSearchParams(
    window.location.search
  );

const token =
  params.get("token");


async function carregar() {

  if (!token) {

    mostrarErro(
      "Link de proposta inválido."
    );

    return;
  }

  try {

    const response =
      await fetch(
        `/api/get-proposal?token=${encodeURIComponent(token)}`
      );

    const proposta =
      await response.json();

    if (!response.ok) {

      mostrarErro(
        proposta.error ||
        "Proposta não encontrada."
      );

      return;
    }

    mostrarProposta(
      proposta
    );

  } catch (error) {

    console.error(error);

    mostrarErro(
      "Erro ao carregar proposta."
    );

  }
}


function mostrarProposta(
  proposta
) {

  const aceita =
    proposta.status ===
    "accepted";


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


  conteudo.innerHTML = `

    <section class="card">

      <span
        class="status ${
          aceita
            ? "accepted"
            : ""
        }"
      >
        ${
          aceita
            ? "PROPOSTA ACEITA"
            : "AGUARDANDO RESPOSTA"
        }
      </span>

      <h1>
        ${escapar(
          proposta.title ||
          "Proposta comercial"
        )}
      </h1>

      <p class="cliente">
        Preparada para
        <strong>
          ${escapar(
            proposta.client_name ||
            "Cliente"
          )}
        </strong>
      </p>

      <div class="valor">
        ${valor}
      </div>

      <div class="bloco">

        <h3>
          Descrição
        </h3>

        <p>
          ${escapar(
            proposta.description ||
            "Sem descrição."
          )}
        </p>

      </div>

      <div class="bloco">

        <h3>
          Prazo
        </h3>

        <p>
          ${escapar(
            proposta.deadline ||
            "A combinar"
          )}
        </p>

      </div>

      ${
        aceita
          ? `
            <button
              class="btn"
              disabled
            >
              ✓ Proposta aceita
            </button>
          `
          : `
            <button
              class="btn"
              id="btnAceitar"
            >
              Aceitar proposta
            </button>
          `
      }

    </section>

  `;


  if (!aceita) {

    document
      .getElementById(
        "btnAceitar"
      )
      .addEventListener(
        "click",
        aceitarProposta
      );

  }
}


async function aceitarProposta() {

  const btn =
    document.getElementById(
      "btnAceitar"
    );

  const confirmar =
    confirm(
      "Deseja confirmar a aceitação desta proposta?"
    );

  if (!confirmar) {
    return;
  }


  btn.disabled = true;

  btn.textContent =
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
            token
          })
        }
      );


    const data =
      await response.json();


    if (!response.ok) {

      alert(
        data.error ||
        "Erro ao aceitar proposta."
      );

      btn.disabled = false;

      btn.textContent =
        "Aceitar proposta";

      return;
    }


    alert(
      "Proposta aceita com sucesso!"
    );


    await carregar();


  } catch (error) {

    console.error(error);

    alert(
      "Erro ao aceitar proposta."
    );

    btn.disabled = false;

    btn.textContent =
      "Aceitar proposta";

  }
}


function mostrarErro(
  mensagem
) {

  conteudo.innerHTML = `

    <div class="erro">
      ${escapar(mensagem)}
    </div>

  `;

}


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


carregar();