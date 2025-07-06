import * as XLSX from 'xlsx';
import { Indicator, Activity, Risk, ImportData } from '../types';

export const parseHTMLFile = (htmlContent: string): ImportData => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  
  const indicators: Omit<Indicator, 'id' | 'activities' | 'createdAt' | 'updatedAt'>[] = [];
  const activities: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>[] = [];
  const risks: Omit<Risk, 'id' | 'createdAt' | 'updatedAt'>[] = [];
  
  // Extraer información general del reporte
  const areaSelect = doc.getElementById('area') as HTMLSelectElement;
  const responsableInput = doc.getElementById('responsable') as HTMLInputElement;
  const periodoInput = doc.getElementById('periodo') as HTMLInputElement;
  const fechaReporteInput = doc.getElementById('fecha-reporte') as HTMLInputElement;
  
  const area = mapAreaFromSelect(areaSelect?.value || 'calidad-funcional');
  const responsable = responsableInput?.value || 'Carlos Mendoza';
  const fechaMedicion = fechaReporteInput?.value || new Date().toISOString().split('T')[0];
  
  console.log('=== 📋 DATOS GENERALES EXTRAÍDOS ===');
  console.log('🏢 Área:', area);
  console.log('👤 Responsable:', responsable);
  console.log('📅 Fecha:', fechaMedicion);
  
  // 1. PROCESAR ACTIVIDADES (14 actividades esperadas)
  const tablaActividades = doc.getElementById('tabla-actividades');
  if (tablaActividades) {
    const filas = tablaActividades.querySelectorAll('tbody tr');
    console.log(`=== 📋 PROCESANDO ${filas.length} ACTIVIDADES ===`);
    
    filas.forEach((fila, index) => {
      const celdas = fila.querySelectorAll('td');
      if (celdas.length >= 6) {
        const numeroCell = celdas[0];
        const actividadInput = celdas[1].querySelector('input') as HTMLInputElement;
        const fechaInicioInput = celdas[2].querySelector('input') as HTMLInputElement;
        const fechaFinInput = celdas[3].querySelector('input') as HTMLInputElement;
        const estadoSelect = celdas[4].querySelector('select') as HTMLSelectElement;
        const progresoInput = celdas[5].querySelector('input') as HTMLInputElement;
        
        if (actividadInput && actividadInput.value.trim()) {
          const numeroActividad = numeroCell.textContent?.trim() || (index + 1).toString();
          const nombreActividad = actividadInput.value.trim();
          const fechaInicio = fechaInicioInput?.value || '2025-04-01';
          const fechaFin = fechaFinInput?.value || '2025-12-31';
          const estadoValue = estadoSelect?.value || 'completada';
          const progreso = parseInt(progresoInput?.value || '100');
          
          const actividad = {
            name: nombreActividad,
            indicatorId: `temp-indicator-activity-${numeroActividad}`,
            area: area,
            status: mapActivityStatus(estadoValue),
            progress: progreso,
            startDate: fechaInicio,
            estimatedEndDate: fechaFin,
            actualEndDate: (estadoValue === 'completada' || estadoValue === 'certificado' || estadoValue === 'produccion') ? fechaFin : undefined,
            responsible: responsable,
            observations: `Actividad ${numeroActividad} del reporte mensual - ${periodoInput?.value || 'Abril 2025'}`,
          };
          
          activities.push(actividad);
          console.log(`✅ Actividad ${numeroActividad}: ${nombreActividad} (${progreso}% - ${estadoValue})`);
        }
      }
    });
  }
  
  // 2. PROCESAR KPIs (7 indicadores de desempeño esperados)
  const tablaKPIs = doc.getElementById('tabla-kpis');
  if (tablaKPIs) {
    const filas = tablaKPIs.querySelectorAll('tbody tr');
    console.log(`=== 📊 PROCESANDO ${filas.length} KPIs ===`);
    
    filas.forEach((fila, index) => {
      const celdas = fila.querySelectorAll('td');
      if (celdas.length >= 5) {
        const kpiSelect = celdas[0].querySelector('select') as HTMLSelectElement;
        const metaInput = celdas[1].querySelector('input') as HTMLInputElement;
        const resultadoInput = celdas[2].querySelector('input') as HTMLInputElement;
        const observacionesInput = celdas[4].querySelector('input') as HTMLInputElement;
        
        if (kpiSelect && metaInput && resultadoInput) {
          const kpiText = kpiSelect.options[kpiSelect.selectedIndex]?.text || `KPI ${index + 1}`;
          const meta = parseNumericValue(metaInput.value);
          const actual = parseNumericValue(resultadoInput.value);
          
          if (meta > 0 && actual >= 0) {
            const cumplimiento = (actual / meta) * 100;
            const status = getStatusFromPercentage(cumplimiento);
            
            const indicator = {
              name: kpiText,
              area: area,
              target: meta,
              actual: actual,
              measurementDate: fechaMedicion,
              responsible: responsable,
              status: status,
              observations: observacionesInput?.value || '',
            };
            
            indicators.push(indicator);
            console.log(`✅ KPI ${index + 1}: ${kpiText} (${actual}/${meta} = ${cumplimiento.toFixed(1)}%)`);
          }
        }
      }
    });
  }
  
  // 3. PROCESAR RIESGOS (4 riesgos de gestión esperados)
  const tablaRiesgos = doc.getElementById('tabla-riesgos');
  if (tablaRiesgos) {
    const filas = tablaRiesgos.querySelectorAll('tbody tr');
    console.log(`=== ⚠️ PROCESANDO ${filas.length} RIESGOS ===`);
    
    filas.forEach((fila, index) => {
      const celdas = fila.querySelectorAll('td');
      if (celdas.length >= 6) {
        const numeroCell = celdas[0];
        const riesgoInput = celdas[1].querySelector('input') as HTMLInputElement;
        const categoriaSelect = celdas[2].querySelector('select') as HTMLSelectElement;
        const impactoSelect = celdas[3].querySelector('select') as HTMLSelectElement;
        const probabilidadSelect = celdas[4].querySelector('select') as HTMLSelectElement;
        const mitigacionInput = celdas[5].querySelector('input') as HTMLInputElement;
        
        if (riesgoInput && riesgoInput.value.trim()) {
          const numeroRiesgo = numeroCell.textContent?.trim() || (index + 1).toString();
          const nombreRiesgo = riesgoInput.value.trim();
          const categoria = categoriaSelect?.value || 'operativo';
          const impacto = impactoSelect?.value || 'medio';
          const probabilidad = probabilidadSelect?.value || 'media';
          const mitigacion = mitigacionInput?.value || '';
          
          // Determinar status basado en impacto y probabilidad
          const riskStatus = getRiskStatus(impacto, probabilidad);
          
          const riesgo = {
            name: nombreRiesgo,
            area: area,
            category: categoria,
            impact: impacto as 'alto' | 'medio' | 'bajo',
            probability: probabilidad as 'alta' | 'media' | 'baja',
            mitigationPlan: mitigacion,
            status: riskStatus,
            responsible: responsable,
          };
          
          risks.push(riesgo);
          console.log(`✅ Riesgo ${numeroRiesgo}: ${nombreRiesgo} (${impacto}/${probabilidad} - ${riskStatus})`);
        }
      }
    });
  }
  
  console.log('=== 🎯 RESUMEN FINAL DE IMPORTACIÓN ===');
  console.log(`📊 Indicadores (KPIs): ${indicators.length}`);
  console.log(`📋 Actividades: ${activities.length}`);
  console.log(`⚠️ Riesgos: ${risks.length}`);
  console.log('==========================================');
  
  return { indicators, activities, risks };
};

export const parseExcelFile = (file: File): Promise<ImportData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const indicators: Omit<Indicator, 'id' | 'activities' | 'createdAt' | 'updatedAt'>[] = [];
        const activities: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>[] = [];
        const risks: Omit<Risk, 'id' | 'createdAt' | 'updatedAt'>[] = [];
        
        // Parse indicators sheet
        if (workbook.SheetNames.includes('Indicadores')) {
          const worksheet = workbook.Sheets['Indicadores'];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          jsonData.forEach((row: any) => {
            indicators.push({
              name: row['Indicador'] || row['Nombre'] || '',
              area: mapAreaFromText(row['Área'] || row['Area'] || ''),
              target: parseFloat(row['Meta'] || row['Target'] || '0'),
              actual: parseFloat(row['Real'] || row['Actual'] || '0'),
              measurementDate: formatDate(row['Fecha'] || row['Fecha de Medición'] || ''),
              responsible: row['Responsable'] || '',
              status: mapStatusFromText(row['Estado'] || row['Status'] || ''),
              observations: row['Observaciones'] || row['Comentarios'] || '',
            });
          });
        }
        
        // Parse activities sheet
        if (workbook.SheetNames.includes('Actividades')) {
          const worksheet = workbook.Sheets['Actividades'];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          jsonData.forEach((row: any) => {
            activities.push({
              name: row['Actividad'] || row['Nombre'] || '',
              indicatorId: row['ID Indicador'] || '',
              area: mapAreaFromText(row['Área'] || row['Area'] || ''),
              status: mapActivityStatusFromText(row['Estado'] || ''),
              progress: parseFloat(row['Progreso'] || row['Progress'] || '0'),
              startDate: formatDate(row['Fecha Inicio'] || ''),
              estimatedEndDate: formatDate(row['Fecha Fin Estimada'] || ''),
              actualEndDate: formatDate(row['Fecha Fin Real'] || ''),
              responsible: row['Responsable'] || '',
              observations: row['Observaciones'] || '',
            });
          });
        }
        
        // Parse risks sheet
        if (workbook.SheetNames.includes('Riesgos')) {
          const worksheet = workbook.Sheets['Riesgos'];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          jsonData.forEach((row: any) => {
            risks.push({
              name: row['Riesgo'] || row['Nombre'] || '',
              area: mapAreaFromText(row['Área'] || row['Area'] || ''),
              category: row['Categoría'] || row['Category'] || 'operativo',
              impact: (row['Impacto'] || row['Impact'] || 'medio').toLowerCase() as 'alto' | 'medio' | 'bajo',
              probability: (row['Probabilidad'] || row['Probability'] || 'media').toLowerCase() as 'alta' | 'media' | 'baja',
              mitigationPlan: row['Plan de Mitigación'] || row['Mitigation Plan'] || '',
              status: 'active' as const,
              responsible: row['Responsable'] || '',
            });
          });
        }
        
        resolve({ indicators, activities, risks });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Error reading file'));
    reader.readAsArrayBuffer(file);
  });
};

// Función para mapear el valor del select de área del HTML
const mapAreaFromSelect = (selectValue: string): string => {
  const mapping: { [key: string]: string } = {
    'calidad-funcional': 'quality',
    'infraestructura': 'infrastructure',
    'desarrollo': 'systems',
    'seguridad': 'infrastructure',
    'soporte': 'systems',
    'bi': 'systems',
    'db': 'infrastructure',
    'redes': 'infrastructure',
    'proyectos': 'projects',
    'procesos': 'projects'
  };
  
  return mapping[selectValue] || 'quality';
};

const mapAreaFromText = (text: string): string => {
  const lowerText = text.toLowerCase();
  if (lowerText.includes('calidad') || lowerText.includes('funcional')) return 'quality';
  if (lowerText.includes('proyecto') || lowerText.includes('proceso')) return 'projects';
  if (lowerText.includes('infraestructura') || lowerText.includes('infra')) return 'infrastructure';
  if (lowerText.includes('sistema') || lowerText.includes('desarrollo')) return 'systems';
  if (lowerText.includes('vp') || lowerText.includes('tecnología')) return 'vp_tech';
  return 'quality'; // default
};

const mapStatusFromText = (text: string): 'achieved' | 'at_risk' | 'critical' => {
  const lowerText = text.toLowerCase();
  if (lowerText.includes('cumplido') || lowerText.includes('achieved') || lowerText.includes('verde')) return 'achieved';
  if (lowerText.includes('riesgo') || lowerText.includes('risk') || lowerText.includes('amarillo')) return 'at_risk';
  if (lowerText.includes('crítico') || lowerText.includes('critical') || lowerText.includes('rojo')) return 'critical';
  return 'at_risk'; // default
};

const mapActivityStatus = (htmlStatus: string): 'pending' | 'in_progress' | 'completed' | 'suspended' | 'postponed' => {
  const statusMap: { [key: string]: 'pending' | 'in_progress' | 'completed' | 'suspended' | 'postponed' } = {
    'pendiente': 'pending',
    'en-progreso': 'in_progress',
    'completada': 'completed',
    'retrasada': 'in_progress',
    'cancelada': 'suspended',
    'certificado': 'completed',
    'produccion': 'completed',
    'suspendida': 'suspended',
    'aplazada': 'postponed'
  };
  
  return statusMap[htmlStatus] || 'completed'; // Default a completed para las actividades del reporte
};

const mapActivityStatusFromText = (text: string): 'pending' | 'in_progress' | 'completed' | 'suspended' | 'postponed' => {
  const lowerText = text.toLowerCase();
  if (lowerText.includes('pendiente') || lowerText.includes('pending')) return 'pending';
  if (lowerText.includes('curso') || lowerText.includes('progress') || lowerText.includes('proceso')) return 'in_progress';
  if (lowerText.includes('finalizada') || lowerText.includes('completed') || lowerText.includes('terminada')) return 'completed';
  if (lowerText.includes('suspendida') || lowerText.includes('suspended')) return 'suspended';
  if (lowerText.includes('aplazada') || lowerText.includes('postponed') || lowerText.includes('diferida')) return 'postponed';
  return 'pending'; // default
};

const getRiskStatus = (impact: string, probability: string): 'active' | 'mitigated' | 'monitoring' => {
  if ((impact === 'alto' && probability === 'alta') || 
      (impact === 'alto' && probability === 'media')) {
    return 'active'; // Riesgo crítico
  } else if (impact === 'medio' || probability === 'media') {
    return 'monitoring'; // Riesgo en monitoreo
  } else {
    return 'mitigated'; // Riesgo bajo
  }
};

const parseNumericValue = (value: string): number => {
  if (!value) return 0;
  // Remover símbolos como % y convertir a número
  const cleanValue = value.replace(/[%$,]/g, '').trim();
  const parsed = parseFloat(cleanValue);
  return isNaN(parsed) ? 0 : parsed;
};

const getStatusFromPercentage = (percentage: number): 'achieved' | 'at_risk' | 'critical' => {
  if (percentage >= 90) return 'achieved';
  if (percentage >= 80) return 'at_risk';
  return 'critical';
};

const formatDate = (dateStr: string): string => {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  
  // Try to parse different date formats
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }
  
  return new Date().toISOString().split('T')[0];
};

export const validateImportData = (data: ImportData): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Validate indicators
  data.indicators.forEach((indicator, index) => {
    if (!indicator.name) errors.push(`Indicador ${index + 1}: Nombre requerido`);
    if (!indicator.area) errors.push(`Indicador ${index + 1}: Área requerida`);
    if (indicator.target <= 0) errors.push(`Indicador ${index + 1}: Meta debe ser mayor a 0`);
    if (!indicator.responsible) errors.push(`Indicador ${index + 1}: Responsable requerido`);
  });
  
  // Validate activities
  data.activities.forEach((activity, index) => {
    if (!activity.name) errors.push(`Actividad ${index + 1}: Nombre requerido`);
    if (!activity.area) errors.push(`Actividad ${index + 1}: Área requerida`);
    if (!activity.responsible) errors.push(`Actividad ${index + 1}: Responsable requerido`);
  });
  
  // Validate risks
  data.risks.forEach((risk, index) => {
    if (!risk.name) errors.push(`Riesgo ${index + 1}: Nombre requerido`);
    if (!risk.area) errors.push(`Riesgo ${index + 1}: Área requerida`);
    if (!risk.responsible) errors.push(`Riesgo ${index + 1}: Responsable requerido`);
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};