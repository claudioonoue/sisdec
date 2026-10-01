import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { LocationField } from './location-field';

/**
 * O mapa em si não é montado aqui: o Leaflet depende do DOM de um navegador de
 * verdade, e `next/dynamic` o carrega sob demanda. O que estes testes cobrem é o
 * que **decide** algo — quando a localização é pedida, o que acontece na recusa e
 * o que é dito a quem não vê o marcador.
 */

function montar(props: Partial<Parameters<typeof LocationField>[0]> = {}) {
  const onChange = vi.fn();
  const onClear = vi.fn();

  render(<LocationField value={null} onChange={onChange} onClear={onClear} {...props} />);

  return { onChange, onClear };
}

describe('LocationField', () => {
  const original = globalThis.navigator;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'navigator', { value: original, configurable: true });
  });

  it('deixa claro que o ponto é opcional (RF-CID-13)', () => {
    montar();

    expect(screen.getByText('(opcional)')).toBeDefined();
    expect(screen.getByText(/endereço que você informou acima já/i)).toBeDefined();
  });

  it('não pede a localização ao montar — só por acionamento (RNF-CID-33)', () => {
    const getCurrentPosition = vi.fn();
    Object.defineProperty(globalThis, 'navigator', {
      value: { geolocation: { getCurrentPosition } },
      configurable: true,
    });

    montar();

    expect(getCurrentPosition).not.toHaveBeenCalled();
  });

  it('pede a localização quando a pessoa aciona o botão', () => {
    const getCurrentPosition = vi.fn();
    Object.defineProperty(globalThis, 'navigator', {
      value: { geolocation: { getCurrentPosition } },
      configurable: true,
    });

    montar();
    fireEvent.click(screen.getByRole('button', { name: /minha localização/i }));

    expect(getCurrentPosition).toHaveBeenCalledTimes(1);
  });

  it('devolve o ponto arredondado quando a localização é concedida', () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: {
        geolocation: {
          getCurrentPosition: (ok: (p: unknown) => void) =>
            ok({ coords: { latitude: -23.550512345678, longitude: -46.633398765432 } }),
        },
      },
      configurable: true,
    });

    const { onChange } = montar();
    fireEvent.click(screen.getByRole('button', { name: /minha localização/i }));

    expect(onChange).toHaveBeenCalledWith({ latitude: -23.5505123, longitude: -46.6333988 });
  });

  it('explica a recusa de permissão sem bloquear o formulário (RNF-CID-26)', () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: {
        geolocation: {
          getCurrentPosition: (_ok: unknown, fail: (e: { code: number }) => void) =>
            fail({ code: 1 }),
        },
      },
      configurable: true,
    });

    const { onChange } = montar();
    fireEvent.click(screen.getByRole('button', { name: /minha localização/i }));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('alert').textContent).toMatch(/não autorizou/);
    // O caminho alternativo continua à mão.
    expect(screen.getByText(/Toque no mapa/)).toBeDefined();
  });

  it('explica quando o aparelho não informa a localização, em vez de esconder o botão', () => {
    Object.defineProperty(globalThis, 'navigator', { value: {}, configurable: true });

    montar();
    fireEvent.click(screen.getByRole('button', { name: /minha localização/i }));

    expect(screen.getByRole('alert').textContent).toMatch(/não informou a localização/);
  });

  it('informa em texto que não há ponto marcado (RNF-CID-19)', () => {
    montar();

    expect(screen.getByText('Nenhum ponto marcado.')).toBeDefined();
  });

  it('mostra as coordenadas em texto quando há ponto, para quem usa leitor de tela', () => {
    montar({ value: { latitude: -23.5505123, longitude: -46.6333988 } });

    expect(screen.getByText('-23,55051, -46,63340')).toBeDefined();
  });

  it('oferece remover o ponto só quando existe um', () => {
    montar();
    expect(screen.queryByRole('button', { name: /Remover o ponto/ })).toBeNull();

    const { onClear } = montar({ value: { latitude: -23.55, longitude: -46.63 } });
    fireEvent.click(screen.getByRole('button', { name: /Remover o ponto/ }));
    expect(onClear).toHaveBeenCalled();
  });

  it('não abre o mapa de saída: quem não precisa dele não baixa o Leaflet (RNF-CID-22)', () => {
    montar();

    expect(screen.queryByText(/Toque no mapa/)).toBeNull();
    expect(screen.getByRole('button', { name: /Marcar no mapa/ })).toBeDefined();
  });

  it('abre o mapa já aberto quando o ponto vem preenchido', () => {
    montar({ value: { latitude: -23.55, longitude: -46.63 } });

    expect(screen.getByText(/Toque no mapa/)).toBeDefined();
  });
});
