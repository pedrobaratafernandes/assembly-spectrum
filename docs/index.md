# Escrever Jogos para o ZX Spectrum

Este livro ensina a programar o ZX Spectrum em assembly do Z80, desde as primeiras instruções até às técnicas usadas nos jogos comerciais da época: leitura do teclado, *sprites*, colisões, som, interrupções e carregamento automático.

Todos os programas completos do livro foram testados num emulador de Spectrum 48K e estão prontos a compilar com o **sjasmplus**, que gera diretamente um ficheiro `.tap` para abrir no emulador **Fuse** (ou numa máquina verdadeira).

## Como Está Organizado

* **[Preparar o Ambiente](ferramentas.md)** explica como instalar as ferramentas e qual é o molde comum a todos os programas. Comece por aqui.
* **Parte 1, Assembly do Z80**, apresenta o processador e o Spectrum: registos, modos de endereçamento, cópia de dados, saltos, aritmética, pilha, operações com bits, portas, ROM, ecrã e interrupções. Cada capítulo termina com um programa completo e alguns exercícios.
* **Parte 2, Escrever Jogos**, é uma tradução adaptada de *How to Write ZX Spectrum Games*, de Jonathan Cauldwell. Ao longo dos capítulos constrói-se um pequeno jogo ao estilo de *Centipede* e apresentam-se técnicas de jogos mais avançados.

As listagens que começam com `DEVICE ZXSPECTRUM48` são programas completos. As restantes são rotinas para incluir num programa maior e não se compilam sozinhas.

## Sobre a Parte 2

A Parte 2 segue o texto e as listagens do livro original, com estas diferenças:

* todas as listagens completas usam o mesmo molde do sjasmplus, com um carregador BASIC e um `.tap` gerado automaticamente;
* foram corrigidos os erros que impediam alguns programas de funcionar (por exemplo, a divisão do capítulo 15 e o registo `I` do capítulo 17). Quando a correção altera o código original, o texto assinala-o;
* alguns capítulos ganharam um pequeno programa completo para se poder ver a técnica a funcionar.

## Conteúdo

### Preparação
* [Preparar o Ambiente](ferramentas.md)

### Parte 1: Assembly do Z80
1. [O Z80, a Memória e os Modos de Endereçamento](z80_1_modos_enderecamento.md)
2. [Mover Dados](z80_2_data_in_motion.md)
3. [Condições, Saltos e Ciclos](z80_3_condicionalidade.md)
4. [Aritmética](z80_4_aritmetica.md)
5. [A Pilha](z80_5_the_stack.md)
6. [Bits, Lógica e Rotações](z80_6_bits_logica.md)
7. [Entrada e Saída](z80_7_in_e_out.md)
8. [Outras Instruções Úteis](z80_8_o_resto.md)
9. [A ROM e as Variáveis de Sistema](z80_9_a_rom.md)
10. [Gráficos no ZX Spectrum](z80_10_graficos.md)
11. [Interrupções](z80_11_interrupcoes.md)

### Parte 2: Escrever Jogos
1. [Texto e Gráficos Simples](1.md)
2. [Teclado e Joystick](2.md)
3. [Efeitos Sonoros do Altifalante](3.md)
4. [Números Aleatórios](4.md)
5. [Deteção Simples de Colisões com o Fundo](5.md)
6. [Tabelas](6.md)
7. [Deteção Básica de Colisões com Alienígenas](7.md)
8. [Sprites](8.md)
9. [Gráficos de Fundo](9.md)
10. [Pontuações e Pontuações Máximas](10.md)
11. [Movimento dos Inimigos](11.md)
12. [Sincronização e Temporização](12.md)
13. [Duplo Buffer](13.md)
14. [Movimento Mais Sofisticado](14.md)
15. [Matemática](15.md)
16. [Música e Efeitos AY](16.md)
17. [Interrupções](17.md)
18. [Carregamento Automático](18.md)
19. [Design de Jogos e Apêndice](19.md)

### Apêndices
* [Bibliografia e Fontes](bibliografia.md)
