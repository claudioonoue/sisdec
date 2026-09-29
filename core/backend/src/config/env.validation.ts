import { plainToInstance } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

/**
 * Formato esperado do ambiente. A validação roda na inicialização: faltando ou
 * estando inválida uma variável obrigatória, a aplicação falha de imediato, em
 * vez de quebrar no primeiro uso (RNF-API-33).
 */
export class EnvironmentVariables {
  @IsString()
  @IsNotEmpty({ message: 'DATABASE_URL é obrigatória — veja o .env.example' })
  DATABASE_URL!: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = 3000;

  @IsString()
  @MinLength(16, {
    message: 'JWT_SECRET precisa ter ao menos 16 caracteres',
  })
  JWT_SECRET!: string;

  @IsString()
  @IsNotEmpty()
  JWT_EXPIRES_IN: string = '8h';

  @IsIn(['local'], {
    message: 'STORAGE_DRIVER aceita apenas "local" nesta versão',
  })
  STORAGE_DRIVER: string = 'local';

  @IsString()
  @IsNotEmpty()
  UPLOAD_DIR: string = './uploads';

  @IsInt()
  @Min(1)
  MAX_UPLOAD_SIZE_MB: number = 10;

  @IsString()
  @IsNotEmpty({
    message: 'CORS_ORIGINS é obrigatória — liste as origens dos portais separadas por vírgula',
  })
  CORS_ORIGINS!: string;
}

/** Campos numéricos, convertidos antes da validação porque o ambiente é texto. */
const NUMERIC_KEYS = ['PORT', 'MAX_UPLOAD_SIZE_MB'] as const;

export function validateEnvironment(raw: Record<string, unknown>): EnvironmentVariables {
  const normalized: Record<string, unknown> = { ...raw };
  for (const key of NUMERIC_KEYS) {
    if (normalized[key] !== undefined && normalized[key] !== '') {
      const parsed = Number(normalized[key]);
      normalized[key] = Number.isNaN(parsed) ? normalized[key] : parsed;
    } else {
      delete normalized[key];
    }
  }

  const config = plainToInstance(EnvironmentVariables, normalized, {
    // Mantém os valores padrão declarados na classe quando a variável não vem.
    exposeDefaultValues: true,
  });

  const errors = validateSync(config, {
    skipMissingProperties: false,
    whitelist: false,
  });

  if (errors.length > 0) {
    const detalhes = errors
      .map((error) => Object.values(error.constraints ?? {}).join('; '))
      .join('\n  - ');
    throw new Error(`Configuração de ambiente inválida:\n  - ${detalhes}`);
  }

  return config;
}
