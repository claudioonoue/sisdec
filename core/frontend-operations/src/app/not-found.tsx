import Link from 'next/link';
import { PageHeader } from '@/components/ui/page-header';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md space-y-6 py-12">
      <PageHeader
        title="Página não encontrada"
        description="O endereço acessado não existe neste portal, ou o seu perfil não tem acesso a ele."
      />
      <Link
        href="/"
        className="inline-block rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-strong"
      >
        Ir para o painel
      </Link>
    </div>
  );
}
