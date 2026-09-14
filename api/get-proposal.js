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

    const response = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/proposals?token=eq.${encodeURIComponent(token)}&select=id,client_name,title,value,deadline,description,status,accepted_at`,
      {
        headers: {
          apikey:
            process.env.SUPABASE_SERVICE_ROLE_KEY,

          Authorization:
            `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(data);

      return res.status(500).json({
        error: "Erro ao buscar proposta"
      });
    }

    if (!data.length) {
      return res.status(404).json({
        error: "Proposta não encontrada"
      });
    }

    return res.status(200).json(
      data[0]
    );

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Erro interno"
    });
  }
};