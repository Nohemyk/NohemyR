import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Evitar detección automática de URL
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'vp-tech-indicators@1.0.0'
    }
  }
});

// Función para verificar la conexión con timeout
export const testConnection = async (timeoutMs: number = 5000) => {
  try {
    console.log('🔍 Verificando conexión a Supabase...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
      .abortSignal(controller.signal);
    
    clearTimeout(timeoutId);
    
    if (error) {
      console.error('❌ Error de conexión:', error.message);
      return false;
    }
    
    console.log('✅ Conexión a Supabase exitosa');
    return true;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error('❌ Timeout de conexión a Supabase');
    } else {
      console.error('❌ Error conectando a Supabase:', error.message);
    }
    return false;
  }
};

// Función para obtener el usuario actual con manejo de errores
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('❌ Error obteniendo usuario:', error.message);
      return null;
    }
    return user;
  } catch (error: any) {
    console.error('❌ Error inesperado obteniendo usuario:', error.message);
    return null;
  }
};

// Función para obtener el perfil completo del usuario con reintentos
export const getUserProfile = async (userId: string, retries: number = 2) => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      console.log(`🔍 Obteniendo perfil del usuario (intento ${attempt + 1}/${retries + 1}):`, userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          console.warn('⚠️ Perfil no encontrado para el usuario:', userId);
          return null;
        }
        throw error;
      }
      
      if (data) {
        console.log('✅ Perfil obtenido exitosamente:', data.name, data.role);
        return data;
      }
      
      return null;
    } catch (error: any) {
      console.error(`❌ Error obteniendo perfil (intento ${attempt + 1}):`, error.message);
      
      if (attempt === retries) {
        console.error('❌ Todos los intentos fallaron para obtener el perfil');
        return null;
      }
      
      // Esperar antes del siguiente intento
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
  
  return null;
};

// Función para verificar si el usuario existe en la tabla profiles
export const checkUserProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    return !!data;
  } catch (error: any) {
    console.error('❌ Error verificando perfil de usuario:', error.message);
    return false;
  }
};