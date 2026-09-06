const form = document.getElementById("companyForm");
const message = document.getElementById("companyMessage");

async function loadCompany() {

  const user = await getSessionUser();

  if (!user) return;

  const { data, error } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error(error);
    return;
  }

  if (!data) return;

  document.getElementById("businessName").value =
    data.business_name || "";

  document.getElementById("document").value =
    data.document || "";

  document.getElementById("companyPhone").value =
    data.phone || "";

  document.getElementById("companyEmail").value =
    data.email || "";

  document.getElementById("companyAddress").value =
    data.address || "";
}


form.addEventListener("submit", async (event) => {

  event.preventDefault();

  const user = await getSessionUser();

  if (!user) return;

  message.textContent = "Salvando...";

  const company = {

    id: user.id,

    business_name:
      document.getElementById("businessName").value.trim(),

    document:
      document.getElementById("document").value.trim(),

    phone:
      document.getElementById("companyPhone").value.trim(),

    email:
      document.getElementById("companyEmail").value.trim(),

    address:
      document.getElementById("companyAddress").value.trim(),

    updated_at:
      new Date().toISOString()

  };

  const { error } = await supabaseClient
    .from("profiles")
    .upsert(company);

  if (error) {

    console.error(error);

    message.textContent =
      "Erro ao salvar informações.";

    return;
  }

  message.textContent =
    "Informações salvas com sucesso! ✓";

});


loadCompany();