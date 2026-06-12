# O Coração do Jogo: O Domínio do Tempo (Interrupções Z80)

Este documento traduz o décimo segundo episódio do tutorial de **Assembly Z80 para o ZX Spectrum**, desenhado pelo Matt Heffernan. Descobrimos finalmente o segredo dos jogos de arcada puros: como sincronizar os nossos programas com a cadência exata do televisor para acabar com os ecrãs a piscar.

## 1. Os Alarmes do Spectrum (`NMI` vs `INT`)

Tal como nós precisamos de despertadores para parar de dormir e ir trabalhar, o Z80 tem dois pinos físicos que emitem choques elétricos para o obrigar a largar o que está a fazer e saltar para tarefas críticas de salvamento.

- **`NMI` (Non-Maskable Interrupt):** Uma interrupção de emergência máxima! Não pode ser ignorada, silenciada, ou adiada de maneira nenhuma. No ZX Spectrum original, nada está ligado ao `NMI`, servindo apenas para expansões traseiras externas (que assim podem congelar o jogo quando quiserem).
- **`INT` (Maskable Interrupt):** A Interrupção normal de Hardware. Ela é "mascarável" (pode ser silenciada com o comando `DI`). E no Spectrum, a única coisa que está ligada a este choque elétrico é a Placa de Vídeo (O ULA)!

**A Janela Mágica (Vertical Blanking Period):**
O ULA varre a TV (PAL) enviando imagens a 50 Hertz (50 frames por segundo). Isto significa que a cada 20 milissegundos, a imagem chega ao fim, e o ULA levanta o pino do `INT` para avisar o Z80: *"Acabei a frame! Vou desligar o canhão de eletrões da TV durante meio milissegundo para o puxar para o topo do ecrã e recomeçar."* 
É nesses míseros `512 microsegundos` cegos que temos a nossa oportunidade de ouro para desenhar gráficos sem ninguém ver a brocha de tinta!

---

## 2. O Modo Normal (`IM 1`) vs O Modo de Jogo (`IM 2`)

O processador Z80 possui 3 comportamentos perante o "choque" do `INT`:

- **Modo 1 (`IM 1`):** O modo preguiçoso com que o Spectrum arranca. Sempre que o choque do VBlank bate, ele abandona o que está a fazer e salta obrigatoriamente para o endereço fixo da ROM em `0x0038`. Esse endereço chama as famosas rotinas do BASIC (conta o tempo no relógio e lê o teclado).
- **Modo 2 (`IM 2`):** O Modo Especialista. Permite ao Z80 largar tudo e saltar para um código **Teu** escrito na memória RAM! Se queres atualizar sprites ao som do relógio do jogo, o teu motor tem de assentar aqui. 

---

## 3. O Truque Negro da Tabela de Saltos (`0xFE00`)

O grande problema arquitetural do ZX Spectrum é este: quando o Mode 2 pede o Endereço de Salto, o Z80 pega na metade alta (fornecida pelo registo `I`) mas pede à Placa de Vídeo (ULA) para lhe fornecer a metade baixa. Mas a ULA do Spectrum é "surda" e atira apenas um byte de **Lixo Elétrico Aleatório** para o canal de dados! 
Resultado? A morada de salto pode ser qualquer uma num espaço de 256 bytes! A solução criativa da comunidade passa por inundar uma página inteira de RAM (`0xFE00` a `0xFF00`) com exatamente o mesmo valor repetido 257 vezes, normalmente usando o lixo `0xFD`!

- **O Algoritmo Clássico:**
  1. Mandamos o endereço do topo da tabela para o Registo `I` (`0xFE`).
  2. Preenchemos os bytes de `0xFE00` a `0xFF00` com o valor `0xFD`.
  3. Não importa o "lixo aleatório" que o ULA atire de `00` a `FF`... o Z80 vai juntar a tabela e ler os conteúdos. Vai abrir duas gavetas consecutivas na tabela, e como lá só existe o valor `0xFD`, ele montará o Salto Final sempre para a morada `0xFDFD`!
  4. Por fim, escrevemos na morada `0xFDFD` o comando "Salta P'ró Meu Jogo".

```assembly
; EXCEÇÃO CLÁSSICA: Criar a Tabela de Lixo em 0xFE00
  di              ; 1. Desliga Interrupções! Operação cirúrgica em curso.
  ld hl, 0xFE00   ; 2. Prepara a tabela de 257 bytes.
  ld a, 0xFE      ; 3. Carrega o Endereço do Topo...
  ld i, a         ;    ...para o Registo Mestre I.

; (Aqui usamos um Loop e LDIR para atirar o valor '0xFD' 257 vezes de seguida para 0xFE00 a 0xFF00).

; Agora enfiamos o Jump Real da nossa Rotina lá no fundo cego da tabela montada!
  ld hl, 0xFDFD   ; O endereço onde a máquina vai aterrar, não importa o Lixo.
  ld (hl), 0xC3   ; 0xC3 é o código puro do comando absoluto de "JUMP" (JP).
  inc hl
  ld de, O_MEU_JOGO_ROUTINE ; O endereço onde nós realmente queremos ir!
  ld (hl), e      ; Atira o byte baixo do endereço
  inc hl
  ld (hl), d      ; Atira o byte alto do endereço

  im 2            ; Acorda a besta! (Interrupt Mode 2).
  ei              ; Liga as interrupções de novo.
```

---

## 4. A Anatomia de um Game Loop Perfeito

*A Analogia do Empregado da Lousa:* Num jogo mal otimizado (como em BASIC), o jogador vê os bonecos a piscarem na TV (Screen Tearing). Isto acontece porque o programa escreve os píxeis devagarinho e de forma visível aos olhos do espetador. A solução correta (Interrupção) é como ter um dono de restaurante e um empregado que trabalha nas sombras:

- **O Dono (A Main Thread):** Trata da matemática pesada. Lê as portas de Joystick (`IN`), atualiza o número de vidas e move as coordenadas invisíveis dos heróis. Em vez de escrever tudo na parede visível (O Ecrã em `0x4000`), ele escreve as coisas num rascunho de papel secreto escondido algures na RAM ("Line Buffers", ou *Double Buffering*). Depois o Dono **Pára o programa na totalidade** usando o comando `HALT` e encosta a cabeça a dormir!
- **O Empregado (A Rotina de IM2):** Passados alguns milissegundos a TV avisa "A plateia não está a ver, as luzes da TV desligaram!" (Chegou a Interrupção). O programa acorda imediatamente do seu sono! Como é uma emergência, a rotina **Tem de gravar à força bruta o estado do Cérebro do Computador na Stack** (faz um *Push* a dezenas de registos como `AF`, `HL`, `BC` etc). De seguida, o empregado pega na folha de rascunho onde o Dono andou a pintar durante 20 ms, e espeta tudo a bater forte e rápido na memória de vídeo `0x4000` em menos de 512 microsegundos.
O Empregado limpa a memória RAM, repõe o estado cerebral da máquina inteirinho lendo de novo da Stack (`Pop` a todos os registos de volta), liga de novo as interrupções (`EI`) e regressa a casa (`RET`). O Dono acorda do `HALT` e o jogo segue para o próximo milissegundo de forma hiper-fluída. É assim que um Super Mario corre!
