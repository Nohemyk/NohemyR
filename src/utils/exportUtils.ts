import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';
import { Indicator, Activity, Risk } from '../types';
import { areas } from '../data/mockData';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export const exportToPDF = async (data: Indicator[], title: string = 'Reporte de Indicadores') => {
  const pdf = new jsPDF();
  
  // Header
  pdf.setFontSize(20);
  pdf.text(title, 20, 20);
  pdf.setFontSize(12);
  pdf.text(`Generado el: ${new Date().toLocaleDateString()}`, 20, 30);
  
  // Table data
  const tableData = data.map(indicator => {
    const area = areas.find(a => a.id === indicator.area);
    return [
      indicator.name,
      area?.name || '',
      `${indicator.target}%`,
      `${indicator.actual}%`,
      `${Math.round((indicator.actual / indicator.target) * 100)}%`,
      indicator.status === 'achieved' ? 'Cumplido' : 
      indicator.status === 'at_risk' ? 'En Riesgo' : 
      indicator.status === 'in_progress' ? 'En Progreso' : 'Crítico',
      indicator.responsible
    ];
  });
  
  pdf.autoTable({
    head: [['Indicador', 'Área', 'Meta', 'Real', 'Cumplimiento', 'Estado', 'Responsable']],
    body: tableData,
    startY: 40,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [37, 99, 235] },
  });
  
  pdf.save(`${title.toLowerCase().replace(/\s+/g, '-')}.pdf`);
};

export const exportToExcel = (data: Indicator[], filename: string = 'indicadores') => {
  const worksheetData = data.map(indicator => {
    const area = areas.find(a => a.id === indicator.area);
    return {
      'Indicador': indicator.name,
      'Área': area?.name || '',
      'Meta': indicator.target,
      'Real': indicator.actual,
      'Cumplimiento (%)': Math.round((indicator.actual / indicator.target) * 100),
      'Estado': indicator.status === 'achieved' ? 'Cumplido' : 
               indicator.status === 'at_risk' ? 'En Riesgo' : 
               indicator.status === 'in_progress' ? 'En Progreso' : 'Crítico',
      'Responsable': indicator.responsible,
      'Fecha de Medición': indicator.measurementDate,
      'Observaciones': indicator.observations,
    };
  });
  
  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Indicadores');
  
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${filename}.xlsx`);
};

export const exportActivitiesToExcel = (activities: Activity[], filename: string = 'actividades') => {
  const worksheetData = activities.map(activity => {
    const area = areas.find(a => a.id === activity.area);
    return {
      'Actividad': activity.name,
      'Área': area?.name || '',
      'Estado': activity.status === 'pending' ? 'Pendiente' :
               activity.status === 'in_progress' ? 'En Curso' : 'Finalizada',
      'Progreso (%)': activity.progress,
      'Fecha Inicio': activity.startDate,
      'Fecha Fin Estimada': activity.estimatedEndDate,
      'Fecha Fin Real': activity.actualEndDate || '',
      'Responsable': activity.responsible,
      'Observaciones': activity.observations,
    };
  });
  
  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Actividades');
  
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${filename}.xlsx`);
};

export const exportRisksToExcel = (risks: Risk[], filename: string = 'riesgos') => {
  const worksheetData = risks.map(risk => {
    const area = areas.find(a => a.id === risk.area);
    return {
      'Riesgo': risk.name,
      'Área': area?.name || '',
      'Categoría': risk.category,
      'Impacto': risk.impact,
      'Probabilidad': risk.probability,
      'Exposición': risk.exposure,
      'Estado': risk.status === 'active' ? 'Activo' :
               risk.status === 'monitoring' ? 'Monitoreo' : 'Mitigado',
      'Plan de Mitigación': risk.mitigationPlan,
      'Estado Mitigación': risk.mitigationStatus === 'pending' ? 'Pendiente' :
                          risk.mitigationStatus === 'in_progress' ? 'En Progreso' : 'Completado',
      'Responsable': risk.responsible,
    };
  });
  
  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Riesgos');
  
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${filename}.xlsx`);
};

// Función mejorada para esperar a que los gráficos se rendericen
const waitForCharts = async (timeout = 3000): Promise<void> => {
  return new Promise((resolve) => {
    let attempts = 0;
    const maxAttempts = 30; // 3 segundos máximo
    
    const checkCharts = () => {
      const canvasElements = document.querySelectorAll('canvas');
      const hasCharts = canvasElements.length > 0;
      
      if (hasCharts || attempts >= maxAttempts) {
        console.log(`📊 Gráficos detectados: ${canvasElements.length} canvas elements`);
        resolve();
      } else {
        attempts++;
        setTimeout(checkCharts, 100);
      }
    };
    
    checkCharts();
  });
};

// Función mejorada para capturar gráficos individuales
const captureChart = async (selector: string, title: string): Promise<{ canvas: HTMLCanvasElement; title: string } | null> => {
  try {
    console.log(`🎯 Intentando capturar: ${selector} - ${title}`);
    
    const element = document.querySelector(selector);
    if (!element) {
      console.warn(`❌ No se encontró el elemento: ${selector}`);
      return null;
    }

    // Verificar si hay canvas dentro del elemento
    const canvasElements = element.querySelectorAll('canvas');
    console.log(`📊 Canvas encontrados en ${selector}: ${canvasElements.length}`);

    // Esperar un momento adicional para que el gráfico se renderice
    await new Promise(resolve => setTimeout(resolve, 1000));

    const canvas = await html2canvas(element as HTMLElement, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: element.clientWidth,
      height: element.clientHeight,
      onclone: (clonedDoc) => {
        // Asegurar que los canvas clonados mantengan su contenido
        const originalCanvases = element.querySelectorAll('canvas');
        const clonedCanvases = clonedDoc.querySelectorAll('canvas');
        
        originalCanvases.forEach((originalCanvas, index) => {
          if (clonedCanvases[index]) {
            const clonedCanvas = clonedCanvases[index] as HTMLCanvasElement;
            const originalContext = (originalCanvas as HTMLCanvasElement).getContext('2d');
            const clonedContext = clonedCanvas.getContext('2d');
            
            if (originalContext && clonedContext) {
              clonedCanvas.width = originalCanvas.width;
              clonedCanvas.height = originalCanvas.height;
              clonedContext.drawImage(originalCanvas as HTMLCanvasElement, 0, 0);
            }
          }
        });
      }
    });

    console.log(`✅ Gráfico capturado exitosamente: ${title} (${canvas.width}x${canvas.height})`);
    return { canvas, title };
  } catch (error) {
    console.error(`❌ Error capturando gráfico ${title}:`, error);
    return null;
  }
};

// Función alternativa para capturar canvas directamente
const captureCanvasDirectly = async (title: string): Promise<{ canvas: HTMLCanvasElement; title: string } | null> => {
  try {
    const canvasElements = document.querySelectorAll('canvas');
    console.log(`🎯 Capturando canvas directamente. Encontrados: ${canvasElements.length}`);
    
    if (canvasElements.length === 0) {
      console.warn('❌ No se encontraron elementos canvas');
      return null;
    }

    // Crear un canvas combinado con todos los gráficos
    const combinedCanvas = document.createElement('canvas');
    const ctx = combinedCanvas.getContext('2d');
    
    if (!ctx) {
      console.error('❌ No se pudo obtener el contexto del canvas');
      return null;
    }

    // Configurar el tamaño del canvas combinado
    const canvasWidth = 800;
    const canvasHeight = 600;
    combinedCanvas.width = canvasWidth;
    combinedCanvas.height = canvasHeight;
    
    // Fondo blanco
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Dibujar cada canvas en el canvas combinado
    let currentY = 20;
    const maxCanvasHeight = 250;
    
    for (let i = 0; i < Math.min(canvasElements.length, 4); i++) {
      const canvas = canvasElements[i] as HTMLCanvasElement;
      
      if (canvas.width > 0 && canvas.height > 0) {
        // Calcular dimensiones manteniendo proporción
        const aspectRatio = canvas.width / canvas.height;
        let drawWidth = canvasWidth - 40;
        let drawHeight = drawWidth / aspectRatio;
        
        if (drawHeight > maxCanvasHeight) {
          drawHeight = maxCanvasHeight;
          drawWidth = drawHeight * aspectRatio;
        }
        
        const drawX = (canvasWidth - drawWidth) / 2;
        
        // Verificar que no se salga del canvas
        if (currentY + drawHeight <= canvasHeight - 20) {
          ctx.drawImage(canvas, drawX, currentY, drawWidth, drawHeight);
          currentY += drawHeight + 20;
          console.log(`✅ Canvas ${i + 1} agregado al canvas combinado`);
        }
      }
    }

    console.log(`✅ Canvas combinado creado exitosamente: ${title}`);
    return { canvas: combinedCanvas, title };
  } catch (error) {
    console.error(`❌ Error capturando canvas directamente:`, error);
    return null;
  }
};

export const generateExecutiveReport = async (indicators: Indicator[], selectedArea: string, risks: Risk[] = []) => {
  console.log('🚀 Iniciando generación de reporte ejecutivo...');
  
  const pdf = new jsPDF();
  
  // Header
  pdf.setFontSize(24);
  pdf.text('Reporte Ejecutivo', 20, 20);
  pdf.setFontSize(16);
  pdf.text('VP Tecnología - Sistema de Indicadores', 20, 30);
  
  const area = areas.find(a => a.id === selectedArea);
  if (area && selectedArea !== 'all') {
    pdf.setFontSize(14);
    pdf.text(`Área: ${area.name}`, 20, 40);
  }
  
  pdf.setFontSize(12);
  pdf.text(`Generado el: ${new Date().toLocaleDateString()}`, 20, selectedArea !== 'all' ? 50 : 40);
  
  // KPIs Summary
  const startY = selectedArea !== 'all' ? 60 : 50;
  pdf.setFontSize(16);
  pdf.text('Resumen Ejecutivo', 20, startY);
  
  const totalIndicators = indicators.length;
  const achieved = indicators.filter(i => i.status === 'achieved').length;
  const atRisk = indicators.filter(i => i.status === 'at_risk').length;
  const critical = indicators.filter(i => i.status === 'critical').length;
  const inProgress = indicators.filter(i => i.status === 'in_progress').length;
  const avgCompliance = totalIndicators > 0 ? Math.round(indicators.reduce((acc, ind) => acc + (ind.actual / ind.target * 100), 0) / totalIndicators) : 0;
  
  // Estadísticas de actividades
  const allActivities = indicators.flatMap(ind => ind.activities);
  const totalActivities = allActivities.length;
  const completedActivities = allActivities.filter(a => a.status === 'completed').length;
  const inProgressActivities = allActivities.filter(a => a.status === 'in_progress').length;
  
  // Estadísticas de riesgos
  const totalRisks = risks.length;
  const activeRisks = risks.filter(r => r.status === 'active').length;
  const highRisks = risks.filter(r => r.exposure >= 6).length;
  
  pdf.setFontSize(12);
  pdf.text('INDICADORES:', 20, startY + 15);
  pdf.text(`• Total: ${totalIndicators}`, 25, startY + 25);
  pdf.text(`• Cumplidos: ${achieved} (${totalIndicators > 0 ? Math.round((achieved/totalIndicators)*100) : 0}%)`, 25, startY + 35);
  pdf.text(`• En Progreso: ${inProgress} (${totalIndicators > 0 ? Math.round((inProgress/totalIndicators)*100) : 0}%)`, 25, startY + 45);
  pdf.text(`• En Riesgo: ${atRisk} (${totalIndicators > 0 ? Math.round((atRisk/totalIndicators)*100) : 0}%)`, 25, startY + 55);
  pdf.text(`• Críticos: ${critical} (${totalIndicators > 0 ? Math.round((critical/totalIndicators)*100) : 0}%)`, 25, startY + 65);
  pdf.text(`• Cumplimiento Promedio: ${avgCompliance}%`, 25, startY + 75);
  
  pdf.text('ACTIVIDADES:', 20, startY + 90);
  pdf.text(`• Total: ${totalActivities}`, 25, startY + 100);
  pdf.text(`• Completadas: ${completedActivities} (${totalActivities > 0 ? Math.round((completedActivities/totalActivities)*100) : 0}%)`, 25, startY + 110);
  pdf.text(`• En Progreso: ${inProgressActivities} (${totalActivities > 0 ? Math.round((inProgressActivities/totalActivities)*100) : 0}%)`, 25, startY + 120);
  
  pdf.text('RIESGOS:', 20, startY + 135);
  pdf.text(`• Total: ${totalRisks}`, 25, startY + 145);
  pdf.text(`• Activos: ${activeRisks} (${totalRisks > 0 ? Math.round((activeRisks/totalRisks)*100) : 0}%)`, 25, startY + 155);
  pdf.text(`• Alto Riesgo: ${highRisks} (${totalRisks > 0 ? Math.round((highRisks/totalRisks)*100) : 0}%)`, 25, startY + 165);
  
  // Detailed table
  if (indicators.length > 0) {
    const tableData = indicators.map(indicator => {
      const indicatorArea = areas.find(a => a.id === indicator.area);
      return [
        indicator.name.length > 25 ? indicator.name.substring(0, 25) + '...' : indicator.name,
        indicatorArea?.code || '',
        `${indicator.target}%`,
        `${indicator.actual}%`,
        `${Math.round((indicator.actual / indicator.target) * 100)}%`,
        indicator.status === 'achieved' ? 'Cumplido' : 
        indicator.status === 'at_risk' ? 'En Riesgo' : 
        indicator.status === 'in_progress' ? 'En Progreso' : 'Crítico'
      ];
    });
    
    pdf.autoTable({
      head: [['Indicador', 'Área', 'Meta', 'Real', '%', 'Estado']],
      body: tableData,
      startY: startY + 180,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [37, 99, 235] },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 20 },
        2: { cellWidth: 20 },
        3: { cellWidth: 20 },
        4: { cellWidth: 20 },
        5: { cellWidth: 30 }
      }
    });
  }

  // Capturar y agregar gráficos
  try {
    console.log('📊 Esperando a que los gráficos se rendericen...');
    await waitForCharts();
    
    console.log('🎯 Iniciando captura de gráficos para PDF...');
    
    // Estrategia 1: Intentar capturar gráficos por selectores específicos
    const chartSelectors = [
      { selector: '[data-chart="area-performance"]', title: 'Rendimiento por Área' },
      { selector: '[data-chart="indicators-performance"]', title: 'Cumplimiento de Indicadores' },
      { selector: '[data-chart="status-distribution"]', title: 'Distribución por Estado' },
      { selector: '[data-chart="performance-matrix"]', title: 'Matriz de Rendimiento' }
    ];

    const capturedCharts = [];
    
    for (const { selector, title } of chartSelectors) {
      const result = await captureChart(selector, title);
      if (result) {
        capturedCharts.push(result);
        console.log(`✅ Gráfico capturado: ${title}`);
      }
    }

    // Estrategia 2: Si no se capturaron gráficos, intentar captura directa de canvas
    if (capturedCharts.length === 0) {
      console.log('🔄 Intentando captura directa de canvas...');
      const directCapture = await captureCanvasDirectly('Gráficos del Dashboard');
      if (directCapture) {
        capturedCharts.push(directCapture);
        console.log('✅ Captura directa exitosa');
      }
    }

    // Estrategia 3: Capturar toda la grilla de gráficos
    if (capturedCharts.length === 0) {
      console.log('🔄 Intentando capturar grilla completa...');
      const gridCapture = await captureChart('.charts-grid', 'Dashboard Completo');
      if (gridCapture) {
        capturedCharts.push(gridCapture);
        console.log('✅ Grilla completa capturada');
      }
    }

    // Si se capturaron gráficos, agregarlos al PDF
    if (capturedCharts.length > 0) {
      pdf.addPage();
      pdf.setFontSize(16);
      pdf.text('Gráficos de Análisis', 20, 20);
      
      let currentY = 30;
      const maxWidth = 170;
      const maxHeight = 120;
      
      for (const { canvas, title } of capturedCharts) {
        // Calcular dimensiones manteniendo proporción
        const aspectRatio = canvas.width / canvas.height;
        let imgWidth = maxWidth;
        let imgHeight = imgWidth / aspectRatio;
        
        if (imgHeight > maxHeight) {
          imgHeight = maxHeight;
          imgWidth = imgHeight * aspectRatio;
        }
        
        // Verificar si cabe en la página actual
        if (currentY + imgHeight + 25 > 280) {
          pdf.addPage();
          currentY = 20;
        }
        
        // Agregar título del gráfico
        pdf.setFontSize(12);
        pdf.text(title, 20, currentY);
        currentY += 10;
        
        // Agregar imagen
        const imgData = canvas.toDataURL('image/png', 0.9);
        pdf.addImage(imgData, 'PNG', 20, currentY, imgWidth, imgHeight);
        currentY += imgHeight + 20;
        
        console.log(`📊 Gráfico agregado al PDF: ${title} (${imgWidth}x${imgHeight})`);
      }
      
      console.log(`🎉 Se agregaron ${capturedCharts.length} gráficos al PDF`);
    } else {
      console.warn('⚠️ No se pudieron capturar gráficos. Generando PDF solo con datos.');
      
      // Agregar página con mensaje informativo
      pdf.addPage();
      pdf.setFontSize(16);
      pdf.text('Gráficos de Análisis', 20, 20);
      pdf.setFontSize(12);
      pdf.text('Los gráficos no pudieron ser capturados en este reporte.', 20, 40);
      pdf.text('Para ver los gráficos, consulte el dashboard en línea.', 20, 55);
    }
    
  } catch (error) {
    console.error('❌ Error general capturando gráficos:', error);
  }
  
  pdf.save('reporte-ejecutivo-completo.pdf');
  console.log('📄 PDF generado exitosamente');
};

export const generateAreaReport = async (indicators: Indicator[], selectedArea: string, risks: Risk[] = []) => {
  const area = areas.find(a => a.id === selectedArea);
  const areaName = area?.name || 'Todas las Áreas';
  
  const pdf = new jsPDF();
  
  // Header
  pdf.setFontSize(20);
  pdf.text(`Reporte de Área: ${areaName}`, 20, 20);
  pdf.setFontSize(12);
  pdf.text(`Generado el: ${new Date().toLocaleDateString()}`, 20, 30);
  
  // Filtrar datos por área
  const areaIndicators = selectedArea === 'all' ? indicators : indicators.filter(i => i.area === selectedArea);
  const areaRisks = selectedArea === 'all' ? risks : risks.filter(r => r.area === selectedArea);
  
  // Estadísticas del área
  const totalIndicators = areaIndicators.length;
  const avgCompliance = totalIndicators > 0 ? Math.round(areaIndicators.reduce((acc, ind) => acc + (ind.actual / ind.target * 100), 0) / totalIndicators) : 0;
  
  pdf.setFontSize(14);
  pdf.text('Resumen del Área', 20, 45);
  pdf.setFontSize(12);
  pdf.text(`Indicadores: ${totalIndicators}`, 20, 55);
  pdf.text(`Cumplimiento Promedio: ${avgCompliance}%`, 20, 65);
  pdf.text(`Riesgos: ${areaRisks.length}`, 20, 75);
  
  // Tabla de indicadores
  if (areaIndicators.length > 0) {
    const tableData = areaIndicators.map(indicator => [
      indicator.name,
      `${indicator.target}%`,
      `${indicator.actual}%`,
      `${Math.round((indicator.actual / indicator.target) * 100)}%`,
      indicator.status === 'achieved' ? 'Cumplido' : 
      indicator.status === 'at_risk' ? 'En Riesgo' : 
      indicator.status === 'in_progress' ? 'En Progreso' : 'Crítico'
    ]);
    
    pdf.autoTable({
      head: [['Indicador', 'Meta', 'Real', 'Cumplimiento', 'Estado']],
      body: tableData,
      startY: 85,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [37, 99, 235] },
    });
  }
  
  // Capturar gráficos específicos del área
  try {
    await waitForCharts();
    
    const chartResult = await captureChart('.charts-grid', 'Gráficos del Área');
    if (chartResult) {
      pdf.addPage();
      pdf.setFontSize(16);
      pdf.text(`Gráficos - ${areaName}`, 20, 20);
      
      const imgData = chartResult.canvas.toDataURL('image/png', 0.8);
      const imgWidth = 170;
      const imgHeight = (chartResult.canvas.height * imgWidth) / chartResult.canvas.width;
      
      pdf.addImage(imgData, 'PNG', 20, 30, imgWidth, Math.min(imgHeight, 200));
    }
  } catch (error) {
    console.error('Error capturando gráficos del área:', error);
  }
  
  pdf.save(`reporte-area-${selectedArea}.pdf`);
};

export const exportChartToPNG = async (chartId: string, filename: string = 'chart') => {
  const chartElement = document.getElementById(chartId);
  if (chartElement) {
    const canvas = await html2canvas(chartElement);
    canvas.toBlob((blob) => {
      if (blob) {
        saveAs(blob, `${filename}.png`);
      }
    });
  }
};