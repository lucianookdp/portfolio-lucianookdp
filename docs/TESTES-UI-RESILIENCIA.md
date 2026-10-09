# Testes adicionais de UI/UX, erros e otimização

Data: 09/10/2026

## Correções
- Preferências locais são opcionais: tema, metadados e menu continuam funcionando quando localStorage lança SecurityError ou QuotaExceededError.
- Menu mobile recebe foco ao abrir, mantém Tab/Shift+Tab no menu, fecha com Escape e restaura o foco. O conteúdo de fundo fica inert; o estado anterior é preservado ao fechar. Ao navegar, a seção de destino recebe foco. Ao ampliar para desktop, o menu fecha.
- Falhas de View Transitions não impedem a troca de tema nem deixam promessas rejeitadas sem tratamento. O tema muda uma única vez.

## Validação
28 testes automatizados de regressão aprovados, executando o código de produção com um ambiente controlado (não são medições em aparelho físico):
- armazenamento bloqueado e persistência disponível;
- foco e restauração do menu;
- reduzido movimento, saveData, pouca memória e conexão 3G;
- falha no download do módulo 3D e ausência de WebGL, mantendo a imagem acessível;
- cancelamento e navegação durante o carregamento; aba oculta;
- espera por load, dois frames e idle antes do 3D;
- renderização 60 fps desktop / 30 fps mobile em frequências de 60, 90, 120 e 144 Hz;
- falhas síncronas, de atualização e de animação na troca de tema;
- cópia de email com sucesso, permissão negada e API indisponível.

Astro/TypeScript: zero erros, avisos ou hints. Verificação existente de movimento mobile e limpeza: aprovada. Build e orçamento de tamanho: aprovados. Novos testes integrados ao GitHub Actions de PR e publicação.

No navegador em 320 px: sem overflow horizontal; foco inicial no menu, Tab do último link volta ao botão, Escape restaura botão e remove inert; seção de contato recebe foco e carrega email. Versão inglesa e retorno PT confirmados no domínio público. A cópia no navegador de automação não apresentou confirmação; cobertura de sucesso e falha foi realizada no teste controlado.

## Limites e pendências
- A API PageSpeed retornou HTTP 429 por limite de uso. Nenhuma nota Lighthouse ou ganho de tempo de carregamento foi atribuído.
- A cena Three.js permanece um módulo adiado de cerca de 571 KiB raw / 144 KiB gzip, mantendo a aparência. O build ainda alerta sobre esse chunk, já separado do carregamento estático inicial.
- O domínio apresenta página genérica da Hostinger em /qa-missing-page; /404.html entrega a página personalizada. A hospedagem precisa encaminhar respostas 404 para /404.html preservando o status 404. O acesso GitHub não oferece acesso ao painel dessa configuração; não foi alterada uma regra de servidor sem verificar a plataforma.
- Os links de seção no cabeçalho/rodapé da página 404 ainda são fragmentos locais. Os botões Voltar ao início / Back to home oferecem recuperação, mas os links de seção precisam levar à home nessa página.
