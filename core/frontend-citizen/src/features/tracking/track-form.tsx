'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CONTROL_CLASS, Field } from '@/features/report-form/field';
import { normalizeProtocol, protocolInputError } from '@/lib/protocol';

/**
 * Consulta por protocolo (RF-CID-30, RF-CID-31).
 *
 * O formato é conferido aqui, antes de navegar: assim um número digitado errado dá
 * uma mensagem que diz o que corrigir, em vez de levar a uma tela de "não
 * encontrado" que não distingue erro de digitação de ocorrência inexistente.
 */
export function TrackForm({ initialValue = '' }: { initialValue?: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);

  function submit(event: React.FormEvent) {
    event.preventDefault();

    const found = protocolInputError(value);

    if (found) {
      setError(found);
      return;
    }

    setError(null);
    router.push(`/acompanhar/${encodeURIComponent(normalizeProtocol(value))}`);
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <Field
        id="protocolo"
        label="Número de protocolo"
        error={error ?? undefined}
        hint="Está no formato SISDEC-2026-000123. Maiúsculas e espaços não importam."
      >
        {(props) => (
          <input
            {...props}
            name="protocolo"
            type="text"
            inputMode="text"
            autoComplete="off"
            spellCheck={false}
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              setError(null);
            }}
            placeholder="SISDEC-2026-000123"
            className={`${CONTROL_CLASS} font-mono`}
          />
        )}
      </Field>

      <button
        type="submit"
        className="w-full rounded-md bg-brand px-5 py-3 font-semibold text-white hover:bg-brand-strong sm:w-auto"
      >
        Consultar
      </button>
    </form>
  );
}
