const search = document.getElementById("proposalSearch");
const statusFilter = document.getElementById("statusFilter");

let allProposals = [];

search.addEventListener("input", renderProposals);
statusFilter.addEventListener("change", renderProposals);

async function loadProposals() {
  const user = await getSessionUser();

  if (!user) return;

  const { data, error } = await supabaseClient
    .from("proposals")
    .select("*")
    .order("created_at", {
      ascending: false
    });

  if (error) {
    console.error("Erro ao carregar propostas:", error);
    alert("Erro ao carregar propostas.");
    return;
  }

  allProposals = data || [];

  renderProposals();
}

async function deleteProposal(id) {
  if (!confirm("Excluir esta proposta?")) return;

  const { error } = await supabaseClient
    .from("proposals")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(error);
    alert("Erro ao excluir proposta.");
    return;
  }

  await loadProposals();
}

async function setStatus(id, status) {
  const { error } = await supabaseClient
    .from("proposals")
    .update({
      status: status
    })
    .eq("id", id);

  if (error) {
    console.error(error);
    alert("Erro ao alterar status.");
    return;
  }

  await loadProposals();
}

function renderProposals() {
  const q = search.value.toLowerCase();
  const status = statusFilter.value;

  const items = allProposals.filter((proposal) => {
    const matchesSearch = [
      proposal.title,
      proposal.client_name
    ]
      .join(" ")
      .toLowerCase()
      .includes(q);

    const matchesStatus =
      !status ||
      proposal.status === status;

    return matchesSearch && matchesStatus;
  });

  const box =
    document.getElementById("proposalList");

  if (!items.length) {
    box.innerHTML =
      '<div class="empty-state">Nenhuma proposta encontrada.</div>';

    return;
  }

  box.innerHTML = `
    <table class="data-table">

      <thead>
        <tr>
          <th>Proposta</th>
          <th>Cliente</th>
          <th>Valor</th>
          <th>Status</th>
          <th>Ações</th>
        </tr>
      </thead>

      <tbody>

        ${items
          .map(
            (proposal) => `
            <tr>

              <td>
                <b>${proposal.title}</b>
              </td>

              <td>
                ${proposal.client_name}
              </td>

              <td>
                ${moneyBR(proposal.value)}
              </td>

              <td>
                <span class="tag ${statusClass(
                  proposal.status
                )}">
                  ${proposal.status}
                </span>
              </td>

              <td class="table-actions">

                <a
                  class="small-btn"
                 href="proposta.html?token=${proposal.public_token}"
                >
                  Abrir
                </a>

                <button
                  class="small-btn"
                  onclick="setStatus(
                    '${proposal.id}',
                    'Aguardando'
                  )"
                >
                  Aguardando
                </button>

                <button
                  class="small-btn"
                  onclick="setStatus(
                    '${proposal.id}',
                    'Aceita'
                  )"
                >
                  Aceita
                </button>

                <button
                  class="small-btn danger"
                  onclick="deleteProposal(
                    '${proposal.id}'
                  )"
                >
                  Excluir
                </button>

              </td>

            </tr>
          `
          )
          .join("")}

      </tbody>

    </table>
  `;
}

loadProposals();