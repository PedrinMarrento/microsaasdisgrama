module.exports = async function handler(req, res) {

  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Método não permitido"
    });
  }

  try {

    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        error: "Token não informado"
      });
    }


    // ==========================================
    // BUSCAR PROPOSTA
    // ==========================================

    const response = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/proposals?token=eq.${encodeURIComponent(token)}&select=id,user_id,client_name,client_phone,title,value,deadline,description,notes,status,created_at,accepted_at`,
      {
        method: "GET",

        headers: {
          apikey:
            process.env.SUPABASE_SERVICE_ROLE_KEY,

          Authorization:
            `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        }
      }
    );


    const propostas =
      await response.json();


    if (!response.ok) {

      console.error(
        "Erro ao buscar proposta:",
        propostas
      );

      return res.status(500).json({
        error:
          "Erro ao buscar proposta"
      });
    }


    if (
      !Array.isArray(propostas) ||
      propostas.length === 0
    ) {

      return res.status(404).json({
        error:
          "Proposta não encontrada"
      });
    }


    const proposta =
      propostas[0];


    // ==========================================
    // BUSCAR EMPRESA
    // ==========================================

    const profileResponse =
      await fetch(
        `${process.env.SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(proposta.user_id)}&select=business_name,document,phone,email,address,logo_url`,
        {
          method: "GET",

          headers: {
            apikey:
              process.env.SUPABASE_SERVICE_ROLE_KEY,

            Authorization:
              `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
          }
        }
      );


    const profiles =
      await profileResponse.json();


    if (!profileResponse.ok) {

      console.error(
        "Erro ao buscar perfil:",
        profiles
      );

      return res.status(500).json({
        error:
          "Erro ao buscar dados da empresa"
      });
    }


    const profile =
      Array.isArray(profiles) &&
      profiles.length > 0
        ? profiles[0]
        : {};


    // ==========================================
    // RESPOSTA
    // ==========================================

    return res.status(200).json({

      id:
        proposta.id,

      client_name:
        proposta.client_name,

      client_phone:
        proposta.client_phone,

      title:
        proposta.title,

      value:
        proposta.value,

      deadline:
        proposta.deadline,

      description:
        proposta.description,

      notes:
        proposta.notes,

      status:
        proposta.status,

      created_at:
        proposta.created_at,

      accepted_at:
        proposta.accepted_at,


      // EMPRESA

      business_name:
        profile.business_name || "",

      business_document:
        profile.document || "",

      business_phone:
        profile.phone || "",

      business_email:
        profile.email || "",

      business_address:
        profile.address || "",

      business_logo:
        profile.logo_url || ""

    });


  } catch (error) {

    console.error(
      "Erro get-proposal:",
      error
    );


    return res.status(500).json({
      error: "Erro interno",
      details: error.message
    });

  }
};
