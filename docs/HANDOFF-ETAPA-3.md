# Handoff — etapa 3: revisão e acabamento

## Objetivo da próxima etapa

A etapa 3 será a revisão final pelo Claude: corrigir problemas pontuais de texto, layout, navegação, acessibilidade e metadados, preservando a direção visual e o funcionamento das animações. Não redesenhar o site, reescrever toda a apresentação ou substituir a arquitetura das cenas.

Este documento registra o estado após a etapa 2 e orienta a revisão. Não representa uma validação já executada da etapa 3.

## Base correta de trabalho

- Repositório de referência: https://github.com/lucianookdp/portfolio-lucianookdp.
- A etapa 2 partiu da versão local em `C:\dev\portfolio-lucianookdp`, mas foi implementada em uma cópia. Na etapa 3, essa cópia foi trazida para o repositório no commit `b1db2c8` (branch `feat/foco-em-servicos`). Desde então, o repositório é a base de trabalho.
- A versão atualizada desta entrega está em:

  `C:\Users\Luciano\Documents\Codex\2026-11-04\files-pasted-by-the-user-implemente\outputs\portfolio-lucianookdp`

- O pacote `portfolio-etapa-2.zip`, na pasta `outputs` acima, também contém essa implementação. Não inclui `node_modules`, `dist`, caches ou histórico Git.
- Não houve commit, push nem publicação. O repositório remoto e o site público podem estar desatualizados; não os use como substitutos da base local entregue.
- Antes de editar, leia `docs/HANDOFF-ETAPA-2.md`, este documento e `docs/ENTREGA-ETAPA-2.md`, e examine o código. O primeiro handoff descreve o estado anterior; as mudanças abaixo o atualizam.

## Logos e design

**Caso precise dos arquivos de logos, identidade visual ou design, a pasta indicada pelo Luciano é:**

```text
C:\Users\Luciano\Desktop\LUCIANO\branding\lucianookdp
```

Consulte os arquivos dessa pasta quando necessário para conferir a identidade visual ou reutilizar os materiais existentes. O caminho foi informado pelo usuário; seu conteúdo não foi inspecionado nesta atualização documental. Preserve a identidade aprovada.

## Escopo comercial a preservar

As ofertas continuam sendo landing pages, sites institucionais, sistemas web e automações/integrações. O tom é o de um profissional independente, responsável pelo planejamento, desenvolvimento e entregas combinadas.

Projetos, tecnologias e atividade do GitHub foram removidos intencionalmente da apresentação pública. Não recolocar essas seções. Os links de perfil existentes no rodapé são distintos da antiga seção de atividade.

As demonstrações dos serviços são ilustrações, não trabalhos entregues ou produtos disponíveis. O sistema usa uma solicitação fictícia `DEMO-001`; não adicionar dados pessoais, números de desempenho comercial ou funções como se fossem um pacote contratado. A viabilidade das automações depende das ferramentas e acessos envolvidos.

A futura seção independente de exemplos permanece apenas preparada e documentada. Não criar placeholders, aviso de “em breve”, seção vazia ou navegação sem destino. As páginas PT/EN mantêm comentários de preparação entre processo e apresentação pessoal; os componentes e dados antigos não devem ser reativados como exemplos.

## O que a etapa 2 entregou

### Abertura e dispositivos

- `src/components/hero/LaptopScene.ts`: reaproveita o notebook procedural e suas proteções. A tela agora apresenta a oferta comercial em PT/EN e acompanha o tema. A rolagem altera suavemente posição, rotação e enquadramento.
- O mesmo módulo oferece uma composição com notebook, tablet e celular. Cada tela tem organização própria de menu, colunas, cards e botões; não é apenas uma imagem reduzida.
- `src/components/hero/Hero.astro`: inicialização adiada, alternativa estática, resposta à mudança de preferência de movimento e descarte da cena fora de vista.
- `src/lib/device-scene.ts` e `src/components/sections/Devices.astro`: a cena dos três dispositivos carrega quando necessária, em telas a partir de 900 px e quando as políticas de capacidade permitem. A composição HTML/CSS permanece disponível para telas menores e falhas.
- `public/media/laptop-static.svg`: novo pôster comercial do notebook, substituindo a tela antiga de código. Preservar a alternativa sem WebGL.

### Narrativa dos serviços

- `src/components/sections/Services.astro` e `src/lib/service-story.ts`: em largura de pelo menos 1024 px e altura de pelo menos 800 px, as quatro figuras usam uma coluna compartilhada fixa enquanto os textos avançam. Em outras dimensões, as figuras voltam aos respectivos artigos.
- Não há cópias adicionais das figuras nem altura artificial criada para alongar a narrativa. O controlador move e restaura o DOM existente.
- `src/components/sections/ServiceVisual.astro`: interfaces HTML/CSS com três momentos por serviço. Landing destaca oferta, benefícios/informações e contato; institucional alterna empresa, serviços e contato; sistema mostra solicitação, lista e acompanhamento; automação conduz a informação entre etapas.
- O progresso acompanha avanço e retorno da rolagem. Em movimento reduzido ou sem scripts, as informações ilustrativas ficam disponíveis em apresentação estática.
- `src/i18n/pt.json` e `src/i18n/en.json`: incluem as explicações de cada momento, identificação das ilustrações e aviso de dados fictícios. Manter equivalência entre os idiomas.

### Processo, âncoras e interação

- `src/components/sections/Process.astro`: a rolagem pausa o avanço automático para evitar competição entre os controles. O visitante pode continuar manualmente. A versão compacta, sem JavaScript ou com movimento reduzido usa detalhes nativos; os estilos dessa alternativa também funcionam no desktop.
- `src/lib/lenis.ts`: navegação por hash cancela inércia pendente e sincroniza o destino após mudanças de layout. Evita descontar duas vezes o espaço do cabeçalho. Preservar esse comportamento ao revisar as âncoras.
- `src/styles/global.css`: botões principais com altura mínima de 44 px e ajustes de espaço do processo. Elementos decorativos não interceptam cliques.

## Proteções que não devem regredir

- Importação adiada de recursos pesados, limite de FPS, políticas de economia de dados, pouca memória, conexão lenta e movimento reduzido.
- Liberação dos recursos 3D e eventos ao sair de vista ou navegar com o Astro; tratamento de aba oculta e falhas de contexto/importação.
- Uma única cena para o conjunto de dispositivos. A abertura libera sua cena ao sair da tela.
- As texturas comerciais são atualizadas na inicialização, troca de tema e carregamento de fontes, não em cada frame.
- O controlador de serviços agenda um frame em resposta aos eventos; não mantém um loop contínuo. Preservar limpeza, observadores e restauração do DOM no redimensionamento.
- Conteúdo essencial e chamadas permanecem em HTML. As figuras decorativas têm legendas acessíveis.
- Nenhuma dependência foi adicionada ou atualizada na etapa 2. Não elevar os limites de desempenho para acomodar ajustes de acabamento.

## Foco da revisão pelo Claude

1. Revisar português brasileiro e inglês equivalente: escrita, concordância, repetições, naturalidade e consistência de tom. Conferir se cada chamada combina com seu destino. Não inventar preços, garantias, prazos, resultados ou condições comerciais.
2. Corrigir espaçamento, alinhamento, quebras de títulos, largura dos parágrafos, contraste, botões e áreas de toque. Preservar a composição e os espaços das cenas; revalidar a rolagem após alterar dimensões próximas delas.
3. Exercitar menu desktop/mobile, âncoras, cabeçalho, rodapé, paleta de atalhos, teclado, foco/restauração, idiomas, temas, contato, cópia de email e links externos. Não enviar mensagens nem submeter formulários reais.
4. Conferir títulos, nomes acessíveis, textos alternativos e elementos decorativos. Revisar alternativas com movimento reduzido e sem 3D, sem remover efeitos ou enfraquecer testes.
5. Conferir títulos e descrições, compartilhamento, imagens geradas, idiomas e URLs. Examinar também `scripts/generate-og-image.mjs`, layouts e dicionários. Remover referências antigas ao portfólio pessoal apenas onde contradigam o posicionamento comercial; preservar Luciano como responsável.
6. Se houver problema estrutural de 3D, sincronização ou renderização, registrar reprodução, dimensões/condições, esperado versus observado, componente provável e evidência visual. Não reescrever o mecanismo durante essa revisão nem esconder o defeito removendo conteúdo ou animações.

## Verificações realizadas na etapa 2

Resultados anteriores, que devem servir de referência — não substituem nova validação após alterações:

| Comando | Resultado |
| --- | --- |
| `npm run check` | 44 arquivos; 0 erros, avisos ou dicas |
| `npm run build` | 3 páginas geradas |
| `node --test scripts/check-resilience.mjs scripts/check-service-experience.mjs` | 48 testes passaram |
| `node scripts/check-mobile-motion.mjs` | Passou |
| `node scripts/check-performance-budget.mjs --json` | Nenhum limite excedido |

Os 34 testes anteriores de resiliência foram mantidos. A simulação de `matchMedia` foi adaptada para aceitar eventos, sem remover asserções. Os 14 testes novos em `scripts/check-service-experience.mjs` cobrem narrativa reversível, saltos diretos, redimensionamento/restauração, movimento reduzido, limpeza, políticas e falhas do 3D e âncoras.

O build final apresentou CSS total de 87,4 KiB bruto/18,0 KiB gzip; JavaScript inicial PT/EN de 332,6/112,8 KiB; JavaScript total de 1003,1/288,4 KiB. O módulo adiado `LaptopScene` ficou em 575,2/146,1 KiB. São tamanhos de arquivos, não medições de velocidade ou Core Web Vitals. O aviso do build sobre módulo acima de 500 kB permanece.

A inspeção visual cobriu larguras de 360, 390, 768, 1280 e 1440 px, além de 844 × 390 em paisagem. Foram exercitados rolagem nos dois sentidos, âncoras, redimensionamento, menu, teclado/foco, temas e idiomas. Não foi observado transbordamento horizontal nos estados conferidos.

As alternativas sem WebGL, com movimento reduzido e sem scripts foram conferidas por simulação em servidor temporário de QA. Esse servidor não integra o site. Não foram feitos testes em aparelhos físicos, Safari/iOS, toque real ou preferência nativa de movimento do sistema, nem medições Lighthouse, Core Web Vitals, GPU ou FPS em aparelho físico.

Capturas e logs estão nas pastas irmãs `outputs/screenshots` e `outputs/validacao`. O relatório complementar é `docs/ENTREGA-ETAPA-2.md`.

## Pendências e limites conhecidos

- Sem JavaScript, o email continua como “Carregando email…”, pois o endereço é montado no navegador para dificultar coleta automática. Isso já constava no handoff da etapa 1. O LinkedIn permanece em HTML. Avaliar uma correção local compatível com a intenção original; não declarar o contato sem scripts plenamente resolvido.
- “Costumo responder em até 24h” foi preservado do conteúdo anterior e não foi reconfirmado. Não transformar esse texto em garantia ou acrescentar compromissos.
- A revisão editorial completa, a auditoria final de metadados/compartilhamento e a conferência abrangente dos links são trabalho da etapa 3, não resultados já concluídos.
- Não foi registrado um defeito estrutural pendente nas cenas durante a entrega da etapa 2. Isso não equivale a garantia de ausência de defeitos em outras condições.

## Execução e entrega da revisão

Requer Node.js 22.12 ou superior. Na base atualizada:

```powershell
npm ci
npm run check
npm run build
node --test scripts/check-resilience.mjs scripts/check-service-experience.mjs
node scripts/check-mobile-motion.mjs
node scripts/check-performance-budget.mjs --json
npm run preview -- --host 127.0.0.1 --port 4325
```

Acesse `http://127.0.0.1:4325/`. Os servidores temporários da etapa 2 foram encerrados. Durante a revisão, reinicie a prévia após reconstruir o projeto para evitar inspeção de HTML ou módulos antigos em cache.

Faça inspeção desktop/mobile, nos dois sentidos da rolagem, com temas e movimento reduzido. Execute novamente os testes afetados por correções. Registre claramente verificações não executadas e problemas pendentes.

Ao concluir, atualize apenas a documentação necessária e entregue um resumo curto das correções, verificações/resultados, pendências reais e eventuais problemas que devem retornar à etapa de animações. Priorize alterações pequenas e úteis, sem novas dependências, relatórios extensos ou refatorações desnecessárias. **Não faça push nem publique em produção.**

## Resultado da etapa 3

Revisão feita sobre o commit `b1db2c8` (etapa 2 trazida para o repositório). Sem commit das correções abaixo até a aprovação, sem push e sem publicação.

### Correções

- **Textos (pt/en):** as frases da sequência ilustrativa passaram a combinar com o que cada tela mostra. No site institucional, o passo "Entrar em contato" falava do menu; no sistema web, "Organizar na lista" ficou mais concreto; na automação, o terceiro passo virou "Avisar a equipe", que é o que a ilustração mostra. A ressalva de viabilidade continua no destaque e na nota do serviço. Também removi repetições ("toque/toques", "planejado/planejada" na seção de telas), troquei o rótulo genérico "Da ideia à experiência" por "Ilustrações dos serviços" e corrigi "a organização muda, e" para "mas". No inglês, unifiquei a grafia americana ("organized"), substituí "mistaps" e alinhei as mesmas correções.
- **Acessibilidade:** a área compartilhada das ilustrações (`service-story.ts`) recebeu `role="group"`. Antes, o `aria-label` estava em uma `div` sem papel e era ignorado.
- **Áreas de toque:** os links do rodapé passaram de 17 px para cerca de 29 px de altura, mantendo o espaçamento visual.
- **Título da abertura:** `text-wrap: balance` nas linhas do `h1` evita "web" sozinho na linha em telas estreitas.

### Verificações

- `npm run check`: 0 erros, 0 avisos e 0 dicas. `node scripts/check-mobile-motion.mjs`: passou. `node --test scripts/check-resilience.mjs scripts/check-service-experience.mjs`: 48 de 48 testes passaram. `npm run build` + `check-performance-budget.mjs`: todos os limites respeitados (CSS em 87,5 de 90 KiB; JS inicial em 332,6 de 360 KiB).
- Navegador (build de produção, `astro preview`), em 1440, 1280, 768 e 375 px, temas escuro e claro, pt e en:
  - sem rolagem horizontal;
  - um único `h1` e hierarquia de títulos coerente;
  - nenhum controle sem nome acessível, nenhuma imagem sem `alt` e nenhuma âncora sem destino.
- Navegação e contato:
  - menu mobile: o foco fica preso dentro dele, o Esc fecha e o foco volta ao botão; ao escolher uma seção, a página para com a seção a 96 px do topo e o foco vai para ela;
  - paleta ⌘K: a busca e o Enter levam à seção certa; os atalhos `g + v/p/a/c` funcionam;
  - tema: a troca altera `theme-color` e a escolha fica salva; o idioma também fica salvo;
  - metadados por idioma conferidos: título, descrição, `og:image`, canônica e `hreflang`;
  - `mailto` e links externos (`rel="noopener noreferrer me"`) corretos;
  - "Copiar email": o painel de testes bloqueia a área de transferência, e apareceu a mensagem alternativa correta; o caminho de sucesso é coberto pelo teste automático. Nenhum email foi enviado.
- Projetos, tecnologias e atividade do GitHub continuam fora da página. A seção de exemplos existe só como comentário de preparação.

### Limitações desta verificação

- O painel de navegador usado não emula `prefers-reduced-motion` nem desliga o WebGL. Movimento reduzido e falta de 3D foram conferidos pelos testes automáticos e pela leitura do código, não visualmente nesta etapa. O pôster estático aparece no celular, onde o 3D da abertura não é carregado.
- Com o painel oculto, o navegador pausa `requestAnimationFrame`. A rolagem da narrativa foi conferida nos dois sentidos com capturas intermediárias e pelos testes; algumas capturas pegaram transições no meio.
- Não houve teste em aparelho físico, Safari/iOS ou toque real.
- Seguem pendentes, como antes: o email sem JavaScript continua aparecendo como "Carregando email…", e "Costumo responder em até 24h" ainda não foi reconfirmado.

### Retorno à etapa de animações

Nenhum problema estrutural foi encontrado na cena 3D, na sincronização da rolagem ou no ciclo de renderização durante esta revisão.

### Ajustes pedidos depois da revisão

- **Cena 3D dos aparelhos removida.** A seção de aparelhos (`#devices`) agora usa só a composição em HTML/CSS, em todos os tamanhos de tela. Foram removidos:
  - `src/lib/device-scene.ts`;
  - o `<canvas>`, o script e o CSS de `.devices-composition` em `Devices.astro`;
  - o modo `devices` (tablet e celular em 3D) de `LaptopScene.ts`;
  - os 9 testes desse módulo em `scripts/check-service-experience.mjs`, que passou de 48 para 39 testes, todos passando.

  O `ScreenPainter` ainda aceita os formatos `tablet` e `phone`, mas só o formato de desktop é usado.
- **Título da seção:** agora é "Funciona em todos os dispositivos" / "Works on every device".
- **Notebook da abertura:** é a única cena 3D do site e voltou à animação anterior à etapa 2. A tampa abre ao carregar e fecha conforme a rolagem; no celular, fecha mais rápido. A tela escurece junto com a tampa. A tela comercial e o pôster estático da etapa 2 foram mantidos. O código foi restaurado de `d2f33da:src/components/hero/LaptopScene.ts`.
- **Conferido no navegador:** a tampa fecha ao rolar para baixo e reabre ao voltar ao topo (1440 px). A seção de aparelhos não tem mais canvas nem rolagem horizontal (1440 e 375 px).

### Ilustrações dos serviços e avisos

- **Novas ilustrações:** as quatro (`ServiceVisual.astro`) foram redesenhadas como telas de site e de sistema, com barra do navegador no estilo Windows (endereço à esquerda; minimizar, maximizar e fechar à direita), cabeçalho com logo e menu, títulos, botões, imagens, formulários, tabela e rodapé. Os ganchos da narrativa (`data-cue`, `data-sequence`, `data-step`, `--story-progress`) foram mantidos. Os textos dessas telas estão em `services.site` e `visual.copy`, nos dois dicionários.
- **Avisos removidos, a pedido:** o selo "Ilustração", a nota "Demonstrações ilustrativas…", o aviso de viabilidade da automação e as notas abaixo de "O que pode incluir". As legendas das figuras passaram a ser só para leitores de tela (`sr-only`), com uma descrição simples. As frases "Exemplo fictício…" e "fluxo ilustrativo" também saíram.
- **Orçamento de CSS:** com o CSS novo, o total passou do limite. Para não aumentar o orçamento, `global.css` tira da varredura do Tailwind os componentes arquivados que não aparecem na página (`Projects.astro`, `ProjectCard.astro` e `Marquee.astro`), com `@source not`. Remova essas linhas quando a seção de trabalhos voltar. O CSS total ficou em 88,8 de 90 KiB.

### Ajustes após a publicação

- **Sem emojis:** a seta da tela do notebook 3D agora é desenhada no canvas; como caractere `↗`, ela podia aparecer como emoji colorido em alguns aparelhos. Os `↗` dos links externos (rodapé, menu mobile, "Sobre", paleta) e as setas das ilustrações viraram ícones SVG.
- **Ilustrações:** saíram o ponto verde que acompanhava a rolagem na automação e o contorno verde que se movia entre os blocos. As etapas continuam trocando.
- **Blocos de serviço:** o rótulo "Serviço 01" virou uma etiqueta que não quebra no meio, e o subtítulo fica ao lado ou abaixo dela. Os títulos internos ("O que é", "Quando faz sentido"…) passaram da fonte mono maiúscula para texto normal em negrito.
- **Aparelhos no celular:** tablet e celular ficam com a mesma altura abaixo do computador, com colunas na proporção das telas. Conferido em 360 e 320 px.

### 3D no celular, imagem estática e cartões de serviço

- **3D em celulares bons:** a imagem estática do notebook aparecia em celulares que dariam conta do 3D. A regra usava `deviceMemory <= 2` e conexão `3g`, mas o navegador arredonda a memória para baixo (um aparelho de 3 GB informa 2) e o Android costuma informar "3g" em 4G razoável. Agora a imagem só aparece com movimento reduzido, economia de dados, `deviceMemory < 2` (até 1 GB) ou conexão `slow-2g`/`2g`. Os testes passaram a verificar 1 GB e 2G como casos de imagem estática, e um teste novo garante que 2 GB e "3g" carregam o 3D (41 testes no total).
- **Imagem estática nova:** `laptop-poster.webp` e `laptop-poster-en.webp` são capturas do próprio `LaptopScene` (Chrome headless com movimento reduzido, fundo transparente, recortadas com `sharp`) e substituem `laptop-static.svg` e o antigo `laptop.webp`. Para regerar depois de mudar a tela, renderize uma página temporária em `dist/` que importe o chunk `LaptopScene` e use `chrome --headless=new --force-prefers-reduced-motion --default-background-color=00000000 --screenshot`.
- **Serviços em cartões:** cada serviço virou um cartão com borda e fundo próprios. Linhas finas separam resumo, listas, "Como funciona na prática" e "Próximo passo", e o próximo passo tem fundo verde suave. O rótulo "O que é" saiu, porque o texto logo abaixo do título já responde.
- **Removidos:** o destaque "Diferença para a landing page" (e a chave `callout`). No ponto "Contato acessível", o ícone de balão foi trocado por um envelope.

### Serviços: largura, sincronização e versão compacta

- **Mais largura:** a partir de 1280 px, a seção de serviços usa até 96rem (`#services.services-wide`), em vez dos 80rem das outras seções.
- **Sincronização com o mockup:** cada cartão marca três partes com `data-story-step` (topo, listas e próximo passo). Em `service-story.ts`, a etapa do mockup acompanha a parte que chegou à linha de leitura (42% da altura da tela), não mais terços iguais da altura do cartão. Sem marcadores, vale a regra antiga. Um teste novo cobre a ida e a volta.
- **Listas:** "O que pode incluir" usa bolinhas, como "Quando faz sentido". O "check" desenhado em CSS saiu.
- **Celular (até 639 px):** cartões mais compactos (espaços e textos menores). As listas e o "Como funciona na prática" ficam dentro de um `<details>` ("Ver o que inclui e como funciona"), que começa fechado no celular e fica sempre aberto em telas maiores. Sem JavaScript, tudo aparece aberto.
- **CSS:** 89,8 de 90 KiB. Não há mais margem; o próximo acréscimo de estilo precisa remover algo antes.

### Contraste dos mockups

- **Destaque:** cada mockup (`.sv`) fica sobre um fundo verde próprio (gradiente escuro com brilho na cor de destaque). A janela (`.sv-frame`) redefine as variáveis de cor para uma paleta clara fixa, como um site real de cliente. Por isso ela se destaca do cartão de serviço tanto no tema escuro quanto no claro.
- **Celular:** o fundo verde tem menos margem, a barra lateral do sistema web (que ficava cortada) não aparece, e a janela mostra só o botão de fechar.
- **CSS:** para caber no orçamento, saíram regras sem uso da linha do tempo (`.tl-ring`, `ring-fill`, `.stroke-text`). Total: 89,8 de 90 KiB.
