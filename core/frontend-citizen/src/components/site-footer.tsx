import { EMERGENCY_PHONES } from '@/lib/emergency';

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <div className="mx-auto max-w-3xl px-4 py-6 text-sm text-ink-muted">
        <p>
          <strong className="text-ink">SISDEC</strong> — Sistema Integrado da Defesa Civil.
        </p>
        <p className="mt-2">
          Em emergências, ligue{' '}
          {EMERGENCY_PHONES.map((phone, index) => (
            <span key={phone.number}>
              {index > 0 && ' ou '}
              <a href={`tel:${phone.dial}`} className="font-semibold text-brand underline">
                {phone.number}
              </a>{' '}
              ({phone.who})
            </span>
          ))}
          .
        </p>
      </div>
    </footer>
  );
}
