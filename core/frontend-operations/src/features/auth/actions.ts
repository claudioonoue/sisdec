'use server';

import { redirect } from 'next/navigation';
import type { LoginResponse } from '@/types/agent';
import { ApiError, userMessageFor } from '@/lib/api-error';
import { apiRequest } from '@/lib/api-client';
import { writeSessionToken } from '@/lib/session-cookie';
import { safeDestination } from '@/lib/session';
import type { SignInState } from './sign-in-state';

/**
 * Autentica o agente em `POST /auth/login` e abre a sessão (RF-OP-01, RF-OP-03).
 *
 * A requisição parte do servidor do Next, que guarda o token em cookie
 * `httpOnly` — ele nunca passa pelo JavaScript da página.
 */
export async function signIn(_previous: SignInState, formData: FormData): Promise<SignInState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const destination = safeDestination(String(formData.get('destino') ?? '/'));

  if (!email || !password) {
    return { error: 'Informe o e-mail e a senha para entrar.', email };
  }

  try {
    const session = await apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: { email, password },
      auth: false,
    });
    await writeSessionToken(session.accessToken);
  } catch (error) {
    if (error instanceof ApiError) {
      // RF-OP-02: a recusa não diz se o erro foi no e-mail ou na senha — a
      // própria API responde 401 genérico, e distinguir aqui entregaria a
      // quem tentasse adivinhar a informação de que o e-mail existe.
      if (error.kind === 'authentication') {
        return { error: 'E-mail ou senha incorretos.', email };
      }
      if (error.kind === 'validation') {
        return { error: 'Informe um e-mail válido e a senha.', email };
      }
    }
    return { error: userMessageFor(error), email };
  }

  // Fora do `try`: `redirect` sinaliza o desvio lançando, e o `catch` acima o
  // trataria como falha do login.
  redirect(destination);
}
