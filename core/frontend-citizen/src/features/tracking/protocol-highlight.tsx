import { CopyProtocol } from './copy-protocol';

/**
 * O protocolo como **elemento de maior destaque** da tela (RF-CID-25).
 *
 * Em fonte monoespaçada e com quebra permitida: o número é longo e precisa caber
 * em 320 px sem estourar o layout nem virar uma linha ilegível.
 */
export function ProtocolHighlight({ protocolNumber }: { protocolNumber: string }) {
  return (
    <div className="rounded-lg border-2 border-success bg-success-soft p-5">
      <p className="text-sm font-semibold text-ink">Seu número de protocolo</p>

      <p className="mt-2 break-all font-mono text-3xl font-bold leading-tight text-ink">
        {protocolNumber}
      </p>

      <div className="mt-4">
        <CopyProtocol protocolNumber={protocolNumber} />
      </div>
    </div>
  );
}
