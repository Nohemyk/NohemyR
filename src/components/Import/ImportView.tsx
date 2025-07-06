import React, { useState, useEffect } from 'react';
import { Upload, Download, FileText, AlertCircle, CheckCircle, X, History, Trash2, Eye, Shield, RefreshCw } from 'lucide-react';
import { parseHTMLFile, parseExcelFile, validateImportData } from '../../utils/importUtils';
import { Indicator, Risk, ImportData } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { completeSystemReset, diagnoseSystem } from '../../utils/dataRecovery';

interface ImportViewProps {
  indicators: Indicator[];
  risks: Risk[];
  onIndicatorsChange: (indicators: Indicator[]) => void;
  onRisksChange: (risks: Risk[]) => void;
}

interface ImportHistoryEntry {
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
}

export const ImportView: React.FC<ImportViewProps> = ({
  indicators,
  risks,
  onIndicatorsChange,
  onRisksChange,
}) => {
  const { user } = useAuth();
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<ImportData | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importHistory, setImportHistory] = useState<ImportHistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [fileHash, setFileHash] = useState<string>('');
  const [showDataManagement, setShowDataManagement] = useState(false);

  // Cargar historial de importaciones al montar el componente
  useEffect(() => {
    const storedHistory = localStorage.getItem('importHistory');
    if (storedHistory) {
      try {
        const history = JSON.parse(storedHistory);
        const normalizedHistory = history.map((entry: any) => ({
          ...entry,
          areas: entry.areas || []
        }));
        setImportHistory(normalizedHistory);
        console.log('📚 Historial de importaciones cargado:', normalizedHistory.length, 'entradas');
      } catch (error) {
        console.error('❌ Error cargando historial de importaciones:', error);
        setImportHistory([]);
      }
    }
  }, []);

  // Guardar historial cuando cambie
  useEffect(() => {
    if (importHistory.length > 0) {
      localStorage.setItem('importHistory', JSON.stringify(importHistory));
      console.log('💾 Historial de importaciones guardado');
    }
  }, [importHistory]);

  // 🆕 FUNCIÓN PARA LIMPIAR COMPLETAMENTE EL SISTEMA
  const handleCompleteReset = () => {
    const confirmMessage = `⚠️ LIMPIEZA COMPLETA DEL SISTEMA ⚠️

¿Está seguro de eliminar TODOS los datos del sistema?

Esto incluye:
• Todos los indicadores cargados (${indicators.length})
• Todas las actividades (${indicators.reduce((acc, ind) => acc + (ind.activities?.length || 0), 0)})
• Todos los riesgos (${risks.length})
• Todo el historial de importaciones
• Todos los backups y datos de recuperación

⚠️ ESTA ACCIÓN NO SE PUEDE DESHACER ⚠️

El sistema quedará completamente limpio y listo para una nueva importación.`;

    if (window.confirm(confirmMessage)) {
      console.log('🧹 === INICIANDO LIMPIEZA COMPLETA DEL SISTEMA ===');
      
      // Ejecutar limpieza completa
      completeSystemReset();
      
      // Limpiar estado local
      onIndicatorsChange([]);
      onRisksChange([]);
      setImportHistory([]);
      
      // Limpiar formulario
      setFile(null);
      setImportData(null);
      setErrors([]);
      setFileHash('');
      
      console.log('✅ === SISTEMA COMPLETAMENTE LIMPIO ===');
      alert('✅ Sistema limpiado exitosamente.\n\nTodos los datos han sido eliminados.\nAhora puede importar nuevos datos sin problemas.');
      
      // Recargar la página para asegurar estado limpio
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  // Función para calcular hash del archivo
  const calculateFileHash = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  // Verificar si el archivo ya fue importado
  const checkDuplicateFile = (hash: string, fileName: string): boolean => {
    return importHistory.some(entry => 
      entry.fileHash === hash || 
      (entry.fileName === fileName && entry.status === 'success')
    );
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsProcessing(true);
    setErrors([]);
    setImportData(null);

    try {
      console.log('📁 Procesando archivo:', selectedFile.name, selectedFile.size, 'bytes');
      
      // Calcular hash del archivo
      const hash = await calculateFileHash(selectedFile);
      setFileHash(hash);
      console.log('🔐 Hash del archivo calculado:', hash.substring(0, 16) + '...');

      // Verificar duplicados
      if (checkDuplicateFile(hash, selectedFile.name)) {
        const duplicateEntry = importHistory.find(entry => 
          entry.fileHash === hash || 
          (entry.fileName === selectedFile.name && entry.status === 'success')
        );
        
        throw new Error(
          `⚠️ ARCHIVO DUPLICADO: Este archivo ya fue importado el ${new Date(duplicateEntry!.date).toLocaleDateString()} ` +
          `por ${duplicateEntry!.importedBy}. No se permite importar el mismo archivo dos veces.`
        );
      }

      let data: ImportData;

      if (selectedFile.name.endsWith('.html') || selectedFile.name.endsWith('.htm')) {
        console.log('📄 Procesando archivo HTML...');
        const text = await selectedFile.text();
        data = parseHTMLFile(text);
      } else if (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')) {
        console.log('📊 Procesando archivo Excel...');
        data = await parseExcelFile(selectedFile);
      } else {
        throw new Error('Formato de archivo no soportado. Use archivos HTML o Excel.');
      }

      console.log('✅ Datos procesados exitosamente:', data);

      const validation = validateImportData(data);
      if (!validation.isValid) {
        setErrors(validation.errors);
      } else {
        setImportData(data);
        console.log('🎉 Datos validados exitosamente:', {
          indicators: data.indicators.length,
          activities: data.activities.length,
          risks: data.risks.length
        });
      }
    } catch (error) {
      console.error('❌ Error procesando archivo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error procesando el archivo';
      setErrors([errorMessage]);
      
      // Agregar entrada de error al historial
      const errorEntry: ImportHistoryEntry = {
        id: Date.now().toString(),
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileHash: fileHash || 'unknown',
        date: new Date().toISOString(),
        type: selectedFile.name.endsWith('.html') ? 'HTML' : 'Excel',
        indicatorsCount: 0,
        activitiesCount: 0,
        risksCount: 0,
        status: 'error',
        errorMessage: errorMessage,
        importedBy: user?.name || 'Usuario desconocido',
        importedByRole: user?.role || 'unknown',
        areas: []
      };
      
      setImportHistory(prev => [errorEntry, ...prev]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = () => {
    if (!importData || !file) return;

    console.log('=== 🚀 INICIANDO IMPORTACIÓN ROBUSTA ===');
    console.log('📊 Datos a importar:', importData);
    console.log('📈 Indicadores actuales:', indicators.length);
    console.log('⚠️ Riesgos actuales:', risks.length);
    
    // 🆕 CREAR INDICADORES CON ACTIVIDADES CORRECTAMENTE ASOCIADAS
    const newIndicators = importData.indicators.map((ind, index) => {
      const indicatorId = `ind-${Date.now()}-${index}`;
      
      // 🔧 ASOCIAR ACTIVIDADES DE FORMA MÁS INTELIGENTE
      // Calcular cuántas actividades corresponden a este indicador
      const activitiesPerIndicator = Math.ceil(importData.activities.length / importData.indicators.length);
      const startIndex = index * activitiesPerIndicator;
      const endIndex = Math.min(startIndex + activitiesPerIndicator, importData.activities.length);
      
      // Tomar las actividades correspondientes a este indicador
      const indicatorActivities = importData.activities.slice(startIndex, endIndex).map((act, actIndex) => ({
        ...act,
        id: `act-${indicatorId}-${actIndex}`,
        indicatorId: indicatorId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      console.log(`📋 Indicador ${index + 1}: "${ind.name}" con ${indicatorActivities.length} actividades`);

      return {
        ...ind,
        id: indicatorId,
        activities: indicatorActivities,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });

    // Si hay actividades sobrantes, crear indicadores adicionales
    const remainingActivities = importData.activities.slice(newIndicators.length * Math.ceil(importData.activities.length / importData.indicators.length));
    
    if (remainingActivities.length > 0) {
      console.log(`📋 Creando indicadores adicionales para ${remainingActivities.length} actividades restantes`);
      
      remainingActivities.forEach((act, index) => {
        const indicatorId = `ind-activity-${Date.now()}-${index}`;
        const activityIndicator: Indicator = {
          id: indicatorId,
          name: `Indicador para: ${act.name}`,
          area: act.area,
          target: 100,
          actual: act.progress,
          measurementDate: act.startDate,
          responsible: act.responsible,
          status: act.status === 'completed' ? 'achieved' : 
                 act.status === 'in_progress' ? 'at_risk' : 'critical',
          observations: `Indicador generado automáticamente para la actividad: ${act.name}`,
          activities: [{
            ...act,
            id: `act-${indicatorId}-0`,
            indicatorId: indicatorId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        newIndicators.push(activityIndicator);
      });
    }
    
    // Crear riesgos con IDs únicos
    const newRisks = importData.risks.map((risk, index) => ({
      ...risk,
      id: `risk-${Date.now()}-${index}`,
      exposure: calculateRiskExposure(risk.impact, risk.probability),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    
    console.log('📊 === RESUMEN DE IMPORTACIÓN ===');
    console.log(`📈 Indicadores finales: ${newIndicators.length}`);
    console.log(`📋 Total de actividades: ${newIndicators.reduce((acc, ind) => acc + ind.activities.length, 0)}`);
    console.log(`⚠️ Riesgos finales: ${newRisks.length}`);
    
    // Verificar que cada indicador tenga al menos una actividad
    const indicatorsWithoutActivities = newIndicators.filter(ind => ind.activities.length === 0);
    if (indicatorsWithoutActivities.length > 0) {
      console.warn(`⚠️ ADVERTENCIA: ${indicatorsWithoutActivities.length} indicadores sin actividades`);
      
      // Agregar actividad por defecto a indicadores sin actividades
      indicatorsWithoutActivities.forEach(ind => {
        const defaultActivity = {
          id: `act-default-${ind.id}`,
          name: `Actividad por defecto para ${ind.name}`,
          indicatorId: ind.id,
          area: ind.area,
          status: 'in_progress' as const,
          progress: 50,
          startDate: ind.measurementDate,
          estimatedEndDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          responsible: ind.responsible,
          observations: 'Actividad generada automáticamente durante la importación',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        ind.activities = [defaultActivity];
        console.log(`✅ Actividad por defecto agregada a: ${ind.name}`);
      });
    }
    
    // Actualizar el estado con los nuevos datos
    const updatedIndicators = [...indicators, ...newIndicators];
    const updatedRisks = [...risks, ...newRisks];
    
    console.log('💾 Estado final del sistema:');
    console.log(`📊 Total indicadores: ${updatedIndicators.length}`);
    console.log(`📋 Total actividades: ${updatedIndicators.reduce((acc, ind) => acc + ind.activities.length, 0)}`);
    console.log(`⚠️ Total riesgos: ${updatedRisks.length}`);
    
    // Llamar a las funciones de cambio
    onIndicatorsChange(updatedIndicators);
    onRisksChange(updatedRisks);
    
    // Actualizar timestamp del sistema
    localStorage.setItem('systemLastUpdate', new Date().toISOString());
    
    // Obtener áreas afectadas por esta importación
    const affectedAreas = [...new Set([
      ...newIndicators.map(ind => ind.area),
      ...newRisks.map(risk => risk.area)
    ])];
    
    // Agregar al historial de importaciones exitosas
    const newHistoryEntry: ImportHistoryEntry = {
      id: Date.now().toString(),
      fileName: file.name,
      fileSize: file.size,
      fileHash: fileHash,
      date: new Date().toISOString(),
      type: file.name.endsWith('.html') ? 'HTML' : 'Excel',
      indicatorsCount: newIndicators.length,
      activitiesCount: newIndicators.reduce((acc, ind) => acc + ind.activities.length, 0),
      risksCount: newRisks.length,
      status: 'success',
      importedBy: user?.name || 'Usuario desconocido',
      importedByRole: user?.role || 'unknown',
      areas: affectedAreas
    };
    
    setImportHistory(prev => [newHistoryEntry, ...prev]);
    
    // Reset form
    setFile(null);
    setImportData(null);
    setErrors([]);
    setFileHash('');
    
    console.log('🎉 === IMPORTACIÓN COMPLETADA EXITOSAMENTE ===');
    alert(`🎉 ¡Importación exitosa!\n\n📊 ${newIndicators.length} indicadores\n📋 ${newHistoryEntry.activitiesCount} actividades\n⚠️ ${newRisks.length} riesgos\n\nTodas las actividades están correctamente asociadas a sus indicadores.`);
  };

  const calculateRiskExposure = (impact: string, probability: string): number => {
    const impactValues = { bajo: 1, medio: 2, alto: 3 };
    const probabilityValues = { baja: 1, media: 2, alta: 3 };
    
    return impactValues[impact as keyof typeof impactValues] * 
           probabilityValues[probability as keyof typeof probabilityValues];
  };

  const resetForm = () => {
    setFile(null);
    setImportData(null);
    setErrors([]);
    setFileHash('');
  };

  const canDeleteHistoryEntry = (entry: ImportHistoryEntry): boolean => {
    if (user?.role === 'admin') {
      return true;
    }
    
    if (user?.role === 'area_manager') {
      const entryAreas = entry.areas || [];
      return entryAreas.length > 0 && entryAreas.every(area => area === user.area);
    }
    
    return false;
  };

  const deleteHistoryEntry = (entryId: string) => {
    const entry = importHistory.find(e => e.id === entryId);
    if (!entry) return;

    if (!canDeleteHistoryEntry(entry)) {
      alert('❌ No tiene permisos para eliminar esta entrada del historial. Solo puede eliminar datos de su área asignada.');
      return;
    }

    const entryAreas = entry.areas || [];
    if (window.confirm(`¿Está seguro de eliminar esta entrada del historial?\n\nArchivo: ${entry.fileName}\nÁreas afectadas: ${entryAreas.join(', ')}`)) {
      setImportHistory(prev => prev.filter(e => e.id !== entryId));
      console.log('🗑️ Entrada del historial eliminada:', entryId);
    }
  };

  const deleteImportedData = (entryId: string) => {
    if (user?.role !== 'admin') {
      alert('❌ Solo el administrador puede eliminar datos cargados del sistema.');
      return;
    }

    const entry = importHistory.find(e => e.id === entryId);
    if (!entry || entry.status !== 'success') {
      alert('❌ No se puede eliminar datos de una importación fallida.');
      return;
    }

    const entryAreas = entry.areas || [];
    const confirmMessage = `⚠️ ELIMINACIÓN DE DATOS CARGADOS ⚠️

¿Está seguro de eliminar TODOS los datos importados de este archivo?

Archivo: ${entry.fileName}
Fecha: ${new Date(entry.date).toLocaleDateString()}
Indicadores: ${entry.indicatorsCount}
Actividades: ${entry.activitiesCount}
Riesgos: ${entry.risksCount}
Áreas afectadas: ${entryAreas.join(', ')}

⚠️ ESTA ACCIÓN NO SE PUEDE DESHACER ⚠️

Los datos se eliminarán permanentemente del sistema.`;

    if (window.confirm(confirmMessage)) {
      console.log('🗑️ Iniciando eliminación de datos importados:', entry);
      
      const importDate = new Date(entry.date);
      const importDateStr = importDate.toISOString().split('T')[0];
      
      const filteredIndicators = indicators.filter(indicator => {
        const indicatorDate = new Date(indicator.createdAt).toISOString().split('T')[0];
        return indicatorDate !== importDateStr;
      });
      
      const filteredRisks = risks.filter(risk => {
        const riskDate = new Date(risk.createdAt).toISOString().split('T')[0];
        return riskDate !== importDateStr;
      });
      
      onIndicatorsChange(filteredIndicators);
      onRisksChange(filteredRisks);
      
      setImportHistory(prev => prev.map(h => 
        h.id === entryId 
          ? { ...h, status: 'error' as const, errorMessage: 'Datos eliminados por el administrador' }
          : h
      ));
      
      console.log('✅ Datos eliminados exitosamente');
      alert(`✅ Datos eliminados exitosamente.\n\nIndicadores eliminados: ${indicators.length - filteredIndicators.length}\nRiesgos eliminados: ${risks.length - filteredRisks.length}`);
    }
  };

  const clearAllHistory = () => {
    if (user?.role !== 'admin') {
      alert('❌ Solo el administrador puede limpiar todo el historial.');
      return;
    }

    if (window.confirm('¿Está seguro de eliminar todo el historial de importaciones?\n\n⚠️ Esta acción no eliminará los datos, solo el historial de importaciones.')) {
      setImportHistory([]);
      localStorage.removeItem('importHistory');
      console.log('🗑️ Historial de importaciones limpiado completamente');
    }
  };

  const downloadTemplate = (type: 'excel' | 'html') => {
    if (type === 'excel') {
      alert('Descargando plantilla Excel...');
    } else {
      alert('Descargando plantilla HTML...');
    }
  };

  const canImport = user?.role === 'admin' || user?.role === 'area_manager' || user?.role === 'analyst';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Importación de Datos</h1>
          <p className="text-gray-600 mt-1">
            Carga masiva de indicadores, actividades y riesgos desde archivos Excel o HTML
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <History className="w-4 h-4" />
            <span>Historial ({importHistory.length})</span>
          </button>
          
          {user?.role === 'admin' && (
            <>
              <button
                onClick={() => setShowDataManagement(!showDataManagement)}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Shield className="w-4 h-4" />
                <span>Gestión de Datos</span>
              </button>
              
              <button
                onClick={handleCompleteReset}
                className="flex items-center space-x-2 px-4 py-2 bg-red-800 text-white rounded-lg hover:bg-red-900 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Limpiar Sistema</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Debug Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">Estado del Sistema</h3>
        <div className="text-sm text-blue-800 grid grid-cols-2 gap-4">
          <div>
            <p>• Indicadores actuales: {indicators.length}</p>
            <p>• Actividades totales: {indicators.reduce((acc, ind) => acc + (ind.activities?.length || 0), 0)}</p>
          </div>
          <div>
            <p>• Riesgos actuales: {risks.length}</p>
            <p>• Usuario: {user?.name} ({user?.role})</p>
          </div>
        </div>
        <div className="mt-2 text-xs text-blue-700">
          <p>• Última actualización: {localStorage.getItem('systemLastUpdate') ? 
            new Date(localStorage.getItem('systemLastUpdate')!).toLocaleString() : 'Nunca'}</p>
          <p>• Importaciones realizadas: {importHistory.filter(h => h.status === 'success').length}</p>
        </div>
      </div>

      {/* 🆕 ALERTA DE LIMPIEZA COMPLETA */}
      {user?.role === 'admin' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <RefreshCw className="w-6 h-6 text-red-600" />
            <div>
              <h2 className="text-xl font-semibold text-red-900">🧹 Limpieza Completa del Sistema</h2>
              <p className="text-red-700 text-sm">Herramienta para eliminar todos los datos y empezar desde cero</p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-red-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">¿Cuándo usar esta función?</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium text-gray-900">Datos inconsistentes o corruptos</p>
                  <p className="text-gray-600">Cuando hay problemas con la carga de actividades o datos duplicados</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium text-gray-900">Actividades no se cargan correctamente</p>
                  <p className="text-gray-600">Cuando los indicadores aparecen pero las actividades no se muestran</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium text-gray-900">Empezar con datos frescos</p>
                  <p className="text-gray-600">Para garantizar una importación limpia sin conflictos</p>
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Importante:</strong> Esta acción eliminará TODOS los datos del sistema. 
                Asegúrese de tener respaldos de sus archivos originales antes de proceder.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Data Management Section - Solo para administradores */}
      {user?.role === 'admin' && showDataManagement && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="w-6 h-6 text-red-600" />
            <div>
              <h2 className="text-xl font-semibold text-red-900">Gestión de Datos del Sistema</h2>
              <p className="text-red-700 text-sm">Solo disponible para administradores</p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-red-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Acciones Disponibles:</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium text-gray-900">Eliminar datos de importaciones específicas</p>
                  <p className="text-gray-600">Use el botón "Eliminar Datos" en el historial para eliminar permanentemente los datos de una importación específica.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium text-gray-900">Limpiar historial completo</p>
                  <p className="text-gray-600">Elimina el registro de todas las importaciones (no elimina los datos, solo el historial).</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium text-gray-900">Limpieza completa del sistema</p>
                  <p className="text-gray-600">Elimina TODOS los datos y deja el sistema completamente limpio para empezar desde cero.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import History */}
      {showHistory && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Historial de Importaciones
              </h2>
              {importHistory.length > 0 && user?.role === 'admin' && (
                <button
                  onClick={clearAllHistory}
                  className="flex items-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Limpiar Todo</span>
                </button>
              )}
            </div>
            
            {importHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Archivo</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Áreas</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Fecha</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-900">Datos</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-900">Estado</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Importado por</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-900">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {importHistory.map((entry) => {
                      const entryAreas = entry.areas || [];
                      return (
                        <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-2">
                              <FileText className="w-4 h-4 text-gray-400" />
                              <div>
                                <span className="font-medium text-gray-900">{entry.fileName}</span>
                                <p className="text-xs text-gray-500">
                                  {(entry.fileSize / 1024).toFixed(1)} KB • {entry.type}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex flex-wrap gap-1">
                              {entryAreas.map(area => (
                                <span key={area} className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                  {area}
                                </span>
                              ))}
                              {entryAreas.length === 0 && (
                                <span className="text-xs text-gray-500">Sin áreas</span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-gray-700">
                              {new Date(entry.date).toLocaleDateString()}
                            </span>
                            <p className="text-xs text-gray-500">
                              {new Date(entry.date).toLocaleTimeString()}
                            </p>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <div className="text-xs space-y-1">
                              <div>📊 {entry.indicatorsCount} ind.</div>
                              <div>📋 {entry.activitiesCount} act.</div>
                              <div>⚠️ {entry.risksCount} riesgos</div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <div className="flex items-center justify-center">
                              {entry.status === 'success' ? (
                                <div className="flex items-center space-x-1 text-green-600">
                                  <CheckCircle className="w-4 h-4" />
                                  <span className="text-sm font-medium">Exitoso</span>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-1 text-red-600">
                                  <AlertCircle className="w-4 h-4" />
                                  <span className="text-sm font-medium">Error</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div>
                              <span className="text-sm text-gray-700">{entry.importedBy}</span>
                              <p className="text-xs text-gray-500">{entry.importedByRole}</p>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              {entry.errorMessage && (
                                <button
                                  onClick={() => alert(entry.errorMessage)}
                                  className="p-1 text-red-600 hover:text-red-800 transition-colors"
                                  title="Ver error"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              )}
                              
                              {canDeleteHistoryEntry(entry) && (
                                <button
                                  onClick={() => deleteHistoryEntry(entry.id)}
                                  className="p-1 text-gray-600 hover:text-red-600 transition-colors"
                                  title="Eliminar entrada del historial"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                              
                              {user?.role === 'admin' && entry.status === 'success' && (
                                <button
                                  onClick={() => deleteImportedData(entry.id)}
                                  className="p-1 text-red-600 hover:text-red-800 transition-colors"
                                  title="Eliminar datos cargados (Solo Admin)"
                                >
                                  <Shield className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No hay importaciones registradas</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Import Section */}
      {canImport && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Cargar Archivo</h2>
          
          {!file && (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Arrastra tu archivo aquí
              </h3>
              <p className="text-gray-600 mb-4">
                o haz clic para seleccionar un archivo
              </p>
              <input
                type="file"
                accept=".html,.htm,.xlsx,.xls"
                onChange={handleFileInput}
                className="hidden"
                id="file-input"
              />
              <label
                htmlFor="file-input"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
              >
                <FileText className="w-4 h-4 mr-2" />
                Seleccionar Archivo
              </label>
              <p className="text-sm text-gray-500 mt-4">
                Formatos soportados: HTML, Excel (.xlsx, .xls)
              </p>
            </div>
          )}

          {isProcessing && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Procesando archivo...</p>
            </div>
          )}

          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                  <h4 className="font-medium text-red-800">Errores encontrados:</h4>
                </div>
                <button onClick={resetForm} className="text-red-600 hover:text-red-800">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {importData && errors.length === 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  <h4 className="font-medium text-green-800">Archivo procesado exitosamente</h4>
                </div>
                <button onClick={resetForm} className="text-green-600 hover:text-green-800">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="text-sm text-green-700 space-y-1">
                <p>• {importData.indicators.length} indicadores encontrados</p>
                <p>• {importData.activities.length} actividades encontradas</p>
                <p>• {importData.risks.length} riesgos encontrados</p>
                {importData.activities.length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium">✅ Actividades detectadas y serán asociadas correctamente:</p>
                    <ul className="list-disc list-inside ml-4 text-xs">
                      {importData.activities.slice(0, 5).map((activity, index) => (
                        <li key={index}>{activity.name} - {activity.status} ({activity.progress}%)</li>
                      ))}
                      {importData.activities.length > 5 && (
                        <li>... y {importData.activities.length - 5} más</li>
                      )}
                    </ul>
                  </div>
                )}
                {importData.risks.length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium">Riesgos detectados:</p>
                    <ul className="list-disc list-inside ml-4 text-xs">
                      {importData.risks.slice(0, 3).map((risk, index) => (
                        <li key={index}>{risk.name} - {risk.impact}/{risk.probability}</li>
                      ))}
                      {importData.risks.length > 3 && (
                        <li>... y {importData.risks.length - 3} más</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
              <div className="mt-4">
                <button
                  onClick={handleImport}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Confirmar Importación
                </button>
              </div>
            </div>
          )}

          {file && !isProcessing && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className="w-5 h-5 text-gray-600 mr-2" />
                  <div>
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-600">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <button onClick={resetForm} className="text-gray-600 hover:text-gray-800">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Import Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Instrucciones de Importación y Permisos
            </h3>
            <div className="text-blue-800 space-y-2">
              <p>• <strong>Formatos soportados:</strong> Excel (.xlsx, .xls) y HTML (.html, .htm)</p>
              <p>• <strong>Estructura requerida:</strong> Utiliza las plantillas proporcionadas para garantizar compatibilidad</p>
              <p>• <strong>Datos extraídos:</strong> Indicadores KPI, actividades y gestión de riesgos</p>
              <p>• <strong>Validación automática:</strong> El sistema verificará la integridad de los datos antes de importar</p>
              <p>• <strong>Duplicados:</strong> Se evitará la importación de archivos duplicados automáticamente</p>
              <p>• <strong>Persistencia:</strong> Los datos se mantienen al refrescar la página o reiniciar el sistema</p>
              <p>• <strong>Historial:</strong> Se mantiene un registro completo de todas las importaciones realizadas</p>
              <p>• <strong>🆕 Asociación robusta:</strong> Las actividades se asocian correctamente a sus indicadores</p>
              
              <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                <p className="font-semibold text-blue-900 mb-2">🔒 Control de Permisos:</p>
                <ul className="text-sm space-y-1">
                  <li>• <strong>Administrador:</strong> Puede eliminar cualquier dato y gestionar todo el historial</li>
                  <li>• <strong>Responsable de Área:</strong> Solo puede eliminar datos de su área asignada</li>
                  <li>• <strong>Analista:</strong> Puede importar datos pero no eliminar del historial</li>
                  <li>• <strong>Consultor:</strong> Solo visualización, sin permisos de importación</li>
                </ul>
              </div>
              
              <div className="mt-4 p-3 bg-green-100 rounded-lg">
                <p className="font-semibold text-green-900 mb-2">🆕 Mejoras en esta versión:</p>
                <ul className="text-sm space-y-1">
                  <li>• <strong>Asociación inteligente:</strong> Las actividades se distribuyen equitativamente entre indicadores</li>
                  <li>• <strong>Verificación robusta:</strong> Se garantiza que cada indicador tenga al menos una actividad</li>
                  <li>• <strong>Limpieza completa:</strong> Función para eliminar todos los datos y empezar desde cero</li>
                  <li>• <strong>Detección de inconsistencias:</strong> El sistema detecta y corrige problemas automáticamente</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Templates Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Plantilla Excel</h3>
              <p className="text-sm text-gray-600">Formato estructurado para carga masiva</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="text-sm text-gray-700">
              <p><strong>Incluye:</strong></p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Hoja "Indicadores" con campos requeridos</li>
                <li>Hoja "Actividades" para tareas asociadas</li>
                <li>Hoja "Riesgos" para gestión de riesgos</li>
                <li>Validaciones y formatos predefinidos</li>
              </ul>
            </div>
            
            <button
              onClick={() => downloadTemplate('excel')}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Descargar Plantilla Excel</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Plantilla HTML</h3>
              <p className="text-sm text-gray-600">Para reportes web estructurados</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="text-sm text-gray-700">
              <p><strong>Incluye:</strong></p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Estructura de tablas HTML válida</li>
                <li>Campos identificados por clases CSS</li>
                <li>Soporte para KPIs, actividades y riesgos</li>
                <li>Ejemplo completo funcional</li>
              </ul>
            </div>
            
            <button
              onClick={() => downloadTemplate('html')}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Descargar Plantilla HTML</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};