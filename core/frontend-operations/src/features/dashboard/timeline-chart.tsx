import type { CountByKey } from '@/types/dashboard';
import { formatDate } from '@/lib/format';

/**
 * Volume de registros ao longo do tempo (RF-OP-12).
 *
 * Série **única**, então não há legenda — o título da seção já nomeia o que a
 * barra mede, e uma legenda de um item só ocupa espaço sem informar. Pelo mesmo
 * motivo há um só matiz: a cor não distingue nada aqui.
 *
 * Rótulos seletivos: o primeiro dia, o último e o de maior volume. Um número
 * sobre cada barra viraria ruído e se sobreporia no primeiro período longo.
 *
 * O `<title>` de cada barra dá o valor ao passar o ponteiro sem depender de
 * JavaScript, e a tabela ao pé — aberta por um `<details>` — dá o mesmo dado a
 * quem navega por teclado ou leitor de tela, e a quem precisa do número exato
 * (`RNF-OP-31`: nada é transmitido só pela forma ou pela cor).
 */

const CHART_HEIGHT = 160;
const BAR_GAP = 2;
const numberFormat = new Intl.NumberFormat('pt-BR');

function tooltip(point: CountByKey): string {
  const unidade = point.total === 1 ? 'ocorrência' : 'ocorrências';
  return `${formatDate(point.key)}: ${numberFormat.format(point.total)} ${unidade}`;
}

export function TimelineChart({ points }: { points: CountByKey[] }) {
  if (points.length === 0) {
    return <p className="text-sm text-ink-muted">Nenhum registro no período selecionado.</p>;
  }

  const maior = Math.max(...points.map((p) => p.total));
  const larguraBarra = 100 / points.length;
  const indiceMaior = points.findIndex((p) => p.total === maior);

  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 100 ${CHART_HEIGHT}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`Volume diário de ocorrências registradas, de ${formatDate(points[0].key)} a ${formatDate(points.at(-1)!.key)}. Maior volume: ${maior} em um dia.`}
        className="h-40 w-full"
      >
        {/* Linha de base discreta: o eixo é referência, não protagonista. */}
        <line
          x1="0"
          y1={CHART_HEIGHT - 1}
          x2="100"
          y2={CHART_HEIGHT - 1}
          stroke="var(--color-border)"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />

        {points.map((point, index) => {
          const altura = Math.max((point.total / maior) * (CHART_HEIGHT - 12), 2);
          const x = index * larguraBarra;
          const largura = Math.max(larguraBarra - BAR_GAP / 4, 0.4);

          return (
            <rect
              key={point.key}
              x={x}
              y={CHART_HEIGHT - 1 - altura}
              width={largura}
              height={altura}
              rx="0.6"
              fill="var(--color-brand)"
            >
              {/*
                Uma **única** string como filho: o React 19 trata `<title>` como
                elemento especial e descarta o conteúdo quando recebe vários
                filhos, deixando a dica de foco vazia sem quebrar o build.
              */}
              <title>{tooltip(point)}</title>
            </rect>
          );
        })}
      </svg>

      <figcaption className="mt-1 flex justify-between text-xs text-ink-muted">
        <span>{formatDate(points[0].key)}</span>
        <span className="font-medium text-ink">
          máximo: {numberFormat.format(maior)} em {formatDate(points[indiceMaior].key)}
        </span>
        <span>{formatDate(points.at(-1)!.key)}</span>
      </figcaption>

      <details className="mt-3">
        <summary className="cursor-pointer text-xs font-medium text-brand-strong">
          Ver os números do período
        </summary>
        <table className="mt-2 w-full text-sm">
          <caption className="sr-only">
            Ocorrências registradas por dia no período selecionado.
          </caption>
          <thead>
            <tr className="border-b border-border text-left">
              <th scope="col" className="py-1 text-xs font-semibold text-ink-muted">
                Dia
              </th>
              <th scope="col" className="py-1 text-right text-xs font-semibold text-ink-muted">
                Ocorrências
              </th>
            </tr>
          </thead>
          <tbody>
            {points.map((point) => (
              <tr key={point.key} className="border-b border-border last:border-0">
                <td className="py-1 text-ink">{formatDate(point.key)}</td>
                <td className="py-1 text-right tabular-nums text-ink">
                  {numberFormat.format(point.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
