module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Método não permitido"
    });
  }

  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: "Usuário não informado"
      });
    }

    const response = await fetch(
      "https://api.mercadopago.com/preapproval",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:
            `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`
        },

        body: JSON.stringify({
          reason: "PropostaFlow Pro",

          payer_email:
            "test_user_242383705928364986@testuser.com",

          external_reference: userId,

          auto_recurring: {
            frequency: 1,
            frequency_type: "months",
            transaction_amount: 29.90,
            currency_id: "BRL"
          },

          back_url:
            "https://microsaasdisgrama.vercel.app/planos.html",

          notification_url:
            "https://microsaasdisgrama.vercel.app/api/mercadopago-webhook",

          status: "pending"
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Mercado Pago:", data);

      return res.status(response.status).json({
        error: "Erro ao criar assinatura",
        details: data
      });
    }

    return res.status(200).json({
      url: data.init_point
    });

  } catch (error) {
    console.error("Erro:", error);

    return res.status(500).json({
      error: error.message
    });
  }
};
