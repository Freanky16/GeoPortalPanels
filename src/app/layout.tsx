import type { Metadata } from 'next';
import './globals.css';
import 'maplibre-gl/dist/maplibre-gl.css';
import AuthProvider from '@/components/AuthProvider';

export const metadata: Metadata = {
  title: 'Visor de Paneles Publicitarios — Lima Metropolitana',
  description:
    'Plataforma interactiva de visualización y gestión de elementos de publicidad exterior (EPE) en las vías de Lima Metropolitana. Consulta ubicaciones, tipos, empresas y estado de contratos.',
  keywords: [
    'paneles publicitarios',
    'Lima',
    'publicidad exterior',
    'mapa',
    'EPE',
    'municipalidad',
    'fiscalización',
  ],
  authors: [{ name: 'Equipo de Gestión de Publicidad Exterior' }],
  openGraph: {
    title: 'Visor de Paneles Publicitarios — Lima Metropolitana',
    description:
      'Mapa interactivo con todos los paneles de publicidad exterior de Lima.',
    type: 'website',
    locale: 'es_PE',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" data-theme="light" suppressHydrationWarning>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
