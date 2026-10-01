import type { Metadata } from 'next';
import { ServiceUnavailable } from '@/components/service-unavailable';
import { ReportForm } from '@/features/report-form/report-form';
import { userMessageFor } from '@/lib/api-error';
import { fetchPublicMetadata } from '@/lib/metadata';
import type { PublicMetadata } from '@/types/metadata';

export const metadata: Metadata = {
  title: 'Registrar ocorrência — SISDEC',
  description: 'Comunique uma reclamação, sugestão ou situação de risco à Defesa Civil.',
};

/**
 * Renderizada a cada requisição, pelo mesmo motivo de `/orientacoes`: pré-gerar
 * assaria a tela de falha na página caso a API estivesse fora no build. A chamada
 * a `GET /metadata` segue cacheada por uma hora.
 */
export const dynamic = 'force-dynamic';

export default async function RegisterPage() {
  let publicMetadata: PublicMetadata;

  try {
    publicMetadata = await fetchPublicMetadata();
  } catch (error) {
    // Sem os metadados não há como montar os seletores de categoria e tipo, nem
    // saber os limites das fotos. Melhor dizer isso do que exibir um formulário
    // com listas vazias.
    return <ServiceUnavailable message={userMessageFor(error)} />;
  }

  return <ReportForm metadata={publicMetadata} />;
}
