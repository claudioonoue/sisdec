import { STEPS } from './draft';

/**
 * Indicação de progresso (RF-CID-06).
 *
 * Diz a etapa atual **em texto**, e não só por cor ou posição de bolinha
 * (RNF-CID-19). O `aria-live` anuncia a mudança de etapa a quem usa leitor de
 * tela — sem isso, avançar no formulário não produziria nenhum retorno audível
 * (RNF-CID-18).
 */
export function StepProgress({ current }: { current: number }) {
  return (
    <div className="space-y-2">
      <p aria-live="polite" className="text-sm font-semibold text-ink-muted">
        Etapa {current + 1} de {STEPS.length}: {STEPS[current].title}
      </p>

      <ol className="flex gap-1" aria-hidden="true">
        {STEPS.map((step, index) => (
          <li
            key={step.id}
            className={`h-2 flex-1 rounded-full ${
              index <= current ? 'bg-brand' : 'bg-border'
            }`}
          />
        ))}
      </ol>
    </div>
  );
}
