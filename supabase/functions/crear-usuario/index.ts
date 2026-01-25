import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. Extraer datos del body (Asegúrate de incluir apellido)
    const { email, password, nombre, apellido, rol } = await req.json();

    // 2. Crear usuario en la sección de Authentication
    const { data: userData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nombre, apellido, rol }
    });

    if (authError) throw authError;

    const userId = userData.user.id;

    // 3. Insertar en la tabla 'profiles'
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: userId,
        correo: email, // Mapeado a tu columna 'correo'
        nombre: nombre,
        apellido: apellido,
        rol: rol
      });

    if (profileError) {
      // Si falla el perfil, borramos el usuario de Auth para evitar basura
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw profileError;
    }

    // 4. Insertar en la tabla de rol específica (Choferes o Padres)
    // Esto es lo que hacía que no aparecieran en la tabla de choferes
    const tablaRol = rol === 'chofer' ? 'choferes' : 'padres';
    
    const { error: roleError } = await supabaseAdmin
      .from(tablaRol)
      .insert({ id: userId });

    if (roleError) {
      // Opcional: podrías borrar el perfil y el auth si esto falla
      console.error(`Error insertando en tabla ${tablaRol}:`, roleError.message);
      throw roleError;
    }

    return new Response(JSON.stringify({ 
      success: true, 
      user: { id: userId, email, nombre, rol } 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});