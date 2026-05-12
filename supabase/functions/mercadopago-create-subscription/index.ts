import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type PlanId = "starter" | "profissional" | "enterprise";

const planPricing: Record<PlanId, { amount: number; label: string }> = {
  starter: { amount: 97, label: "Starter" },
  profissional: { amount: 197, label: "Profissional" },
  enterprise: { amount: 397, label: "Enterprise" },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const mpAccessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN")!;
    const mpEnv = (Deno.env.get("MERCADOPAGO_ENV") || "production").toLowerCase();

    const authHeader = req.headers.get("Authorization") || "";

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await callerClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { plan, tenant_slug } = await req.json().catch(() => ({}));
    const planId = plan as PlanId;
    const pricing = planPricing[planId];
    if (!pricing) {
      return new Response(JSON.stringify({ error: "Plano inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const tenantQuery = supabaseAdmin
      .from("tenants")
      .select("id, owner_id, name, slug")
      .eq("owner_id", user.id)
      .limit(1)
      .maybeSingle();

    const tenantBySlugQuery = tenant_slug
      ? supabaseAdmin
        .from("tenants")
        .select("id, owner_id, name, slug")
        .eq("slug", tenant_slug)
        .limit(1)
        .maybeSingle()
      : null;

    const { data: tenantByOwner, error: tenantOwnerErr } = await tenantQuery;
    if (tenantOwnerErr) throw tenantOwnerErr;

    const { data: tenantBySlug, error: tenantSlugErr } = tenantBySlugQuery ? await tenantBySlugQuery : { data: null, error: null };
    if (tenantSlugErr) throw tenantSlugErr;

    const tenant = tenantBySlug || tenantByOwner;
    if (!tenant) {
      return new Response(JSON.stringify({ error: "Tenant não encontrado para este usuário" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (tenant.owner_id !== user.id) {
      return new Response(JSON.stringify({ error: "Não autorizado para este tenant" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const origin = req.headers.get("origin") || req.headers.get("referer")?.replace(/\/$/, "") || "";
    const backUrl = origin ? `${origin}/admin/config?billing=success` : undefined;

    const body = {
      reason: `Assinatura LucenaDelivery — ${pricing.label}`,
      payer_email: user.email,
      back_url: backUrl,
      external_reference: `${tenant.id}:${planId}`,
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: pricing.amount,
        currency_id: "BRL",
      },
    };

    const mpRes = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mpAccessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const mpJson = await mpRes.json().catch(() => ({}));
    if (!mpRes.ok) {
      return new Response(JSON.stringify({ error: "Erro ao criar assinatura no Mercado Pago", details: mpJson }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const initPoint = (mpEnv === "sandbox" ? mpJson.sandbox_init_point : mpJson.init_point) || mpJson.init_point;
    const externalId = mpJson.id || null;

    if (externalId) {
      await supabaseAdmin
        .from("billing_subscriptions")
        .insert({
          tenant_id: tenant.id,
          user_id: user.id,
          provider: "mercadopago",
          external_id: externalId,
          plan: planId,
          status: mpJson.status || "pending",
          amount: pricing.amount,
          currency: "BRL",
          init_point: initPoint || "",
          raw: mpJson,
        });

      await supabaseAdmin
        .from("tenants")
        .update({
          billing_provider: "mercadopago",
          billing_status: mpJson.status || "pending",
          billing_subscription_id: externalId,
          billing_plan: planId,
          monthly_revenue: pricing.amount,
        })
        .eq("id", tenant.id);
    }

    return new Response(JSON.stringify({ init_point: initPoint, id: externalId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
