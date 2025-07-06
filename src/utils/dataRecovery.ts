// Utilidad para recuperación y persistencia de datos
import { Indicator, Risk } from '../types';

export interface SystemData {
  indicators: Indicator[];
  risks: Risk[];
  lastUpdate: string;
  version: string;
}

export interface ImportHistoryEntry {
  id: string;
  fileName: string;
  fileSize: number;
  fileHash: string;
  date: string;
  type: string;
  indicatorsCount: number;
  activitiesCount: number;
  risksCount: number;
  status: 'success' | 'error';
  errorMessage?: string;
  importedBy: string;
  importedByRole: string;
  areas: string[];
  rawData?: {
    indicators: any[];
    activities: any[];
    risks: any[];
  };
}

export const STORAGE_KEYS = {
  INDICATORS: 'systemIndicators',
  RISKS: 'systemRisks',
  LAST_UPDATE: 'systemLastUpdate',
  IMPORT_HISTORY: 'importHistory',
  BACKUP: 'systemBackup',
  VERSION: 'systemVersion'
};

export const CURRENT_VERSION = '1.0.0';

// 🆕 FUNCIÓN PARA LIMPIAR COMPLETAMENTE EL SISTEMA
export const completeSystemReset = (): void => {
  console.log('🧹 === LIMPIEZA COMPLETA DEL SISTEMA ===');
  
  // Lista de TODAS las claves relacionadas con el sistema
  const systemKeys = [
    // Claves principales
    'systemIndicators',
    'systemRisks',
    'systemLastUpdate',
    'importHistory',
    'systemBackup',
    'systemVersion',
    
    // Claves de backup
    'backup_indicators',
    'backup_risks',
    'emergency_indicators',
    'emergency_risks',
    'fallback_indicators',
    'fallback_risks',
    
    // Claves que podrían haberse creado por error
    'indicators',
    'risks',
    'data',
    'systemData',
    'recoveredData',
    'tempData',
    
    // Claves de recuperación
    'recovered-indicators',
    'recovered-risks',
    'temp-indicators',
    'temp-risks'
  ];
  
  // Eliminar todas las claves del sistema
  systemKeys.forEach(key => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      console.log(`🗑️ Eliminada clave: ${key}`);
    }
  });
  
  // Buscar y eliminar cualquier clave que contenga patrones relacionados
  const patterns = ['indicator', 'risk', 'system', 'backup', 'emergency', 'fallback', 'recovered', 'temp'];
  
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key) {
      const lowerKey = key.toLowerCase();
      const shouldDelete = patterns.some(pattern => lowerKey.includes(pattern));
      
      if (shouldDelete && !key.includes('User') && !key.includes('currentUser')) {
        localStorage.removeItem(key);
        console.log(`🗑️ Eliminada clave por patrón: ${key}`);
      }
    }
  }
  
  console.log('✅ Sistema completamente limpio');
  console.log('📊 Estado final del localStorage:');
  console.log(`   Total de claves restantes: ${localStorage.length}`);
  
  // Verificar que no queden datos del sistema
  const remainingSystemKeys = systemKeys.filter(key => localStorage.getItem(key) !== null);
  if (remainingSystemKeys.length === 0) {
    console.log('✅ Confirmado: No quedan datos del sistema en localStorage');
  } else {
    console.warn('⚠️ Advertencia: Algunas claves del sistema no se pudieron eliminar:', remainingSystemKeys);
  }
};

// 🆕 FUNCIÓN ROBUSTA PARA GUARDAR DATOS CON VERIFICACIÓN MÚLTIPLE
export const saveSystemDataRobust = (indicators: Indicator[], risks: Risk[]): boolean => {
  try {
    console.log('💾 === GUARDADO ROBUSTO DE DATOS ===');
    console.log(`📊 Guardando ${indicators.length} indicadores`);
    console.log(`⚠️ Guardando ${risks.length} riesgos`);
    
    // Verificar que los indicadores tengan actividades
    const totalActivities = indicators.reduce((acc, ind) => acc + (ind.activities?.length || 0), 0);
    console.log(`📋 Total de actividades: ${totalActivities}`);
    
    if (indicators.length > 0 && totalActivities === 0) {
      console.warn('⚠️ ADVERTENCIA: Los indicadores no tienen actividades asociadas');
      return false;
    }
    
    // Verificar integridad de datos antes de guardar
    const validIndicators = indicators.filter(ind => 
      ind.id && ind.name && ind.area && ind.target > 0 && ind.responsible
    );
    
    const validRisks = risks.filter(risk => 
      risk.id && risk.name && risk.area && risk.responsible
    );
    
    if (validIndicators.length !== indicators.length) {
      console.error(`❌ ${indicators.length - validIndicators.length} indicadores inválidos detectados`);
      return false;
    }
    
    if (validRisks.length !== risks.length) {
      console.error(`❌ ${risks.length - validRisks.length} riesgos inválidos detectados`);
      return false;
    }
    
    const timestamp = new Date().toISOString();
    const indicatorsJson = JSON.stringify(validIndicators);
    const risksJson = JSON.stringify(validRisks);
    
    // Guardar en claves principales
    localStorage.setItem(STORAGE_KEYS.INDICATORS, indicatorsJson);
    localStorage.setItem(STORAGE_KEYS.RISKS, risksJson);
    localStorage.setItem(STORAGE_KEYS.LAST_UPDATE, timestamp);
    localStorage.setItem(STORAGE_KEYS.VERSION, CURRENT_VERSION);
    
    // Crear backup inmediato
    localStorage.setItem('backup_indicators', indicatorsJson);
    localStorage.setItem('backup_risks', risksJson);
    
    // Verificar que se guardó correctamente
    const verification = verifyDataIntegrityRobust();
    if (!verification.isValid) {
      console.error('❌ Error: Los datos no se guardaron correctamente');
      console.error('Errores:', verification.errors);
      return false;
    }
    
    console.log('✅ Datos guardados y verificados exitosamente');
    console.log(`📊 ${validIndicators.length} indicadores guardados`);
    console.log(`📋 ${totalActivities} actividades guardadas`);
    console.log(`⚠️ ${validRisks.length} riesgos guardados`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Error crítico guardando datos:', error);
    return false;
  }
};

// 🆕 FUNCIÓN ROBUSTA PARA VERIFICAR INTEGRIDAD DE DATOS
export const verifyDataIntegrityRobust = (): { isValid: boolean; errors: string[]; data: { indicators: Indicator[]; risks: Risk[] } } => {
  const errors: string[] = [];
  let indicators: Indicator[] = [];
  let risks: Risk[] = [];
  
  try {
    // Verificar indicadores
    const indicatorsData = localStorage.getItem(STORAGE_KEYS.INDICATORS);
    if (indicatorsData) {
      try {
        const parsedIndicators = JSON.parse(indicatorsData);
        if (Array.isArray(parsedIndicators)) {
          indicators = parsedIndicators;
          
          // Verificar estructura de cada indicador
          indicators.forEach((ind, index) => {
            if (!ind.id) errors.push(`Indicador ${index + 1}: ID faltante`);
            if (!ind.name) errors.push(`Indicador ${index + 1}: Nombre faltante`);
            if (!ind.area) errors.push(`Indicador ${index + 1}: Área faltante`);
            if (!ind.activities || !Array.isArray(ind.activities)) {
              errors.push(`Indicador ${index + 1}: Actividades faltantes o inválidas`);
            }
          });
          
          const totalActivities = indicators.reduce((acc, ind) => acc + (ind.activities?.length || 0), 0);
          console.log(`✅ Indicadores verificados: ${indicators.length} con ${totalActivities} actividades`);
        } else {
          errors.push('Los indicadores no son un array válido');
        }
      } catch (parseError) {
        errors.push('Error parseando indicadores: datos corruptos');
      }
    } else {
      console.log('ℹ️ No hay indicadores en localStorage');
    }
    
    // Verificar riesgos
    const risksData = localStorage.getItem(STORAGE_KEYS.RISKS);
    if (risksData) {
      try {
        const parsedRisks = JSON.parse(risksData);
        if (Array.isArray(parsedRisks)) {
          risks = parsedRisks;
          
          // Verificar estructura de cada riesgo
          risks.forEach((risk, index) => {
            if (!risk.id) errors.push(`Riesgo ${index + 1}: ID faltante`);
            if (!risk.name) errors.push(`Riesgo ${index + 1}: Nombre faltante`);
            if (!risk.area) errors.push(`Riesgo ${index + 1}: Área faltante`);
          });
          
          console.log(`✅ Riesgos verificados: ${risks.length}`);
        } else {
          errors.push('Los riesgos no son un array válido');
        }
      } catch (parseError) {
        errors.push('Error parseando riesgos: datos corruptos');
      }
    } else {
      console.log('ℹ️ No hay riesgos en localStorage');
    }
    
  } catch (error) {
    errors.push(`Error general verificando integridad: ${error}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    data: { indicators, risks }
  };
};

// 🆕 FUNCIÓN SIMPLIFICADA Y ROBUSTA PARA CARGAR DATOS
export const loadSystemDataRobust = (): { indicators: Indicator[]; risks: Risk[] } => {
  console.log('🚀 === CARGA ROBUSTA DE DATOS ===');
  
  // Verificar integridad primero
  const verification = verifyDataIntegrityRobust();
  
  if (verification.isValid && (verification.data.indicators.length > 0 || verification.data.risks.length > 0)) {
    console.log('✅ Datos válidos encontrados en localStorage');
    console.log(`📊 ${verification.data.indicators.length} indicadores cargados`);
    console.log(`📋 ${verification.data.indicators.reduce((acc, ind) => acc + (ind.activities?.length || 0), 0)} actividades cargadas`);
    console.log(`⚠️ ${verification.data.risks.length} riesgos cargados`);
    
    return verification.data;
  }
  
  if (verification.errors.length > 0) {
    console.warn('⚠️ Errores de integridad detectados:', verification.errors);
  }
  
  console.log('ℹ️ No se encontraron datos válidos en el sistema');
  console.log('💡 Para cargar datos, use la sección "Importar Datos"');
  
  return { indicators: [], risks: [] };
};

// Función para crear backup automático
export const createBackup = (indicators: Indicator[], risks: Risk[]): void => {
  try {
    const backup: SystemData = {
      indicators,
      risks,
      lastUpdate: new Date().toISOString(),
      version: CURRENT_VERSION
    };
    
    localStorage.setItem(STORAGE_KEYS.BACKUP, JSON.stringify(backup));
    console.log('💾 Backup creado exitosamente con', indicators.length, 'indicadores y', risks.length, 'riesgos');
  } catch (error) {
    console.error('❌ Error creando backup:', error);
  }
};

// Función para restaurar desde backup
export const restoreFromBackup = (): SystemData | null => {
  try {
    const backupData = localStorage.getItem(STORAGE_KEYS.BACKUP);
    if (backupData) {
      const backup: SystemData = JSON.parse(backupData);
      console.log('🔄 Backup encontrado con', backup.indicators.length, 'indicadores y', backup.risks.length, 'riesgos');
      return backup;
    }
  } catch (error) {
    console.error('❌ Error restaurando backup:', error);
  }
  return null;
};

// 🆕 FUNCIÓN PRINCIPAL SIMPLIFICADA PARA CARGAR DATOS
export const loadSystemData = (): { indicators: Indicator[]; risks: Risk[] } => {
  return loadSystemDataRobust();
};

// 🆕 FUNCIÓN PRINCIPAL SIMPLIFICADA PARA GUARDAR DATOS
export const saveSystemData = (indicators: Indicator[], risks: Risk[]): void => {
  const success = saveSystemDataRobust(indicators, risks);
  if (!success) {
    console.error('❌ Error guardando datos del sistema');
  }
};

// Función para verificar integridad de datos (mantenida para compatibilidad)
export const verifyDataIntegrity = (): boolean => {
  const verification = verifyDataIntegrityRobust();
  return verification.isValid;
};

// Función para limpiar datos corruptos
export const cleanCorruptedData = (): void => {
  console.log('🧹 Limpiando datos corruptos...');
  
  Object.values(STORAGE_KEYS).forEach(key => {
    try {
      const data = localStorage.getItem(key);
      if (data) {
        JSON.parse(data); // Verificar que sea JSON válido
        console.log('✅ Dato válido:', key);
      }
    } catch (error) {
      console.warn(`⚠️ Eliminando dato corrupto: ${key}`);
      localStorage.removeItem(key);
    }
  });
  
  console.log('✅ Limpieza completada');
};

// Función para obtener estadísticas del sistema
export const getSystemStats = () => {
  const { indicators, risks } = loadSystemData();
  const lastUpdate = localStorage.getItem(STORAGE_KEYS.LAST_UPDATE);
  const importHistory = localStorage.getItem(STORAGE_KEYS.IMPORT_HISTORY);
  
  let importCount = 0;
  try {
    if (importHistory) {
      const history = JSON.parse(importHistory);
      importCount = history.filter((h: any) => h.status === 'success').length;
    }
  } catch (error) {
    console.warn('⚠️ Error leyendo historial de importaciones');
  }
  
  return {
    totalIndicators: indicators.length,
    totalActivities: indicators.reduce((acc, ind) => acc + (ind.activities?.length || 0), 0),
    totalRisks: risks.length,
    lastUpdate: lastUpdate ? new Date(lastUpdate).toLocaleString() : 'Nunca',
    importCount,
    hasData: indicators.length > 0 || risks.length > 0
  };
};

// Función para forzar recarga de datos
export const forceDataReload = (): { indicators: Indicator[]; risks: Risk[] } => {
  console.log('🔄 Forzando recarga completa de datos...');
  
  // Limpiar cache si existe
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => {
        caches.delete(name);
      });
    });
  }
  
  return loadSystemData();
};

// Función de diagnóstico completo
export const diagnoseSystem = (): void => {
  console.log('🔍 === DIAGNÓSTICO COMPLETO DEL SISTEMA ===');
  
  // Verificar todas las claves de localStorage
  console.log('📋 Claves en localStorage:');
  const allKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      allKeys.push(key);
      try {
        const data = localStorage.getItem(key);
        const size = data ? (data.length / 1024).toFixed(2) : '0';
        console.log(`  • ${key}: ${size} KB`);
      } catch (error) {
        console.log(`  • ${key}: ERROR`);
      }
    }
  }
  
  console.log(`📊 Total de claves en localStorage: ${allKeys.length}`);
  
  // Verificar datos del sistema
  const verification = verifyDataIntegrityRobust();
  console.log('🔍 Verificación de integridad:', verification.isValid ? 'VÁLIDA' : 'INVÁLIDA');
  if (verification.errors.length > 0) {
    console.log('❌ Errores encontrados:', verification.errors);
  }
  
  const stats = getSystemStats();
  console.log('📊 Estadísticas del sistema:', stats);
  
  console.log('🎯 === FIN DEL DIAGNÓSTICO ===');
};