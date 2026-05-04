import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import MuiThemeProvider from '@/components/MuiThemeProvider';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'WDFinance – Gestione Finanziaria Personale',
  description: 'Traccia spese, guadagni e obiettivi finanziari in modo semplice e intuitivo.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className={inter.variable}>
      <body className="min-h-screen bg-[#0f1117] text-white antialiased">
        <AuthProvider>
          <MuiThemeProvider>
            {children}
          </MuiThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
