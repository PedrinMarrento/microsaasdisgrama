module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Método não permitido"
    });
  }

  try {
    const { userId, email } = req.body;

    if (!userId || !email) {
      return res.status(400).json({
        error: "Usuário ou e-mail não informado"
      });
    }

    const today = new Date();
    const nextDueDate = today.toISOString().split("T")[0];

    const response = await fetch(
      "https://api-sandbox.asaas.com/v3/checkouts",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          access_token: process.env.ASAAS_API_KEY
        },
        body: JSON.stringify({
          billingTypes: ["CREDIT_CARD"],
          chargeTypes: ["RECURRENT"],

          minutesToExpire: 60,

          externalReference: userId,

          callback: {
            successUrl:
              "https://microsaasdisgrama.vercel.app/planos.html",
            cancelUrl:
              "https://microsaasdisgrama.vercel.app/planos.html",
            expiredUrl:
              "https://microsaasdisgrama.vercel.app/planos.html"
          },

          items: [
            {
              name: "PropostaFlow Pro",
              description: "Plano Pro mensal",
              quantity: 1,
              value: 29.90
            }
          ],

          customerData: {
            email: email
          },

          subscription: {
            cycle: "MONTHLY",
            nextDueDate: nextDueDate
          }
        })
      }
    );

    const data = await response.json();

    console.log("ASAAS STATUS:", response.status);
    console.log("ASAAS RESPOSTA:", JSON.stringify(data));

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Erro ao criar checkout Asaas",
        details: data
      });
    }

    return res.status(200).json({
      id: data.id,
      url: data.url
    });

  } catch (error) {
    console.error("ERRO ASAAS:", error);

    return res.status(500).json({
      error: error.message
    });
  }
};
