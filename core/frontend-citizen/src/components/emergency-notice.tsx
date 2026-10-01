import { EMERGENCY_PHONES } from '@/lib/emergency';

/**
 * Aviso de acionamento dos telefones de emergência (RF-CID-02).
 *
 * Aparece na página inicial e na de registro, em destaque. Os números são
 * `tel:` para que, no celular, um toque já inicie a chamada — é o caminho mais
 * curto possível para quem está diante de uma emergência de verdade.
 *
 * Não transmite a informação só por cor: traz o rótulo "Emergência" em texto
 * (RNF-CID-19).
 */
export function EmergencyNotice({ compact = false }: { compact?: boolean }) {
  return (
    <aside
      aria-labelledby="aviso-emergencia"
      className="rounded-lg border-2 border-emergency bg-emergency-soft p-4"
    >
      <h2 id="aviso-emergencia" className="text-base font-bold text-emergency">
        Emergência? Ligue agora
      </h2>

      <ul className="mt-3 flex flex-wrap gap-2">
        {EMERGENCY_PHONES.map((phone) => (
          <li key={phone.number}>
            <a
              href={`tel:${phone.dial}`}
              role="button"
              className="flex items-center gap-2 rounded-md bg-emergency px-4 py-2 font-bold text-white hover:bg-emergency/90"
            >
              <span className="text-lg">{phone.number}</span>
              <span className="text-sm font-normal">{phone.who}</span>
            </a>
          </li>
        ))}
      </ul>

      {!compact && (
        <p className="mt-3 text-sm text-ink">
          Este sistema <strong>não substitui</strong> o atendimento emergencial. Use-o para
          comunicar situações que precisam de acompanhamento, não para pedir socorro imediato.
        </p>
      )}
    </aside>
  );
}
