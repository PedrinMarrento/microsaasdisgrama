export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).json({ ok: true });
  }

  try {
    const type = req.body?.type;
    const subscriptionId = req.body?.data?.id;

    if (type !== "subscription_preapproval" || !subscriptionId) {
      return res.status(200).json({ ok: true });
    }

    const mpResponse = await fetch(
      `https://api.mercadopago.com/preapproval/${subscriptionId}`,
      {
        headers: {
          Authorization:
            `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`
        }
      }
    );

    const subscription = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error("Erro Mercado Pago:", subscription);

      return res.status(200).json({
        ok: true
      });
    }

    const userId = subscription.external_reference;

    if (!userId) {
      console.error("Assinatura sem external_reference.");

      return res.status(200).json({
        ok: true
      });
    }

    const isPro =
      subscription.status === "authorized";

    const supabaseResponse = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`,
      {
        method: "PATCH",

        headers: {
          "Content-Type": "application/json",

          apikey:
            process.env.SUPABASE_SERVICE_ROLE_KEY,

          Authorization:
            `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },

        body: JSON.stringify({
          plan: isPro ? "pro" : "free",

          mercado_pago_subscription_id:
            subscriptionId,

          subscription_status:
            subscription.status,

          subscription_updated_at:
            new Date().toISOString()
        })
      }
    );

    if (!supabaseResponse.ok) {
      const supabaseError =
        await supabaseResponse.text();

      console.error(
        "Erro ao atualizar Supabase:",
        supabaseError
      );
    }

    return res.status(200).json({
      ok: true,
      status: subscription.status
    });

  } catch (error) {
    console.error("Erro no webhook:", error);

    return res.status(200).json({
      ok: true
    });
  }
}
