/**
 * Aviso de que o comentário de uma mudança de situação fica público.
 *
 * A API marca **toda** transição de situação como visível ao cidadão, para que
 * o acompanhamento por protocolo mostre o andamento do atendimento. A
 * consequência é que o texto digitado aqui não é interno — e, ao contrário do
 * registro de andamento, não há escolha a fazer.
 *
 * O `RF-OP-37` pede o aviso no andamento com visibilidade escolhida; este caso
 * não estava previsto, e é o mais fácil de errar justamente por não ter caixa
 * nenhuma para marcar.
 */
export function PublicCommentWarning() {
  return (
    <p className="mt-1.5 text-xs text-warning">
      Este comentário aparecerá na consulta pública por protocolo — toda mudança de situação é
      visível ao cidadão. Não inclua dado pessoal nem informação de uso interno.
    </p>
  );
}
