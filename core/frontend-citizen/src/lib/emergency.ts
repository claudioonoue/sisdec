/**
 * Telefones de emergência.
 *
 * Ficam em um único lugar porque aparecem em várias telas e em mensagens de erro
 * (`api-error.ts`): o aviso do `RF-CID-02` precisa ser o mesmo em todas, e um
 * número divergente numa delas seria um defeito grave — alguém pode ligar.
 */
export interface EmergencyPhone {
  number: string;
  who: string;
  /** Formato aceito por `tel:` — sem espaços nem pontuação. */
  dial: string;
}

export const EMERGENCY_PHONES: readonly EmergencyPhone[] = [
  { number: '199', who: 'Defesa Civil', dial: '199' },
  { number: '193', who: 'Bombeiros', dial: '193' },
];

/** Texto curto do aviso, usado onde não cabe a lista inteira. */
export const EMERGENCY_NOTICE =
  'Em emergências, ligue 199 (Defesa Civil) ou 193 (Bombeiros). ' +
  'Este sistema não substitui o atendimento emergencial.';
