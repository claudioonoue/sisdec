import { validateEnvironment } from './env.validation.js';

const ambienteValido = {
  DATABASE_URL: 'postgresql://sisdec:sisdec@localhost:5432/sisdec',
  JWT_SECRET: 'uma-chave-com-tamanho-suficiente',
  CORS_ORIGINS: 'http://localhost:3001,http://localhost:3002',
};

describe('validateEnvironment', () => {
  it('aceita um ambiente completo', () => {
    expect(() => validateEnvironment(ambienteValido)).not.toThrow();
  });

  it('aplica os valores padrão das variáveis opcionais', () => {
    const config = validateEnvironment(ambienteValido);

    expect(config.PORT).toBe(3000);
    expect(config.JWT_EXPIRES_IN).toBe('8h');
    expect(config.STORAGE_DRIVER).toBe('local');
    expect(config.MAX_UPLOAD_SIZE_MB).toBe(10);
  });

  it('converte para número as variáveis numéricas vindas como texto', () => {
    const config = validateEnvironment({ ...ambienteValido, PORT: '4000', MAX_UPLOAD_SIZE_MB: '5' });

    expect(config.PORT).toBe(4000);
    expect(config.MAX_UPLOAD_SIZE_MB).toBe(5);
  });

  it('falha nomeando a variável obrigatória ausente', () => {
    const { DATABASE_URL: _omitida, ...semBanco } = ambienteValido;

    expect(() => validateEnvironment(semBanco)).toThrow(/DATABASE_URL/);
  });

  it('recusa JWT_SECRET curto demais', () => {
    expect(() => validateEnvironment({ ...ambienteValido, JWT_SECRET: 'curta' })).toThrow(
      /JWT_SECRET/,
    );
  });

  it('recusa STORAGE_DRIVER não suportado nesta versão', () => {
    expect(() => validateEnvironment({ ...ambienteValido, STORAGE_DRIVER: 's3' })).toThrow(
      /STORAGE_DRIVER/,
    );
  });

  it('recusa porta fora da faixa válida', () => {
    expect(() => validateEnvironment({ ...ambienteValido, PORT: '99999' })).toThrow(/PORT/);
  });
});
