import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Papa from "https://esm.sh/papaparse@5.4.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type EntityType = 'padres' | 'conductores' | 'estudiantes' | 'buses';

interface ImportError {
  row: number;
  error: string;
}

interface ImportResult {
  total: number;
  insertados: number;
  errores: number;
  detalles_errores: ImportError[];
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_ROWS = 1000;
const BATCH_SIZE = 10;

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verificar autenticación
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No autorizado');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      throw new Error('No autenticado');
    }

    // Verificar rol admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('rol')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.rol !== 'admin') {
      throw new Error('Solo administradores pueden importar entidades');
    }

    // Parsear FormData
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const entityType = formData.get('entity_type') as EntityType | null;

    if (!file || !entityType) {
      throw new Error('file y entity_type son requeridos');
    }

    const validTypes: EntityType[] = ['padres', 'conductores', 'estudiantes', 'buses'];
    if (!validTypes.includes(entityType)) {
      throw new Error(`entity_type inválido. Valores permitidos: ${validTypes.join(', ')}`);
    }

    // Validar tamaño
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`Archivo excede el límite de 2MB (${(file.size / 1024 / 1024).toFixed(1)}MB)`);
    }

    // Leer contenido
    const content = await file.text();
    const fileName = file.name.toLowerCase();

    // Parsear según formato
    let rows: Record<string, string>[];

    if (fileName.endsWith('.json')) {
      const parsed = JSON.parse(content);
      if (!Array.isArray(parsed)) {
        throw new Error('El JSON debe ser un array de objetos');
      }
      rows = parsed;
    } else if (fileName.endsWith('.csv')) {
      const parsed = Papa.parse(content, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h: string) => h.trim().toLowerCase(),
      });
      if (parsed.errors.length > 0) {
        throw new Error(`Error parseando CSV: ${parsed.errors[0].message}`);
      }
      rows = parsed.data as Record<string, string>[];
    } else {
      throw new Error('Formato no soportado. Use .csv o .json');
    }

    // Validar cantidad de filas
    if (rows.length > MAX_ROWS) {
      throw new Error(`Máximo ${MAX_ROWS} filas permitidas (archivo tiene ${rows.length})`);
    }

    if (rows.length === 0) {
      throw new Error('El archivo está vacío');
    }

    // Procesar en batches
    const result: ImportResult = {
      total: rows.length,
      insertados: 0,
      errores: 0,
      detalles_errores: [],
    };

    const addError = (row: number, error: string) => {
      result.errores++;
      result.detalles_errores.push({ row, error });
    };

    // Procesar por batches de BATCH_SIZE
    for (let batchStart = 0; batchStart < rows.length; batchStart += BATCH_SIZE) {
      const batch = rows.slice(batchStart, batchStart + BATCH_SIZE);

      const promises = batch.map(async (row, batchIndex) => {
        const rowNum = batchStart + batchIndex + 1;

        try {
          switch (entityType) {
            case 'padres':
              await importPadre(supabaseAdmin, row, rowNum, addError);
              break;
            case 'conductores':
              await importConductor(supabaseAdmin, row, rowNum, addError);
              break;
            case 'estudiantes':
              await importEstudiante(supabaseAdmin, row, rowNum, addError);
              break;
            case 'buses':
              await importBus(supabaseAdmin, row, rowNum, addError);
              break;
          }
          result.insertados++;
        } catch (err) {
          addError(rowNum, err.message || 'Error desconocido');
        }
      });

      await Promise.all(promises);
    }

    // Registrar en import_logs
    await supabaseAdmin.from('import_logs').insert({
      entity_type: entityType,
      total_rows: result.total,
      inserted: result.insertados,
      errors: result.errores,
      error_details: result.detalles_errores,
      admin_id: user.id,
    });

    return new Response(JSON.stringify({
      success: true,
      resumen: result,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('Error en import-entities:', error);

    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Error desconocido',
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

// ==========================================
// Funciones de importación por entidad
// ==========================================

async function importPadre(
  supabase: ReturnType<typeof createClient>,
  row: Record<string, string>,
  rowNum: number,
  addError: (row: number, error: string) => void,
) {
  const email = row.email?.trim();
  const nombre = row.nombre?.trim();
  const apellido = row.apellido?.trim() || '';
  const password = row.password?.trim() || generatePassword();

  if (!email) {
    throw new Error('Email es obligatorio');
  }
  if (!nombre) {
    throw new Error('Nombre es obligatorio');
  }

  // Crear Auth user
  const { data: userData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nombre, apellido, rol: 'padre' },
  });

  if (authError) {
    throw new Error(`Auth: ${authError.message}`);
  }

  const userId = userData.user.id;

  // Insertar profile
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      correo: email,
      nombre,
      apellido,
      rol: 'padre',
    });

  if (profileError) {
    await supabase.auth.admin.deleteUser(userId);
    throw new Error(`Profile: ${profileError.message}`);
  }

  // Insertar en tabla padres
  const insertData: Record<string, string> = { id: userId };
  if (row.domicilio) insertData.domicilio = row.domicilio.trim();
  if (row.tipo_representante) insertData.tipo_representante = row.tipo_representante.trim();

  const { error: roleError } = await supabase
    .from('padres')
    .insert(insertData);

  if (roleError) {
    await supabase.auth.admin.deleteUser(userId);
    throw new Error(`Tabla padres: ${roleError.message}`);
  }
}

async function importConductor(
  supabase: ReturnType<typeof createClient>,
  row: Record<string, string>,
  rowNum: number,
  addError: (row: number, error: string) => void,
) {
  const email = row.email?.trim();
  const nombre = row.nombre?.trim();
  const apellido = row.apellido?.trim() || '';
  const cedula = row.cedula?.trim();
  const licencia = row.licencia?.trim();
  const password = row.password?.trim() || generatePassword();

  if (!email) throw new Error('Email es obligatorio');
  if (!nombre) throw new Error('Nombre es obligatorio');
  if (!cedula) throw new Error('Cédula es obligatoria');
  if (!licencia) throw new Error('Licencia es obligatoria');

  // Crear Auth user
  const { data: userData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nombre, apellido, rol: 'chofer' },
  });

  if (authError) {
    throw new Error(`Auth: ${authError.message}`);
  }

  const userId = userData.user.id;

  // Insertar profile
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      correo: email,
      nombre,
      apellido,
      rol: 'chofer',
    });

  if (profileError) {
    await supabase.auth.admin.deleteUser(userId);
    throw new Error(`Profile: ${profileError.message}`);
  }

  // Insertar en tabla choferes
  const { error: roleError } = await supabase
    .from('choferes')
    .insert({
      id: userId,
      cedula,
      licencia,
    });

  if (roleError) {
    await supabase.auth.admin.deleteUser(userId);
    throw new Error(`Tabla choferes: ${roleError.message}`);
  }
}

async function importEstudiante(
  supabase: ReturnType<typeof createClient>,
  row: Record<string, string>,
  _rowNum: number,
  _addError: (row: number, error: string) => void,
) {
  const nombre = row.nombre?.trim();
  const apellido = row.apellido?.trim() || '';
  const id_padre = row.id_padre?.trim();
  const id_ruta = row.id_ruta?.trim();
  const id_parada = row.id_parada?.trim();

  if (!nombre) throw new Error('Nombre es obligatorio');

  // Validar que id_padre existe si se proporciona
  if (id_padre) {
    const { data: padre, error } = await supabase
      .from('padres')
      .select('id')
      .eq('id', id_padre)
      .single();

    if (error || !padre) {
      throw new Error(`id_padre '${id_padre}' no existe`);
    }
  }

  // Validar que id_ruta existe si se proporciona
  if (id_ruta) {
    const { data: ruta, error } = await supabase
      .from('rutas')
      .select('id')
      .eq('id', id_ruta)
      .single();

    if (error || !ruta) {
      throw new Error(`id_ruta '${id_ruta}' no existe`);
    }
  }

  const insertData: Record<string, string> = { nombre, apellido };
  if (id_padre) insertData.id_padre = id_padre;
  if (id_ruta) insertData.id_ruta = id_ruta;
  if (id_parada) insertData.id_parada = id_parada;

  const { error: insertError } = await supabase
    .from('estudiantes')
    .insert(insertData);

  if (insertError) {
    throw new Error(`Insert: ${insertError.message}`);
  }
}

async function importBus(
  supabase: ReturnType<typeof createClient>,
  row: Record<string, string>,
  _rowNum: number,
  _addError: (row: number, error: string) => void,
) {
  const placa = row.placa?.trim();
  const capacidad = parseInt(row.capacidad?.trim() || '0', 10);
  const modelo = row.modelo?.trim() || '';
  const marca = row.marca?.trim() || '';

  if (!placa) throw new Error('Placa es obligatoria');
  if (isNaN(capacidad) || capacidad <= 0) throw new Error('Capacidad debe ser un número positivo');

  const insertData: Record<string, string | number> = {
    placa,
    capacidad,
  };
  if (modelo) insertData.modelo = modelo;
  if (marca) insertData.marca = marca;

  const { error: insertError } = await supabase
    .from('busetas')
    .insert(insertData);

  if (insertError) {
    throw new Error(`Insert: ${insertError.message}`);
  }
}
