# Handoff: etapa 1 → etapa 2

Este documento registra o que a etapa 1 da reformulação entregou (portfólio → site comercial de serviços) e o que a etapa 2 precisa saber para acrescentar modelos 3D, animações mais elaboradas e, futuramente, a seção de trabalhos desenvolvidos.

## O que foi implementado

- **Abertura comercial.** O título principal agora é a oferta (“Sites e sistemas web para o seu negócio.”). O nome aparece como identificação secundária, no texto acima do título. Os botões são “Conhecer os serviços” (`#services`) e “Conversar sobre meu projeto” (`#contact`).
- **Serviços** como seção principal: um seletor por necessidade e quatro blocos completos (landing page, site institucional, sistema web, automações e integrações). Cada bloco responde: o que é, quando faz sentido, o que pode incluir, como funciona na prática e qual é o próximo passo. Também traz uma chamada de contato específica e uma interface ilustrativa feita em HTML/CSS.
- **Computador, tablet e celular**: texto em linguagem simples, quatro pontos e uma composição com três aparelhos. Em cada um, o mesmo conteúdo é **reorganizado**, não apenas reduzido.
- **Como funciona**: o passo a passo existente (rolagem fixa no desktop, lista expansível no celular e avanço automático) foi transferido para uma seção própria, com as seis novas etapas.
- **Quem desenvolve**: apresentação breve, em primeira pessoa, com três compromissos de trabalho e o link do LinkedIn.
- **Contato**: “Me conte o que você precisa.”, com uma lista do que ajuda contar na mensagem. O contato real foi mantido: o email ofuscado, o botão para copiar e o envio por `mailto`.
- **Removidos da experiência pública**: Projetos, Tecnologias e Atividade/estatísticas do GitHub, além dos links no menu, no rodapé, na paleta (⌘K) e nos atalhos `g + tecla`. Também foram removidos a busca de estatísticas no build, o workflow semanal `refresh-stats.yml`, o script `fetch-github-stats.mjs`, `StackActivity.astro`, `src/lib/github-stats.ts`, `src/data/stack.json`, `src/data/github-stats.json` e o CSS que ficou sem uso (chips de tecnologia, heatmap, barra de linguagens, `.step*`, `.scroll-cue`, `.divider`). Tudo continua disponível no histórico do git.
- **Metadados**: título, descrição, Open Graph e Twitter nos dois idiomas, imagens de compartilhamento (`public/og.png` e `public/og-en.png`, geradas no build), `site.webmanifest`, JSON-LD (`Person` com `makesOffer` listando os quatro serviços) e a prévia do site na tela do notebook 3D.
- **Versão em inglês** completa, com a mesma estrutura de dados.

## Arquivos principais e identificadores

| Ordem | Seção | `id` | Arquivo |
|---|---|---|---|
| 0 | Abertura | `#hero` | `src/components/hero/Hero.astro` |
| 1 | Serviços | `#services` | `src/components/sections/Services.astro` + `ServiceVisual.astro` |
| 1.1–1.4 | Blocos de serviço | `#service-landing`, `#service-website`, `#service-webapp`, `#service-automation` | idem |
| 2 | Computador, tablet e celular | `#devices` | `src/components/sections/Devices.astro` |
| 3 | Como funciona | `#process` (título: `#process-heading`) | `src/components/sections/Process.astro` |
| 4 | Quem desenvolve | `#about` | `src/components/sections/About.astro` |
| 5 | Contato | `#contact` | `src/components/sections/Contact.astro` |

- Páginas: `src/pages/index.astro` (pt) e `src/pages/en/index.astro` (en).
- Textos: `src/i18n/pt.json` e `src/i18n/en.json`. As chaves usadas são `hero`, `services`, `devices`, `process`, `about`, `contact`, `nav`, `meta`, `footer` e `commandPalette`. O tipo `Dictionary` vem do `en.json`, então as duas versões precisam ter a mesma forma.
- Menu, rodapé e paleta: `Header.astro`, `Footer.astro` e `CommandPaletteDialog.tsx`. Os atalhos de teclado são `g` + `v` (serviços), `p` (como funciona), `a` (sobre) e `c` (contato).
- Metadados: `src/layouts/BaseLayout.astro`, `scripts/generate-og-image.mjs` e `public/site.webmanifest`.

## Estrutura dos blocos de serviço

Cada item de `services.offerings` tem:

```jsonc
{
  "id": "service-landing",      // âncora do bloco (igual nos dois idiomas)
  "kind": "landing",            // landing | website | webapp | automation → escolhe a ilustração
  "title": "...", "kicker": "...",
  "need": "...",                // frase usada no seletor “Qual opção combina…”
  "what": "...",                // O que é
  "callout": "",                // destaque opcional (diferença p/ landing page; viabilidade da automação)
  "when": [], "includes": [],   // Quando faz sentido / O que pode incluir
  "includesNote": "...",        // ressalva: itens são definidos no orçamento/escopo
  "practice": "...",            // Como funciona na prática
  "nextStep": "...", "cta": "...",
  "visual": { "caption": "", "labels": [], "details": [], "states": [], "action": "" }
}
```

Marcação de cada bloco (`Services.astro`):

```
article#<id>.service-block[data-service=<kind>]
  .service-copy        → textos (eyebrow, h3, listas, próximo passo + CTA para #contact)
  .service-visual-col  → fica fixa (sticky) no desktop enquanto o texto rola
    figure.sv.sv-<kind>[data-service-visual=<kind>]
      .sv-frame (aria-hidden) → interface ilustrativa com selo “Ilustração”
      figcaption.sv-caption   → descrição acessível da ilustração
```

Os blocos pares invertem a ordem (ilustração à esquerda) a partir de 1024px.

### Representações visuais (`ServiceVisual.astro`)

Todas são feitas em HTML/CSS, legíveis sem JavaScript ou WebGL, ficam ocultas para leitores de tela (`aria-hidden`) e são descritas pelo `figcaption`. As partes animáveis têm `data-part`:

- **landing**: uma página em quatro blocos na ordem de leitura. `data-part="hero" | "benefits" | "info" | "cta"`.
- **website**: barra de navegação com a página atual destacada e um mapa de páginas (Início → Sobre / Serviços → Serviço 1, 2 / Contato). `data-part="nav" | "sitemap"`.
- **webapp**: menu lateral, que vira abas abaixo de 480px, indicadores por status sem números e uma tabela de solicitações. `data-part="sidebar" | "main" | "summary" | "table"`.
- **automation**: três ferramentas ligadas por conexões “Automático”, com um pulso CSS que percorre a linha. `data-part="flow" | "node-1..3" | "link-1..2"`.

## Pontos preparados para animação e 3D

- `[data-service="<kind>"]` e `[data-service-visual="<kind>"]`: são os alvos para trocar ou sobrepor a ilustração por um modelo 3D. A coluna `.service-visual-col` já fica fixa (`sticky`) no desktop, então uma cena pode reagir à rolagem do texto ao lado.
- `[data-part]` dentro de cada ilustração permite animar entradas parte por parte, sem depender da estrutura de classes.
- `#devices [data-devices]` é o palco, e `[data-device="desktop" | "tablet" | "phone"]` marca cada aparelho. Cada `.device-shell` é um container de consulta (`container-type: inline-size`), e o conteúdo interno usa `cqw`. Por isso, um modelo 3D pode substituir só a moldura e reaproveitar o conteúdo como textura ou como camada HTML.
- O `#hero` continua com o notebook 3D (`LaptopScene.ts`), carregado de forma tardia. A tela pintada em canvas foi atualizada para mostrar a oferta, o nome e os itens de menu atuais.
- Para animações de entrada, use `data-reveal`/`.is-revealed` (`lib/interactions.ts`), que já trata a redução de movimento e tem uma rede de segurança para abas em segundo plano.

## Efeitos existentes e cuidados de compatibilidade

- **Notebook 3D**: os testes em `scripts/check-resilience.mjs` cobrem o pôster estático quando há movimento reduzido, economia de dados, 2 GB de memória, conexão 3G, falha no download e ausência de WebGL; também cobrem a limitação de FPS. A imagem `public/media/laptop.webp` é o pôster. Ela mostra só o notebook, sem texto do site antigo.
- **Como funciona**: o script do passo a passo agora fica em `Process.astro`, e o teste passou a ler esse arquivo. Abaixo de 1024px ou de 540px de altura, a seção usa `<details>` nativos. O avanço automático respeita `prefers-reduced-motion`.
- **Brilho no toque** (`initServiceScroll`): continua atuando nos cartões `.offering` do seletor de serviços. O efeito de painéis empilhados (`initStack`, `.stack-item`) não tem alvo na página atual e fica inativo até a seção de exemplos voltar a usá-lo.
- **Orçamento de desempenho** (`scripts/check-performance-budget.mjs`): o CSS total está em **89,8 de 90 KiB** (tamanho bruto). Para caber, os estilos de `Services`, `ServiceVisual`, `Devices` e `Process` usam `<style is:global>`. Todas as classes desses componentes têm prefixo próprio (`service-`, `offering-`, `sv-`, `device-`, `dm-`, `devices-`, `process-`), o que evita colisões e o atributo de escopo do Astro em cada seletor. Os estilos de `ProjectCard` e `Marquee` foram movidos do `global.css` para os próprios componentes e só são carregados quando eles aparecem na página. **Na etapa 2, qualquer CSS novo vai estourar o limite.** Antes de acrescentar estilos, remova outros ou discuta um novo limite, em vez de aumentá-lo sem critério.
- **JavaScript inicial**: 327,8 de 360 KiB. Modelos 3D devem ser importados dinamicamente, como `LaptopScene`, para não entrar nesse total.
- **Temas e idiomas**: todas as cores usam os tokens de `global.css` (`--color-*`). A única cor fixa nova é o âmbar do status “Em andamento” (`.sv-state-1`).

## Validações feitas

- `npm run check`: 0 erros, 0 avisos e 0 dicas.
- `node scripts/check-mobile-motion.mjs`: passou.
- `node --test scripts/check-resilience.mjs`: 34 de 34 testes passaram. As únicas mudanças foram o caminho do arquivo do passo a passo (`Process.astro`) e o `href` usado na simulação do menu (`#services`).
- `npm run build` + `node scripts/check-performance-budget.mjs`: todos os limites foram respeitados.
- Inspeção visual no build de produção (`astro preview`) em 1440px (tema escuro, pt), 768px (tema claro, en) e 375px (tema escuro, pt): sem rolagem horizontal (`scrollWidth === clientWidth`) e sem sobreposições. O console só mostrou o bloqueio de CORS do Cloudflare Analytics, que é esperado em localhost.

## Limitações e informações pendentes

- “Costumo responder em até 24h” foi mantido do site anterior. Confirme se continua valendo.
- O texto de “Quem desenvolve” usa só o que já estava publicado: engenheiro de software, Brasil, trabalho independente e LinkedIn. Se quiser, acrescente formação, tempo de experiência ou cidade.
- Sem JavaScript, o email do contato continua aparecendo como “Carregando email…”, como já acontecia antes, porque o endereço é montado no navegador para dificultar a coleta automática.
- A tela do notebook 3D é pintada em inglês nos dois idiomas, como antes.
- A prévia em canvas e o pôster do notebook não foram redesenhados. Isso fica para a etapa 2, junto com os novos modelos.
- Não foram feitos commit, push nem publicação.

## Futura seção de trabalhos desenvolvidos

**Onde entra.** Entre `<Process />` e `<About />`, nas duas páginas. Há um comentário marcando o lugar em `src/pages/index.astro` e `src/pages/en/index.astro`. Sugestão de `id`: `#work`. Quando ela existir, acrescente `{ href: '#work', id: 'work', label: dict.nav.work }` aos `navItems` de `Header.astro` e `Footer.astro`; a paleta usa a mesma lista. Opcionalmente, crie o atalho `g + w`. Renumere os índices `(04)`/`(05)` em `about.index` e `contact.index`.

**Dados necessários por trabalho**:

| Campo | Observação |
|---|---|
| `title` | por idioma |
| `description` | por idioma, curta e factual |
| `service` | `landing` \| `website` \| `webapp` \| `automation`: liga o trabalho ao bloco de serviço correspondente |
| `image` | caminho em `public/media/...`, com texto alternativo por idioma |
| `url` | link para o trabalho publicado (opcional, se o cliente autorizar) |

Os dados podem ficar em um JSON em `src/data/`. O arquivo `src/data/projects.json` antigo segue uma estrutura parecida (`id`, `enabled`, `demoUrl`, `translations.{pt,en}`) e foi mantido como referência, sem ser exibido. Os projetos antigos (Consulta CNPJ, Racha Contas, Achados e Perdidos, Eleições Brasil) **não** devem voltar como exemplos.

**Componentes que podem ser reaproveitados**:

- `src/components/sections/ProjectCard.astro`: cartão com mídia (vídeo/gif via `lib/media.ts`), inclinação 3D e estilos próprios (`is:global`, carregados só quando ele é usado). Precisa trocar `stack`/`problem` por `service` e remover os ícones específicos dos projetos antigos.
- `src/components/sections/Projects.astro`: lista antiga com painéis empilhados (`.stack-list` + `initStack`). Fica como referência de layout e não é importada em nenhuma página. Remova o JSON-LD de `SoftwareApplication` se não fizer sentido.
- `SectionHeading.astro`, `RevealText.astro`, `.card`, `.spot-card` e `data-reveal` para seguir o padrão visual das outras seções.
- Os ícones por tipo de serviço (`KIND_ICONS` em `Services.astro`) podem servir de selo de categoria em cada trabalho.

Não exiba a seção vazia, um aviso de “em breve” nem um item de menu sem destino. Acrescente tudo junto quando houver ao menos um trabalho real e autorizado.
