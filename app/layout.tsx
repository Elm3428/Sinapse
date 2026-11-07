import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Aniel Gestão - Serviços e Almoxarifado',
  description: 'Sistema completo de gestão de serviços, ordens de serviço, controle de insumos com RM por matrícula, aplicação em OS, devolução de sobras e dashboard analítico.',
  openGraph: {
    title: 'Aniel Gestão - Serviços e Almoxarifado',
    description: 'Sistema completo de gestão de serviços, ordens de serviço, controle de insumos com RM por matrícula, aplicação em OS, devolução de sobras e dashboard analítico.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Aniel Gestão - Serviços e Almoxarifado',
    description: 'Sistema completo de gestão de serviços, ordens de serviço, controle de insumos com RM por matrícula, aplicação em OS, devolução de sobras e dashboard analítico.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
