export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Método não permitido"
    });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: "E-mail obrigatório"
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

          payer_email: email,

          auto_recurring: {
            frequency: 1,
            frequency_type: "months",
            transaction_amount: 29.90,
            currency_id: "BRL"
          },

          back_url:
            "https://microsaasdisgrama.vercel.app/planos.html",

          status: "pending"
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(data);

      return res.status(response.status).json({
        error: "Erro ao criar assinatura",
        details: data
      });
    }

    return res.status(200).json({
      url: data.init_point
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Erro interno"
    });
  }
}