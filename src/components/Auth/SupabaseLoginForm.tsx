import React, { useState } from 'react';
import { Building2, User, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { useSupabaseAuthContext } from '../../context/SupabaseAuthContext';

export const SupabaseLoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signIn, loading } = useSupabaseAuthContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return; // Prevenir múltiples envíos
    
    setError('');
    setIsSubmitting(true);

    try {
      const result = await signIn(email, password);
      if (!result.success) {
        setError(result.error || 'Error al iniciar sesión');
      }
    } catch (error) {
      console.error('Error en handleSubmit:', error);
      setError('Error inesperado al iniciar sesión');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = (userEmail: string, userPassword: string) => {
    if (isSubmitting || loading) return;
    
    setEmail(userEmail);
    setPassword(userPassword);
    setError('');
  };

  const isLoading = loading || isSubmitting;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">VP Tecnología</h1>
          <p className="text-gray-600">Sistema de Gestión de Indicadores</p>
          <div className="mt-2 px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full inline-block">
            🔄 Colaborativo Multi-Usuario
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center">
                <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="usuario@empresa.com"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isSubmitting ? 'Iniciando sesión...' : 'Verificando...'}
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>

          {/* Demo Users */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-4 text-center">Usuarios de demostración:</p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('admin@vptech.com', 'admin123')}
                className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                disabled={isLoading}
              >
                <div className="font-medium text-gray-900">Administrador VP</div>
                <div className="text-gray-600">admin@vptech.com</div>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('calidad@vptech.com', 'quality123')}
                className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                disabled={isLoading}
              >
                <div className="font-medium text-gray-900">Calidad y Funcional</div>
                <div className="text-gray-600">calidad@vptech.com</div>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('proyectos@vptech.com', 'projects123')}
                className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                disabled={isLoading}
              >
                <div className="font-medium text-gray-900">Proyectos y Procesos</div>
                <div className="text-gray-600">proyectos@vptech.com</div>
              </button>
            </div>
          </div>

          {/* Connection Status */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-center text-xs text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              Conectado a Supabase
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};