'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import type { PublicMetadata } from '@/types/metadata';
import type { ReportCategory, ReportType } from '@/types/enums';
import { EmergencyNotice } from '@/components/emergency-notice';
import { LocationField } from '@/components/map/location-field';
import { submitReport } from './actions';
import { CONTROL_CLASS, Field } from './field';
import { DESCRIPTION_MAX, LAST_STEP, STEPS, emptyDraft, type ReportDraft } from './draft';
import { PhotoPicker } from './photo-picker';
import { StepProgress } from './step-progress';
import { SubmittedPanel } from './submitted-panel';
import { initialSubmitResult, type SubmitResult } from './submit-result';
import { formatCoordinates, parseCoordinates } from './coordinates';
import { firstInvalidStep, validateStep, type StepErrors } from './validation';
import type { PhotoRejection } from './photos';

/**
 * Formulário de registro em cinco etapas (RF-CID-05).
 *
 * O estado vive no cliente porque as fotos são objetos `File`: mantê-las no
 * servidor exigiria subi-las antes de a pessoa terminar de preencher, e uma
 * desistência deixaria arquivos órfãos. O envio é uma Server Action.
 *
 * Voltar uma etapa **não** perde o que foi digitado (RNF-CID-06): o rascunho é
 * um só, e a etapa atual é apenas qual parte dele está visível.
 */
export function ReportForm({ metadata }: { metadata: PublicMetadata }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<ReportDraft>(emptyDraft);
  const [photos, setPhotos] = useState<File[]>([]);
  const [rejections, setRejections] = useState<PhotoRejection[]>([]);
  const [errors, setErrors] = useState<StepErrors>({});
  const [result, setResult] = useState<SubmitResult>(initialSubmitResult);
  const [enviando, startTransition] = useTransition();

  function update<K extends keyof ReportDraft>(field: K, value: ReportDraft[K]) {
    setDraft((current) => ({ ...current, [field]: value }));
    // O erro do campo sai assim que a pessoa mexe nele: manter a mensagem
    // enquanto ela corrige é ruído.
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function advance() {
    const found = validateStep(step, draft);
    setErrors(found);
    if (Object.keys(found).length === 0) setStep((current) => Math.min(current + 1, LAST_STEP));
  }

  function goBack() {
    setErrors({});
    setStep((current) => Math.max(current - 1, 0));
  }

  function send() {
    // Uma etapa anterior pode ter sido esvaziada depois de preenchida; a revisão
    // não é lugar para descobrir isso só no erro da API.
    const pendente = firstInvalidStep(draft);

    if (pendente !== null) {
      setStep(pendente);
      setErrors(validateStep(pendente, draft));
      return;
    }

    const formData = new FormData();
    formData.set('category', draft.category);
    formData.set('type', draft.type);
    formData.set('description', draft.description);
    formData.set('address', draft.address);
    formData.set('district', draft.district);
    formData.set('latitude', draft.latitude);
    formData.set('longitude', draft.longitude);
    formData.set('anonymous', String(draft.anonymous));
    formData.set('name', draft.name);
    formData.set('email', draft.email);
    formData.set('phone', draft.phone);
    for (const photo of photos) formData.append('photos', photo);

    startTransition(async () => {
      const submitted = await submitReport(formData);

      if (submitted.status === 'success' && submitted.protocolNumber && !submitted.photosFailed) {
        // Caminho normal: a tela de confirmação é uma rota própria, para
        // sobreviver a uma recarga e poder ser impressa ou salva (RF-CID-29).
        router.push(
          `/registrar/confirmacao?protocolo=${encodeURIComponent(submitted.protocolNumber)}`,
        );
        return;
      }

      // Com as fotos recusadas, o aviso fica aqui: levá-lo na URL para a próxima
      // tela exigiria passar o motivo da falha por parâmetro, e um texto em query
      // string é frágil e fácil de forjar (RF-CID-24).
      setResult(submitted);
    });
  }

  if (result.status === 'success' && result.protocolNumber) {
    return (
      <SubmittedPanel
        protocolNumber={result.protocolNumber}
        warning={result.photosFailed ? result.message : null}
      />
    );
  }

  const tipoEscolhido = metadata.reportTypes.find((item) => item.value === draft.type);

  return (
    <div className="space-y-6">
      <EmergencyNotice compact />

      <StepProgress current={step} />

      <h1 className="text-2xl font-bold">{STEPS[step].title}</h1>

      {/* Falha do envio: a mensagem aparece e o rascunho fica inteiro (RNF-CID-06). */}
      {result.status === 'error' && result.message ? (
        <p role="alert" className="rounded-md border-2 border-danger bg-danger-soft p-3 font-semibold text-danger">
          {result.message}
        </p>
      ) : null}

      {step === 0 ? (
        <fieldset className="space-y-5">
          <legend className="sr-only">O que aconteceu</legend>

          <Field id="category" label="Que tipo de comunicação é esta?" error={errors.category}>
            {(props) => (
              <select
                {...props}
                name="category"
                value={draft.category}
                onChange={(event) => update('category', event.target.value as ReportCategory)}
                className={CONTROL_CLASS}
              >
                <option value="">Escolha uma opção</option>
                {metadata.reportCategories.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
          </Field>

          <Field
            id="type"
            label="O que está acontecendo?"
            error={errors.type}
            hint="Escolha o que mais se aproxima. Se nada servir, use “Outros”."
          >
            {(props) => (
              <select
                {...props}
                name="type"
                value={draft.type}
                onChange={(event) => update('type', event.target.value as ReportType)}
                className={CONTROL_CLASS}
              >
                <option value="">Escolha uma opção</option>
                {metadata.reportTypes.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
          </Field>

          {/*
            Reforço do aviso quando o tipo escolhido é de risco imediato à vida
            (RF-CID-09). A marcação vem da API, não de uma lista escrita aqui.
          */}
          {tipoEscolhido?.urgent ? (
            <div role="alert" className="rounded-lg border-2 border-emergency bg-emergency-soft p-4">
              <p className="font-bold text-emergency">
                Esta situação pode ser uma emergência
              </p>
              <p className="mt-1 text-ink">
                “{tipoEscolhido.label}” costuma exigir atendimento imediato.{' '}
                <strong>Ligue 199 ou 193 agora</strong> e registre a ocorrência depois.
              </p>
            </div>
          ) : null}
        </fieldset>
      ) : null}

      {step === 1 ? (
        <fieldset className="space-y-5">
          <legend className="sr-only">Onde foi</legend>

          <Field
            id="address"
            label="Endereço"
            error={errors.address}
            hint="Rua e número, ou um ponto de referência que ajude a equipe a chegar."
          >
            {(props) => (
              <input
                {...props}
                name="address"
                type="text"
                autoComplete="street-address"
                value={draft.address}
                onChange={(event) => update('address', event.target.value)}
                className={CONTROL_CLASS}
              />
            )}
          </Field>

          <Field id="district" label="Bairro" error={errors.district}>
            {(props) => (
              <input
                {...props}
                name="district"
                type="text"
                value={draft.district}
                onChange={(event) => update('district', event.target.value)}
                className={CONTROL_CLASS}
              />
            )}
          </Field>

          <LocationField
            value={parseCoordinates(draft.latitude, draft.longitude)}
            onChange={(point) =>
              setDraft((current) => ({
                ...current,
                latitude: String(point.latitude),
                longitude: String(point.longitude),
              }))
            }
            onClear={() => setDraft((current) => ({ ...current, latitude: '', longitude: '' }))}
          />
        </fieldset>
      ) : null}

      {step === 2 ? (
        <fieldset className="space-y-5">
          <legend className="sr-only">Detalhes</legend>

          <Field
            id="description"
            label="O que aconteceu?"
            error={errors.description}
            hint="Descreva o que você viu. Quando começou, o que mudou, se há risco a pessoas."
          >
            {(props) => (
              <textarea
                {...props}
                name="description"
                rows={6}
                maxLength={DESCRIPTION_MAX}
                value={draft.description}
                onChange={(event) => update('description', event.target.value)}
                className={CONTROL_CLASS}
              />
            )}
          </Field>

          <PhotoPicker
            photos={photos}
            limits={metadata.upload}
            rejections={rejections}
            onChange={setPhotos}
            onReject={setRejections}
          />
        </fieldset>
      ) : null}

      {step === 3 ? (
        <fieldset className="space-y-5">
          <legend className="sr-only">Seus dados</legend>

          <p className="rounded-md bg-surface-muted p-3 text-ink-muted">
            <strong className="text-ink">Nada aqui é obrigatório.</strong> Deixar um contato só
            ajuda a equipe a esclarecer dúvidas sobre o local. Nesta versão o sistema{' '}
            <strong className="text-ink">não envia avisos</strong> por e-mail nem por SMS: o
            acompanhamento é feito pelo número de protocolo.
          </p>

          <div className="rounded-md border border-border bg-surface p-3">
            <label htmlFor="anonymous" className="flex items-start gap-3 font-semibold">
              <input
                id="anonymous"
                name="anonymous"
                type="checkbox"
                checked={draft.anonymous}
                onChange={(event) => update('anonymous', event.target.checked)}
                className="mt-1 size-5"
              />
              <span>
                Prefiro não me identificar
                <span className="mt-1 block text-sm font-normal text-ink-muted">
                  A ocorrência é registrada sem nenhum dado seu.
                </span>
              </span>
            </label>
          </div>

          {!draft.anonymous ? (
            <>
              <Field id="name" label="Nome" error={errors.name} optional>
                {(props) => (
                  <input
                    {...props}
                    name="name"
                    type="text"
                    autoComplete="name"
                    value={draft.name}
                    onChange={(event) => update('name', event.target.value)}
                    className={CONTROL_CLASS}
                  />
                )}
              </Field>

              <Field id="email" label="E-mail" error={errors.email} optional>
                {(props) => (
                  <input
                    {...props}
                    name="email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    value={draft.email}
                    onChange={(event) => update('email', event.target.value)}
                    className={CONTROL_CLASS}
                  />
                )}
              </Field>

              <Field id="phone" label="Telefone" error={errors.phone} optional>
                {(props) => (
                  <input
                    {...props}
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    value={draft.phone}
                    onChange={(event) => update('phone', event.target.value)}
                    className={CONTROL_CLASS}
                  />
                )}
              </Field>
            </>
          ) : null}
        </fieldset>
      ) : null}

      {step === LAST_STEP ? (
        <ReviewStep draft={draft} metadata={metadata} photoCount={photos.length} onEdit={setStep} />
      ) : null}

      <div className="flex flex-wrap gap-3 border-t border-border pt-4">
        {step > 0 ? (
          <button
            type="button"
            onClick={goBack}
            disabled={enviando}
            className="rounded-md border-2 border-brand px-5 py-2 font-semibold text-brand disabled:opacity-60"
          >
            Voltar
          </button>
        ) : null}

        {step < LAST_STEP ? (
          <button
            type="button"
            onClick={advance}
            className="rounded-md bg-brand px-5 py-2 font-semibold text-white hover:bg-brand-strong"
          >
            Continuar
          </button>
        ) : (
          <button
            type="button"
            onClick={send}
            // RF-CID-22: bloqueado durante a requisição, para que um segundo
            // toque não registre a mesma ocorrência duas vezes.
            disabled={enviando}
            aria-busy={enviando}
            className="rounded-md bg-brand px-5 py-2 font-semibold text-white hover:bg-brand-strong disabled:opacity-60"
          >
            {enviando ? 'Enviando…' : 'Enviar ocorrência'}
          </button>
        )}
      </div>

      {/* RNF-CID-24: o estado de envio é anunciado, não só indicado no botão. */}
      <p aria-live="polite" className="sr-only">
        {enviando ? 'Enviando a sua ocorrência. Aguarde.' : ''}
      </p>
    </div>
  );
}

/** Revisão: tudo o que será enviado, com atalho para corrigir cada etapa. */
function ReviewStep({
  draft,
  metadata,
  photoCount,
  onEdit,
}: {
  draft: ReportDraft;
  metadata: PublicMetadata;
  photoCount: number;
  onEdit: (step: number) => void;
}) {
  const categoria = metadata.reportCategories.find((item) => item.value === draft.category)?.label;
  const tipo = metadata.reportTypes.find((item) => item.value === draft.type)?.label;
  const pontoRevisado = parseCoordinates(draft.latitude, draft.longitude);

  const blocos = [
    {
      step: 0,
      title: 'O que aconteceu',
      rows: [
        ['Comunicação', categoria],
        ['Situação', tipo],
      ],
    },
    {
      step: 1,
      title: 'Onde foi',
      rows: [
        ['Endereço', draft.address],
        ['Bairro', draft.district],
        [
          'Ponto no mapa',
          pontoRevisado ? formatCoordinates(pontoRevisado) : 'Não marcado',
        ],
      ],
    },
    {
      step: 2,
      title: 'Detalhes',
      rows: [
        ['Relato', draft.description],
        ['Fotos', photoCount === 0 ? 'Nenhuma foto' : `${photoCount} foto(s)`],
      ],
    },
    {
      step: 3,
      title: 'Seus dados',
      rows: draft.anonymous
        ? [['Identificação', 'Você escolheu não se identificar']]
        : [
            ['Nome', draft.name || 'Não informado'],
            ['E-mail', draft.email || 'Não informado'],
            ['Telefone', draft.phone || 'Não informado'],
          ],
    },
  ];

  return (
    <div className="space-y-4">
      <p className="text-ink-muted">
        Confira os dados antes de enviar. Você pode corrigir qualquer etapa.
      </p>

      {blocos.map((bloco) => (
        <section
          key={bloco.step}
          aria-labelledby={`revisao-${bloco.step}`}
          className="rounded-lg border border-border bg-surface p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <h2 id={`revisao-${bloco.step}`} className="font-bold">
              {bloco.title}
            </h2>
            <button
              type="button"
              aria-label={`Corrigir ${bloco.title}`}
              onClick={() => onEdit(bloco.step)}
              className="rounded border border-brand px-3 py-1 text-sm font-semibold text-brand"
            >
              Corrigir
            </button>
          </div>

          <dl className="mt-3 space-y-2">
            {bloco.rows.map(([rotulo, valor]) => (
              <div key={rotulo}>
                <dt className="text-sm text-ink-muted">{rotulo}</dt>
                <dd className="whitespace-pre-line break-words">{valor}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
