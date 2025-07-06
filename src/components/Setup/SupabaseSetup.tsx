import React, { useState, useEffect } from 'react';
import { Database, CheckCircle, AlertCircle, Loader2, Copy, ExternalLink, Users, Shield, Play } from 'lucide-react';
import { testConnection } from '../../lib/supabase';

export const SupabaseSetup: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [showInstructions, setShowInstructions] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setConnectionStatus('checking');
    const isConnected = await testConnection();
    setConnectionStatus(isConnected ? 'connected' : 'error');
  };

  const demoUsers = [
    {
      email: 'admin@vptech.com',
      password: 'admin123',
      name: 'Hersan Romero',
      role: 'admin',
      area: null,
      description: 'Administrador VP - Acceso completo al sistema'
    },
    {
      email: 'calidad@vptech.com',
      password: 'quality123',
      name: 'Carlos Mendoza',
      role: 'area_manager',
      area: 'quality',
      description: 'Gerente de Calidad y Funcional'
    },
    {
      email: 'proyectos@vptech.com',
      password: 'projects123',
      name: 'Ana García',
      role: 'area_manager',
      area: 'projects',
      description: 'Gerente de Proyectos y Procesos'
    }
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const copyUserData = (user: typeof demoUsers[0]) => {
    const userData = `Email: ${user.email}\nPassword: ${user.password}\nName: ${user.name}\nRole: ${user.role}${user.area ? `\nArea: ${user.area}` : ''}`;
    copyToClipboard(userData);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Database className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Configuración de Supabase</h1>
            <p className="text-gray-600">Configure la base de datos para el sistema colaborativo</p>
          </div>

          {/* Connection Status */}
          <div className="mb-8">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                {connectionStatus === 'checking' && <Loader2 className="w-5 h-5 text-blue-600 animate-spin mr-3" />}
                {connectionStatus === 'connected' && <CheckCircle className="w-5 h-5 text-green-600 mr-3" />}
                {connectionStatus === 'error' && <AlertCircle className="w-5 h-5 text-red-600 mr-3" />}
                
                <div>
                  <p className="font-medium text-gray-900">
                    {connectionStatus === 'checking' && 'Verificando conexión...'}
                    {connectionStatus === 'connected' && 'Conectado a Supabase'}
                    {connectionStatus === 'error' && 'Error de conexión'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {connectionStatus === 'connected' && 'La base de datos está lista para usar'}
                    {connectionStatus === 'error' && 'Configure las variables de entorno y ejecute la migración'}
                  </p>
                </div>
              </div>
              
              <button
                onClick={checkConnection}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Verificar
              </button>
            </div>
          </div>

          {/* Setup Instructions */}
          {connectionStatus === 'error' && (
            <div className="mb-8">
              <button
                onClick={() => setShowInstructions(!showInstructions)}
                className="w-full flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-left hover:bg-yellow-100 transition-colors"
              >
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mr-3" />
                  <span className="font-medium text-yellow-800">Instrucciones de configuración</span>
                </div>
                <ExternalLink className="w-4 h-4 text-yellow-600" />
              </button>

              {showInstructions && (
                <div className="mt-4 p-6 bg-white border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Configuración paso a paso</h3>
                    <div className="flex space-x-2">
                      {[1, 2, 3, 4].map((step) => (
                        <button
                          key={step}
                          onClick={() => setCurrentStep(step)}
                          className={`w-8 h-8 rounded-full text-sm font-bold transition-colors ${
                            currentStep === step
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                          }`}
                        >
                          {step}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Step 1: Create Supabase Project */}
                  {currentStep === 1 && (
                    <div className="space-y-4">
                      <div className="flex items-center mb-4">
                        <Database className="w-6 h-6 text-blue-600 mr-3" />
                        <h4 className="text-lg font-medium text-gray-900">Paso 1: Crear proyecto en Supabase</h4>
                      </div>
                      <div className="pl-9 space-y-3">
                        <p className="text-gray-700">1. Vaya a <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">supabase.com</a> y cree una cuenta</p>
                        <p className="text-gray-700">2. Haga clic en "New Project" y complete los datos:</p>
                        <div className="bg-gray-50 p-3 rounded-lg text-sm">
                          <div>• <strong>Name:</strong> VP Tecnología Indicators</div>
                          <div>• <strong>Database Password:</strong> Elija una contraseña segura</div>
                          <div>• <strong>Region:</strong> Seleccione la más cercana</div>
                        </div>
                        <p className="text-gray-700">3. Espere a que el proyecto se cree (puede tomar unos minutos)</p>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Get API Keys */}
                  {currentStep === 2 && (
                    <div className="space-y-4">
                      <div className="flex items-center mb-4">
                        <Shield className="w-6 h-6 text-green-600 mr-3" />
                        <h4 className="text-lg font-medium text-gray-900">Paso 2: Obtener claves de API</h4>
                      </div>
                      <div className="pl-9 space-y-3">
                        <p className="text-gray-700">1. En su proyecto de Supabase, vaya a <strong>Settings → API</strong></p>
                        <p className="text-gray-700">2. Copie estos valores:</p>
                        <div className="bg-gray-50 p-3 rounded-lg text-sm space-y-2">
                          <div>• <strong>Project URL:</strong> https://[your-project].supabase.co</div>
                          <div>• <strong>anon public key:</strong> eyJhbGciOiJIUzI1NiIsInR5cCI6...</div>
                        </div>
                        <p className="text-gray-700">3. Configure las variables de entorno en su hosting:</p>
                        <div className="bg-gray-900 text-gray-100 p-3 rounded text-sm">
                          <div>VITE_SUPABASE_URL=https://[your-project].supabase.co</div>
                          <div>VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Run Migration */}
                  {currentStep === 3 && (
                    <div className="space-y-4">
                      <div className="flex items-center mb-4">
                        <Play className="w-6 h-6 text-purple-600 mr-3" />
                        <h4 className="text-lg font-medium text-gray-900">Paso 3: Ejecutar migración de base de datos</h4>
                      </div>
                      <div className="pl-9 space-y-3">
                        <p className="text-gray-700">1. En Supabase, vaya a <strong>SQL Editor</strong></p>
                        <p className="text-gray-700">2. Ejecute la migración que se encuentra en:</p>
                        <div className="bg-blue-50 p-3 rounded-lg text-sm">
                          <code>supabase/migrations/create_initial_schema.sql</code>
                        </div>
                        <p className="text-gray-700">3. Esta migración creará:</p>
                        <div className="bg-gray-50 p-3 rounded-lg text-sm space-y-1">
                          <div>✅ Tablas: profiles, indicators, activities, risks, import_history</div>
                          <div>✅ Políticas de seguridad (RLS)</div>
                          <div>✅ Triggers automáticos</div>
                          <div>✅ Función para nuevos usuarios</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 4: Create Demo Users */}
                  {currentStep === 4 && (
                    <div className="space-y-4">
                      <div className="flex items-center mb-4">
                        <Users className="w-6 h-6 text-orange-600 mr-3" />
                        <h4 className="text-lg font-medium text-gray-900">Paso 4: Crear usuarios de demostración</h4>
                      </div>
                      <div className="pl-9 space-y-4">
                        <p className="text-gray-700">Cree estos usuarios manualmente en <strong>Authentication → Users → Add user</strong>:</p>
                        
                        <div className="space-y-3">
                          {demoUsers.map((user, index) => (
                            <div key={user.email} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="font-medium text-gray-900">{user.name}</h5>
                                <button
                                  onClick={() => copyUserData(user)}
                                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                  title="Copiar datos del usuario"
                                >
                                  <Copy className="w-4 h-4" />
                                </button>
                              </div>
                              <div className="text-sm text-gray-600 space-y-1">
                                <div><strong>Email:</strong> {user.email}</div>
                                <div><strong>Password:</strong> {user.password}</div>
                                <div><strong>Role:</strong> {user.role}</div>
                                {user.area && <div><strong>Area:</strong> {user.area}</div>}
                                <div className="text-xs text-gray-500 mt-2">{user.description}</div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                          <p className="text-sm text-blue-800">
                            <strong>Importante:</strong> Al crear cada usuario en Supabase, asegúrese de:
                          </p>
                          <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
                            <li>Usar exactamente los emails y contraseñas mostrados arriba</li>
                            <li>Marcar "Auto Confirm User" para evitar verificación por email</li>
                            <li>Los perfiles se crearán automáticamente gracias al trigger</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between mt-6 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                      disabled={currentStep === 1}
                      className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>
                    <button
                      onClick={() => setCurrentStep(Math.min(4, currentStep + 1))}
                      disabled={currentStep === 4}
                      className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Success State */}
          {connectionStatus === 'connected' && (
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">¡Configuración Completa!</h2>
              <p className="text-gray-600 mb-6">
                Su sistema está listo para colaboración multi-usuario en tiempo real
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="font-medium text-green-900">✅ Base de Datos</h3>
                  <p className="text-sm text-green-700">PostgreSQL configurada</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-medium text-blue-900">🔐 Autenticación</h3>
                  <p className="text-sm text-blue-700">Multi-usuario habilitado</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h3 className="font-medium text-purple-900">🔄 Tiempo Real</h3>
                  <p className="text-sm text-purple-700">Sincronización automática</p>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6">
                <p className="text-sm text-yellow-800">
                  <strong>Nota:</strong> Si aún no puede iniciar sesión, asegúrese de haber creado los usuarios de demostración 
                  en la sección Authentication → Users de su proyecto Supabase.
                </p>
              </div>

              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Continuar al Sistema
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};