import type { Metadata } from 'next';
import { Alert } from '@/components/ui/alert';
import { LoginForm } from '@/features/auth/login-form';
import { safeDestination } from '@/lib/session';

export const metadata: Metadata = {
  title: 'Entrar — SISDEC Operações',
};

/** Motivos de encerramento que a rota `/sair` pode repassar ao login. */
const REASON_MESSAGES: Record<string, string> = {
  expirada: 'A sua sessão expirou. Entre novamente para continuar de onde parou.',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const destination = safeDestination(firstValue(params.destino));
  const reason = firstValue(params.motivo);
  const notice = reason ? REASON_MESSAGES[reason] : undefined;

  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-2xl font-semibold tracking-tight text-ink">SISDEC</p>
          <p className="mt-1 text-sm text-ink-muted">
            Portal de Operações — Defesa Civil
          </p>
        </div>

        <div className="rounded-lg border border-border bg-surface p-6 shadow-sm">
          <h1 className="mb-5 text-lg font-semibold text-ink">Entrar</h1>

          {/* RF-OP-07: quem foi desconectado por expiração sabe por quê. */}
          {notice ? (
            <div className="mb-5">
              <Alert tone="warning">{notice}</Alert>
            </div>
          ) : null}

          <LoginForm destination={destination} />
        </div>

        <p className="mt-6 text-center text-sm text-ink-muted">
          O acesso é restrito aos agentes da Defesa Civil. A senha inicial é fornecida
          pelo administrador do sistema.
        </p>
      </div>
    </div>
  );
}

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
