# Otimização de lucianookdp.dev

Auditoria e implementação: 9 de outubro de 2026. Base: commit `e3aadd1`.

## Objetivo

Reduzir o trabalho na abertura e durante as animações, preservando o notebook
3D, identidade visual, português/inglês, temas, navegação, projetos e contato.

## Diagnóstico

- O notebook usa um módulo de aproximadamente 585 KB, incluindo Three.js.
  O observador de visibilidade anterior o carregava imediatamente porque o hero
  já estava na tela. A imagem alternativa de 41.540 bytes ficava escondida.
- A paleta de comandos carregava `cmdk` mesmo sem ser aberta. O seletor de idioma
  importava `motion/react` para animar somente uma pequena pílula.
- O contato hidratava React antes de o visitante chegar à seção.
- A cena 3D renderizava na frequência do monitor e lia o layout a cada frame.
- A base já tinha imagens pequenas, conteúdo estático, fontes locais e fallback
  para economia de dados, movimento reduzido e dispositivos limitados.

## Implementado nesta branch

1. **Abertura progressiva.** A imagem leve do notebook aparece no HTML, com
   prioridade de carregamento. O 3D começa após load, duas oportunidades de
   pintura e um período ocioso. Continua disponível em desktop e celular.
   O agendamento é cancelado ao sair da seção ou trocar de página; imports
   atrasados não criam cenas em páginas que já foram substituídas.
2. **JavaScript sob demanda.** A paleta baixa o modal completo ao primeiro clique
   ou Ctrl/Cmd+K, preservando a intenção e a busca durante o download. O email
   hidrata quando a seção está a 400 px da viewport. A animação do seletor de
   idioma usa CSS, preservando cores e transição. Duas fontes críticas são
   pré-carregadas usando as mesmas URLs do CSS, evitando duplicação de arquivos.
3. **Custo de animação.** A cena passa a desenhar até 60 fps em desktop e 30 fps
   em telas de até 768 px. Mantém resolução, antialias, materiais e geometria.
   As leituras de layout são invalidadas por scroll, resize, fontes ou retomada.
   A cena pausa fora da viewport e em abas ocultas, preservando seu tempo ativo.
4. **Consistência funcional.** O botão de tema acompanha mudanças feitas pela
   paleta. Permanecem menu mobile, atalhos, links e cópia do email.
5. **Proteção no GitHub.** Workflow de pull request executa check, teste existente
   das animações, build e limites de peso. O deploy existente também verifica
   esses limites antes de enviar o artefato. Sem novas dependências ou secrets.

## Resultado medido no build local

Mesma base de dados, lockfile e modo de produção; 1 KiB = 1.024 bytes.

| Medida | Antes | Depois | Variação |
| --- | ---: | ---: | ---: |
| JavaScript de entrada das páginas PT/EN, bruto | 439,1 KiB | 326,2 KiB | -25,7% |
| Mesma entrada, gzip calculado | 147,1 KiB | 110,4 KiB | -24,9% |
| Todo o JavaScript emitido, bruto | 1.052,8 KiB | 992,8 KiB | -5,7% |
| Todo o JavaScript emitido, gzip calculado | 302,6 KiB | 283,8 KiB | -6,2% |
| Todo o CSS emitido, bruto | 74,7 KiB | 75,8 KiB | +1,4% |

“Entrada” é o grafo de imports estáticos, scripts inline e islands client:load;
não inclui imports dinâmicos, nem é uma captura de rede. O Three.js está excluído
dessa medida tanto antes quanto depois. O ganho medido acima vem principalmente
do seletor de idioma e da paleta; o ganho de agendamento do 3D é separado.
Gzip é estimado por arquivo com nível 9 e não comprova compressão da hospedagem.
CSS aumentou cerca de 1,1 KiB para suportar os estados de carregamento.

Não foi medido um percentual de melhora de tempo real, nota Lighthouse ou
Core Web Vitals. Esses resultados exigem ensaio de navegador com rede/CPU
controladas e confirmação depois da publicação.

## Validação

- `npm run check`: 0 erros, 0 avisos, 0 sugestões.
- `npm run build`: páginas PT, EN e 404 geradas.
- `node scripts/check-mobile-motion.mjs`: retrato, paisagem, desktop,
  movimento reduzido e limpeza passaram.
- `node scripts/check-performance-budget.mjs`: limites atendidos.
- Navegador: visual em 1440 × 900 e 390 × 844, notebook 3D ativo, paleta,
  busca, Ctrl+K, troca PT/EN, tema pela paleta e botão, menu mobile, navegação
  ao contato e confirmação de email copiado.
- Relógio simulado do scheduler: teto de 60/30 fps, pausa e retomada; isso
  verifica a lógica e não substitui benchmark de GPU em um celular físico.
- O navegador não registrou erros JavaScript na inspeção. Houve um aviso
  de precisão de shader do driver WebGL, sem falha de renderização observada.

## Próxima etapa: hospedagem e publicação

O GitHub confirma Pages com domínio `lucianookdp.dev` e deploy da main bem-sucedido.
Entretanto, o domínio respondeu com Hostinger/hcdn; o DNS consultado aponta
`88.222.222.151`, `84.32.84.94`, e `www` para
`www.lucianookdp.dev.cdn.hstgr.net`. É necessário confirmar qual origem a
Hostinger serve e se acompanha os deploys do Pages.

Uma requisição pública retornou o HTML (173.283 bytes) em 0,424 s, TTFB 0,374 s.
É uma amostra local isolada. Algumas requisições automatizadas seguintes
receberam HTTP 403 com desafio de navegador; não foram usadas como medidas de
assets. Não foi alterada a proteção da hospedagem.

Depois de revisar e integrar a branch:

1. Confirmar a origem no hPanel e publicar o conteúdo de `dist` pelo mecanismo
   já usado, ou confirmar que o proxy serve o Pages atualizado. Não alterar DNS
   sem essa confirmação. Validar que o domínio entrega os hashes do novo build.
2. Na hospedagem efetiva, verificar Brotli/gzip para HTML/CSS/JS/SVG e cache do CDN.
   Para arquivos versionados de `/_astro/`, usar cache longo com immutable;
   para HTML, revalidação ou cache curto. Arquivos sem hash precisam de política
   curta/revalidação. Não aplicar cache longo indiscriminadamente ao site todo.
3. Executar três ensaios de cache frio por cenário em desktop e mobile, antes e
   depois, usando a mediana. Avaliar LCP, CLS, tarefas longas e latência dos
   controles; medir INP em dados reais de visitas quando houver volume suficiente.
4. Critérios: conteúdo e controles acessíveis rapidamente, nenhuma regressão
   visual em ambos os idiomas/temas, LCP ideal até 2,5 s, CLS até 0,1 e INP
   até 200 ms no percentil 75 dos dados reais. São metas, não resultados obtidos.
5. Se houver regressão, reverter o commit/PR e republicar pelo mesmo fluxo.

O custo de GPU pode ser investigado numa segunda rodada com aparelhos reais.
Trocar o notebook permanentemente por imagem, mudar tipografia ou simplificar
materiais não faz parte desta implementação.

Referências técnicas: [hidratação no Astro](https://docs.astro.build/en/reference/directives-reference/#client-directives),
[otimização de LCP](https://web.dev/articles/optimize-lcp),
[Core Web Vitals](https://web.dev/articles/vitals).
