[OPEN] Debug Session: cpanel-delete-client-error

## Sintoma
- Ao excluir um cliente/loja no cPanel (Clientes / Lojas), a tela quebra com “Minified React error #185”.

## Ambiente
- App: BrandDelivery (Vite/React)
- Área: /cpanel/empresas

## Hipóteses (falsificáveis)
- H1: Existe registro com campo inesperado (ex.: `created_at`, `status`, `name`) vindo `null/undefined` e o render quebra após o refresh da lista.
- H2: O delete retorna erro do Supabase (RLS/constraint) e algum estado fica inconsistente (ex.: lista contém item inválido), gerando erro em render.
- H3: Uma Promise rejeitada (delete/load) não está sendo tratada e dispara erro global no navegador.
- H4: O erro ocorre na formatação de data (`format(new Date(...))`) com `created_at` inválido.

## Evidências a coletar
- Evento global `window.onerror` / `unhandledrejection` com stack e payload.
- Payload do item sendo deletado e resposta do Supabase (ok/erro).
- Contagem de campos nulos e valores suspeitos na lista após `load()`.

## Plano
1) Iniciar Debug Server e instrumentar cPanel para reportar eventos.
2) Reproduzir o erro ao excluir um cliente.
3) Analisar logs NDJSON e confirmar a hipótese.
4) Aplicar correção mínima e comparar logs pre/post.

