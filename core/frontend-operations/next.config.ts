import type { NextConfig } from "next";

/**
 * As fotos dos anexos são servidas pela API (`RNF-OP-18`), e por isso a origem
 * dela precisa ser declarada aqui: o otimizador de imagens do Next só busca de
 * hosts autorizados. É o que gera as miniaturas da lista de anexos sem baixar o
 * arquivo íntegro (`RNF-OP-24`).
 *
 * A origem é derivada de `NEXT_PUBLIC_API_URL` em vez de fixada, para que o
 * endereço da API continue vindo de um lugar só (`RF-OP-55`).
 */
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
const apiOrigin = apiUrl ? new URL(apiUrl) : undefined;

/**
 * O Next recusa otimizar imagem cujo host resolva para IP privado, porque um
 * otimizador que busca qualquer endereço vira uma porta de SSRF para a rede
 * interna. Nesta etapa a API roda em `localhost`
 * ([decisão 10](../../docs/arquitetura.md#5-decisões-técnicas-registradas)), que
 * é exatamente o caso bloqueado.
 *
 * A exceção vale **apenas em desenvolvimento**. Em produção a API terá endereço
 * público e a permissão deixa de ser necessária — deixá-la ligada lá abriria o
 * buraco que a verificação existe para fechar.
 */
const isDevelopment = process.env.NODE_ENV !== 'production';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: apiOrigin
      ? [
          {
            protocol: apiOrigin.protocol.replace(':', '') as 'http' | 'https',
            hostname: apiOrigin.hostname,
            port: apiOrigin.port,
            pathname: '/**',
          },
        ]
      : [],
    dangerouslyAllowLocalIP: isDevelopment,
  },
};

export default nextConfig;
