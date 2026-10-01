import Link from 'next/link';

/**
 * Estado final do registro, com o protocolo em destaque.
 *
 * A tela dedicada `/registrar/confirmacao`, com botão de copiar e o alerta de
 * guardar o número, é a etapa C4 (RF-CID-25 a RF-CID-29). Aqui o protocolo já
 * aparece em evidência para que o fluxo da etapa C2 esteja completo: concluir o
 * envio sem mostrar o número deixaria a pessoa sem a única forma de acompanhar.
 */
export function SubmittedPanel({
  protocolNumber,
  warning,
}: {
  protocolNumber: string;
  warning?: string | null;
}) {
  return (
    <div className="space-y-5">
      <section
        aria-labelledby="registrada"
        className="rounded-lg border-2 border-success bg-success-soft p-5"
      >
        <h1 id="registrada" className="text-xl font-bold text-success">
          Ocorrência registrada
        </h1>

        <p className="mt-3 text-ink">O seu número de protocolo é:</p>
        <p className="mt-2 break-all font-mono text-2xl font-bold text-ink">{protocolNumber}</p>

        <p className="mt-4 font-semibold text-ink">
          Anote este número. Ele é a única forma de consultar o andamento depois.
        </p>
      </section>

      {warning ? (
        <p role="alert" className="rounded-md border-2 border-danger bg-danger-soft p-3 text-danger">
          {warning}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Link
          href={`/acompanhar?protocolo=${encodeURIComponent(protocolNumber)}`}
          className="rounded-md bg-brand px-5 py-2 font-semibold text-white"
        >
          Acompanhar esta ocorrência
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
