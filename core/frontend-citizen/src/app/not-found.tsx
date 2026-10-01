import Link from 'next/link';

export default function NotFound() {
  return (
    <section aria-labelledby="nao-encontrada" className="rounded-lg border border-border bg-surface p-5">
      <h1 id="nao-encontrada" className="text-xl font-bold">
        Página não encontrada
      </h1>
      <p className="mt-3 text-ink-muted">
        O endereço que você acessou não existe ou foi alterado.
      </p>
      <Link
        href="/"
        className="mt-5 inline-flex items-center rounded-md bg-brand px-4 py-2 font-semibold text-white"
      >
        Voltar ao início
      </Link>
    </section>
  );
}
