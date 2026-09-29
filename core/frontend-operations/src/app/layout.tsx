import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AppShell } from '@/components/app-shell';
import { ServiceUnavailable } from '@/components/service-unavailable';
import { ApiError, userMessageFor } from '@/lib/api-error';
import { getMetadata } from '@/lib/metadata';
import { getCurrentAgent } from '@/lib/session';
import type { AuthenticatedAgent } from '@/types/agent';
import type { PortalMetadata } from '@/types/metadata';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SISDEC Operações',
  description: 'Portal de operações da Defesa Civil — atendimento de ocorrências.',
};

interface Session {
  agent: AuthenticatedAgent;
  metadata: PortalMetadata;
}

/**
 * A moldura autenticada vive no layout raiz, e não em um grupo de rotas, para
 * que exista **uma** decisão sobre quando a navegação aparece: há sessão, ou não
 * há. O `/login` cai no mesmo layout e simplesmente não recebe a moldura.
 */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let session: Session | null = null;
  let unavailable: string | null = null;

  try {
    const agent = await getCurrentAgent();
    if (agent) {
      // Os rótulos em pt-BR são carregados junto da sessão: sem eles a interface
      // exibiria valores em inglês ao agente, o que o RF-OP-57 proíbe. Preferimos
      // avisar da indisponibilidade a mostrar a tela pela metade.
      session = { agent, metadata: await getMetadata() };
    }
  } catch (error) {
    // Só falha de comunicação com a API vira esta tela. Qualquer outro erro é
    // defeito do portal e deve subir para o limite de erro, onde fica visível.
    if (!(error instanceof ApiError)) throw error;
    unavailable = userMessageFor(error);
  }

  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        {unavailable ? (
          <ServiceUnavailable message={unavailable} />
        ) : session ? (
          <AppShell agent={session.agent} metadata={session.metadata}>
            {children}
          </AppShell>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
