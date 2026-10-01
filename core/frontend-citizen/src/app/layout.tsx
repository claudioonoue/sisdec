import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SISDEC — Defesa Civil',
  description:
    'Registre e acompanhe reclamações, sugestões e situações de risco junto à Defesa Civil.',
};

/**
 * RNF-CID-10: abordagem *mobile first*. O `viewport` acompanha a largura do
 * aparelho e **não** bloqueia o zoom — limitar `maximumScale` impediria quem
 * precisa ampliar o texto de usar o portal.
 */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {/*
          RNF-CID-15: atalho para o conteúdo, primeiro item do percurso por
          teclado. Visível apenas quando recebe foco.
        */}
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-brand focus:px-4 focus:py-2 focus:text-white"
        >
          Ir para o conteúdo
        </a>

        <SiteHeader />

        {/* O gutter de 16 px vale a partir de 320 px, sem rolagem horizontal. */}
        <main id="conteudo" className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
          {children}
        </main>

        <SiteFooter />
      </body>
    </html>
  );
}
