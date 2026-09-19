module.exports = async function handler(req, res) {

  // ==========================================
  // PERMITIR APENAS POST
  // ==========================================

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Método não permitido"
    });
  }


  try {

    // ==========================================
    // PEGAR TOKEN
    // ==========================================

    const { token } = req.body || {};

    if (!token) {
      return res.status(400).json({
        error: "Token não informado"
      });
    }


    // ==========================================
    // BUSCAR PROPOSTA
    // ==========================================

    const buscar = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/proposals?token=eq.${encodeURIComponent(token)}&select=id,status`,
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
      await buscar.json();


    if (!buscar.ok) {

      console.error(
        "Erro ao buscar proposta:",
        propostas
      );

      return res.status(500).json({
        error: "Erro ao buscar proposta"
      });
    }


    if (
      !Array.isArray(propostas) ||
      propostas.length === 0
    ) {

      return res.status(404).json({
        error: "Proposta não encontrada"
      });
    }


    const proposta =
      propostas[0];


    // ==========================================
    // JÁ FOI ACEITA
    // ==========================================

    if (
      proposta.status === "Aceita"
    ) {

      return res.status(200).json({
        ok: true,
        alreadyAccepted: true
      });
    }


    // ==========================================
    // ATUALIZAR PROPOSTA
    // ==========================================

    const response = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/proposals?id=eq.${encodeURIComponent(proposta.id)}`,
      {
        method: "PATCH",

        headers: {
          "Content-Type":
            "application/json",

          apikey:
            process.env.SUPABASE_SERVICE_ROLE_KEY,

          Authorization:
            `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,

          Prefer:
            "return=representation"
        },

        body: JSON.stringify({

          status: "Aceita",

          accepted_at:
            new Date().toISOString()

        })
      }
    );


    const data =
      await response.json();


    if (!response.ok) {

      console.error(
        "Erro Supabase ao aceitar proposta:",
        data
      );

      return res.status(500).json({
        error: "Erro ao aceitar proposta",
        details: data
      });
    }


    // ==========================================
    // SUCESSO
    // ==========================================

    return res.status(200).json({
      ok: true,
      proposal: data[0] || null
    });


  } catch (error) {

    console.error(
      "Erro accept-proposal:",
      error
    );

    return res.status(500).json({
      error: "Erro interno",
      details: error.message
    });

  }
};
