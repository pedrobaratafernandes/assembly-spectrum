# Como Escrever Jogos para o ZX Spectrum

Bem-vindo à tradução e adaptação do livro **"How to Write ZX Spectrum Games"** de Jonathan Cauldwell.

Esta documentação foi estruturada para ajudar programadores de todos os níveis a compreender a arquitetura do ZX Spectrum, o processador Z80 e como criar jogos em código máquina utilizando ferramentas modernas.

## Ferramentas de Desenvolvimento

Para acompanhar os exemplos práticos deste livro, utilizamos um fluxo de trabalho moderno baseado em duas ferramentas fundamentais:
* **sjasmplus**: Um compilador cruzado (*cross-assembler*) moderno e rápido para Z80 que corre diretamente no seu PC atual e gera os ficheiros binários (`.tap`, `.sna`) prontos para o ZX Spectrum.
* **Fuse (Free Unix Spectrum Emulator)**: Um emulador robusto e preciso do ZX Spectrum para testar os ficheiros gerados de imediato.

No [Capítulo 1](1.md) encontrará as instruções detalhadas de instalação destas ferramentas tanto para **Arch Linux** como para **Debian/Ubuntu/outros**.

## Conteúdos

Utilize o menu lateral para navegar pelos capítulos:

*   **[Capítulo 1: Setup, Texto e Gráficos](1.md)** - Introdução ao sjasmplus, emulador Fuse, impressão de texto e cores.
*   **[Capítulo 2: Teclado e Joystick](2.md)** - Leitura de portas de teclado e joysticks Kempston e Sinclair.
*   **[Capítulo 3: Efeitos Sonoros do Altifalante](3.md)** - Geração de sons e ruído branco na beeper de 48K.
*   **[Capítulo 4: Números Aleatórios](4.md)** - Geração de números pseudoaleatórios lendo a ROM.
*   **[Capítulo 5: Deteção Simples de Colisão de Fundo](5.md)** - Leitura de atributos para colisões com o cenário.
*   **[Capítulo 6: Tabelas](6.md)** - Estruturas de dados e tabelas para múltiplos elementos (segmentos/inimigos).
*   **[Capítulo 7: Deteção Básica de Colisão de Inimigos](7.md)** - Verificação de coordenadas e colisões com projéteis.
*   **[Capítulo 8: Sprites](8.md)** - Desenho de sprites no ecrã e método byte scan.
*   **[Capítulo 9: Gráficos de Fundo](9.md)** - Desenho de blocos de mapa e cenários de labirinto.
*   **[Capítulo 10: Pontuações e Pontuações Máximas](10.md)** - Gestão de tabelas de recordes e strings ASCII para pontuação.
*   **[Capítulo 11: Movimento de Inimigos](11.md)** - Patrulhas pré-definidas e algoritmos de perseguição inteligentes.
*   **[Capítulo 12: Sincronização e Temporização](12.md)** - Uso do HALT e do relógio interno para manter a velocidade do jogo.
*   **[Capítulo 13: Duplo Buffer](13.md)** - Técnicas de Double Buffering para eliminar a cintilação (*flicker*).
*   **[Capítulo 14: Movimento Mais Sofisticado](14.md)** - Gravidade, inércia, tabelas de salto e movimento rotacional.
*   **[Capítulo 15: Matemática](15.md)** - Multiplicação, divisão e raiz quadrada (Teorema de Pitágoras) em Z80.
*   **[Capítulo 16: Música e Efeitos AY](16.md)** - Uso do chip de som AY-3-8912 e drivers de música 128K.
*   **[Capítulo 17: Interrupções](17.md)** - Configuração do Modo de Interrupção 2 (IM 2).
*   **[Capítulo 18: Carregamento Automático](18.md)** - Como criar carregadores BASIC com ecrã de carregamento.
*   **[Capítulo 19: Design de Jogos & Apêndice](19.md)** - Conceção de mecânicas de jogo e tabela de endereços úteis da ROM/RAM.
