import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { UploadLimits } from '@/types/metadata';
import { PhotoPicker } from './photo-picker';

const LIMITS: UploadLimits = {
  maxFiles: 5,
  maxSizeMb: 10,
  acceptedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
};

function arquivo(name: string, megabytes = 0.5): File {
  return new File([new Uint8Array(Math.round(megabytes * 1024 * 1024))], name, {
    type: 'image/jpeg',
  });
}

function montar(props: Partial<Parameters<typeof PhotoPicker>[0]> = {}) {
  const onChange = vi.fn();
  const onReject = vi.fn();

  render(
    <PhotoPicker
      photos={[]}
      limits={LIMITS}
      rejections={[]}
      onChange={onChange}
      onReject={onReject}
      {...props}
    />,
  );

  return { onChange, onReject };
}

describe('PhotoPicker', () => {
  it('anuncia os limites que a API aplica, em vez de valores próprios', () => {
    montar();

    const ajuda = screen.getByText(/Até 5 fotos/);
    expect(ajuda.textContent).toContain('JPEG, PNG ou WEBP');
    expect(ajuda.textContent).toContain('10 MB');
  });

  it('aceita só os formatos que a API aceita', () => {
    montar();

    expect(screen.getByLabelText(/Fotos/).getAttribute('accept')).toBe(
      'image/jpeg,image/png,image/webp',
    );
  });

  it('o campo é rotulado e tem a dica associada (RNF-CID-16)', () => {
    montar();

    const campo = screen.getByLabelText(/Fotos/);
    expect(campo.getAttribute('aria-describedby')).toBe('fotos-ajuda');
  });

  it('mostra prévia, nome e tamanho de cada foto escolhida (RF-CID-15)', () => {
    montar({ photos: [arquivo('arvore.jpg', 1.5)] });

    expect(screen.getByAltText(/Prévia da foto 1: arvore.jpg/)).toBeDefined();
    expect(screen.getByText('arvore.jpg')).toBeDefined();
    expect(screen.getByText('1,5 MB')).toBeDefined();
  });

  it('o botão de remover nomeia a foto, para não ficar ambíguo com várias', () => {
    montar({ photos: [arquivo('a.jpg'), arquivo('b.jpg')] });

    expect(screen.getByRole('button', { name: /Remover a foto a.jpg/ })).toBeDefined();
    expect(screen.getByRole('button', { name: /Remover a foto b.jpg/ })).toBeDefined();
  });

  it('desabilita a escolha ao atingir o máximo, e explica por quê', () => {
    montar({ photos: [arquivo('1'), arquivo('2'), arquivo('3'), arquivo('4'), arquivo('5')] });

    expect(screen.getByLabelText(/Fotos/)).toHaveProperty('disabled', true);
    expect(screen.getByText(/máximo de fotos/)).toBeDefined();
  });

  it('anuncia as recusas, nomeando o arquivo e o motivo (RNF-CID-18)', () => {
    montar({
      rejections: [{ fileName: 'documento.pdf', reason: 'Este arquivo não é uma imagem.' }],
    });

    const alerta = screen.getByRole('alert');
    expect(alerta.textContent).toContain('documento.pdf');
    expect(alerta.textContent).toContain('não é uma imagem');
  });

  it('não exibe área de recusa quando não há nenhuma', () => {
    montar({ photos: [arquivo('a.jpg')] });

    expect(screen.queryByRole('alert')).toBeNull();
  });
});
