import type { EnumOption } from '@/types/metadata';

/**
 * Rótulo em pt-BR de um valor de enumeração (RF-OP-57).
 *
 * Mora em módulo próprio, sem nenhuma importação de servidor, porque tanto as
 * telas (servidor) quanto os componentes interativos (navegador) traduzem
 * valores. Deixá-lo em `lib/metadata.ts` arrastaria o cliente HTTP — e com ele
 * a leitura do cookie de sessão — para o pacote entregue ao navegador.
 *
 * Um valor sem rótulo devolve o texto de ausência, nunca o valor em inglês: o
 * agente jamais deve ver `IN_PROGRESS` na tela. Se isso acontecer, o que falta
 * é o rótulo na API — e a marca `—` torna a falta visível em vez de disfarçada.
 */
export function labelFor<TValue extends string>(
  options: readonly EnumOption<TValue>[],
  value: TValue | null | undefined,
  missing = '—',
): string {
  if (!value) return missing;
  return options.find((option) => option.value === value)?.label ?? missing;
}
