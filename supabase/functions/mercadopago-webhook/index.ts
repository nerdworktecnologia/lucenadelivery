import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const normalizeStatus = (status: string | null | undefined) => (status || "").toLowerCase();

const isActive = (status: string) => ["authorized", "active"].includes(status);
const isInactive = (status: string) => ["cancelled", "canceled", "paused", "rejected", "inactive", "expired"].includes(status);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const mpAccessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN")!;

    const url = new URL(req.url);
    const qpId = url.searchParams.get("data.id") || url.searchParams.get("id");

    const payload = await req.json().catch(() => ({}));
    const id = payload?.data?.id || payload?.id || qpId;

    if (!id) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mpRes = await fetch(`https://api.mercadopago.com/preapproval/${encodeURIComponent(String(id))}`, {
      headers: { Authorization: `Bearer ${mpAccessToken}` },
    });
    const mpJson = await mpRes.json().catch(() => ({}));
    if (!mpRes.ok) {
      return new Response(JSON.stringify({ error: "Falha ao consultar assinatura no Mercado Pago", details: mpJson }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const externalId = mpJson.id;
    const status = normalizeStatus(mpJson.status);
    const externalRef = (mpJson.external_reference as string | null) || "";

    const [tenantIdFromRef, planFromRef] = externalRef.includes(":") ? externalRef.split(":") : [null, null];

    const { data: existing } = await supabaseAdmin
      .from("billing_subscriptions")
      .select("id, tenant_id, user_id, plan, amount")
      .eq("external_id", externalId)
      .limit(1)
      .maybeSingle();

    const tenantId = existing?.tenant_id || tenantIdFromRef || null;
    const plan = existing?.plan || planFromRef || "";
    const amount = existing?.amount || mpJson.auto_recurring?.transaction_amount || 0;

    await supabaseAdmin
      .from("billing_subscriptions")
      .upsert({
        ...(existing?.id ? { id: existing.id } : {}),
        tenant_id: tenantId,
        user_id: existing?.user_id || null,
        provider: "mercadopago",
        external_id: externalId,
        plan,
        status,
        amount,
        currency: mpJson.auto_recurring?.currency_id || "BRL",
        init_point: mpJson.init_point || "",
        raw: mpJson,
      }, { onConflict: "external_id" });

    if (tenantId) {
      const tenantUpdate: Record<string, unknown> = {
        billing_provider: "mercadopago",
        billing_status: status,
        billing_subscription_id: externalId,
        billing_plan: plan,
        billing_updated_at: new Date().toISOString(),
        monthly_revenue: amount,
      };

      if (isActive(status)) {
        tenantUpdate.status = "active";
        if (plan) tenantUpdate.plan = plan;
      } else if (isInactive(status)) {
        tenantUpdate.status = "inactive";
      }

      await supabaseAdmin.from("tenants").update(tenantUpdate).eq("id", tenantId);
    }

    return new Response(JSON.stringify({ ok: true }), {
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
