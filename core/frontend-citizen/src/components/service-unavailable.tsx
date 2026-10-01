import Link from 'next/link';
import { EMERGENCY_PHONES } from '@/lib/emergency';

/**
 * Exibida quando a API não responde (RNF-CID-27).
 *
 * Nunca mostra erro técnico nem deixa a tela em branco, e repete os telefones de
 * emergência — se o sistema está fora do ar e a pessoa tem um risco em mãos, essa
 * é a informação que importa.
 */
export function ServiceUnavailable({ message }: { message: string }) {
  return (
    <section aria-labelledby="fora-do-ar" className="rounded-lg border-2 border-danger bg-danger-soft p-5">
      <h1 id="fora-do-ar" className="text-xl font-bold text-danger">
        Não foi possível carregar esta página
      </h1>
      <p className="mt-3 text-ink">{message}</p>

      <p className="mt-4 text-ink">
        Se for uma emergência, ligue{' '}
        {EMERGENCY_PHONES.map((phone, index) => (
          <span key={phone.number}>
            {index > 0 && ' ou '}
            <a href={`tel:${phone.dial}`} className="font-bold text-danger underline">
              {phone.number}
            </a>{' '}
            ({phone.who})
          </span>
        ))}
        .
      </p>

      <Link
        href="/"
        className="mt-5 inline-flex items-center rounded-md border-2 border-brand px-4 py-2 font-semibold text-brand"
      >
        Voltar ao início
      </Link>
    </section>
  );
}
