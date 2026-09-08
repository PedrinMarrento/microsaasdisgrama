const crypto = require("crypto");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).json({ ok: true });
  }

  try {
    // =========================
    // 1. VALIDAR WEBHOOK
    // =========================

    const xSignature = req.headers["x-signature"];
    const xRequestId = req.headers["x-request-id"];

    const dataId =
      req.query?.["data.id"] ||
      req.query?.data_id ||
      req.body?.data?.id;

    const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;

    if (!xSignature || !xRequestId || !dataId || !secret) {
      console.error("Webhook sem dados de segurança.");

      return res.status(401).json({
        error: "Webhook não autorizado"
      });
    }

    let ts = null;
    let receivedHash = null;

    const parts = xSignature.split(",");

    for (const part of parts) {
      const [key, value] = part.split("=");

      if (key?.trim() === "ts") {
        ts = value?.trim();
      }

      if (key?.trim() === "v1") {
        receivedHash = value?.trim();
      }
    }

    if (!ts || !receivedHash) {
      console.error("Assinatura inválida.");

      return res.status(401).json({
        error: "Assinatura inválida"
      });
    }

    const manifest =
      `id:${dataId};request-id:${xRequestId};ts:${ts};`;

    const calculatedHash = crypto
      .createHmac("sha256", secret)
      .update(manifest)
      .digest("hex");

    const calculatedBuffer = Buffer.from(
      calculatedHash,
      "utf8"
    );

    const receivedBuffer = Buffer.from(
      receivedHash,
      "utf8"
    );

    if (
      calculatedBuffer.length !== receivedBuffer.length ||
      !crypto.timingSafeEqual(
        calculatedBuffer,
        receivedBuffer
      )
    ) {
      console.error("Webhook com assinatura incorreta.");

      return res.status(401).json({
        error: "Assinatura inválida"
      });
    }

    console.log("Webhook Mercado Pago validado.");

    // =========================
    // 2. PROCESSAR ASSINATURA
    // =========================

    const type =
      req.body?.type ||
      req.query?.type;

    const subscriptionId =
      req.body?.data?.id ||
      dataId;

    if (
      type !== "subscription_preapproval" ||
      !subscriptionId
    ) {
      return res.status(200).json({
        ok: true
      });
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
      console.error(
        "Erro Mercado Pago:",
        subscription
      );

      return res.status(200).json({
        ok: true
      });
    }

    const userId =
      subscription.external_reference;

    if (!userId) {
      console.error(
        "Assinatura sem external_reference."
      );

      return res.status(200).json({
        ok: true
      });
    }

    let plan = "free";

    if (subscription.status === "authorized") {
      plan = "pro";
    }

    const supabaseResponse = await fetch(
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

        body: JSON.stringify({
          plan: plan,
          mercado_pago_subscription_id:
            subscription.id,
          subscription_status:
            subscription.status,
          subscription_updated_at:
            new Date().toISOString()
        })
      }
    );

    const supabaseText =
      await supabaseResponse.text();

    if (!supabaseResponse.ok) {
      console.error(
        "Erro Supabase:",
        supabaseText
      );

      return res.status(200).json({
        ok: true
      });
    }

    console.log(
      "Assinatura atualizada:",
      userId,
      subscription.status,
      plan
    );

    return res.status(200).json({
      ok: true,
      userId,
      status: subscription.status,
      plan
    });

  } catch (error) {
    console.error(
      "Erro webhook:",
      error
    );

    return res.status(500).json({
      error: "Erro interno"
    });
  }
};
