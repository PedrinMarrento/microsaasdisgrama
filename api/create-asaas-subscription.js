module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).json({ ok: true });
  }

  try {
    const tokenRecebido = req.headers["asaas-access-token"];
    const tokenEsperado = process.env.ASAAS_WEBHOOK_TOKEN;

    if (!tokenRecebido || tokenRecebido !== tokenEsperado) {
      console.error("Webhook Asaas não autorizado");
      return res.status(401).json({ error: "Não autorizado" });
    }

    const event = req.body?.event;

    console.log("ASAAS EVENTO:", event);

    // ==================================================
    // CHECKOUT PAGO -> PRO + SALVA CUSTOMER CORRETO
    // ==================================================
    if (event === "CHECKOUT_PAID") {
      const checkout = req.body?.checkout;

      console.log("CHECKOUT:", JSON.stringify(checkout));

      if (!checkout?.externalReference) {
        console.log("Checkout sem externalReference");
        return res.status(200).json({ ok: true });
      }

      const userId = checkout.externalReference;

      const dados = {
        plan: "pro",
        subscription_status: "CHECKOUT_PAID",
        subscription_updated_at: new Date().toISOString()
      };

      if (checkout.id) {
        dados.asaas_checkout_id = checkout.id;
      }

      if (checkout.customer) {
        dados.asaas_customer_id = checkout.customer;
      }

      await atualizarProfile(userId, dados);

      console.log(
        "CHECKOUT VINCULADO CORRETAMENTE:",
        checkout.id,
        "customer:",
        checkout.customer,
        "->",
        userId
      );

      console.log("Usuário virou PRO:", userId);

      return res.status(200).json({ ok: true });
    }

    // ==================================================
    // ASSINATURA CRIADA
    // ==================================================
    if (event === "SUBSCRIPTION_CREATED") {
      const subscription = req.body?.subscription;

      console.log(
        "SUBSCRIPTION:",
        JSON.stringify(subscription)
      );

      if (!subscription?.id) {
        return res.status(200).json({ ok: true });
      }

      let profiles = [];

      if (subscription.externalReference) {
        profiles = await buscarProfile(
          "id",
          subscription.externalReference
        );
      }

      if (
        profiles.length === 0 &&
        subscription.customer
      ) {
        profiles = await buscarProfile(
          "asaas_customer_id",
          subscription.customer
        );
      }

      if (profiles.length === 0) {
        console.log(
          "Assinatura ainda sem usuário associado:",
          subscription.id,
          "customer:",
          subscription.customer
        );

        return res.status(200).json({ ok: true });
      }

      const userId = profiles[0].id;

      await atualizarProfile(userId, {
        asaas_subscription_id: subscription.id,
        asaas_customer_id: subscription.customer || null,
        subscription_status: "SUBSCRIPTION_CREATED",
        subscription_updated_at: new Date().toISOString()
      });

      console.log(
        "ASSINATURA VINCULADA:",
        subscription.id,
        "->",
        userId
      );

      return res.status(200).json({ ok: true });
    }

    // ==================================================
    // PAGAMENTOS -> VINCULA ASSINATURA PELO CUSTOMER
    // ==================================================
    if (
      event === "PAYMENT_CREATED" ||
      event === "PAYMENT_CONFIRMED" ||
      event === "PAYMENT_RECEIVED"
    ) {
      const payment = req.body?.payment;

      console.log(
        "PAGAMENTO:",
        event,
        JSON.stringify(payment)
      );

      if (!payment) {
        return res.status(200).json({ ok: true });
      }

      if (payment.subscription) {
        let profiles = [];

        // Se vier externalReference, ótimo.
        if (payment.externalReference) {
          profiles = await buscarProfile(
            "id",
            payment.externalReference
          );
        }

        // Caso normal do Asaas Checkout:
        // encontra pelo customer salvo no CHECKOUT_PAID.
        if (
          profiles.length === 0 &&
          payment.customer
        ) {
          profiles = await buscarProfile(
            "asaas_customer_id",
            payment.customer
          );
        }

        if (profiles.length > 0) {
          const userId = profiles[0].id;

          await atualizarProfile(userId, {
            asaas_subscription_id:
              payment.subscription,

            asaas_customer_id:
              payment.customer || null,

            subscription_status: event,

            subscription_updated_at:
              new Date().toISOString()
          });

          console.log(
            "ASSINATURA VINCULADA PELO PAGAMENTO:",
            payment.subscription,
            "customer:",
            payment.customer,
            "->",
            userId
          );
        } else {
          console.log(
            "Pagamento sem usuário correspondente.",
            "subscription:",
            payment.subscription,
            "customer:",
            payment.customer
          );
        }
      }

      return res.status(200).json({ ok: true });
    }

    // ==================================================
    // CANCELAMENTO -> FREE
    // ==================================================
    if (
      event === "SUBSCRIPTION_DELETED" ||
      event === "SUBSCRIPTION_INACTIVATED"
    ) {
      const subscription = req.body?.subscription;

      console.log(
        "ASSINATURA CANCELADA:",
        JSON.stringify(subscription)
      );

      if (!subscription?.id) {
        return res.status(200).json({ ok: true });
      }

      let profiles = await buscarProfile(
        "asaas_subscription_id",
        subscription.id
      );

      if (
        profiles.length === 0 &&
        subscription.customer
      ) {
        profiles = await buscarProfile(
          "asaas_customer_id",
          subscription.customer
        );
      }

      if (profiles.length === 0) {
        console.log(
          "Nenhum usuário encontrado para assinatura:",
          subscription.id
        );

        return res.status(200).json({ ok: true });
      }

      const userId = profiles[0].id;

      await atualizarProfile(userId, {
        plan: "free",
        subscription_status: event,
        subscription_updated_at: new Date().toISOString()
      });

      console.log(
        "Usuário voltou para FREE:",
        userId
      );

      return res.status(200).json({ ok: true });
    }

    // ==================================================
    // OUTROS EVENTOS DE PAGAMENTO
    // ==================================================
    if (
      event === "PAYMENT_OVERDUE" ||
      event === "PAYMENT_REFUNDED" ||
      event === "PAYMENT_DELETED"
    ) {
      const payment = req.body?.payment;

      console.log(
        "Pagamento problemático:",
        event,
        payment?.id
      );

      return res.status(200).json({ ok: true });
    }

    return res.status(200).json({
      ok: true,
      ignored: true
    });

  } catch (error) {
    console.error("Erro webhook Asaas:", error);

    return res.status(500).json({
      error: "Erro interno"
    });
  }
};


async function buscarProfile(campo, valor) {
  const response = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/profiles?${campo}=eq.${encodeURIComponent(valor)}&select=id`,
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
    throw new Error(
      `Erro buscando profile: ${JSON.stringify(data)}`
    );
  }

  return Array.isArray(data) ? data : [];
}


async function atualizarProfile(userId, dados) {
  const response = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`,
    {
      method: "PATCH",

      headers: {
        "Content-Type": "application/json",

        apikey:
          process.env.SUPABASE_SERVICE_ROLE_KEY,

        Authorization:
          `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,

        Prefer: "return=representation"
      },

      body: JSON.stringify(dados)
    }
  );

  const data = await response.text();

  if (!response.ok) {
    throw new Error(
      `Erro atualizando profile: ${data}`
    );
  }

  return data;
}
