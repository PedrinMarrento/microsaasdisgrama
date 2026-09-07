module.exports = async function handler(req, res) {
  try {
    const BUYER_EMAIL =
      "test_user_242383705928364986@testuser.com";

    const mpResponse = await fetch(
      `https://api.mercadopago.com/preapproval/search?payer_email=${encodeURIComponent(BUYER_EMAIL)}`,
      {
        headers: {
          Authorization:
            `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`
        }
      }
    );

    const mpData = await mpResponse.json();

    if (!mpResponse.ok) {
      return res.status(500).json({
        error: "Erro ao buscar assinatura",
        details: mpData
      });
    }

    const subscriptions = mpData.results || [];

    const subscription = subscriptions.find(
      item =>
        item.reason === "PropostaFlow Pro" &&
        item.status === "authorized"
    );

    if (!subscription) {
      return res.status(404).json({
        error: "Nenhuma assinatura Pro ativa encontrada",
        subscriptions
      });
    }

    const userId = subscription.external_reference;

    if (!userId) {
      return res.status(400).json({
        error: "Assinatura encontrada, mas sem external_reference"
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
          plan: "pro",
          mercado_pago_subscription_id: subscription.id,
          subscription_status: subscription.status,
          subscription_updated_at: new Date().toISOString()
        })
      }
    );

    const supabaseText = await supabaseResponse.text();

    if (!supabaseResponse.ok) {
      return res.status(500).json({
        error: "Erro ao atualizar Supabase",
        details: supabaseText
      });
    }

    return res.status(200).json({
      success: true,
      message: "Conta atualizada para PRO",
      subscription_id: subscription.id,
      status: subscription.status,
      user_id: userId
    });

  } catch (error) {
    return res.status(500).json({
      error: error.message
    });
  }
};