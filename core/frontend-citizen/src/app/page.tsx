import Link from 'next/link';
import { EmergencyNotice } from '@/components/emergency-notice';

/**
 * Página inicial (RF-CID-01).
 *
 * Explica o serviço e oferece **dois caminhos**: registrar e acompanhar. Nada
 * mais compete com eles — quem chega aqui quer uma das duas coisas.
 *
 * O aviso de emergência vem **antes** dos dois caminhos, de propósito: se a
 * pessoa está diante de um risco imediato, a informação mais útil da página não
 * é como registrar uma ocorrência (RF-CID-02).
 */
export default function HomePage() {
  return (
    <div className="space-y-6">
      <EmergencyNotice />

      <section aria-labelledby="o-que-e">
        <h1 id="o-que-e" className="text-2xl font-bold">
          Comunique uma situação à Defesa Civil
        </h1>
        <p className="mt-3 text-ink-muted">
          Use este canal para comunicar riscos como alagamentos, deslizamentos, árvores em
          perigo ou estruturas danificadas, e também para enviar reclamações e sugestões.
        </p>
        <p className="mt-2 text-ink-muted">
          <strong className="text-ink">Não é preciso se identificar</strong> nem criar uma conta.
          Ao final, você recebe um número de protocolo para acompanhar o atendimento.
        </p>
      </section>

      <nav aria-label="O que você quer fazer" className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/registrar"
          className="flex flex-col rounded-lg border-2 border-brand bg-brand p-5 text-white hover:bg-brand-strong"
        >
          <span className="text-lg font-bold">Registrar ocorrência</span>
          <span className="mt-1 text-sm">
            Conte o que aconteceu, onde foi e envie fotos, se tiver.
          </span>
        </Link>

        <Link
          href="/acompanhar"
          className="flex flex-col rounded-lg border-2 border-brand bg-surface p-5 text-brand hover:bg-brand-soft"
        >
          <span className="text-lg font-bold">Acompanhar ocorrência</span>
          <span className="mt-1 text-sm text-ink-muted">
            Consulte a situação com o seu número de protocolo.
          </span>
        </Link>
      </nav>

      <section aria-labelledby="como-funciona" className="rounded-lg border border-border bg-surface p-5">
        <h2 id="como-funciona" className="text-lg font-bold">
          Como funciona
        </h2>
        <ol className="mt-3 space-y-3 text-ink-muted">
          <li>
            <strong className="text-ink">1. Você registra.</strong> Informa o que aconteceu, o
            endereço e, se quiser, fotos e seus dados de contato.
          </li>
          <li>
            <strong className="text-ink">2. Recebe um protocolo.</strong> Guarde esse número: ele
            é a forma de consultar o andamento depois.
          </li>
          <li>
            <strong className="text-ink">3. A Defesa Civil analisa.</strong> Uma equipe avalia a
            comunicação, define a urgência e encaminha o atendimento.
          </li>
          <li>
            <strong className="text-ink">4. Você acompanha.</strong> Consulte a situação quando
            quiser, usando o número de protocolo.
          </li>
        </ol>
      </section>
    </div>
  );
}
