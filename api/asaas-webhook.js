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
    // 1. CHECKOUT PAGO -> USUÁRIO VIRA PRO
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

      console.log("Usuário virou PRO:", userId);

      return res.status(200).json({ ok: true });
    }

    // ==================================================
    // 2. ASSINATURA CRIADA
    // ==================================================
    if (event === "SUBSCRIPTION_CREATED") {
      const subscription = req.body?.subscription;

      console.log(
        "SUBSCRIPTION:",
        JSON.stringify(subscription)
      );

      if (!subscription?.id) {
        console.log("SUBSCRIPTION_CREATED sem ID");
        return res.status(200).json({ ok: true });
      }

      let profiles = [];

      // Primeiro tenta externalReference
      if (subscription.externalReference) {
        profiles = await buscarProfile(
          "id",
          subscription.externalReference
        );
      }

      // Depois tenta customer
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
          "Assinatura sem usuário associado:",
          subscription.id
        );

        return res.status(200).json({ ok: true });
      }

      const userId = profiles[0].id;

      const dados = {
        asaas_subscription_id: subscription.id,
        subscription_status: "SUBSCRIPTION_CREATED",
        subscription_updated_at: new Date().toISOString()
      };

      if (subscription.customer) {
        dados.asaas_customer_id = subscription.customer;
      }

      await atualizarProfile(userId, dados);

      console.log(
        "ASSINATURA VINCULADA:",
        subscription.id,
        "->",
        userId
      );

      return res.status(200).json({ ok: true });
    }

    // ==================================================
    // 3. ASSINATURA CANCELADA -> FREE
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
        console.log("Cancelamento sem ID da assinatura");
        return res.status(200).json({ ok: true });
      }

      // Procura primeiro pelo ID exato da assinatura
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

    // ==================================================
    // 4. EVENTOS DE PAGAMENTO
    // ==================================================
    if (
      event === "PAYMENT_CREATED" ||
      event === "PAYMENT_CONFIRMED" ||
      event === "PAYMENT_RECEIVED"
    ) {
      const payment = req.body?.payment;

      if (!payment) {
        console.log("Evento de pagamento sem payment");
        return res.status(200).json({ ok: true });
      }

      console.log(
        "PAGAMENTO:",
        event,
        payment.id
      );

      if (payment.subscription) {
        console.log(
          "Pagamento possui subscription:",
          payment.subscription
        );

        let profiles = [];

        // Tenta pelo externalReference
        if (payment.externalReference) {
          profiles = await buscarProfile(
            "id",
            payment.externalReference
          );
        }

        // Tenta pelo customer
        if (
          profiles.length === 0 &&
          payment.customer
        ) {
          profiles = await buscarProfile(
            "asaas_customer_id",
            payment.customer
          );
        }

        /*
         * Último fallback.
         *
         * Procura o checkout PRO mais recente que ainda
         * não possui uma assinatura vinculada.
         *
         * Serve para o fluxo atual do checkout Asaas,
         * onde o payment está trazendo subscription,
         * mas não externalReference.
         */
        if (profiles.length === 0) {
          profiles =
            await buscarProSemAssinaturaMaisRecente();
        }

        if (profiles.length > 0) {
          const userId = profiles[0].id;

          const dados = {
            asaas_subscription_id:
              payment.subscription,

            subscription_status: event,

            subscription_updated_at:
              new Date().toISOString()
          };

          if (payment.customer) {
            dados.asaas_customer_id =
              payment.customer;
          }

          await atualizarProfile(userId, dados);

          console.log(
            "ASSINATURA VINCULADA PELO PAGAMENTO:",
            payment.subscription,
            "->",
            userId
          );
        } else {
          console.log(
            "Não foi possível vincular subscription:",
            payment.subscription
          );
        }
      }

      return res.status(200).json({ ok: true });
    }

    // ==================================================
    // 5. PAGAMENTO PROBLEMÁTICO
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

    // ==================================================
    // EVENTO NÃO UTILIZADO
    // ==================================================
    console.log("Evento ignorado:", event);

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


// ==================================================
// BUSCAR PROFILE POR UMA COLUNA
// ==================================================
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


// ==================================================
// BUSCAR PRO MAIS RECENTE SEM ASSINATURA
// ==================================================
async function buscarProSemAssinaturaMaisRecente() {
  const url =
    `${process.env.SUPABASE_URL}` +
    `/rest/v1/profiles` +
    `?plan=eq.pro` +
    `&asaas_subscription_id=is.null` +
    `&order=subscription_updated_at.desc` +
    `&limit=1` +
    `&select=id`;

  const response = await fetch(url, {
    headers: {
      apikey:
        process.env.SUPABASE_SERVICE_ROLE_KEY,

      Authorization:
        `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      `Erro procurando PRO sem assinatura: ${JSON.stringify(data)}`
    );
  }

  return Array.isArray(data) ? data : [];
}


// ==================================================
// ATUALIZAR PROFILE
// ==================================================
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
