import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const slugify = (value: string) => {
  const base = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "");
  return base || "minha-loja";
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

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

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const fullName =
      (user.user_metadata as { full_name?: string; name?: string } | null)?.full_name ||
      (user.user_metadata as { full_name?: string; name?: string } | null)?.name ||
      "";

    const tenantName = fullName || user.email?.split("@")[0] || "Minha Loja";
    const slugBase = slugify(tenantName);
    const slug = `${slugBase}-${user.id.replace(/-/g, "").slice(0, 6)}`;

    const { data: existingTenant, error: existingErr } = await supabaseAdmin
      .from("tenants")
      .select("id, slug")
      .eq("owner_id", user.id)
      .limit(1)
      .maybeSingle();
    if (existingErr) throw existingErr;

    if (!existingTenant) {
      const basePayload: Record<string, unknown> = {
        owner_id: user.id,
        name: tenantName,
        plan: "starter",
        status: "trial",
        monthly_revenue: 0,
      };
      const payloads: Array<Record<string, unknown>> = [
        { ...basePayload, slug, trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() },
        { ...basePayload, slug },
        { ...basePayload },
      ];

      let lastError: unknown = null;
      let inserted = false;
      for (const p of payloads) {
        const { error } = await supabaseAdmin.from("tenants").insert(p);
        if (!error) {
          inserted = true;
          break;
        }
        lastError = error;
        const msg = String((error as { message?: string } | null)?.message || error);
        if (msg.includes("does not exist")) break;
      }
      if (!inserted && lastError) throw lastError;
    } else {
      const updatePayload: Record<string, unknown> = {};
      if (!existingTenant.slug) updatePayload.slug = slug;
      if (Object.keys(updatePayload).length) {
        await supabaseAdmin.from("tenants").update(updatePayload).eq("id", existingTenant.id);
      }
    }

    await supabaseAdmin
      .from("store_settings")
      .upsert({ user_id: user.id, store_name: tenantName }, { onConflict: "user_id" })
      .catch(() => null);

    await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: user.id, role: "user" })
      .catch(() => null);

    const { data: tenant } = await supabaseAdmin
      .from("tenants")
      .select("id, owner_id, name, slug, status, plan, trial_ends_at")
      .eq("owner_id", user.id)
      .limit(1)
      .maybeSingle();

    return new Response(JSON.stringify({ tenant }), {
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
