import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CENTER,
  formatCoordinates,
  geolocationMessage,
  isValidCoordinates,
  parseCoordinates,
  roundCoordinates,
} from './coordinates';

describe('validação de coordenadas', () => {
  it('aceita os limites da faixa', () => {
    for (const point of [
      { latitude: -90, longitude: -180 },
      { latitude: 90, longitude: 180 },
      { latitude: 0, longitude: 0 },
    ]) {
      expect(isValidCoordinates(point)).toBe(true);
    }
  });

  it('recusa fora da faixa — é o que a API também recusa', () => {
    for (const point of [
      { latitude: 91, longitude: 0 },
      { latitude: -91, longitude: 0 },
      { latitude: 0, longitude: 181 },
      { latitude: 0, longitude: -181 },
    ]) {
      expect(isValidCoordinates(point)).toBe(false);
    }
  });

  it('recusa NaN e infinito, que vêm de conversão de texto vazio ou inválido', () => {
    for (const point of [
      { latitude: Number.NaN, longitude: 0 },
      { latitude: 0, longitude: Number.POSITIVE_INFINITY },
    ]) {
      expect(isValidCoordinates(point)).toBe(false);
    }
  });

  it('o centro padrão é válido', () => {
    expect(isValidCoordinates(DEFAULT_CENTER)).toBe(true);
  });
});

describe('parseCoordinates', () => {
  it('lê o par guardado como texto', () => {
    expect(parseCoordinates('-23.5505', '-46.6333')).toEqual({
      latitude: -23.5505,
      longitude: -46.6333,
    });
  });

  it('devolve null quando o ponto não foi escolhido — o caso normal', () => {
    expect(parseCoordinates('', '')).toBeNull();
    expect(parseCoordinates('  ', '  ')).toBeNull();
  });

  it('devolve null quando só uma das coordenadas existe', () => {
    expect(parseCoordinates('-23.5505', '')).toBeNull();
    expect(parseCoordinates('', '-46.6333')).toBeNull();
  });

  it('devolve null para texto que não é número, sem lançar', () => {
    expect(parseCoordinates('perto da praça', 'ali')).toBeNull();
  });

  it('devolve null para par fora da faixa', () => {
    expect(parseCoordinates('200', '0')).toBeNull();
  });
});

describe('roundCoordinates', () => {
  it('guarda sete casas, descartando o ruído do arrasto', () => {
    expect(roundCoordinates({ latitude: -23.550512345678, longitude: -46.633398765432 })).toEqual({
      latitude: -23.5505123,
      longitude: -46.6333988,
    });
  });

  it('não altera valor já curto', () => {
    expect(roundCoordinates({ latitude: -23.55, longitude: -46.63 })).toEqual({
      latitude: -23.55,
      longitude: -46.63,
    });
  });
});

describe('formatCoordinates', () => {
  it('usa vírgula decimal e cinco casas, para leitura', () => {
    expect(formatCoordinates({ latitude: -23.5505123, longitude: -46.6333988 })).toBe(
      '-23,55051, -46,63340',
    );
  });
});

describe('geolocationMessage', () => {
  it('explica a recusa de permissão sem culpar a pessoa, e oferece as alternativas', () => {
    const texto = geolocationMessage(1);

    expect(texto).toMatch(/não autorizou/);
    expect(texto).toMatch(/mapa/);
    expect(texto).toMatch(/endereço/);
  });

  it('tem texto próprio para posição indisponível e para tempo esgotado', () => {
    expect(geolocationMessage(2)).not.toBe(geolocationMessage(3));
    expect(geolocationMessage(3)).toMatch(/demorou/);
  });

  it('cai numa mensagem útil para código desconhecido ou ausente', () => {
    for (const code of [undefined, 99]) {
      expect(geolocationMessage(code).length).toBeGreaterThan(20);
    }
  });

  it('nenhuma mensagem cita código de erro nem jargão', () => {
    for (const code of [1, 2, 3, undefined]) {
      const texto = geolocationMessage(code);
      expect(texto).not.toMatch(/PERMISSION_DENIED|TIMEOUT|geolocation|código/i);
    }
  });
});
