import type { UploadLimits } from '@/types/metadata';

/**
 * Redução das fotos no navegador antes do envio (RNF-CID-23).
 *
 * Foto de celular passa de 4 MB com facilidade, e o portal é usado no local da
 * ocorrência, muitas vezes com conexão ruim. Reduzir antes de enviar é o que torna
 * o envio viável — e é feito aqui, no aparelho, porque a banda poupada é a de quem
 * está na rua.
 *
 * As partes que **decidem** algo são funções puras, testáveis sem navegador; o
 * desenho no canvas, que depende de DOM, fica isolado em `compressImage`.
 */

/** Maior lado depois da redução. Suficiente para a equipe avaliar o local. */
export const MAX_SIDE = 1920;

/** Qualidade da recodificação, para os formatos com perda. */
const QUALITY = 0.82;

/**
 * Dimensões de destino, preservando a proporção.
 *
 * Imagem já pequena não é ampliada: aumentar não acrescenta informação e só
 * aumentaria o arquivo.
 */
export function targetDimensions(
  width: number,
  height: number,
  maxSide = MAX_SIDE,
): { width: number; height: number } {
  const longest = Math.max(width, height);

  if (longest <= maxSide || longest === 0) {
    return { width, height };
  }

  const scale = maxSide / longest;
  return {
    width: Math.max(Math.round(width * scale), 1),
    height: Math.max(Math.round(height * scale), 1),
  };
}

/**
 * Decide entre o arquivo reduzido e o original.
 *
 * Mantém o original quando a redução não ajudou — o que acontece com PNG pequeno,
 * em que recodificar chega a aumentar. Enviar um arquivo maior em nome da
 * "compressão" seria o oposto do objetivo.
 *
 * A margem de 5% evita trocar o arquivo por um ganho irrelevante, que só
 * acrescentaria risco de recodificação sem benefício de banda.
 */
export function isWorthCompressing(originalSize: number, compressedSize: number): boolean {
  if (compressedSize <= 0) return false;
  return compressedSize < originalSize * 0.95;
}

/** Verdadeiro quando o arquivo já está dentro do limite e é pequeno o bastante. */
export function alreadySmallEnough(file: { size: number }, limits: UploadLimits): boolean {
  // Metade do limite: abaixo disso o ganho de reduzir não paga o custo de
  // recodificar no aparelho, que em celular antigo não é desprezível.
  return file.size <= (limits.maxSizeMb * 1024 * 1024) / 2;
}

/**
 * Reduz a imagem, devolvendo o original quando não há ganho ou quando algo falha.
 *
 * **Nunca lança**: a compressão é uma otimização, e uma falha dela não pode
 * impedir o registro da ocorrência (RNF-CID-26).
 *
 * O tipo é preservado — JPEG continua JPEG. Trocar o formato faria o arquivo
 * gravado divergir do que o nome diz, e a API decide pelo conteúdo: um `.png` que
 * virasse JPEG seria aceito, mas o registro ficaria confuso de ler.
 */
export async function compressImage(file: File, limits: UploadLimits): Promise<File> {
  if (alreadySmallEnough(file, limits)) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = targetDimensions(bitmap.width, bitmap.height);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) return file;

    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, file.type, QUALITY);
    });

    if (!blob || !isWorthCompressing(file.size, blob.size)) return file;

    return new File([blob], file.name, { type: file.type, lastModified: file.lastModified });
  } catch {
    // Formato que o navegador não decodifica, memória insuficiente, canvas
    // bloqueado: em todos os casos o original segue válido.
    return file;
  }
}
