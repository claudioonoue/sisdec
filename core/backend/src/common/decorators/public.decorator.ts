import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Libera a rota da autenticação.
 *
 * O `JwtAuthGuard` é global: o padrão é exigir token. Uma rota pública precisa
 * dizê-lo explicitamente — assim, esquecer o decorador deixa a rota protegida,
 * e não aberta.
 */
export const Public = (): MethodDecorator & ClassDecorator => SetMetadata(IS_PUBLIC_KEY, true);
