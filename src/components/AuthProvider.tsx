'use client';

import React, { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter, usePathname } from 'next/navigation';

/**
 * AuthProvider — Inicializador silencioso de sesión.
 * 
 * DISEÑO DE ACCESO:
 * - El mapa principal (/) es PÚBLICO. Cualquiera puede verlo sin login.
 * - Los gestores/admins inician sesión voluntariamente desde el botón en la UI.
 * - Las rutas /admin/* sí requieren login (protegidas en sus propios layouts).
 * - Si alguien está logueado y va a /login, lo manda de vuelta.
 */
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore((state) => state.initialize);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const pathname = usePathname();

  // Inicializar sesión de Supabase al montar
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Solo redirigir si ya está logueado y está en /login
  // (No redirigir usuarios anónimos — el mapa es público)
  useEffect(() => {
    if (isInitialized && user && pathname === '/login') {
      router.push('/');
    }
  }, [isInitialized, user, pathname, router]);

  // Mostrar pantalla de carga solo en rutas que requieren auth (/admin/*)
  // Para rutas públicas, renderizar inmediatamente sin esperar
  if (!isInitialized && pathname?.startsWith('/admin')) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid var(--border-color)',
            borderTopColor: 'var(--accent)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Verificando acceso...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
