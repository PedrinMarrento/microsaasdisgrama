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

    const apiKey = process.env.ASAAS_API_KEY;

    if (!apiKey) {
      console.error("ASAAS_API_KEY não encontrada na Vercel");

      return res.status(500).json({
        error: "ASAAS_API_KEY não configurada"
      });
    }

    // Só mostra o prefixo para diagnóstico.
    // NÃO mostra a chave completa.
    console.log(
      "ASAAS KEY PREFIX:",
      apiKey.substring(0, 12)
    );

    const today = new Date()
      .toISOString()
      .split("T")[0];

    const response = await fetch(
      "https://api-sandbox.asaas.com/v3/checkouts",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "User-Agent": "PropostaFlow/1.0",
          access_token: apiKey
        },

        body: JSON.stringify({
          billingTypes: [
            "CREDIT_CARD"
          ],

          chargeTypes: [
            "RECURRENT"
          ],

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

          subscription: {
            cycle: "MONTHLY",
            nextDueDate: today
          }
        })
      }
    );

    const data = await response.json();

    console.log("ASAAS STATUS:", response.status);

    console.log(
      "ASAAS RESPOSTA:",
      JSON.stringify(data)
    );

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Erro ao criar checkout Asaas",
        details: data
      });
    }

    if (!data.id || !data.link) {
      console.error(
        "Asaas não retornou id/link:",
        data
      );

      return res.status(500).json({
        error: "Resposta inválida do Asaas",
        details: data
      });
    }

    // Salva o checkout no usuário
    const supabaseResponse = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`,
      {
        method: "PATCH",

        headers: {
          "Content-Type": "application/json",

          apikey:
            process.env.SUPABASE_SERVICE_ROLE_KEY,

          Authorization:
            `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,

          Prefer:
            "return=representation"
        },

        body: JSON.stringify({
          asaas_checkout_id: data.id,

          subscription_status:
            "CHECKOUT_CREATED",

          subscription_updated_at:
            new Date().toISOString()
        })
      }
    );

    const supabaseData =
      await supabaseResponse.text();

    if (!supabaseResponse.ok) {
      console.error(
        "Erro Supabase:",
        supabaseData
      );

      return res.status(500).json({
        error:
          "Checkout criado, mas não foi possível vincular ao usuário"
      });
    }

    console.log(
      "Checkout vinculado ao usuário:",
      data.id,
      "->",
      userId
    );

    return res.status(200).json({
      id: data.id,
      url: data.link
    });

  } catch (error) {
    console.error(
      "ERRO CREATE ASAAS:",
      error
    );

    return res.status(500).json({
      error:
        error.message || "Erro interno"
    });
  }
};
