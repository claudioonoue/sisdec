/** Contagem por chave — formato comum aos três endpoints do painel. */
export interface CountByKey {
  key: string;
  total: number;
}

export interface DashboardSummary {
  open: number;
  total: number;
  byStatus: CountByKey[];
  byPriority: CountByKey[];
  byType: CountByKey[];
}
