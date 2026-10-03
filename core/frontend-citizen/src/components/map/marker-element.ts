/**
 * Marcador do ponto da ocorrência, desenhado como SVG.
 *
 * O Leaflet, por padrão, usa imagens (`marker-icon.png`, `marker-shadow.png`) cujo
 * caminho ele tenta descobrir a partir da URL do próprio script. Com o empacotador
 * do Next essa descoberta falha e as imagens são pedidas na raiz do site, onde não
 * existem — eram dois `404` por abertura do mapa, e o marcador não aparecia.
 *
 * Em vez de copiar as imagens para `public/`, o marcador é um `divIcon` com SVG:
 * não há arquivo para servir, nem caminho para o empacotador errar, e a cor
 * acompanha os tokens do portal. É o mesmo caminho adotado no Portal de Operações.
 *
 * O elemento é montado pelo **DOM**, e não por texto HTML, para manter verdadeira a
 * regra de que nada no portal escreve marcação por concatenação (`RNF-CID-35`).
 */

export const MARKER_WIDTH = 32;
export const MARKER_HEIGHT = 44;

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Ponta do alfinete na base, para que ela caia exatamente sobre a coordenada. */
export const MARKER_ANCHOR: [number, number] = [MARKER_WIDTH / 2, MARKER_HEIGHT];

/**
 * Cria o elemento do marcador.
 *
 * `color` entra como texto CSS: o componente não conhece os tokens do portal, e
 * trocar o Leaflet por outro mapa não exigiria mexer na paleta.
 */
export function createMarkerElement(color = '#1d4ed8'): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('width', String(MARKER_WIDTH));
  svg.setAttribute('height', String(MARKER_HEIGHT));
  svg.setAttribute('viewBox', '0 0 32 44');
  // Decorativo: a posição é anunciada em texto, ao lado do mapa.
  svg.setAttribute('aria-hidden', 'true');
  svg.style.display = 'block';
  // A sombra vem de um filtro CSS, e não de uma segunda imagem como no Leaflet:
  // um arquivo a menos para servir.
  svg.style.filter = 'drop-shadow(0 2px 2px rgba(0, 0, 0, 0.4))';

  const pin = document.createElementNS(SVG_NS, 'path');
  pin.setAttribute(
    'd',
    'M16 1C8.8 1 3 6.8 3 14c0 9.4 11.1 27.3 11.6 28.1a1.7 1.7 0 0 0 2.8 0C17.9 41.3 29 23.4 29 14 29 6.8 23.2 1 16 1z',
  );
  pin.setAttribute('fill', color);
  // O contorno branco mantém o marcador visível sobre telhado escuro e sobre
  // vegetação, que é onde boa parte destas ocorrências acontece.
  pin.setAttribute('stroke', '#ffffff');
  pin.setAttribute('stroke-width', '2');

  const hole = document.createElementNS(SVG_NS, 'circle');
  hole.setAttribute('cx', '16');
  hole.setAttribute('cy', '14');
  hole.setAttribute('r', '4.5');
  hole.setAttribute('fill', '#ffffff');

  svg.append(pin, hole);

  return svg;
}
