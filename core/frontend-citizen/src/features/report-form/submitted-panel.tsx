import Link from 'next/link';

/**
 * Estado final do registro **quando as fotos não subiram** (RF-CID-24).
 *
 * O caminho normal vai para `/registrar/confirmacao`, uma rota própria. Este painel
 * existe porque o aviso sobre as fotos não cabe numa query string — passá-lo por
 * parâmetro seria frágil e forjável. O protocolo aparece em destaque de todo modo:
 * uma falha nas fotos não pode custar à pessoa o seu único meio de acompanhar.
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
          Anote este número. Ele é a única forma de consultar o andamento depois, e não há como
          recuperá-lo.
        </p>
      </section>

      {warning ? (
        <p role="alert" className="rounded-md border-2 border-danger bg-danger-soft p-3 text-danger">
          {warning}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Link
          href={`/registrar/confirmacao?protocolo=${encodeURIComponent(protocolNumber)}`}
          className="rounded-md bg-brand px-5 py-2 font-semibold text-white"
        >
          Ver a confirmação e copiar o número
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
