import type { UploadLimits } from '@/types/metadata';

/**
 * Validação local das fotos, contra os limites que a **API** publica em
 * `GET /metadata` (RF-CID-16).
 *
 * Os limites não são repetidos aqui: recusar no navegador um arquivo que a API
 * aceitaria — ou aceitar um que ela recusaria — seria pior do que não validar,
 * porque a pessoa não teria como saber qual das duas regras vale.
 */

export interface PhotoRejection {
  fileName: string;
  reason: string;
}

export interface PhotoSelection {
  accepted: File[];
  rejected: PhotoRejection[];
}

function megabytes(bytes: number): number {
  return bytes / (1024 * 1024);
}

/** Lista os formatos aceitos em texto legível: "JPEG, PNG ou WebP". */
export function describeAcceptedTypes(limits: UploadLimits): string {
  const nomes = limits.acceptedMimeTypes.map((mime) => mime.replace('image/', '').toUpperCase());
  if (nomes.length <= 1) return nomes.join('');
  return `${nomes.slice(0, -1).join(', ')} ou ${nomes[nomes.length - 1]}`;
}

/**
 * Separa as fotos aceitas das recusadas, considerando as que já estavam
 * escolhidas — o limite é por ocorrência, não por seleção.
 */
export function selectPhotos(
  current: File[],
  incoming: File[],
  limits: UploadLimits,
): PhotoSelection {
  const accepted: File[] = [];
  const rejected: PhotoRejection[] = [];

  for (const file of incoming) {
    if (current.length + accepted.length >= limits.maxFiles) {
      rejected.push({
        fileName: file.name,
        reason: `Você já escolheu ${limits.maxFiles} fotos, que é o máximo.`,
      });
      continue;
    }

    if (!limits.acceptedMimeTypes.includes(file.type)) {
      rejected.push({
        fileName: file.name,
        reason: `Este arquivo não é uma imagem ${describeAcceptedTypes(limits)}.`,
      });
      continue;
    }

    if (megabytes(file.size) > limits.maxSizeMb) {
      rejected.push({
        fileName: file.name,
        reason: `A imagem tem mais de ${limits.maxSizeMb} MB. Escolha uma menor.`,
      });
      continue;
    }

    // Duas fotos iguais não acrescentam informação e gastam a conexão de quem
    // está no local da ocorrência.
    const duplicada = [...current, ...accepted].some(
      (escolhida) => escolhida.name === file.name && escolhida.size === file.size,
    );

    if (duplicada) {
      rejected.push({ fileName: file.name, reason: 'Esta foto já foi escolhida.' });
      continue;
    }

    accepted.push(file);
  }

  return { accepted, rejected };
}

/** Tamanho legível, para a lista de fotos escolhidas. */
export function formatFileSize(bytes: number): string {
  const mb = megabytes(bytes);
  if (mb >= 1) return `${mb.toFixed(1).replace('.', ',')} MB`;
  return `${Math.max(Math.round(bytes / 1024), 1)} KB`;
}
