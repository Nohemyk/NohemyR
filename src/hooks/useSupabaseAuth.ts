import { useState, useEffect, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, getUserProfile } from '../lib/supabase';
import { User as AppUser } from '../types';

interface AuthState {
  user: AppUser | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
}

export const useSupabaseAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    isAuthenticated: false,
  });

  const initialized = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        console.log('🔐 Inicializando autenticación...');
        
        // Limpiar timeout anterior
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // Timeout de seguridad para evitar bucles infinitos
        timeoutRef.current = setTimeout(() => {
          if (isMounted && !initialized.current) {
            console.warn('⚠️ Timeout de autenticación - forzando estado no autenticado');
            setAuthState({
              user: null,
              session: null,
              loading: false,
              isAuthenticated: false,
            });
            initialized.current = true;
          }
        }, 10000); // 10 segundos máximo

        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!isMounted) return;

        if (error) {
          console.error('❌ Error obteniendo sesión:', error);
          setAuthState({
            user: null,
            session: null,
            loading: false,
            isAuthenticated: false,
          });
          initialized.current = true;
          return;
        }

        if (session?.user) {
          console.log('✅ Sesión encontrada para:', session.user.email);
          
          try {
            const profile = await getUserProfile(session.user.id);
            
            if (!isMounted) return;

            if (profile) {
              const appUser: AppUser = {
                id: profile.id,
                name: profile.name,
                email: profile.email,
                password: '',
                role: profile.role,
                area: profile.area || undefined,
                isActive: profile.is_active,
                createdAt: profile.created_at,
                lastLogin: profile.last_login || undefined,
              };

              console.log('✅ Perfil cargado:', appUser.name, appUser.role);

              setAuthState({
                user: appUser,
                session,
                loading: false,
                isAuthenticated: true,
              });

              // Actualizar último login
              await supabase
                .from('profiles')
                .update({ last_login: new Date().toISOString() })
                .eq('id', session.user.id);

            } else {
              console.warn('⚠️ No se encontró perfil para el usuario');
              setAuthState({
                user: null,
                session: null,
                loading: false,
                isAuthenticated: false,
              });
            }
          } catch (profileError) {
            console.error('❌ Error cargando perfil:', profileError);
            setAuthState({
              user: null,
              session: null,
              loading: false,
              isAuthenticated: false,
            });
          }
        } else {
          console.log('ℹ️ No hay sesión activa');
          setAuthState({
            user: null,
            session: null,
            loading: false,
            isAuthenticated: false,
          });
        }

        initialized.current = true;

      } catch (error) {
        console.error('❌ Error inicializando autenticación:', error);
        if (isMounted) {
          setAuthState({
            user: null,
            session: null,
            loading: false,
            isAuthenticated: false,
          });
          initialized.current = true;
        }
      }
    };

    if (!initialized.current) {
      initializeAuth();
    }

    // Configurar listener de cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted || !initialized.current) return;

        console.log('🔄 Cambio de estado de auth:', event, session?.user?.email);

        // Evitar procesar eventos duplicados
        if (event === 'TOKEN_REFRESHED') {
          console.log('🔄 Token refrescado - manteniendo estado actual');
          return;
        }

        try {
          if (session?.user && event === 'SIGNED_IN') {
            const profile = await getUserProfile(session.user.id);
            
            if (!isMounted) return;

            if (profile) {
              const appUser: AppUser = {
                id: profile.id,
                name: profile.name,
                email: profile.email,
                password: '',
                role: profile.role,
                area: profile.area || undefined,
                isActive: profile.is_active,
                createdAt: profile.created_at,
                lastLogin: profile.last_login || undefined,
              };

              setAuthState({
                user: appUser,
                session,
                loading: false,
                isAuthenticated: true,
              });

              // Actualizar último login
              await supabase
                .from('profiles')
                .update({ last_login: new Date().toISOString() })
                .eq('id', session.user.id);
            }
          } else if (event === 'SIGNED_OUT') {
            console.log('👋 Usuario cerró sesión');
            setAuthState({
              user: null,
              session: null,
              loading: false,
              isAuthenticated: false,
            });
          }
        } catch (error) {
          console.error('❌ Error en listener de auth:', error);
        }
      }
    );

    return () => {
      isMounted = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 Intentando iniciar sesión para:', email);
      
      setAuthState(prev => ({ ...prev, loading: true }));

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        console.error('❌ Error de autenticación:', error.message);
        setAuthState(prev => ({ ...prev, loading: false }));
        
        // Mensajes de error más específicos
        if (error.message.includes('Invalid login credentials')) {
          return { success: false, error: 'Credenciales inválidas. Verifique su email y contraseña.' };
        } else if (error.message.includes('Email not confirmed')) {
          return { success: false, error: 'Email no confirmado. Verifique su bandeja de entrada.' };
        } else {
          return { success: false, error: `Error de autenticación: ${error.message}` };
        }
      }

      if (data.user) {
        console.log('✅ Autenticación exitosa para:', data.user.email);
        // El estado se actualizará automáticamente a través del listener
        return { success: true, error: null };
      }

      return { success: false, error: 'Error desconocido durante la autenticación' };
    } catch (error: any) {
      console.error('❌ Error inesperado en signIn:', error);
      setAuthState(prev => ({ ...prev, loading: false }));
      return { success: false, error: `Error inesperado: ${error.message}` };
    }
  };

  const signOut = async () => {
    try {
      console.log('👋 Cerrando sesión...');
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setAuthState({
        user: null,
        session: null,
        loading: false,
        isAuthenticated: false,
      });

      console.log('✅ Sesión cerrada exitosamente');
      return { success: true, error: null };
    } catch (error: any) {
      console.error('❌ Error cerrando sesión:', error);
      return { success: false, error: error.message };
    }
  };

  const signUp = async (email: string, password: string, userData: {
    name: string;
    role: 'admin' | 'area_manager' | 'analyst' | 'consultant';
    area?: string;
  }) => {
    try {
      console.log('📝 Registrando nuevo usuario:', email);

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
        options: {
          data: userData
        }
      });

      if (error) throw error;

      // Crear perfil en la tabla profiles
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: email.trim(),
            name: userData.name,
            role: userData.role,
            area: userData.area || null,
            is_active: true,
          });

        if (profileError) {
          console.error('❌ Error creando perfil:', profileError);
          throw profileError;
        }

        console.log('✅ Usuario registrado exitosamente');
      }

      return { success: true, error: null };
    } catch (error: any) {
      console.error('❌ Error registrando usuario:', error);
      return { success: false, error: error.message };
    }
  };

  return {
    ...authState,
    signIn,
    signOut,
    signUp,
  };
};