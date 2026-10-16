# TakeToo Web

Interface de gestão e revisão de projetos audiovisuais. Profissionais organizam clientes, projetos e versões de vídeo/imagem; clientes revisam por magic link sem cadastro.

O backend fica em [take-too](https://github.com/lucasrbordignon/take-too). O [plano do MVP](https://github.com/lucasrbordignon/take-too/issues/14) e as issues de backend, frontend e operação são centralizados nesse repositório.

## Estado do MVP

### Disponível e publicado

- Painel do profissional com clientes, projetos, etapas, métricas e atividades.
- Bibliotecas de vídeos e imagens em `/videos` e `/imagens`.
- Upload direto no projeto ou seleção de mídia anterior, no mesmo modal de publicação.
- Rascunhos recuperáveis, progresso real, confirmação de cancelamento e exclusão com confirmação.
- Publicação explícita de mídia pronta; upload sozinho não inicia revisão.
- Histórico ordenado Vn → V1, reprodução HLS assinada e imagens privadas, preservando versões legadas.
- Player com enquadramento vertical/paisagem/quadrado, sem cortar a mídia.
- Portal com comentários por tempo em vídeos e gerais em imagens, aprovação e rejeição.
- Feedback em overlay que mantém o player montado e o vídeo em reprodução.
- Renovação controlada da sessão do profissional após 401 e mensagens para erros de reprodução.

### Pendente para distribuir o MVP

- Painel de marca d'água do profissional, integrado a preferências e processamento no backend.
- Definição de retenção de originais e entrega/download sem marca.
- Critérios restantes do backlog de imagens: WebP e zoom acessível. Hoje o upload aceita JPEG/PNG e o visualizador preserva o enquadramento, sem zoom próprio.
- Conferência visual em 360–390 px e desktop, acessibilidade e cenários reais de rede/expiração.
- Fechamento dos limites operacionais e roteiro do piloto.

Notificações automáticas por e-mail/WhatsApp, anotações por coordenadas e migração entre provedores ficam para uma etapa posterior. O profissional compartilha o magic link manualmente; o atalho `wa.me` da ficha do cliente não é envio automático de notificações.

## Tecnologias

React 19, TypeScript 6, Vite 8, Tailwind CSS 4, React Router 7, TanStack Query 5, Axios e HLS.js. Testes com Vitest e jsdom.

## Executar localmente

Requer Node.js 20.19+ ou 22.12+ em uma versão compatível com Vite 8, npm e o backend funcionando. Use o `package-lock.json` para instalar as versões do projeto:

```bash
npm ci
npm run dev
```

O Vite normalmente abre em `http://localhost:5173`; se a porta estiver ocupada, pode usar `5174`. Por padrão, `/api` é encaminhado pelo proxy do Vite para `http://localhost:8082`.

Para usar outra API, crie `.env`:

```dotenv
VITE_API_URL=http://localhost:8082
```

Inclua a origem exata do web em `CORS_ALLOWED_ORIGINS` e `VIDEO_ALLOWED_ORIGINS` no backend, com protocolo e porta, sem caminho ou barra final. Para upload de imagens, configure também o CORS do bucket com essa origem. O proxy da API não elimina o CORS do upload direto ao provedor.

Credenciais AWS/Mux, signing keys e segredo JWT pertencem exclusivamente ao backend. Variáveis `VITE_*` entram no bundle público e não podem conter segredos.

## Usar o fluxo de revisão

1. Cadastre um cliente, crie um projeto e mova-o para **Em edição**.
2. Abra **Publicar nova versão** e escolha **Vídeo** ou **Imagem**.
3. Envie um arquivo ou selecione uma mídia da **Biblioteca**. Aguarde a disponibilidade.
4. Confirme **Publicar** para iniciar a revisão. A mídia pode ser reutilizada em versões/projetos do mesmo profissional.
5. Compartilhe o magic link com o cliente, que pode visualizar, comentar e aprovar ou solicitar alterações.
6. Após rejeição, o projeto retorna para edição e preserva o histórico. Publique a próxima versão.

Somente a versão mais recente, disponível e com projeto em revisão pode ser aprovada/rejeitada. Mídias vinculadas a versões não podem ser excluídas. Aprovar não equivale a revogar o magic link; o profissional pode revogá-lo explicitamente. Links temporários de mídia já emitidos valem até sua expiração.

## Vídeos

Requer módulo de vídeo habilitado e credenciais Mux/signing configuradas no backend. A integração de projeto foi introduzida na V7; mantenha o backend atualizado com todas as migrations.

- Uploads no projeto permanecem em rascunho até a publicação. Rascunho recuperável não significa retomada dos bytes: o envio atual usa PUT simples, sem retomada por chunks.
- É possível selecionar um vídeo enquanto processa para acompanhar o estado; publicar exige `PRONTO` e projeto em edição.
- Cancelar exige **Cancelar envio → Confirmar cancelamento**, com opção de continuar.
- Miniaturas reais usam URLs assinadas e carregamento próximo à área visível. Vídeos em processamento têm atualização periódica de estado.
- Player prioriza HLS.js/MSE e usa HLS nativo quando necessário. Trocas/desmontagem cancelam sessões antigas; recuperação e renovação são controladas.
- O feedback captura versão e segundo ao abrir o overlay. O vídeo continua tocando; fechar mantém o texto, que só é limpo após confirmação de envio.

Versões antigas por URL continuam reproduzíveis; a interface não oferece criação de versão por link externo. Consulte [contratos e operação de vídeos no projeto](https://github.com/lucasrbordignon/take-too/blob/main/docs/videos-no-projeto.md).

## Imagens

Requer backend atualizado com a V8, `IMAGEM_ENABLED=true`, adaptador S3 configurado e bucket privado com IAM/CORS corretos.

- JPEG/PNG até 10 MiB e 25 milhões de pixels por padrão.
- O web calcula SHA-256, faz PUT direto com URL e headers temporários, sem JWT/cookies da API no S3, e solicita confirmação.
- A API valida o arquivo real antes de liberar publicação. A escrita condicional impede substituir um objeto já enviado.
- **Verificar envio** recupera a confirmação de um arquivo já enviado após sair da tela. Se o arquivo ainda não foi enviado, selecione-o novamente.
- Prévias e revisão usam URLs assinadas após autorização. O cliente acessa a imagem pela versão do seu projeto, sem acesso à biblioteca.
- Comentários não enviam `tempoVideo`; aparecem por ordem de criação. O visualizador não usa controles de vídeo.
- Imagens publicadas são protegidas contra exclusão. Marca d'água em imagens ainda não está implementada.

Consulte [configuração S3, contratos e evidências](https://github.com/lucasrbordignon/take-too/blob/main/docs/imagens-s3.md).

## Rotas principais

- `/login`: acesso do profissional.
- `/dashboard`, `/clientes`, `/projetos`, `/comentarios`: gestão.
- `/projetos/:id`: detalhes e publicação.
- `/projetos/:projetoId/versoes/:versaoId`: revisão do profissional.
- `/videos` e `/imagens`: bibliotecas.
- `/portal/projetos/:id`: revisão do cliente via magic link.

A camada `src/services` consome as rotas de autenticação, gestão, bibliotecas e portal. Os contratos completos estão no Swagger e no Insomnia do backend. Rotas `/api/portal/**` usam o token do cliente; as demais rotas protegidas usam o token do profissional.

## Validação e build

```bash
npm run lint
npm test
npm run build
npm run preview
```

Em 16/10/2026: 33 testes web passaram, lint e build concluídos. Os testes cobrem contratos de vídeo/imagem, reprodução, recuperação de envio e feedback em overlay. A API foi validada com S3 real e PostgreSQL; o backend registra as evidências. A conferência visual em navegador/mobile permanece pendente.

## Deploy

O ambiente atual usa Vercel para o web e Docker Compose na VPS para a API. Configure no ambiente de produção da Vercel:

```dotenv
VITE_API_URL=https://api-taketoo.kinkan.cloud
```

As variáveis Vite são incorporadas no build; mudanças exigem novo deploy. O ambiente atual publica a branch `main` automaticamente. Em hospedagem estática alternativa, publique `dist/` e configure fallback para `index.html` nas rotas da aplicação. O proxy definido em `vite.config.ts` só atende o desenvolvimento.

No backend e nos provedores, autorize `https://taketoo.kinkan.cloud` nas configurações correspondentes. Publique o backend compatível antes do web. Após deploy, confira `/api/ping`, biblioteca autenticada, upload/reprodução e portal.

## Diagnóstico

- **401 na API:** sessão ausente/expirada/inválida ou magic link revogado. O profissional tem refresh controlado; o cliente precisa de um link válido.
- **403:** papel sem permissão ou origem CORS não permitida. Confira a resposta e o header `Origin`.
- **503 de vídeo/imagem:** módulo desativado, credenciais ausentes ou indisponibilidade do provedor. Confira o ambiente efetivo do container.
- **503 de signing:** configure `MUX_SIGNING_KEY_ID` e `MUX_SIGNING_PRIVATE_KEY` no backend e recrie a API; não basta reiniciar.
- **Upload de imagem recusado:** confira CORS do bucket, headers retornados e validade da autorização. Após envio possivelmente concluído, use a confirmação para recuperar, evitando repetir o PUT.

## Organização

- `src/api`: cliente HTTP, autenticação e DTOs.
- `src/components`: modais, seletores, player, visualizador e overlay.
- `src/hooks`: consultas e mutações de domínio.
- `src/pages`: telas do profissional e portal.
- `src/services`: integração com a API.
- `src/lib` e `src/utils`: upload, reprodução e utilitários.
