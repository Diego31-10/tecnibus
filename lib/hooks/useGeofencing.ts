import { useEffect, useRef, useState } from 'react';
import {
  calcularDistancia,
  estaDentroDeGeocerca,
  marcarEntradaGeocerca,
  marcarSalidaGeocerca,
  getSiguienteEstudianteGeocerca,
  type EstudianteGeocerca,
} from '@/lib/services/geocercas.service';

type GeofencingOptions = {
  idAsignacion: string | null;
  idChofer: string;
  recorridoActivo: boolean;
  ubicacionActual: { latitude: number; longitude: number } | null;
  radioMetros?: number;
};

type GeofencingResult = {
  estudianteActual: EstudianteGeocerca | null;
  dentroDeZona: boolean;
  distanciaMetros: number | null;
  loading: boolean;
  marcarCompletadoManual: () => Promise<void>;
};

/**
 * Hook para monitorear geocercas durante el recorrido
 *
 * Detecta entrada/salida de zonas de paradas y gestiona el flujo:
 * 1. Entrada → Notifica padre, muestra panel estudiante
 * 2. Salida → Si no marcó ausente, marca presente automático
 */
export function useGeofencing({
  idAsignacion,
  idChofer,
  recorridoActivo,
  ubicacionActual,
  radioMetros = 100,
}: GeofencingOptions): GeofencingResult {
  const [estudianteActual, setEstudianteActual] = useState<EstudianteGeocerca | null>(null);
  const [dentroDeZona, setDentroDeZona] = useState(false);
  const [distanciaMetros, setDistanciaMetros] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Refs para tracking de estados anteriores
  const estadoAnteriorRef = useRef<{
    dentroDeZona: boolean;
    idEstudiante: string | null;
  }>({
    dentroDeZona: false,
    idEstudiante: null,
  });

  // Cargar estudiante actual al iniciar o cuando cambia el recorrido
  useEffect(() => {
    if (recorridoActivo && idAsignacion) {
      cargarSiguienteEstudiante();
    } else {
      setEstudianteActual(null);
      setDentroDeZona(false);
      setDistanciaMetros(null);
    }
  }, [recorridoActivo, idAsignacion]);

  // Monitorear ubicación y detectar entrada/salida de geocercas
  useEffect(() => {
    if (
      !recorridoActivo ||
      !idAsignacion ||
      !ubicacionActual ||
      !estudianteActual
    ) {
      return;
    }

    const { latitude: latBus, longitude: lonBus } = ubicacionActual;
    const {
      parada_latitud: latParada,
      parada_longitud: lonParada,
      id_estudiante: idEstudiante,
    } = estudianteActual;

    // Calcular distancia
    const distancia = calcularDistancia(latBus, lonBus, latParada, lonParada);
    setDistanciaMetros(distancia);

    // Verificar si está dentro del geocerca
    const dentroAhora = estaDentroDeGeocerca(
      latBus,
      lonBus,
      latParada,
      lonParada,
      radioMetros
    );

    const estadoAnterior = estadoAnteriorRef.current;

    // EVENTO: Entrada a geocerca
    if (dentroAhora && !estadoAnterior.dentroDeZona) {
      console.log('🔔 ENTRADA A GEOCERCA:', {
        estudiante: `${estudianteActual.nombre} ${estudianteActual.apellido}`,
        parada: estudianteActual.parada_nombre,
        distancia: Math.round(distancia),
      });

      handleEntradaGeocerca();
    }

    // EVENTO: Salida de geocerca
    if (!dentroAhora && estadoAnterior.dentroDeZona) {
      console.log('🚶 SALIDA DE GEOCERCA:', {
        estudiante: `${estudianteActual.nombre} ${estudianteActual.apellido}`,
        distancia: Math.round(distancia),
      });

      handleSalidaGeocerca();
    }

    // Actualizar estado anterior
    estadoAnteriorRef.current = {
      dentroDeZona: dentroAhora,
      idEstudiante,
    };

    setDentroDeZona(dentroAhora);
  }, [ubicacionActual, estudianteActual, recorridoActivo, idAsignacion, radioMetros]);

  /**
   * Cargar el siguiente estudiante pendiente
   */
  const cargarSiguienteEstudiante = async () => {
    if (!idAsignacion) return;

    setLoading(true);
    try {
      const siguiente = await getSiguienteEstudianteGeocerca(idAsignacion);
      setEstudianteActual(siguiente);

      if (siguiente) {
        console.log('👤 Siguiente estudiante cargado:', {
          nombre: siguiente.nombreCompleto,
          parada: siguiente.parada_nombre,
          estado: siguiente.estado,
        });
      } else {
        console.log('✅ No hay más estudiantes pendientes');
      }
    } catch (error) {
      console.error('❌ Error cargando siguiente estudiante:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Manejar entrada a geocerca
   */
  const handleEntradaGeocerca = async () => {
    if (!idAsignacion || !estudianteActual || !idChofer) return;

    // Solo marcar entrada si está en estado 'pendiente'
    if (estudianteActual.estado !== 'pendiente') {
      console.log('⚠️ Estudiante no está en estado pendiente, ignorando entrada');
      return;
    }

    try {
      const result = await marcarEntradaGeocerca(
        idAsignacion,
        estudianteActual.id_estudiante,
        idChofer
      );

      if (result.success) {
        console.log('✅ Entrada registrada, notificación enviada al padre');
        // Actualizar estado del estudiante
        setEstudianteActual((prev) =>
          prev ? { ...prev, estado: 'en_zona' } : null
        );
      }
    } catch (error) {
      console.error('❌ Error marcando entrada:', error);
    }
  };

  /**
   * Manejar salida de geocerca (auto-presente si no marcó ausente)
   */
  const handleSalidaGeocerca = async () => {
    if (!idAsignacion || !estudianteActual || !idChofer) return;

    // Solo marcar salida si está 'en_zona'
    if (estudianteActual.estado !== 'en_zona') {
      console.log('⚠️ Estudiante no está en zona, ignorando salida');
      return;
    }

    try {
      const success = await marcarSalidaGeocerca(
        idAsignacion,
        estudianteActual.id_estudiante,
        idChofer
      );

      if (success) {
        console.log('✅ Salida registrada, marcado como presente automáticamente');
        // Cargar siguiente estudiante
        await cargarSiguienteEstudiante();
      }
    } catch (error) {
      console.error('❌ Error marcando salida:', error);
    }
  };

  /**
   * Llamar cuando el chofer marca ausente manualmente
   */
  const marcarCompletadoManual = async () => {
    if (!idAsignacion || !estudianteActual) return;

    console.log('✅ Estudiante marcado manualmente, pasando al siguiente');
    // Cargar siguiente estudiante
    await cargarSiguienteEstudiante();
  };

  return {
    estudianteActual,
    dentroDeZona,
    distanciaMetros,
    loading,
    marcarCompletadoManual,
  };
}
