import type { Metadata } from 'next';
import { EmergencyNotice } from '@/components/emergency-notice';
import { ServiceUnavailable } from '@/components/service-unavailable';
import { fetchPublicMetadata, urgentTypes } from '@/lib/metadata';
import type { ReportTypeOption } from '@/types/metadata';
import { userMessageFor } from '@/lib/api-error';

export const metadata: Metadata = {
  title: 'Orientações — SISDEC',
  description: 'O que fazer em situações de risco e telefones de emergência.',
};

/**
 * Renderizada a cada requisição, e **não** pré-gerada no build.
 *
 * Com a pré-geração, uma API fora do ar no momento do build assava a tela de
 * falha na página — e ela era servida assim por uma hora inteira, mesmo com a API
 * já de volta. Vi isso acontecer. Para um portal público, cuja página de
 * orientações é a que diz quando ligar 199, é um comportamento inaceitável.
 *
 * O custo é baixo: o conteúdo é quase todo estático, e a chamada a `GET /metadata`
 * continua cacheada por uma hora no Data Cache (ver `lib/metadata.ts`), então a
 * renderização por requisição não gera uma viagem à API por visita.
 */
export const dynamic = 'force-dynamic';

/**
 * Página de orientações (RF-CID-03).
 *
 * A lista de situações que exigem ligação imediata **vem da API**, dos tipos
 * marcados como `urgent` em `GET /metadata` (RF-CID-41). Escrevê-la à mão aqui
 * faria esta página divergir do formulário de registro, que usa a mesma marcação
 * para reforçar o aviso — e divergir justamente sobre o que é urgente.
 */
export default async function GuidancePage() {
  let urgentes: ReportTypeOption[];

  // O try envolve **apenas** a busca. Envolver o JSX faria esta página engolir
  // qualquer falha de renderização, que é trabalho do `error.tsx` — e é o que a
  // regra `react-hooks/error-boundaries` cobra.
  try {
    urgentes = urgentTypes(await fetchPublicMetadata());
  } catch (error) {
    // A lista de situações urgentes vem da API; sem ela, a página não pode
    // afirmar o que é urgente. O resto do conteúdo é fixo, mas exibi-lo sem essa
    // lista daria a entender que nada exige ligação imediata.
    return <ServiceUnavailable message={userMessageFor(error)} />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Orientações</h1>

      <EmergencyNotice />

      <section aria-labelledby="ligue-agora" className="rounded-lg border border-border bg-surface p-5">
        <h2 id="ligue-agora" className="text-lg font-bold">
          Situações em que você deve ligar, e não registrar aqui
        </h2>
        <p className="mt-2 text-ink-muted">
          Nestes casos há risco imediato à vida. Ligue primeiro; o registro pode ser feito
          depois.
        </p>
        <ul className="mt-3 list-inside list-disc space-y-1 text-ink">
          {urgentes.map((tipo) => (
            <li key={tipo.value}>{tipo.label}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="o-que-fazer" className="rounded-lg border border-border bg-surface p-5">
        <h2 id="o-que-fazer" className="text-lg font-bold">
          O que fazer antes da chegada da equipe
        </h2>
        <dl className="mt-3 space-y-4">
          <div>
            <dt className="font-semibold">Risco de deslizamento</dt>
            <dd className="text-ink-muted">
              Saia do imóvel e afaste-se da encosta. Rachaduras novas em paredes, portas que
              emperram e água brotando do barranco são sinais de alerta.
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Alagamento</dt>
            <dd className="text-ink-muted">
              Não atravesse áreas alagadas, a pé ou de carro. Desligue a energia do imóvel pelo
              quadro geral, se puder fazê-lo em local seco.
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Fiação ou poste caído</dt>
            <dd className="text-ink-muted">
              Mantenha distância e não toque em nada próximo. Avise quem estiver passando e
              ligue imediatamente.
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Árvore em risco de queda</dt>
            <dd className="text-ink-muted">
              Afaste-se do alcance da copa e não estacione veículos embaixo. Em dia de vento ou
              chuva forte, ligue em vez de esperar.
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Cheiro de gás</dt>
            <dd className="text-ink-muted">
              Não acenda luz, não ligue aparelhos e não use o celular dentro do ambiente. Abra
              as janelas, saia e ligue de fora.
            </dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="como-ajudar" className="rounded-lg border border-border bg-surface p-5">
        <h2 id="como-ajudar" className="text-lg font-bold">
          Como ajudar o atendimento
        </h2>
        <ul className="mt-3 list-inside list-disc space-y-2 text-ink-muted">
          <li>
            Informe o <strong className="text-ink">endereço com ponto de referência</strong> —
            é o que a equipe usa para chegar ao local.
          </li>
          <li>
            Envie <strong className="text-ink">fotos</strong>, se for seguro tirá-las. Elas
            ajudam a avaliar a urgência antes da visita.
          </li>
          <li>
            <strong className="text-ink">Guarde o número de protocolo.</strong> Sem ele não há
            como consultar o andamento depois.
          </li>
          <li>
            Deixar um <strong className="text-ink">telefone</strong> é opcional, mas permite
            que a equipe esclareça dúvidas sobre o local.
          </li>
        </ul>
      </section>
    </div>
  );
}
