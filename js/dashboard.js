async function loadDashboard() {
  const user = await getSessionUser();
  if (!user) return;

  // Nome do usuário
  const name =
    user.user_metadata?.name ||
    user.email.split("@")[0];

  document.getElementById("userName").textContent =
    name.split(" ")[0];

  // Buscar propostas
  const { data, error } = await supabaseClient
    .from("proposals")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  const proposals = data || [];

  // Números
  document.getElementById("totalPropostas").textContent =
    proposals.length;

  document.getElementById("aguardando").textContent =
    proposals.filter(p => p.status === "Aguardando").length;

  document.getElementById("aceitas").textContent =
    proposals.filter(p => p.status === "Aceita").length;

  const valorAceito = proposals
    .filter(p => p.status === "Aceita")
    .reduce((total, p) => total + Number(p.value || 0), 0);

  document.getElementById("valorAceito").textContent =
    moneyBR(valorAceito);

  // Propostas recentes
  renderRecent(proposals.slice(0, 5));
}

function renderRecent(items) {
  const box = document.getElementById("recentProposals");

  if (!items.length) {
    box.innerHTML =
      '<div class="empty-state">Nenhuma proposta criada ainda.</div>';
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
        </tr>
      </thead>

      <tbody>
        ${items.map(p => `
          <tr>
            <td><b>${p.title}</b></td>
            <td>${p.client_name}</td>
            <td>${moneyBR(p.value)}</td>
            <td>
              <span class="tag ${statusClass(p.status)}">
                ${p.status}
              </span>
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

loadDashboard();