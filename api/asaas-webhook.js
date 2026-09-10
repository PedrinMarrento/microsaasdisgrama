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
    const payment = req.body?.payment;

    console.log("ASAAS EVENTO:", event);
    console.log("ASAAS PAYMENT:", payment?.id);

    if (!payment) {
      return res.status(200).json({ ok: true });
    }

    const userId = payment.externalReference;

    if (!userId) {
      console.log("Pagamento sem externalReference.");
      return res.status(200).json({ ok: true });
    }

    let plan = null;

    if (
      event === "PAYMENT_CONFIRMED" ||
      event === "PAYMENT_RECEIVED"
    ) {
      plan = "pro";
    }

    if (
      event === "PAYMENT_OVERDUE" ||
      event === "PAYMENT_DELETED" ||
      event === "PAYMENT_REFUNDED"
    ) {
      plan = "free";
    }

    if (!plan) {
      return res.status(200).json({
        ok: true,
        ignored: true
      });
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
          plan: plan,
          subscription_status: event,
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
      "Plano atualizado:",
      userId,
      event,
      plan
    );

    return res.status(200).json({
      ok: true,
      userId,
      event,
      plan
    });

  } catch (error) {
    console.error("Erro webhook Asaas:", error);

    return res.status(500).json({
      error: "Erro interno"
    });
  }
};