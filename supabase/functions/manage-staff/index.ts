import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  // Verify caller is authenticated and is the owner
  const authHeader = req.headers.get("Authorization")!;
  const callerClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user: caller } } = await callerClient.auth.getUser();
  if (!caller) return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const { action, username, password, role, user_id } = await req.json();
  const emailDomain = "@staff.comandafacil.app";

  if (action === "list") {
    // List staff users created by this owner
    const { data: staffRoles } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role")
      .in("role", ["admin", "user"]);

    if (!staffRoles?.length) return new Response(JSON.stringify([]), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const staffUsers = (staffRoles || []).map((sr) => {
      const u = users?.find((u) => u.id === sr.user_id);
      if (!u) return null;
      const ownerIdMeta = u.user_metadata?.owner_id;
      if (ownerIdMeta !== caller.id) return null;
      return {
        id: u.id,
        username: u.email?.replace(emailDomain, "") || u.email,
        role: sr.role,
        created_at: u.created_at,
      };
    }).filter(Boolean);

    return new Response(JSON.stringify(staffUsers), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  if (action === "create") {
    if (!username || !password || !role) {
      return new Response(JSON.stringify({ error: "username, password e role são obrigatórios" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const email = username.toLowerCase().replace(/\s/g, "") + emailDomain;

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: username, owner_id: caller.id },
    });

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Assign role
    const { error: roleError } = await supabaseAdmin.from("user_roles").insert({ user_id: newUser.user!.id, role });
    if (roleError) {
      return new Response(JSON.stringify({ error: roleError.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ id: newUser.user!.id, username, role }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  if (action === "delete") {
    if (!user_id) {
      return new Response(JSON.stringify({ error: "user_id é obrigatório" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { data: { user: targetUser } } = await supabaseAdmin.auth.admin.getUserById(user_id);
    if (!targetUser || targetUser.user_metadata?.owner_id !== caller.id) {
      return new Response(JSON.stringify({ error: "Não autorizado a excluir este usuário" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    await supabaseAdmin.from("user_roles").delete().eq("user_id", user_id);
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user_id);
    if (deleteError) {
      return new Response(JSON.stringify({ error: deleteError.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  if (action === "generate_link") {
    if (!user_id) {
      return new Response(JSON.stringify({ error: "user_id é obrigatório" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { data: { user: targetUser } } = await supabaseAdmin.auth.admin.getUserById(user_id);
    if (!targetUser || targetUser.user_metadata?.owner_id !== caller.id) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: targetUser.email!,
    });

    if (linkError) {
      return new Response(JSON.stringify({ error: linkError.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Extract the token from the generated link and build a frontend-friendly URL
    const url = new URL(linkData.properties.action_link);
    const token = url.searchParams.get("token");
    const type = url.searchParams.get("type");
    // Build verify URL that goes through Supabase auth verify endpoint then redirects to the app
    const redirectTo = req.headers.get("origin") || req.headers.get("referer")?.replace(/\/$/, "") || "";
    const verifyUrl = `${supabaseUrl}/auth/v1/verify?token=${token}&type=${type}&redirect_to=${encodeURIComponent(redirectTo + "/admin")}`;

    return new Response(JSON.stringify({ link: verifyUrl }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  return new Response(JSON.stringify({ error: "Ação inválida" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
