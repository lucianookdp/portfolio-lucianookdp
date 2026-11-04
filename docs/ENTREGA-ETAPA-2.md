# Entrega da etapa 2 — experiência visual

Implementação feita sobre a versão local de `C:\dev\portfolio-lucianookdp`, após leitura de `docs/HANDOFF-ETAPA-2.md`. A entrega está na cópia `outputs/portfolio-lucianookdp`; o diretório original não foi alterado. Não houve commit, push nem publicação.

## Comportamento entregue

- Abertura com o notebook existente, tela comercial localizada em português/inglês e adaptada ao tema. Posição, rotação e enquadramento acompanham a rolagem. O novo pôster SVG substitui a tela de código quando o 3D não pode ser usado.
- Os quatro serviços compartilham uma área visual fixa em desktops com espaço suficiente. A sequência avança e recua com a leitura, sem acrescentar altura artificial aos artigos. Em telas menores, cada ilustração acompanha seu próprio texto.
- Landing page: oferta, benefícios/informações e chamada de contato ganham destaque sucessivo.
- Site institucional: páginas de empresa, serviços e contato, menu ativo e mapa de navegação mostram a distribuição dos assuntos.
- Sistema web: uma solicitação fictícia DEMO-001 passa por cadastro, lista e acompanhamento. Não há gráficos de resultados nem promessa de pacote pronto.
- Automação: a informação percorre formulário, organização e encaminhamento. A explicação comercial preserva a condição de viabilidade das ferramentas.
- Responsividade: notebook, tablet e celular em uma única cena, com navegação, colunas, cards e botões reorganizados. Em telas menores ou ambientes restritos, permanece a composição HTML/CSS.
- Processo: rolar pausa a reprodução automática; o visitante pode continuar pelos controles. A versão compacta e a alternativa estática usam detalhes nativos, acessíveis por teclado.
- Âncoras corrigidas para cancelar a inércia pendente e evitar desconto duplicado do cabeçalho. Botões principais têm altura mínima de 44 px.

Os textos comerciais e as quatro ofertas da etapa 1 foram preservados. Projetos, tecnologias e atividade do GitHub não voltaram à página. A futura seção de exemplos continua apenas preparada no código, sem conteúdo ou links novos.

## Organização e proteções

`src/lib/service-story.ts` controla a narrativa dos serviços com um único frame agendado por evento; não mantém um loop contínuo. As figuras existentes são movidas para a coluna compartilhada e restauradas no layout compacto, sem duplicação do conteúdo.

`src/lib/device-scene.ts` importa o 3D somente quando necessário e descarta a cena ao sair da tela. O notebook da abertura também libera recursos quando sai de vista. Foram preservadas as políticas de economia de dados, memória, conexão, movimento reduzido, FPS e descarte na navegação Astro. As texturas comerciais são redesenhadas em inicialização, tema e fontes, não em cada frame. Nenhuma dependência foi adicionada ou atualizada.

## Verificação executada

| Verificação | Resultado |
| --- | --- |
| `npm run check` | 44 arquivos; 0 erros, avisos ou dicas |
| `npm run build` | 3 páginas geradas |
| `node --test scripts/check-resilience.mjs scripts/check-service-experience.mjs` | 48 testes passaram; nenhuma falha |
| `node scripts/check-mobile-motion.mjs` | Passou: retrato, paisagem, desktop, redução de movimento e limpeza |
| `node scripts/check-performance-budget.mjs --json` | Todos os limites existentes respeitados, sem aumento de orçamento |

Os 34 testes anteriores de resiliência foram mantidos. O ajuste na simulação de `matchMedia` adiciona suporte a eventos; as asserções não foram removidas. Os 14 testes novos cobrem reversibilidade e salto direto da rolagem, restauração do DOM no redimensionamento, redução de movimento, limpeza fora da tela/aba oculta, políticas e falhas do 3D e navegação por âncoras.

Tamanhos do build final (KiB = 1024 bytes):

| Recurso | Bruto | Gzip |
| --- | ---: | ---: |
| JavaScript inicial PT/EN | 332,6 KiB | 112,8 KiB |
| JavaScript total | 1003,1 KiB | 288,4 KiB |
| CSS total | 87,4 KiB | 18,0 KiB |
| Módulo adiado LaptopScene | 575,2 KiB | 146,1 KiB |

Inspeção visual realizada no navegador em larguras de 360, 390, 768, 1280 e 1440 px; também em 844 × 390 para orientação horizontal. Não foi observado transbordamento horizontal nos estados conferidos. Foram exercitados rolagem nos dois sentidos (incluindo sequência 0 → 2 → 0), âncoras diretas, redimensionamento, menu mobile, Escape/retorno de foco, teclado, temas e idiomas. O contato carregou o endereço real e seus controles.

Foram inspecionadas alternativas sem WebGL, com movimento reduzido e sem scripts por meio de um servidor de QA temporário: falha de contexto WebGL, `matchMedia`/CSS reduzidos e remoção de scripts, respectivamente. Esses mecanismos não fazem parte do site entregue. Os testes automatizados complementam a inspeção com mudanças de preferência em execução e falhas de importação.

## Limitações restantes

- A inspeção responsiva usa dimensões de navegador; não substitui teste em aparelhos físicos, Safari/iOS ou toque real.
- Movimento reduzido foi simulado, sem alterar a preferência do sistema operacional.
- Não foram medidos Lighthouse, Core Web Vitals, consumo de GPU ou FPS em aparelho físico. Os números acima são tamanhos do build, não métricas de velocidade percebida.
- O build avisa que o módulo de Three.js/LaptopScene excede 500 kB. Ele permanece adiado e dentro do orçamento total estabelecido.
- Sem JavaScript, o email continua como “Carregando email…”, limitação documentada na etapa 1, pois o endereço é montado no navegador. O conteúdo dos serviços e o processo permanecem legíveis; o LinkedIn continua disponível em HTML.
- As interfaces são ilustrações, não ferramentas funcionais, trabalhos entregues ou integrações garantidas.

## Executar localmente

Requer Node.js 22.12 ou superior. Na pasta do projeto:

```powershell
npm ci
npm run check
npm run build
npm run preview -- --host 127.0.0.1 --port 4325
```

Abra `http://127.0.0.1:4325/`. Para desenvolver, use `npm run dev`. Os servidores temporários de validação foram encerrados ao concluir a entrega.

O ZIP contém o código-fonte, arquivos públicos e lockfile, sem `node_modules`, `dist`, caches ou histórico Git. As capturas de desktop e mobile acompanham a entrega na pasta `screenshots`.
