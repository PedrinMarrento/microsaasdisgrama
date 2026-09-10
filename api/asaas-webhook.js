module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).json({ ok: true });
  }

  try {
    const receivedToken = req.headers["asaas-access-token"];
    const secret = process.env.ASAAS_WEBHOOK_TOKEN;

    if (!receivedToken || !secret || receivedToken !== secret) {
      console.error("Webhook Asaas não autorizado.");

      return res.status(401).json({
        error: "Não autorizado"
      });
    }

    const event = req.body?.event;

    console.log("ASAAS EVENTO:", event);

    // =========================
    // CHECKOUT PAGO
    // =========================

    if (event === "CHECKOUT_PAID") {
      const checkout = req.body?.checkout;

      if (!checkout) {
        console.log("Evento sem checkout.");
        return res.status(200).json({ ok: true });
      }

      const userId = checkout.externalReference;

      if (!userId) {
        console.log("Checkout sem externalReference.");
        return res.status(200).json({ ok: true });
      }

      const supabaseResponse = await fetch(
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
          body: JSON.stringify({
            plan: "pro",
            subscription_status: "CHECKOUT_PAID",
            subscription_updated_at:
              new Date().toISOString()
          })
        }
      );

      const result = await supabaseResponse.text();

      if (!supabaseResponse.ok) {
        console.error("Erro Supabase:", result);

        return res.status(200).json({
          ok: true
        });
      }

      console.log(
        "Usuário virou PRO:",
        userId
      );

      return res.status(200).json({
        ok: true,
        userId,
        plan: "pro"
      });
    }

    // =========================
    // PAGAMENTOS FUTUROS
    // =========================

    const payment = req.body?.payment;

    if (
      payment &&
      (
        event === "PAYMENT_CONFIRMED" ||
        event === "PAYMENT_RECEIVED"
      )
    ) {
      console.log(
        "Pagamento da assinatura confirmado:",
        payment.id
      );

      return res.status(200).json({
        ok: true
      });
    }

    if (
      payment &&
      (
        event === "PAYMENT_OVERDUE" ||
        event === "PAYMENT_DELETED" ||
        event === "PAYMENT_REFUNDED"
      )
    ) {
      console.log(
        "Evento de pagamento:",
        event,
        payment.id
      );

      return res.status(200).json({
        ok: true
      });
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
