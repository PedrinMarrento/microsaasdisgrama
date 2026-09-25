// ==========================================
// ELEMENTOS
// ==========================================

const form =
  document.getElementById("companyForm");

const message =
  document.getElementById("companyMessage");

const logoInput =
  document.getElementById("logoInput");

const uploadLogoBtn =
  document.getElementById("uploadLogoBtn");

const logoPreview =
  document.getElementById("logoPreview");

const logoPlaceholder =
  document.getElementById("logoPlaceholder");

const logoMessage =
  document.getElementById("logoMessage");


// ==========================================
// MOSTRAR LOGO
// ==========================================

function mostrarLogo(url) {

  if (!url) {

    logoPreview.style.display =
      "none";

    logoPreview.removeAttribute(
      "src"
    );

    logoPlaceholder.style.display =
      "block";

    return;
  }


  logoPreview.src = url;

  logoPreview.style.display =
    "block";

  logoPlaceholder.style.display =
    "none";
}


// ==========================================
// CARREGAR EMPRESA
// ==========================================

async function loadCompany() {

  const user =
    await getSessionUser();

  if (!user) return;


  const {
    data,
    error
  } =
    await supabaseClient
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();


  if (error) {

    console.error(
      "Erro ao carregar empresa:",
      error
    );

    return;
  }


  if (!data) return;


  document
    .getElementById(
      "businessName"
    )
    .value =
      data.business_name || "";


  document
    .getElementById(
      "document"
    )
    .value =
      data.document || "";


  document
    .getElementById(
      "companyPhone"
    )
    .value =
      data.phone || "";


  document
    .getElementById(
      "companyEmail"
    )
    .value =
      data.email || "";


  document
    .getElementById(
      "companyAddress"
    )
    .value =
      data.address || "";


  // LOGO

  mostrarLogo(
    data.logo_url
  );
}


// ==========================================
// PREVIEW DA IMAGEM
// ==========================================

logoInput.addEventListener(
  "change",
  () => {

    const file =
      logoInput.files[0];


    if (!file) {
      return;
    }


    // LIMITE 3 MB

    if (
      file.size >
      3 * 1024 * 1024
    ) {

      alert(
        "A imagem deve ter no máximo 3 MB."
      );

      logoInput.value = "";

      return;
    }


    const previewURL =
      URL.createObjectURL(file);


    mostrarLogo(
      previewURL
    );
  }
);


// ==========================================
// ENVIAR LOGO
// ==========================================

uploadLogoBtn.addEventListener(
  "click",
  async () => {

    const user =
      await getSessionUser();


    if (!user) {
      return;
    }


    const file =
      logoInput.files[0];


    if (!file) {

      alert(
        "Escolha uma imagem primeiro."
      );

      return;
    }


    // TIPOS PERMITIDOS

    const tiposPermitidos = [
      "image/png",
      "image/jpeg",
      "image/webp"
    ];


    if (
      !tiposPermitidos.includes(
        file.type
      )
    ) {

      alert(
        "Use uma imagem PNG, JPG ou WEBP."
      );

      return;
    }


    // TAMANHO

    if (
      file.size >
      3 * 1024 * 1024
    ) {

      alert(
        "A imagem deve ter no máximo 3 MB."
      );

      return;
    }


    uploadLogoBtn.disabled =
      true;

    uploadLogoBtn.textContent =
      "Enviando...";

    logoMessage.textContent =
      "Enviando logo...";


    try {

      // EXTENSÃO

      const extensao =
        file.name
          .split(".")
          .pop()
          .toLowerCase();


      // CADA USUÁRIO TEM SUA PRÓPRIA PASTA

      const caminho =
        `${user.id}/logo.${extensao}`;


      // ======================================
      // UPLOAD
      // ======================================

      const {
        error: uploadError
      } =
        await supabaseClient
          .storage
          .from("logos")
          .upload(
            caminho,
            file,
            {
              cacheControl: "3600",
              upsert: true,
              contentType:
                file.type
            }
          );


      if (uploadError) {

        console.error(
          "Erro no upload:",
          uploadError
        );

        logoMessage.textContent =
          "Erro ao enviar logo.";

        return;
      }


      // ======================================
      // PEGAR URL PÚBLICA
      // ======================================

      const {
        data: publicData
      } =
        supabaseClient
          .storage
          .from("logos")
          .getPublicUrl(
            caminho
          );


      const logoURL =
        publicData.publicUrl;


      if (!logoURL) {

        logoMessage.textContent =
          "Erro ao gerar URL da logo.";

        return;
      }


      // Evita cache da imagem antiga
      const logoURLAtualizada =
        `${logoURL}?v=${Date.now()}`;


      // ======================================
      // SALVAR NO PROFILE
      // ======================================

      const {
        error: profileError
      } =
        await supabaseClient
          .from("profiles")
          .update({

            logo_url:
              logoURLAtualizada,

            updated_at:
              new Date()
                .toISOString()

          })
          .eq(
            "id",
            user.id
          );


      if (profileError) {

        console.error(
          "Erro ao salvar logo:",
          profileError
        );

        logoMessage.textContent =
          "A imagem foi enviada, mas houve erro ao salvar a logo.";

        return;
      }


      mostrarLogo(
        logoURLAtualizada
      );


      logoMessage.textContent =
        "Logo enviada com sucesso! ✓";


      logoInput.value = "";


    } catch (error) {

      console.error(
        "Erro inesperado:",
        error
      );

      logoMessage.textContent =
        "Erro ao enviar logo.";

    } finally {

      uploadLogoBtn.disabled =
        false;

      uploadLogoBtn.textContent =
        "Enviar logo";
    }
  }
);


// ==========================================
// SALVAR DADOS DA EMPRESA
// ==========================================

form.addEventListener(
  "submit",
  async event => {

    event.preventDefault();


    const user =
      await getSessionUser();


    if (!user) {
      return;
    }


    message.textContent =
      "Salvando...";


    const company = {

      id:
        user.id,

      business_name:
        document
          .getElementById(
            "businessName"
          )
          .value
          .trim(),

      document:
        document
          .getElementById(
            "document"
          )
          .value
          .trim(),

      phone:
        document
          .getElementById(
            "companyPhone"
          )
          .value
          .trim(),

      email:
        document
          .getElementById(
            "companyEmail"
          )
          .value
          .trim(),

      address:
        document
          .getElementById(
            "companyAddress"
          )
          .value
          .trim(),

      updated_at:
        new Date()
          .toISOString()
    };


    const {
      error
    } =
      await supabaseClient
        .from("profiles")
        .upsert(company);


    if (error) {

      console.error(
        "Erro ao salvar:",
        error
      );

      message.textContent =
        "Erro ao salvar informações.";

      return;
    }


    message.textContent =
      "Informações salvas com sucesso! ✓";
  }
);


// ==========================================
// INICIAR
// ==========================================

loadCompany();
