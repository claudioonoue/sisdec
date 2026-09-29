import { Alert } from './alert';

/**
 * Marca uma tela cuja etapa do plano de implementação ainda não foi construída.
 *
 * Existe porque a navegação permanente (RF-OP-60) precisa de destinos válidos
 * desde a etapa O1. Dizer o que falta é melhor do que uma página vazia — e
 * melhor do que esconder o item de navegação, que daria a entender que a seção
 * não existe no produto.
 */
export function PendingStage({ stage, summary }: { stage: string; summary: string }) {
  return (
    <Alert tone="info" title={`Em construção — etapa ${stage}`}>
      {summary}
    </Alert>
  );
}
