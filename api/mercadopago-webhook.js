export default async function handler(req, res) {
  // Mercado Pago precisa receber resposta rapidamente
  if (req.method !== "POST") {
    return res.status(200).json({ ok: true });
  }

  try {
    const accessToken = process.env.MERCADO_PASS_TOKEN;

    const type = req.body?.type;
    const subscriptionId = req.body?.data?.id;

    console.log("Webhook recebido:", req.body);

    // Ignora notificações que não sejam de assinatura
    if (type !== "subscription_preapproval" || !subscriptionId) {
      return res.status(200).json({ ok: true });
    }

    // Consulta a assinatura diretamente no Mercado Pago
    const response = await fetch(
      `https://api.mercadopago.com/preapproval/${subscriptionId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    const subscription = await response.json();

    if (!response.ok) {
      console.error("Erro Mercado Pago:", subscription);
      return res.status(200).json({ ok: true });
    }

    console.log("Assinatura:", subscription);

    /*
      Próxima etapa:
      Se subscription.status === "authorized",
      vamos mudar o usuário para PRO no Supabase.
    */

    return res.status(200).json({
      ok: true,
      status: subscription.status
    });

  } catch (error) {
    console.error("Erro webhook:", error);

    return res.status(200).json({
      ok: true
    });
  }
}