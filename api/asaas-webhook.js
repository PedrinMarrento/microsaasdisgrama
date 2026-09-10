module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).json({ ok: true });
  }

  try {
    const receivedToken = req.headers["asaas-access-token"];
    const secret = process.env.ASAAS_WEBHOOK_TOKEN;

    if (!receivedToken || !secret || receivedToken !== secret) {
      console.error("Webhook Asaas não autorizado.");
      return res.status(401).json({ error: "Não autorizado" });
    }

    const event = req.body?.event;

    console.log("ASAAS EVENTO:", event);

    // ==================================
    // CHECKOUT PAGO -> USUÁRIO VIRA PRO
    // ==================================

    if (event === "CHECKOUT_PAID") {
      const checkout = req.body?.checkout;

      if (!checkout?.externalReference) {
        console.log("Checkout sem externalReference.");
        return res.status(200).json({ ok: true });
      }

      const userId = checkout.externalReference;

      await atualizarProfile(userId, {
        plan: "pro",
        subscription_status: "CHECKOUT_PAID",
        subscription_updated_at: new Date().toISOString()
      });

      console.log("Usuário virou PRO:", userId);

      return res.status(200).json({ ok: true });
    }

    // ==================================
    // ASSINATURA CRIADA -> SALVA O ID
    // ==================================

    if (event === "SUBSCRIPTION_CREATED") {
      const subscription = req.body?.subscription;

      if (!subscription?.id) {
        console.log("SUBSCRIPTION_CREATED sem ID.");
        return res.status(200).json({ ok: true });
      }

      // Em checkout recorrente, a assinatura pode vir
      // sem externalReference. Então tentamos localizar
      // o usuário pelo checkout/cliente relacionado.
      let userId = subscription.externalReference || null;

      if (!userId) {
        const customerId = subscription.customer;

        if (customerId) {
          const customerResponse = await fetch(
            `https://api-sandbox.asaas.com/v3/customers/${customerId}`,
            {
              headers: {
                access_token: process.env.ASAAS_API_KEY
              }
            }
          );

          const customer = await customerResponse.json();

          if (customerResponse.ok && customer?.email) {
            const profileResponse = await fetch(
              `${process.env.SUPABASE_URL}/rest/v1/profiles?email=eq.${encodeURIComponent(customer.email)}&select=id`,
              {
                headers: {
                  apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
                  Authorization:
                    `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
                }
              }
            );

            const profiles = await profileResponse.json();

            if (Array.isArray(profiles) && profiles.length > 0) {
              userId = profiles[0].id;
            }
          }
        }
      }

      if (!userId) {
        console.log(
          "Não foi possível relacionar assinatura ao usuário:",
          subscription.id
        );

        return res.status(200).json({ ok: true });
      }

      await atualizarProfile(userId, {
        asaas_subscription_id: subscription.id,
        subscription_status: "SUBSCRIPTION_CREATED",
        subscription_updated_at: new Date().toISOString()
      });

      console.log(
        "Assinatura Asaas vinculada:",
        subscription.id,
        "->",
        userId
      );

      return res.status(200).json({ ok: true });
    }

    // ==================================
    // ASSINATURA CANCELADA -> FREE
    // ==================================

    if (
      event === "SUBSCRIPTION_DELETED" ||
      event === "SUBSCRIPTION_INACTIVATED"
    ) {
      const subscription = req.body?.subscription;

      if (!subscription?.id) {
        console.log("Evento de assinatura sem ID.");
        return res.status(200).json({ ok: true });
      }

      const response = await fetch(
        `${process.env.SUPABASE_URL}/rest/v1/profiles?asaas_subscription_id=eq.${encodeURIComponent(subscription.id)}&select=id`,
        {
          headers: {
            apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
            Authorization:
              `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
          }
        }
      );

      const profiles = await response.json();

      if (!Array.isArray(profiles) || profiles.length === 0) {
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

      console.log("Usuário voltou para FREE:", userId);

      return res.status(200).json({ ok: true });
    }

    // ==================================
    // PAGAMENTOS
    // ==================================

    const payment = req.body?.payment;

    if (
      payment &&
      (
        event === "PAYMENT_CONFIRMED" ||
        event === "PAYMENT_RECEIVED"
      )
    ) {
      console.log("Pagamento confirmado:", payment.id);
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

async function atualizarProfile(userId, dados) {
  const response = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization:
          `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        Prefer: "return=representation"
      },
      body: JSON.stringify(dados)
    }
  );

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Erro Supabase: ${text}`);
  }

  return text;
}
