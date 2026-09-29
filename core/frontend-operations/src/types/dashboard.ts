/** Contagem por chave — formato comum aos três endpoints do painel. */
export interface CountByKey {
  key: string;
  total: number;
}

export interface DashboardSummary {
  open: number;
  total: number;
  byStatus: CountByKey[];
  /** Todas as ocorrências do recorte. */
  byPriority: CountByKey[];
  /** Apenas as ainda em aberto — é o que indica o que exige atenção (RF-OP-10). */
  openByPriority: CountByKey[];
  byType: CountByKey[];
}

/**
 * Chave que a API usa para as ocorrências ainda sem prioridade, que existem
 * entre o registro e a triagem. Não é valor da enumeração `Priority`: é uma
 * chave do painel, e por isso não tem rótulo em `GET /metadata/internal`.
 */
export const NO_PRIORITY_KEY = 'SEM_PRIORIDADE';
