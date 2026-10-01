import type { Metadata } from 'next';
import { TrackForm } from '@/features/tracking/track-form';
import { normalizeProtocol } from '@/lib/protocol';

export const metadata: Metadata = {
  title: 'Acompanhar ocorrência — SISDEC',
  description: 'Consulte a situação de uma ocorrência pelo número de protocolo.',
};

/**
 * Consulta por protocolo (RF-CID-30).
 *
 * Aceita `?protocolo=` para que o caminho vindo da confirmação já chegue com o
 * campo preenchido — quem acabou de registrar não deve ter de copiar o número à mão
 * para a tela seguinte.
 */
export default async function TrackPage({ searchParams }: PageProps<'/acompanhar'>) {
  const { protocolo } = await searchParams;
  const raw = Array.isArray(protocolo) ? protocolo[0] : protocolo;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Acompanhar ocorrência</h1>
        <p className="mt-2 text-ink-muted">
          Informe o número de protocolo que você recebeu ao registrar a ocorrência.
        </p>
      </div>

      <TrackForm initialValue={raw ? normalizeProtocol(raw) : ''} />

      <section
        aria-labelledby="sem-numero"
        className="rounded-lg border border-border bg-surface p-5"
      >
        <h2 id="sem-numero" className="font-bold">
          Não tem o número?
        </h2>
        <p className="mt-2 text-ink-muted">
          Nesta versão o protocolo é a única forma de localizar uma ocorrência, e não há como
          recuperá-lo. Se você o perdeu, registre a ocorrência de novo — a equipe identifica
          registros repetidos do mesmo local.
        </p>
      </section>
    </div>
  );
}
