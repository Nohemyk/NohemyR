import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Indicator, Activity, Risk } from '../types';
import { useSupabaseAuth } from './useSupabaseAuth';

export const useSupabaseData = () => {
  const { user, isAuthenticated } = useSupabaseAuth();
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [risks, setRisks] = useState<Risk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Función para convertir datos de Supabase a formato de la app
  const convertSupabaseIndicator = (dbIndicator: any, activities: any[]): Indicator => {
    return {
      id: dbIndicator.id,
      name: dbIndicator.name,
      area: dbIndicator.area,
      target: dbIndicator.target,
      actual: dbIndicator.actual,
      measurementDate: dbIndicator.measurement_date,
      responsible: dbIndicator.responsible,
      status: dbIndicator.status,
      observations: dbIndicator.observations,
      activities: activities.map(convertSupabaseActivity),
      createdAt: dbIndicator.created_at,
      updatedAt: dbIndicator.updated_at,
    };
  };

  const convertSupabaseActivity = (dbActivity: any): Activity => {
    return {
      id: dbActivity.id,
      name: dbActivity.name,
      indicatorId: dbActivity.indicator_id,
      area: dbActivity.area,
      status: dbActivity.status,
      progress: dbActivity.progress,
      startDate: dbActivity.start_date,
      estimatedEndDate: dbActivity.estimated_end_date,
      actualEndDate: dbActivity.actual_end_date,
      responsible: dbActivity.responsible,
      observations: dbActivity.observations,
      createdAt: dbActivity.created_at,
      updatedAt: dbActivity.updated_at,
    };
  };

  const convertSupabaseRisk = (dbRisk: any): Risk => {
    return {
      id: dbRisk.id,
      name: dbRisk.name,
      area: dbRisk.area,
      category: dbRisk.category,
      impact: dbRisk.impact,
      probability: dbRisk.probability,
      exposure: dbRisk.exposure,
      mitigationPlan: dbRisk.mitigation_plan,
      mitigationStatus: dbRisk.mitigation_status,
      status: dbRisk.status,
      responsible: dbRisk.responsible,
      createdAt: dbRisk.created_at,
      updatedAt: dbRisk.updated_at,
    };
  };

  // Cargar datos desde Supabase
  const loadData = async () => {
    if (!isAuthenticated || !user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Construir filtros basados en el rol del usuario
      let indicatorQuery = supabase.from('indicators').select('*');
      let activityQuery = supabase.from('activities').select('*');
      let riskQuery = supabase.from('risks').select('*');

      // Aplicar filtros por área si no es admin
      if (user.role !== 'admin' && user.area) {
        indicatorQuery = indicatorQuery.eq('area', user.area);
        activityQuery = activityQuery.eq('area', user.area);
        riskQuery = riskQuery.eq('area', user.area);
      }

      // Ejecutar consultas
      const [indicatorsResult, activitiesResult, risksResult] = await Promise.all([
        indicatorQuery,
        activityQuery,
        riskQuery,
      ]);

      if (indicatorsResult.error) throw indicatorsResult.error;
      if (activitiesResult.error) throw activitiesResult.error;
      if (risksResult.error) throw risksResult.error;

      // Procesar indicadores con sus actividades
      const processedIndicators = indicatorsResult.data.map(indicator => {
        const indicatorActivities = activitiesResult.data.filter(
          activity => activity.indicator_id === indicator.id
        );
        return convertSupabaseIndicator(indicator, indicatorActivities);
      });

      // Procesar riesgos
      const processedRisks = risksResult.data.map(convertSupabaseRisk);

      setIndicators(processedIndicators);
      setRisks(processedRisks);

      console.log('✅ Datos cargados desde Supabase:', {
        indicators: processedIndicators.length,
        activities: activitiesResult.data.length,
        risks: processedRisks.length,
      });

    } catch (err: any) {
      console.error('❌ Error cargando datos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Guardar indicador
  const saveIndicator = async (indicator: Indicator) => {
    if (!user) throw new Error('Usuario no autenticado');

    try {
      const dbIndicator = {
        id: indicator.id,
        name: indicator.name,
        area: indicator.area,
        target: indicator.target,
        actual: indicator.actual,
        measurement_date: indicator.measurementDate,
        responsible: indicator.responsible,
        status: indicator.status,
        observations: indicator.observations,
        created_by: user.id,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('indicators')
        .upsert(dbIndicator);

      if (error) throw error;

      // Guardar actividades
      for (const activity of indicator.activities) {
        const dbActivity = {
          id: activity.id,
          name: activity.name,
          indicator_id: indicator.id,
          area: activity.area,
          status: activity.status,
          progress: activity.progress,
          start_date: activity.startDate,
          estimated_end_date: activity.estimatedEndDate,
          actual_end_date: activity.actualEndDate,
          responsible: activity.responsible,
          observations: activity.observations,
          created_by: user.id,
          updated_at: new Date().toISOString(),
        };

        const { error: activityError } = await supabase
          .from('activities')
          .upsert(dbActivity);

        if (activityError) throw activityError;
      }

      await loadData(); // Recargar datos
      return { success: true, error: null };

    } catch (err: any) {
      console.error('Error guardando indicador:', err);
      return { success: false, error: err.message };
    }
  };

  // Guardar riesgo
  const saveRisk = async (risk: Risk) => {
    if (!user) throw new Error('Usuario no autenticado');

    try {
      const dbRisk = {
        id: risk.id,
        name: risk.name,
        area: risk.area,
        category: risk.category,
        impact: risk.impact,
        probability: risk.probability,
        exposure: risk.exposure,
        mitigation_plan: risk.mitigationPlan,
        mitigation_status: risk.mitigationStatus,
        status: risk.status,
        responsible: risk.responsible,
        created_by: user.id,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('risks')
        .upsert(dbRisk);

      if (error) throw error;

      await loadData(); // Recargar datos
      return { success: true, error: null };

    } catch (err: any) {
      console.error('Error guardando riesgo:', err);
      return { success: false, error: err.message };
    }
  };

  // Eliminar indicador
  const deleteIndicator = async (indicatorId: string) => {
    try {
      // Primero eliminar actividades
      const { error: activitiesError } = await supabase
        .from('activities')
        .delete()
        .eq('indicator_id', indicatorId);

      if (activitiesError) throw activitiesError;

      // Luego eliminar indicador
      const { error } = await supabase
        .from('indicators')
        .delete()
        .eq('id', indicatorId);

      if (error) throw error;

      await loadData(); // Recargar datos
      return { success: true, error: null };

    } catch (err: any) {
      console.error('Error eliminando indicador:', err);
      return { success: false, error: err.message };
    }
  };

  // Eliminar riesgo
  const deleteRisk = async (riskId: string) => {
    try {
      const { error } = await supabase
        .from('risks')
        .delete()
        .eq('id', riskId);

      if (error) throw error;

      await loadData(); // Recargar datos
      return { success: true, error: null };

    } catch (err: any) {
      console.error('Error eliminando riesgo:', err);
      return { success: false, error: err.message };
    }
  };

  // Cargar datos cuando el usuario se autentica
  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    } else {
      setIndicators([]);
      setRisks([]);
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Configurar suscripciones en tiempo real
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    console.log('🔄 Configurando suscripciones en tiempo real...');

    // Suscripción a cambios en indicadores
    const indicatorsSubscription = supabase
      .channel('indicators-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'indicators',
          filter: user.role === 'admin' ? undefined : `area=eq.${user.area}`
        }, 
        (payload) => {
          console.log('🔄 Cambio en indicadores:', payload);
          loadData();
        }
      )
      .subscribe();

    // Suscripción a cambios en actividades
    const activitiesSubscription = supabase
      .channel('activities-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'activities',
          filter: user.role === 'admin' ? undefined : `area=eq.${user.area}`
        }, 
        (payload) => {
          console.log('🔄 Cambio en actividades:', payload);
          loadData();
        }
      )
      .subscribe();

    // Suscripción a cambios en riesgos
    const risksSubscription = supabase
      .channel('risks-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'risks',
          filter: user.role === 'admin' ? undefined : `area=eq.${user.area}`
        }, 
        (payload) => {
          console.log('🔄 Cambio en riesgos:', payload);
          loadData();
        }
      )
      .subscribe();

    return () => {
      indicatorsSubscription.unsubscribe();
      activitiesSubscription.unsubscribe();
      risksSubscription.unsubscribe();
    };
  }, [isAuthenticated, user]);

  return {
    indicators,
    risks,
    loading,
    error,
    saveIndicator,
    saveRisk,
    deleteIndicator,
    deleteRisk,
    refreshData: loadData,
  };
};