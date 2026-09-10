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

    // ==========================================
    // CHECKOUT PAGO -> PRO + SALVA CUSTOMER
    // ==========================================
    if (event === "CHECKOUT_PAID") {
      const checkout = req.body?.checkout;

      console.log(
        "CHECKOUT:",
        JSON.stringify(checkout)
      );

      if (!checkout?.externalReference) {
        console.log("Checkout sem externalReference");
        return res.status(200).json({ ok: true });
      }

      const userId = checkout.externalReference;

      await atualizarProfile(userId, {
        plan: "pro",
        asaas_checkout_id: checkout.id || null,
        asaas_customer_id: checkout.customer || null,
        subscription_status: "CHECKOUT_PAID",
        subscription_updated_at: new Date().toISOString()
      });

      console.log(
        "Usuário virou PRO:",
        userId
      );

      return res.status(200).json({ ok: true });
    }

    // ==========================================
    // ASSINATURA CRIADA -> VINCULAR AO CUSTOMER
    // ==========================================
    if (event === "SUBSCRIPTION_CREATED") {
      const subscription = req.body?.subscription;

      console.log(
        "SUBSCRIPTION:",
        JSON.stringify(subscription)
      );

      if (!subscription?.id) {
        return res.status(200).json({ ok: true });
      }

      let userId = subscription.externalReference || null;

      if (!userId && subscription.customer) {
        const profiles = await buscarProfile(
          "asaas_customer_id",
          subscription.customer
        );

        if (profiles.length > 0) {
          userId = profiles[0].id;
        }
      }

      if (!userId) {
        console.log(
          "Assinatura sem usuário associado:",
          subscription.id
        );

        return res.status(200).json({ ok: true });
      }

      await atualizarProfile(userId, {
        asaas_subscription_id: subscription.id,
        asaas_customer_id: subscription.customer || null,
        subscription_status: "SUBSCRIPTION_CREATED",
        subscription_updated_at: new Date().toISOString()
      });

      console.log(
        "Assinatura vinculada:",
        subscription.id,
        "->",
        userId
      );

      return res.status(200).json({ ok: true });
    }

    // ==========================================
    // ASSINATURA CANCELADA / INATIVADA -> FREE
    // ==========================================
    if (
      event === "SUBSCRIPTION_DELETED" ||
      event === "SUBSCRIPTION_INACTIVATED"
    ) {
      const subscription = req.body?.subscription;

      if (!subscription?.id) {
        return res.status(200).json({ ok: true });
      }

      let profiles = await buscarProfile(
        "asaas_subscription_id",
        subscription.id
      );

      // fallback pelo customer
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

    // ==========================================
    // PAGAMENTO RECEBIDO
    // ==========================================
    if (
      event === "PAYMENT_CONFIRMED" ||
      event === "PAYMENT_RECEIVED"
    ) {
      const payment = req.body?.payment;

      console.log(
        "Pagamento confirmado:",
        payment?.id
      );

      return res.status(200).json({ ok: true });
    }

    // ==========================================
    // INADIMPLÊNCIA / REEMBOLSO
    // ==========================================
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
    console.error(
      "Erro webhook Asaas:",
      error
    );

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
    `${process.env.SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`,
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
