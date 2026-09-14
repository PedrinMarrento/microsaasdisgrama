module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Método não permitido"
    });
  }

  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        error: "Token não informado"
      });
    }

    const buscar = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/proposals?token=eq.${encodeURIComponent(token)}&select=id,status`,
      {
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

    if (
      !buscar.ok ||
      !propostas.length
    ) {
      return res.status(404).json({
        error:
          "Proposta não encontrada"
      });
    }

    const proposta =
      propostas[0];

    if (
      proposta.status ===
      "accepted"
    ) {
      return res.status(200).json({
        ok: true,
        alreadyAccepted: true
      });
    }

    const response = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/proposals?id=eq.${proposta.id}`,
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
          status: "accepted",

          accepted_at:
            new Date().toISOString()
        })
      }
    );

    const data =
      await response.json();

    if (!response.ok) {
      console.error(data);

      return res.status(500).json({
        error:
          "Erro ao aceitar proposta"
      });
    }

    return res.status(200).json({
      ok: true
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Erro interno"
    });
  }
};