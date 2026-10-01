import type { ReportCategory, ReportType } from '@/types/enums';

/**
 * Rascunho do registro, como o formulário o mantém entre as etapas.
 *
 * Tudo é texto, inclusive o que a API recebe tipado: é o que os campos do
 * formulário produzem, e converter só no envio evita um estado intermediário em
 * que o valor digitado não cabe no tipo — o que apagaria o que a pessoa escreveu
 * (RNF-CID-06).
 */
export interface ReportDraft {
  category: ReportCategory | '';
  type: ReportType | '';
  address: string;
  district: string;
  /**
   * Ponto no mapa, como texto e vazio por padrão.
   *
   * Complementar: o endereço é o dado obrigatório, e o registro conclui sem
   * coordenada nenhuma (RF-CID-13).
   */
  latitude: string;
  longitude: string;
  description: string;
  /** Quando verdadeiro, os dados de contato são descartados no envio. */
  anonymous: boolean;
  name: string;
  email: string;
  phone: string;
}

export const emptyDraft: ReportDraft = {
  category: '',
  type: '',
  address: '',
  district: '',
  latitude: '',
  longitude: '',
  description: '',
  anonymous: false,
  name: '',
  email: '',
  phone: '',
};

/** Etapas do formulário, na ordem em que aparecem (RF-CID-05). */
export const STEPS = [
  { id: 'o-que', title: 'O que aconteceu?' },
  { id: 'onde', title: 'Onde foi?' },
  { id: 'detalhes', title: 'Detalhes' },
  { id: 'seus-dados', title: 'Seus dados' },
  { id: 'revisao', title: 'Revisão' },
] as const;

export type StepId = (typeof STEPS)[number]['id'];

export const LAST_STEP = STEPS.length - 1;

/** Limites de texto, iguais aos que a API aplica. */
export const DESCRIPTION_MIN = 10;
export const DESCRIPTION_MAX = 5000;
