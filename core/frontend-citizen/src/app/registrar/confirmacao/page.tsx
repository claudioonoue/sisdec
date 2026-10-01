import type { Metadata } from 'next';
import Link from 'next/link';
import { ProtocolHighlight } from '@/features/tracking/protocol-highlight';
import { looksLikeProtocol, normalizeProtocol } from '@/lib/protocol';

export const metadata: Metadata = {
  title: 'Ocorrência registrada — SISDEC',
  description: 'Guarde o número de protocolo para acompanhar o atendimento.',
};

/**
 * Confirmação do registro (RF-CID-25 a RF-CID-29).
 *
 * O protocolo vem na URL para que a página sobreviva a uma recarga e possa ser
 * impressa ou salva (`RF-CID-29`) — o que não aconteceria se ele vivesse apenas na
 * memória do formulário.
 *
 * Sem protocolo válido, a página não inventa um: diz que não há o que confirmar e
 * oferece os dois caminhos. Chegar aqui sem o número significa, quase sempre, um
 * endereço digitado à mão.
 */
export default async function ConfirmationPage({
  searchParams,
}: PageProps<'/registrar/confirmacao'>) {
  const { protocolo } = await searchParams;
  const raw = Array.isArray(protocolo) ? protocolo[0] : protocolo;
  const protocolNumber = raw ? normalizeProtocol(raw) : '';

  if (!looksLikeProtocol(protocolNumber)) {
    return (
      <section aria-labelledby="sem-protocolo" className="space-y-4">
        <h1 id="sem-protocolo" className="text-2xl font-bold">
          Nada a confirmar nesta página
        </h1>
        <p className="text-ink-muted">
          Esta tela mostra o número de protocolo depois de um registro. Se você acabou de
          registrar uma ocorrência e perdeu o número, não há como recuperá-lo — será preciso
          registrar de novo.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/registrar"
            className="rounded-md bg-brand px-5 py-2 font-semibold text-white"
          >
            Registrar ocorrência
          </Link>
          <Link
            href="/acompanhar"
            className="rounded-md border-2 border-brand px-5 py-2 font-semibold text-brand"
          >
            Acompanhar com um protocolo
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-success">Ocorrência registrada</h1>
        <p className="mt-2 text-ink-muted">
          A sua comunicação foi recebida pela Defesa Civil e será analisada por uma equipe.
        </p>
      </div>

      <ProtocolHighlight protocolNumber={protocolNumber} />

      {/*
        O alerta é o ponto desta tela, não um detalhe: nesta versão o sistema não
        envia avisos, e sem o protocolo não existe nenhum outro caminho de volta
        até a ocorrência (RF-CID-27).
      */}
      <section
        aria-labelledby="guarde"
        className="rounded-lg border-2 border-emergency bg-emergency-soft p-5"
      >
        <h2 id="guarde" className="text-lg font-bold text-emergency">
          Anote este número antes de sair
        </h2>
        <p className="mt-2 text-ink">
          O protocolo é a <strong>única</strong> forma de consultar o andamento. Nesta versão o
          sistema <strong>não envia</strong> avisos por e-mail nem por SMS, e{' '}
          <strong>não há como recuperar</strong> o número depois.
        </p>
        <p className="mt-2 text-ink">
          Guarde-o onde você vai encontrar: uma foto da tela, uma anotação no celular ou um papel.
        </p>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          href={`/acompanhar/${encodeURIComponent(protocolNumber)}`}
          className="rounded-md bg-brand px-5 py-2 font-semibold text-white"
        >
          Ver a situação agora
        </Link>
        <Link
          href="/"
          className="rounded-md border-2 border-brand px-5 py-2 font-semibold text-brand"
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
