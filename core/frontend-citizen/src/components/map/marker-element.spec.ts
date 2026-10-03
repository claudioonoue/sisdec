import { describe, expect, it } from 'vitest';
import {
  MARKER_ANCHOR,
  MARKER_HEIGHT,
  MARKER_WIDTH,
  createMarkerElement,
} from './marker-element';

describe('createMarkerElement', () => {
  it('devolve um SVG, sem depender de arquivo de imagem', () => {
    const svg = createMarkerElement();

    expect(svg.tagName.toLowerCase()).toBe('svg');
    // O defeito que este teste impede: o marcador padrão do Leaflet pede
    // marker-icon.png e marker-shadow.png na raiz do site, onde não existem.
    expect(svg.outerHTML).not.toContain('.png');
    expect(svg.outerHTML).not.toContain('marker-icon');
  });

  it('tem o tamanho que o mapa declara ao Leaflet', () => {
    const svg = createMarkerElement();

    expect(svg.getAttribute('width')).toBe(String(MARKER_WIDTH));
    expect(svg.getAttribute('height')).toBe(String(MARKER_HEIGHT));
  });

  it('ancora pela ponta, na base do alfinete', () => {
    // Ancorar pelo centro faria o ponto marcado ficar acima do lugar tocado.
    expect(MARKER_ANCHOR).toEqual([MARKER_WIDTH / 2, MARKER_HEIGHT]);
  });

  it('usa a cor informada, sem conhecer os tokens do portal', () => {
    const svg = createMarkerElement('#9a1c12');

    expect(svg.querySelector('path')?.getAttribute('fill')).toBe('#9a1c12');
  });

  it('tem contorno branco, para se destacar sobre telhado e vegetação', () => {
    const path = createMarkerElement().querySelector('path');

    expect(path?.getAttribute('stroke')).toBe('#ffffff');
  });

  it('é decorativo para o leitor de tela — a posição é anunciada em texto', () => {
    expect(createMarkerElement().getAttribute('aria-hidden')).toBe('true');
  });

  it('é montado pelo DOM, não por texto HTML', () => {
    const svg = createMarkerElement();

    // Se fosse string, não haveria nós filhos a consultar.
    expect(svg.children.length).toBeGreaterThan(0);
    expect(svg.querySelector('circle')).not.toBeNull();
  });
});
