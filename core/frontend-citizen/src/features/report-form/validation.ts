import { DESCRIPTION_MAX, DESCRIPTION_MIN, type ReportDraft } from './draft';

/**
 * Validação por etapa (RF-CID-21).
 *
 * Função pura, sem React: é o que permite testá-la sem montar a tela, e é onde
 * a decisão de "pode avançar?" fica — uma só, em vez de espalhada pelos
 * componentes de cada etapa.
 *
 * As mensagens falam do campo como o cidadão o vê na tela ("endereço"), não como
 * a API o chama ("address"): quem lê não conhece o contrato (RNF-CID-05).
 */

/** Erros de uma etapa, indexados pelo campo do rascunho. */
export type StepErrors = Partial<Record<keyof ReportDraft, string>>;

function isBlank(value: string): boolean {
  return value.trim().length === 0;
}

/** Aceita o que a API aceita, sem tentar adivinhar mais que isso. */
function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

function looksLikePhone(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  return digits.length >= 8 && digits.length <= 15 && /^[0-9()+\s-]+$/.test(value.trim());
}

function validateWhat(draft: ReportDraft): StepErrors {
  const errors: StepErrors = {};
  if (!draft.category) errors.category = 'Escolha o tipo de comunicação.';
  if (!draft.type) errors.type = 'Escolha o que está acontecendo.';
  return errors;
}

function validateWhere(draft: ReportDraft): StepErrors {
  const errors: StepErrors = {};
  // O endereço é o dado obrigatório; o ponto no mapa é complementar e chega na
  // etapa C3 (RF-CID-13).
  if (isBlank(draft.address)) errors.address = 'Informe o endereço, com um ponto de referência.';
  if (isBlank(draft.district)) errors.district = 'Informe o bairro.';
  return errors;
}

function validateDetails(draft: ReportDraft): StepErrors {
  const errors: StepErrors = {};
  const description = draft.description.trim();

  if (isBlank(description)) {
    errors.description = 'Conte o que aconteceu.';
  } else if (description.length < DESCRIPTION_MIN) {
    errors.description = `Escreva um pouco mais — ao menos ${DESCRIPTION_MIN} caracteres.`;
  } else if (description.length > DESCRIPTION_MAX) {
    errors.description = `O relato ficou longo demais. Use até ${DESCRIPTION_MAX} caracteres.`;
  }

  return errors;
}

function validateContact(draft: ReportDraft): StepErrors {
  const errors: StepErrors = {};

  // Quem optou por não se identificar não tem nada a validar — os campos serão
  // descartados no envio (RF-CID-17).
  if (draft.anonymous) return errors;

  const name = draft.name.trim();
  const email = draft.email.trim();
  const phone = draft.phone.trim();

  // Todos os campos são opcionais. Mas um contato sem nome não serve para nada e
  // só acumularia dado pessoal sem uso, então o nome passa a ser exigido assim
  // que a pessoa informa qualquer forma de contato.
  if (isBlank(name) && (email || phone)) {
    errors.name = 'Informe o seu nome, ou escolha não se identificar.';
  }

  if (email && !looksLikeEmail(email)) {
    errors.email = 'Confira o e-mail: parece estar incompleto.';
  }

  if (phone && !looksLikePhone(phone)) {
    errors.phone = 'Confira o telefone: use apenas números, com o DDD.';
  }

  return errors;
}

const VALIDATORS = [validateWhat, validateWhere, validateDetails, validateContact, () => ({})];

/** Erros da etapa informada. Vazio significa que pode avançar. */
export function validateStep(step: number, draft: ReportDraft): StepErrors {
  return (VALIDATORS[step] ?? (() => ({})))(draft);
}

/**
 * Primeira etapa com erro, ou `null` quando o rascunho inteiro está válido.
 *
 * Usada no envio: a revisão é a última etapa, e enviar dali exige que nenhuma
 * etapa anterior tenha ficado pendente — o que aconteceria se alguém voltasse e
 * apagasse um campo já preenchido.
 */
export function firstInvalidStep(draft: ReportDraft): number | null {
  for (let step = 0; step < VALIDATORS.length; step += 1) {
    if (Object.keys(validateStep(step, draft)).length > 0) return step;
  }
  return null;
}

export function isStepValid(step: number, draft: ReportDraft): boolean {
  return Object.keys(validateStep(step, draft)).length === 0;
}
