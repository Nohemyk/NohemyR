# 🔧 Configuración Multi-Usuario con Supabase

## 📋 Paso 1: Crear Proyecto en Supabase

1. **Ir a [supabase.com](https://supabase.com)**
2. **Crear cuenta** o iniciar sesión
3. **Crear nuevo proyecto:**
   - Name: `VP Tecnología Indicators`
   - Database Password: (elige una contraseña segura)
   - Region: Selecciona la más cercana a tu ubicación

## 🔑 Paso 2: Obtener Credenciales

1. En tu proyecto Supabase, ve a **Settings → API**
2. Copia estos valores:
   - **Project URL**: `https://[tu-proyecto].supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6...`

## ⚙️ Paso 3: Configurar Variables de Entorno en Netlify

1. **Ir a tu sitio en Netlify**: `indicadores-tecnologia-04072025.netlify.app`
2. **Site settings → Environment variables**
3. **Agregar estas variables:**

```
VITE_SUPABASE_URL=https://[tu-proyecto].supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
```

## 🗄️ Paso 4: Ejecutar Migración de Base de Datos

1. En Supabase, ve a **SQL Editor**
2. Ejecuta el script que está en: `supabase/migrations/20250701160906_misty_boat.sql`
3. Esto creará todas las tablas necesarias

## 👥 Paso 5: Crear Usuarios de Demostración

En Supabase, ve a **Authentication → Users → Add user** y crea:

### Usuario Administrador
- **Email**: `admin@vptech.com`
- **Password**: `admin123`
- **Marcar**: "Auto Confirm User"

### Usuario Calidad
- **Email**: `calidad@vptech.com`
- **Password**: `quality123`
- **Marcar**: "Auto Confirm User"

### Usuario Proyectos
- **Email**: `proyectos@vptech.com`
- **Password**: `projects123`
- **Marcar**: "Auto Confirm User"

## 🔄 Paso 6: Redesplegar en Netlify

1. Después de configurar las variables de entorno
2. **Trigger deploy** en Netlify para que tome las nuevas variables

## ✅ Resultado Final

Tu aplicación tendrá:
- ✅ **Multi-usuario** con roles (admin, gerente, analista, consultor)
- ✅ **Persistencia de datos** en PostgreSQL
- ✅ **Sincronización en tiempo real** entre usuarios
- ✅ **Seguridad** con Row Level Security (RLS)
- ✅ **Backup automático** en la nube

## 🎯 Usuarios y Permisos

### Administrador (`admin@vptech.com`)
- Acceso completo a todas las áreas
- Puede gestionar usuarios
- Puede eliminar cualquier dato

### Gerente de Área (`calidad@vptech.com`, `proyectos@vptech.com`)
- Solo su área asignada
- Puede crear/editar indicadores y actividades
- Puede importar datos

### Analista
- Solo su área asignada
- Puede crear/editar datos
- No puede eliminar

### Consultor
- Solo lectura
- Puede ver reportes
- No puede modificar datos

## 🔧 Solución de Problemas

Si tienes problemas:
1. Verifica que las variables de entorno estén correctas
2. Asegúrate de que la migración se ejecutó sin errores
3. Confirma que los usuarios fueron creados con "Auto Confirm User"
4. Revisa los logs en Netlify si hay errores de despliegue