<p align="center">
  <img src="/public/logo.png" alt="TakeToo Logo" width="96" height="96" />
</p>

<h1 align="center">TakeToo Web</h1>

<p align="center">
  <strong>Plataforma moderna de revisão e aprovação de cortes de vídeo por timecode para videomakers, editores e seus clientes.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-8.3-646CFF?logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/TailwindCSS-v4-06B6D4?logo=tailwindcss&logoColor=white" alt="TailwindCSS" />
  <img src="https://img.shields.io/badge/TanStack_Query-v5-FF4154?logo=reactquery&logoColor=white" alt="TanStack Query" />
</p>

---

## 📌 Visão Geral

O **TakeToo Web** é a interface do profissional audiovisual e de seus clientes para eliminar o atrito de comunicação em revisões de vídeo. Em vez de anotações desorganizadas por WhatsApp ou e-mails imprecisos, os clientes assistem aos cortes de vídeo através de um **Magic Link** seguro (sem necessidade de cadastro ou senha) e registram seus feedbacks diretamente no **segundo exato (timecode)** da timeline.

O profissional centraliza em um único dashboard a esteira completa de pós-produção: publicação de versões, controle de status, métricas de crescimento e acompanhamento de aprovação formal.

---

## 🚀 Principais Recursos

### 1. 🎬 Player de Vídeo Interativo com Timecode
- **Timeline & Scrubber Sincronizados**: linha de reprodução contínua com marcações visuais das anotações existentes.
- **Navegação Rápida por Anotação**: clicar em qualquer comentário salta instantaneamente o vídeo para o timecode registrado.
- **Congelamento Inteligente para Feedback**: ao iniciar um comentário, o segundo exato é congelado para digitação confortável.
- **Suporte Híbrido de Vídeos**: suporte a arquivos locais, URLs diretas em CDN/S3 e streams públicos de demonstração.

### 2. 🔗 Portal do Cliente via Magic Link (Sem Senha)
- Acesso imediato pelo cliente via link exclusivo sem fricção de cadastro.
- Ações no portal:
  - Visualização de todas as versões disponibilizadas pelo profissional.
  - Registro de comentários com segundo exato.
  - **Decisão Formal de Versão**: botão de aprovação (`APROVADA`) ou solicitação de alterações (`REJEITADA`).
- **Revogação Automática**: ao ser aprovado ou entregue, o Magic Link é automaticamente bloqueado para novas anotações, assegurando integridade do corte final.

### 3. 🚦 Regras de Negócio & Modais de Etapas
- Ciclo de vida controlado: `Gravação Concluída` ➔ `Em Edição` ➔ `Revisão do Cliente` ➔ `Aprovado` ➔ `Entregue`.
- **Modais de Confirmação Contextuais**:
  - Confirmação visual de transição de etapa com feedback em tempo real.
  - **Trava de Aprovação**: somente o cliente pode aprovar formalmente no portal.
  - **Trava de Entrega**: o profissional só pode marcar como "Entregue" após a aprovação formal do cliente.
  - **Reabertura Extraordinária**: possibilidade de devolver para revisão com reativação do Magic Link caso o cliente aprove por engano.

### 4. 📊 Dashboard Dinâmico em Tempo Real
- **Métricas Consolidadas**:
  - Projetos em produção com indicador dinâmico de novos na semana (`+X esta semana`).
  - Projetos aguardando aprovação com alerta de SLA (`X há mais de 2 dias` ou `"Tudo em dia"`).
  - Projetos concluídos com indicador mensal (`+X este mês`).
- **Projetos Recentes**: Top 5 projetos reais atualizados do profissional com badges de etapa e links diretos.

### 5. 👥 Ficha e Gestão Completa de Clientes
- Tabela com contagem de projetos calculada em lote e auditoria de última atividade (`"há 15 min"`, `"há 2 h"`).
- **Ficha Centralizada do Cliente**: modal detalhado com formatação de telefone, atalho direto para WhatsApp (`wa.me`) e lista de projetos associados.

### 6. ⏱ Feed de Atividades Real do Projeto
- Histórico cronológico vivo agrupando: criação do projeto, publicação de cortes, comentários com timecode e aprovações/rejeições.
- Formatação de tempo relativo amigável em pt-BR.

### 7. 🔐 Autenticação & Renovação Silenciosa de Sessão
- Autenticação JWT com isolamento estrito entre `ROLE_PROFISSIONAL` e `ROLE_CLIENTE`.
- **Refresh Token Silencioso**: interceptor Axios com proteção de concorrência (`isRefreshing` e fila de requisições pendentes), trafegando via cookie `HTTP-Only`.

---

## 🛠️ Tecnologias Utilizadas

- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Linguagem**: [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
- **Estilização**: [TailwindCSS v4](https://tailwindcss.com/) (Design System moderno dark mode)
- **Roteamento**: [React Router DOM v7](https://reactrouter.com/)
- **Gerenciamento de Estado de Servidor**: [TanStack React Query v5](https://tanstack.com/query/latest)
- **Cliente HTTP**: [Axios](https://axios-http.com/) com interceptores customizados
- **Feedback ao Usuário**: Notificações Toast nativas customizadas e acessíveis

---

## 📂 Estrutura de Diretórios

```bash
take-too-web/
├── public/                     # Imagens estáticas, logotipos e favicons
│   ├── logo.png
│   └── preview.mp4
├── src/
│   ├── api/                    # Cliente HTTP (Axios) e DTOs/Interfaces TypeScript
│   │   ├── client.ts           # Interceptores de autenticação e refresh token
│   │   └── types.ts            # DTOs sincronizados com o backend Spring Boot
│   ├── components/             # Componentes de UI e Modais
│   │   ├── shared/             # Modais reutilizáveis, Player de Vídeo, Stepper
│   │   ├── AuthPage.tsx        # Tela de login com player interativo de demonstração
│   │   ├── Layout.tsx          # Shell do painel profissional com sidebar e header
│   │   ├── NovaVersaoModal.tsx # Modal de upload/publicação de cortes
│   │   └── NovoProjetoModal.tsx# Modal de criação de projetos
│   ├── context/                # Contextos globais (AuthContext, ToastContext)
│   ├── data/                   # Dados de fallback e vitrine de demonstração
│   │   └── showcaseClients.ts
│   ├── hooks/                  # Hooks React Query customizados
│   │   ├── useAtividades.ts    # Feed de atividades do projeto
│   │   ├── useClientes.ts      # Listagem e criação de clientes
│   │   ├── useDashboardMetricas.ts # Métricas consolidadas do dashboard
│   │   ├── usePortal.ts        # Rotas públicas do cliente via Magic Link
│   │   ├── useProjetos.ts      # CRUD e status de projetos
│   │   └── useVersoes.ts       # Publicação e listagem de versões
│   ├── pages/                  # Telas da aplicação
│   │   ├── ClientPortalPage.tsx# Portal de revisão do cliente
│   │   ├── ClientesPage.tsx    # Listagem e busca de clientes
│   │   ├── ComentariosPage.tsx # Central de anotações e filtros por timecode
│   │   ├── DashboardPage.tsx   # Painel inicial do profissional
│   │   ├── ProjetoDetalhesPage.tsx # Detalhes, stepper de etapas e versões
│   │   └── VersaoDetalhesPage.tsx  # Player do profissional para anotações
│   ├── services/               # Camada de comunicação com a API REST
│   └── utils/                  # Formatadores de datas relativas e números
├── index.html
├── package.json
└── vite.config.ts
```

---

## 🌐 Endpoints da API Integrados

A aplicação consome 19 endpoints REST expostos pelo backend Spring Boot (`take-too`):

| Domínio | Método | Endpoint | Papel Necessário | Descrição |
|---|---|---|---|---|
| **Auth** | `POST` | `/api/auth/login` | Público | Autenticação do profissional |
| **Auth** | `POST` | `/api/auth/register` | Público | Cadastro de novo profissional |
| **Auth** | `POST` | `/api/auth/refresh` | Público / Cookie | Renovação silenciosa do token |
| **Auth** | `POST` | `/api/auth/magic-link`| `ROLE_PROFISSIONAL` | Geração do Magic Link do cliente |
| **Auth** | `POST` | `/api/auth/logout` | Autenticado | Encerramento de sessão |
| **Profissional** | `GET` | `/api/profissionais/me` | `ROLE_PROFISSIONAL` | Perfil do profissional logado |
| **Dashboard** | `GET` | `/api/dashboard/metricas` | `ROLE_PROFISSIONAL` | Métricas e projetos recentes |
| **Clientes** | `GET` | `/api/clientes` | `ROLE_PROFISSIONAL` | Lista de clientes com contadores em batch |
| **Clientes** | `GET` | `/api/clientes/{id}` | `ROLE_PROFISSIONAL` | Ficha detalhada do cliente |
| **Clientes** | `POST` | `/api/clientes` | `ROLE_PROFISSIONAL` | Cadastro de novo cliente |
| **Projetos** | `GET` | `/api/projetos` | `ROLE_PROFISSIONAL` | Lista de projetos do profissional |
| **Projetos** | `GET` | `/api/projetos/{id}` | `ROLE_PROFISSIONAL` | Detalhes e status do projeto |
| **Projetos** | `POST` | `/api/projetos` | `ROLE_PROFISSIONAL` | Criação de novo projeto |
| **Projetos** | `PATCH` | `/api/projetos/{id}/status` | `ROLE_PROFISSIONAL` | Atualização da etapa de produção |
| **Projetos** | `POST` | `/api/projetos/{id}/revogar-link` | `ROLE_PROFISSIONAL` | Revogação de acesso ao Magic Link |
| **Projetos** | `GET` | `/api/projetos/{id}/atividades` | `ROLE_PROFISSIONAL` | Feed cronológico de eventos reais |
| **Versões** | `GET` | `/api/projetos/{id}/versoes` | `ROLE_PROFISSIONAL` | Histórico de cortes de vídeo |
| **Versões** | `POST` | `/api/projetos/{id}/versoes` | `ROLE_PROFISSIONAL` | Publicação de novo corte |
| **Comentários** | `GET` | `/api/versoes/{id}/comentarios` | `ROLE_PROFISSIONAL` | Lista de comentários por timecode |
| **Comentários** | `POST` | `/api/versoes/{id}/comentarios` | `ROLE_PROFISSIONAL` | Nova anotação do profissional |
| **Portal** | `GET` | `/api/portal/projetos/{id}` | `ROLE_CLIENTE` | Dados do projeto via Magic Link |
| **Portal** | `GET` | `/api/portal/projetos/{id}/versoes` | `ROLE_CLIENTE` | Versões disponíveis para o cliente |
| **Portal** | `GET` | `/api/portal/versoes/{id}/comentarios` | `ROLE_CLIENTE` | Comentários visíveis no portal |
| **Portal** | `POST` | `/api/portal/versoes/{id}/comentarios` | `ROLE_CLIENTE` | Feedback com timecode do cliente |
| **Portal** | `PATCH` | `/api/portal/versoes/{id}/status` | `ROLE_CLIENTE` | Decisão (Aprovar / Rejeitar corte) |

---

## 💻 Como Rodar o Projeto

### Pré-requisitos
- [Node.js](https://nodejs.org/) versão `20.x` ou superior
- Gerenciador de pacotes `npm` ou `pnpm`
- Backend `take-too` rodando em `http://localhost:8082` (opcional: a aplicação possui modo showcase integrado para navegação visual)

### 1. Clonar o repositório e entrar no diretório
```bash
git clone https://github.com/lucasrbordignon/take-too-web.git
cd take-too-web
```

### 2. Instalar as dependências
```bash
npm install
```

### 3. Configurar variáveis de ambiente (Opcional)
Crie um arquivo `.env` na raiz do projeto caso deseje apontar para uma URL externa do backend (por padrão, o Vite faz proxy de `/api` para `localhost:8082`):
```env
VITE_API_URL=http://localhost:8082
```

### 4. Iniciar o servidor de desenvolvimento
```bash
npm run dev
```
O frontend estará acessível em: `http://localhost:5173`.

### 5. Validar código e gerar bundle de produção
```bash
# Executa a verificação estrita do ESLint
npm run lint

# Executa a compilação do TypeScript e empacotamento do Vite
npm run build

# Visualiza o build de produção localmente
npm run preview
```

---

## 🎨 Identidade Visual & Design System

A interface do TakeToo adota um estilo **dark mode** elegante e imersivo, planejado especificamente para ambientes de edição de vídeo:
- **Cores de Destaque**: Roxo vibrante (`#8B5CF6`), Índigo (`#6366F1`), Âmbar (`#F59E0B`) e Esmeralda (`#10B981`).
- **Superfícies & Profundidade**: Tons grafite profundos (`#07090D`, `#12151C`, `#1A1D24`) com bordas sutis (`#2E3440` / `#343946`) e sombras suaves.
- **Tipografia**: Hierarquia balanceada com fontes sem serifa modernas e elementos monoespaçados para timecodes de vídeo.

---

## 📄 Licença

Este projeto está sob a licença [MIT](LICENSE).


## Vídeos no projeto — etapa 1

Em um projeto em edição, **Publicar nova versão** oferece envio de arquivo,
seleção da biblioteca em um único modal. O envio fica como rascunho
recuperável ao reabrir o modal; publicar é uma ação separada, habilitada somente
para vídeos prontos. O player do profissional e o portal usam sessões HLS
temporárias autorizadas pela versão, mantendo comentários por tempo.

A exclusão pede confirmação e apresenta a mensagem do backend quando o vídeo
está protegido por uma versão publicada. Publicação atualiza versões, projeto e
dashboard. Upload usa a origem atual do navegador; configure essa origem no
CORS e em VIDEO_ALLOWED_ORIGINS do backend.

Requer backend com a migration V7 e rotas de projeto/portal documentadas em
docs/videos-no-projeto.md no repositório take-too. Playback real requer as
chaves de signing configuradas no backend; elas nunca vão para o frontend.
URLs temporárias não são persistidas. O envio atual é um PUT simples, sem
retomada automática por chunks; rascunho recuperável não significa retomada dos
bytes após falha de rede.

Verificações: `npm test`, `npm run lint` e `npm run build`.

### Seleção e acompanhamento de vídeos

A publicação mantém a seleção ao trocar de página ou origem. Após enviar um arquivo pelo projeto, ele fica selecionado enquanto processa; publicar continua sendo uma confirmação explícita. O resumo mostra quando está pronto. A biblioteca atualiza os vídeos em processamento com intervalo progressivo, pausa em abas ocultas ou sem conexão e atualiza o cache sem recarregar a lista para cada vídeo. No projeto, somente o vídeo selecionado é reconciliado com o provedor; os rascunhos são consultados a cada 15 segundos enquanto houver envios pendentes.

O modal de publicação oferece apenas envio de arquivo e seleção da biblioteca. Arquivo, prévia, nome e progresso aparecem no próprio modal, sem abrir outra janela. Links externos continuam disponíveis somente nas versões legadas; a criação pela interface usa vídeos da biblioteca.

Cancelar um upload exige dois cliques: “Cancelar envio” e “Confirmar cancelamento”. A confirmação aparece no próprio formulário, com a opção “Continuar envio”.

As origens usam abas com indicador de seleção e navegação por teclado. As miniaturas reais são carregadas somente para cards próximos à área visível, por URL assinada devolvida em `miniaturaUrl` pelo playback. Vídeos verticais preservam o enquadramento. Enquanto processam ou quando a prévia falha, o card mantém um placeholder. Requer backend atualizado e credenciais de signing configuradas.

O histórico do projeto mostra versões em ordem numérica decrescente (Vn → V1). Portal e comentários escolhem a versão de maior número independentemente da ordem devolvida pela API. Se o playback responder 503 com signing ausente, configure as duas variáveis `MUX_SIGNING_KEY_ID` e `MUX_SIGNING_PRIVATE_KEY` no `.env` do backend e execute `docker compose up -d --force-recreate api`; apenas reiniciar não reaplica o ambiente.

### Reprodução HLS e diagnóstico

O portal, a versão do profissional e a biblioteca usam o mesmo controle de reprodução. O player prioriza HLS.js/MSE (inclusive no Brave/Chromium) e usa reprodução nativa quando MSE não está disponível. Troca de vídeo, desmontagem e renovação cancelam sessões antigas. Falhas de autorização permitem uma única renovação automática; falhas de decodificação permitem uma recuperação de mídia. A interface distingue rede, autorização, formato e decodificação, com um código em “Detalhes do erro”, sem expor URLs assinadas ou tokens. A indicação de carregamento só termina quando o vídeo possui dados reproduzíveis ou ocorre uma falha.

### Feedback sem interromper o vídeo

Adicionar feedback abre um painel flutuante não modal sobre a revisão, sem trocar a tela, remontar o player ou pausar o vídeo. Os controles do vídeo continuam disponíveis. O comentário usa o segundo e a versão capturados ao abrir o painel, mesmo que a reprodução avance. Fechar preserva o rascunho; o texto só é limpo após envio confirmado. Falhas mantêm o painel e apresentam erro para tentar novamente.

### Imagens privadas no S3

A biblioteca **Imagens** permite enviar JPEG/PNG (até 10 MB e 25 megapixels por padrão), selecionar arquivos anteriores e excluir imagens não publicadas. O projeto oferece seleção do tipo de mídia no modal de publicação. Upload direto usa URL temporária, checksum SHA-256 e escrita condicional para impedir sobrescrita; a API confirma o arquivo real antes de liberar a publicação. A revisão de imagem usa visualização privada e comentários sem timestamp; versões e aprovação seguem o mesmo fluxo dos vídeos. Credenciais AWS ficam exclusivamente no backend. Consulte `docs/imagens-s3.md` no repositório take-too para IAM, CORS e variáveis.
