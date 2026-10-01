/**
 * Coordenadas do ponto escolhido no mapa.
 *
 * Função pura, sem React e sem Leaflet: é o que permite testar a validação e a
 * formatação sem montar o mapa — que, por depender do DOM, não roda no servidor
 * nem no jsdom de forma útil.
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/** Centro aproximado da área de atendimento, usado quando não há ponto escolhido. */
export const DEFAULT_CENTER: Coordinates = { latitude: -23.5505, longitude: -46.6333 };

/** Casas decimais guardadas: ~1 m de precisão, mais do que o suficiente. */
const PRECISION = 7;

export function isValidLatitude(value: number): boolean {
  return Number.isFinite(value) && value >= -90 && value <= 90;
}

export function isValidLongitude(value: number): boolean {
  return Number.isFinite(value) && value >= -180 && value <= 180;
}

export function isValidCoordinates(point: {
  latitude: number;
  longitude: number;
}): boolean {
  return isValidLatitude(point.latitude) && isValidLongitude(point.longitude);
}

/** Arredonda para a precisão guardada, descartando ruído do arrasto no mapa. */
export function roundCoordinates({ latitude, longitude }: Coordinates): Coordinates {
  return {
    latitude: Number(latitude.toFixed(PRECISION)),
    longitude: Number(longitude.toFixed(PRECISION)),
  };
}

/**
 * Lê as coordenadas do rascunho, que as guarda como texto.
 *
 * Devolve `null` para qualquer coisa que não seja um par válido — incluindo campo
 * vazio, que é o caso normal de quem não ajustou o ponto.
 */
export function parseCoordinates(
  latitude: string,
  longitude: string,
): Coordinates | null {
  if (latitude.trim() === '' || longitude.trim() === '') return null;

  const point = { latitude: Number(latitude), longitude: Number(longitude) };
  return isValidCoordinates(point) ? point : null;
}

/**
 * Texto exibido ao cidadão.
 *
 * Cinco casas, não sete: o que está na tela serve para a pessoa reconhecer o
 * ponto, não para reproduzi-lo com precisão de metro. Vírgula decimal, como se
 * escreve em pt-BR.
 */
export function formatCoordinates({ latitude, longitude }: Coordinates): string {
  const format = (value: number) => value.toFixed(5).replace('.', ',');
  return `${format(latitude)}, ${format(longitude)}`;
}

/** Mensagem de falha da geolocalização, no vocabulário de quem está na rua. */
export function geolocationMessage(code: number | undefined): string {
  switch (code) {
    case 1: // PERMISSION_DENIED
      return (
        'Você não autorizou o uso da localização. ' +
        'Pode marcar o ponto no mapa com o dedo, ou seguir só com o endereço.'
      );
    case 2: // POSITION_UNAVAILABLE
      return 'Não foi possível obter a sua localização agora. Tente marcar o ponto no mapa.';
    case 3: // TIMEOUT
      return 'A localização demorou para responder. Tente de novo ou marque o ponto no mapa.';
    default:
      return 'Este aparelho não informou a localização. Marque o ponto no mapa, se quiser.';
  }
}
