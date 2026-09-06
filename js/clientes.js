const modal = document.getElementById("clientModal");
const openBtn = document.getElementById("openClientModal");
const closeBtn = document.getElementById("closeClientModal");
const form = document.getElementById("clientForm");
const search = document.getElementById("clientSearch");

let allClients = [];

openBtn.addEventListener("click", () => {
  modal.classList.remove("hidden");
});

closeBtn.addEventListener("click", () => {
  modal.classList.add("hidden");
});

modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.classList.add("hidden");
  }
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const user = await getSessionUser();

  if (!user) return;

  const name = document
    .getElementById("clientName")
    .value.trim();

  const company = document
    .getElementById("clientCompany")
    .value.trim();

  const phone = document
    .getElementById("clientPhone")
    .value.trim();

  const email = document
    .getElementById("clientEmail")
    .value.trim();

  const { error } = await supabaseClient
    .from("clients")
    .insert({
      user_id: user.id,
      name,
      company,
      phone,
      email
    });

  if (error) {
    console.error(error);
    alert("Erro ao salvar cliente.");
    return;
  }

  form.reset();
  modal.classList.add("hidden");

  await loadClients();
});

search.addEventListener("input", () => {
  renderClients();
});

async function deleteClient(id) {
  if (!confirm("Excluir este cliente?")) return;

  const { error } = await supabaseClient
    .from("clients")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(error);
    alert("Erro ao excluir cliente.");
    return;
  }

  await loadClients();
}

async function loadClients() {
  const user = await getSessionUser();

  if (!user) return;

  const { data, error } = await supabaseClient
    .from("clients")
    .select("*")
    .order("created_at", {
      ascending: false
    });

  if (error) {
    console.error(error);
    return;
  }

  allClients = data || [];

  renderClients();
}

function renderClients() {
  const q = search.value.toLowerCase();

  const items = allClients.filter((c) =>
    [
      c.name,
      c.company,
      c.phone,
      c.email
    ]
      .join(" ")
      .toLowerCase()
      .includes(q)
  );

  const box =
    document.getElementById("clientsList");

  if (!items.length) {
    box.innerHTML =
      '<div class="empty-state">Nenhum cliente encontrado.</div>';

    return;
  }

  box.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>Nome</th>
          <th>Empresa</th>
          <th>WhatsApp</th>
          <th>E-mail</th>
          <th></th>
        </tr>
      </thead>

      <tbody>
        ${items
          .map(
            (c) => `
          <tr>
            <td><b>${c.name}</b></td>
            <td>${c.company || "—"}</td>
            <td>${c.phone || "—"}</td>
            <td>${c.email || "—"}</td>

            <td>
              <button
                class="small-btn danger"
                onclick="deleteClient('${c.id}')"
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

loadClients();