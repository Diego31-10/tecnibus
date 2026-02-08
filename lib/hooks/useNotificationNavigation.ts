import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook que maneja la navegación desde notificaciones
 * Se ejecuta DESPUÉS de que el usuario esté autenticado
 */
export function useNotificationNavigation() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const hasProcessedInitialNotification = useRef(false);

  useEffect(() => {
    // No hacer nada hasta que termine de cargar
    if (loading) return;

    // Solo procesar si hay usuario autenticado
    if (!user || !profile) return;

    console.log('📱 useNotificationNavigation: Configurando listeners');

    // Listener: cuando la app está abierta y el usuario toca una notificación
    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('🔔 Notificación tocada (app abierta):', response);
      handleNotificationNavigation(response.notification.request.content.data);
    });

    // Listener: cuando la app fue abierta DESDE una notificación (cold start)
    if (!hasProcessedInitialNotification.current) {
      Notifications.getLastNotificationResponseAsync().then((response) => {
        if (response) {
          console.log('🔔 Notificación que abrió la app (cold start):', response);
          hasProcessedInitialNotification.current = true;
          // Pequeño delay para asegurar que el router esté listo
          setTimeout(() => {
            handleNotificationNavigation(response.notification.request.content.data);
          }, 100);
        }
      });
    }

    return () => {
      console.log('📱 useNotificationNavigation: Limpiando listeners');
      responseListener.remove();
    };
  }, [user, profile, loading]);

  const handleNotificationNavigation = (data: any) => {
    console.log('🧭 Navegando desde notificación:', data);

    const tipo = data?.tipo;

    // Mapeo de tipos de notificación a rutas
    if (tipo === 'recorrido_iniciado' || tipo === 'recorrido_finalizado') {
      if (profile?.rol === 'padre') {
        router.push('/parent');
      } else if (profile?.rol === 'chofer') {
        router.push('/driver');
      } else if (profile?.rol === 'admin') {
        router.push('/admin');
      }
    }

    // Agregar más tipos de notificaciones aquí según sea necesario
    // Ejemplo: tipo === 'nueva_asistencia' → router.push('/parent')
  };
}
