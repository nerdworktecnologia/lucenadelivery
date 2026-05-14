import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Role = "super_admin" | "admin" | "user" | "cozinha" | "pedidos" | "entrega";

const resolveUserIdFromProfile = (p: Record<string, unknown>) => {
  const v = (p.user_id || p.id) as string | undefined;
  return typeof v === "string" ? v : "";
};

const resolveCreatedAt = (u: { created_at?: string | null }) => u.created_at || new Date().toISOString();

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

    const missing = [
      !supabaseUrl ? "SUPABASE_URL" : null,
      !serviceRoleKey ? "SUPABASE_SERVICE_ROLE_KEY" : null,
      !anonKey ? "SUPABASE_ANON_KEY" : null,
    ].filter(Boolean);
    if (missing.length) {
      return new Response(JSON.stringify({ error: `Secrets ausentes no Supabase: ${missing.join(", ")}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization") || "";
    const callerClient = createClient(supabaseUrl!, anonKey!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl!, serviceRoleKey!);
    const { data: superRow, error: superErr } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "super_admin")
      .limit(1)
      .maybeSingle();

    if (superErr || !superRow) {
      return new Response(JSON.stringify({ error: "Acesso negado" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const action = (body?.action as string | undefined) || "";

    if (action === "list") {
      const page = Number(body?.page || 1);
      const perPage = Math.min(200, Math.max(1, Number(body?.perPage || 200)));

      const { data: listData, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage,
      });
      if (listErr) throw listErr;

      const users = listData?.users || [];
      const userIds = users.map((u) => u.id);

      const { data: rolesRows } = await supabaseAdmin
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds);

      const { data: profilesRows } = await supabaseAdmin
        .from("profiles")
        .select("id, user_id, full_name, company_name, created_at")
        .or(`user_id.in.(${userIds.join(",")}),id.in.(${userIds.join(",")})`);

      const rolesByUser: Record<string, Role[]> = {};
      for (const r of (rolesRows || []) as Array<{ user_id: string; role: Role }>) {
        rolesByUser[r.user_id] ||= [];
        rolesByUser[r.user_id].push(r.role);
      }

      const profileByUser: Record<string, { full_name?: string | null; company_name?: string | null; created_at?: string | null }> = {};
      for (const p of (profilesRows || []) as Array<Record<string, unknown>>) {
        const uid = resolveUserIdFromProfile(p);
        if (!uid) continue;
        profileByUser[uid] = {
          full_name: (p.full_name as string | null) ?? null,
          company_name: (p.company_name as string | null) ?? null,
          created_at: (p.created_at as string | null) ?? null,
        };
      }

      const out = users.map((u) => {
        const uid = u.id;
        const prof = profileByUser[uid] || {};
        return {
          user_id: uid,
          email: u.email || null,
          full_name: prof.full_name || (u.user_metadata as { full_name?: string } | null)?.full_name || null,
          company_name: prof.company_name || (u.user_metadata as { company_name?: string } | null)?.company_name || null,
          created_at: prof.created_at || resolveCreatedAt(u),
          roles: rolesByUser[uid] || [],
        };
      });

      return new Response(JSON.stringify(out), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "create") {
      const email = String(body?.email || "").trim().toLowerCase();
      const password = String(body?.password || "");
      const full_name = String(body?.full_name || "").trim();
      const company_name = String(body?.company_name || "").trim();
      const role = (body?.role as Role | undefined) || "user";

      if (!email || !password) {
        return new Response(JSON.stringify({ error: "email e password são obrigatórios" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name, company_name },
      });
      if (createErr) {
        return new Response(JSON.stringify({ error: createErr.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const newId = created.user?.id as string;

      await supabaseAdmin
        .from("user_roles")
        .insert([{ user_id: newId, role }], { defaultToNull: false })
        .throwOnError();

      if (full_name || company_name) {
        const update = { ...(full_name ? { full_name } : {}), ...(company_name ? { company_name } : {}) };
        const { error: upd1 } = await supabaseAdmin.from("profiles").update(update).eq("user_id", newId);
        if (upd1) {
          await supabaseAdmin.from("profiles").update(update).eq("id", newId);
        }
      }

      return new Response(JSON.stringify({ user_id: newId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete") {
      const user_id = String(body?.user_id || "");
      if (!user_id) {
        return new Response(JSON.stringify({ error: "user_id é obrigatório" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (user_id === caller.id) {
        return new Response(JSON.stringify({ error: "Você não pode excluir seu próprio usuário" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await supabaseAdmin.from("user_roles").delete().eq("user_id", user_id);
      const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(user_id);
      if (delErr) {
        return new Response(JSON.stringify({ error: delErr.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "set_role") {
      const user_id = String(body?.user_id || "");
      const role = (body?.role as Role | undefined) || null;
      if (!user_id || !role) {
        return new Response(JSON.stringify({ error: "user_id e role são obrigatórios" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await supabaseAdmin.from("user_roles").delete().eq("user_id", user_id);
      await supabaseAdmin.from("user_roles").insert([{ user_id, role }]).throwOnError();

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Ação inválida" }), {
      status: 400,
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

