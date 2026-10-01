'use server';

import { ApiError, userMessageFor } from '@/lib/api-error';
import { attachPhotos, createReport } from '@/lib/reports';
import type { ReportCategory, ReportType } from '@/types/enums';
import type { CreateReportPayload } from '@/types/report';
import { parseCoordinates } from './coordinates';
import type { SubmitResult } from './submit-result';

/**
 * Envio do registro (RF-CID-20, RF-CID-23, RF-CID-24).
 *
 * Roda no servidor do Next: o navegador não fala com a API diretamente, o que
 * mantém o portal com uma só porta de saída e dispensa expor a API ao cliente.
 *
 * São **duas** chamadas — a ocorrência e, havendo fotos, os anexos. A ordem
 * importa: a API só aceita anexo enquanto a ocorrência está em `RECEIVED`.
 */
export async function submitReport(formData: FormData): Promise<SubmitResult> {
  const payload = payloadFrom(formData);
  const photos = formData.getAll('photos').filter((item): item is File => item instanceof File);

  let created;

  try {
    created = await createReport(payload);
  } catch (error) {
    if (error instanceof ApiError) {
      return {
        status: 'error',
        message: userMessageFor(error),
        protocolNumber: null,
        photosFailed: false,
      };
    }
    throw error;
  }

  // A partir daqui a ocorrência **está registrada**. Uma falha nas fotos não pode
  // apagar isso nem esconder o protocolo: sem ele a pessoa perde o único meio de
  // acompanhar o atendimento (RF-CID-24).
  if (photos.length > 0) {
    try {
      await attachPhotos(created.id, photos);
    } catch {
      return {
        status: 'success',
        message:
          'A sua ocorrência foi registrada, mas não conseguimos enviar as fotos. ' +
          'O protocolo abaixo é válido e o atendimento segue normalmente.',
        protocolNumber: created.protocolNumber,
        photosFailed: true,
      };
    }
  }

  return {
    status: 'success',
    message: null,
    protocolNumber: created.protocolNumber,
    photosFailed: false,
  };
}

function text(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === 'string' ? value.trim() : '';
}

function payloadFrom(formData: FormData): CreateReportPayload {
  const anonymous = formData.get('anonymous') === 'true';
  // Par incompleto ou inválido vira ausência: a API recusaria, e o endereço já
  // basta para o registro seguir (RF-CID-13).
  const point = parseCoordinates(text(formData, 'latitude'), text(formData, 'longitude'));
  const name = text(formData, 'name');
  const email = text(formData, 'email');
  const phone = text(formData, 'phone');

  // Sem nome não há contato a registrar. E quem escolheu não se identificar tem
  // os campos descartados aqui, no servidor — não só escondidos na tela
  // (RF-CID-17, RNF-CID-30).
  const identifica = !anonymous && name.length > 0;

  return {
    category: formData.get('category') as ReportCategory,
    type: formData.get('type') as ReportType,
    description: text(formData, 'description'),
    address: text(formData, 'address'),
    district: text(formData, 'district'),
    ...(point && { latitude: point.latitude, longitude: point.longitude }),
    ...(identifica && {
      citizen: {
        name,
        ...(email && { email }),
        ...(phone && { phone }),
      },
    }),
  };
}
