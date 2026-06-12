# O Sistema Operativo: A ROM (ZX Spectrum)

Este documento resume o décimo episódio do tutorial de **Assembly Z80 para o ZX Spectrum**, criado pelo Matt Heffernan. Com este capítulo abandonamos o laboratório puro do processador e mergulhamos finalmente na máquina de jogos que todos conhecem: a arquitetura do ZX Spectrum e os seus 16KB de memórias proibidas!

## 1. O Mapa da Memória (Os 16K de ROM)

O ZX Spectrum (original) possui 64 KB de espaço endereçável de memória (`0x0000` a `0xFFFF`). No entanto, o primeiro grande bloco da memória está chumbado pela fábrica: os endereços `0x0000` até `0x3FFF` (Exatos 16 KB) são **ROM** (Read-Only Memory).
Isto significa que nunca podes escrever para lá, mas podes (e deves) ler de lá!

O que mora nesta terra proibida?
- O interpretador gigante da linguagem BASIC.
- As funções de ajuda rápida do sistema (Os "Restarts").
- Mensagens de Sistema (Ex: "R Tape loading error, 0:1").
- **A Fonte de Letras:** O desenho pixel a pixel de todas as letras do teclado, do espaço em branco (`0x20`) ao símbolo de Copyright (`0x7F`).

---

## 2. O Menu de Serviços: Os "Restarts" (`RST`)

Como vimos anteriormente, as instruções de `RST` são atalhos super rápidos para rotinas que habitam no Page Zero da ROM. Estas rotinas são subprogramas de sistema que podes chamar em vez de teres de programar tu a roda.

- **`RST 0` (Reboot):** Reinicia o Spectrum. Apaga tudo e volta ao ecrã inicial branco com a mensagem de copyright.
- **`RST 8` (Erro):** Podes atirar mensagens de erro do sistema para o ecrã.
- **`RST 10` (Print):** A nossa velha e amada amiga. Pões o código de uma letra no Acumulador `A` e corres `RST 10`. A ROM encarrega-se da magia terrível de desenhar a letra no ecrã.
- **`RST 28` (Calculadora Flutuante):** O segredo mais bem guardado do Spectrum! A ROM esconde um motor matemático de "ponto flutuante". Executar `RST 28` liga uma calculadora virtual baseada numa "Stack", fantástica para trigonometria e raízes quadradas sem precisares de reinventar matemática em Assembly!
- **`RST 38` (Interrupção Mestra):** Esta é a rotina chamada automaticamente 50 vezes por segundo pela Televisão. Ela lê o teclado e atualiza o relógio do sistema (System Variables).

---

## 3. Ler o Teclado Usando a ROM (A Solução Preguiçosa)

Ler portas de I/O em bruto é rápido, mas obriga-te a saber exatamente que matriz estás a pesquisar. Mas a ROM do Spectrum já está farta de ler o teclado por causa do BASIC, então porque não usá-la a nosso favor?

A ROM oferece rotinas diretas (Call) para tratar disto:
- `CALL 0x02BF`: Acorda a rotina de varrimento (scan) de hardware e despeja o estado das teclas para a memória RAM.
- `CALL 0x10A8`: Vasculha as teclas pressionadas e atira-te a tecla principal diretamente para o Acumulador (`A`) como um caráter limpinho e pronto a usar!
  - *Truque Mágico:* Se a tecla tiver acabado de ser pressionada e continuar em baixo, a rotina também **Acende a luz de Carry** para te avisar!

- **Exemplo Prático (A Esperar pelo Dedo do Jogador):**
  ```assembly
  esperar_tecla:
    call 0x02BF       ; 1. A ROM varre o teclado inteiro
    call 0x10A8       ; 2. A ROM atira-nos a tecla tocada para o registo 'A'
    
    jr nc, esperar_tecla  ; 3. A luz do Carry acendeu? Se NC (Não Carry), não tocaram em nada. Volta ao início!
    
    ; Se chegámos aqui, o 'A' tem o código ASCII da letra!
    rst 10            ; Imprime a letra no ecrã e sê feliz.
  ```

---

## 4. Usar a ROM: Prós, Contras e a Empregada Doméstica

Usar funções da ROM é maravilhoso. Torna-te extremamente preguiçoso e poupa-te semanas de trabalho. No entanto, é raramente usado na criação de videojogos comerciais.

- *Explicação para Iniciantes:* Imagina que a ROM é uma fantástica **Empregada Doméstica**. Se a chamares (`RST`), ela faz o trabalho duro todo: imprime texto alinhado e varre o teclado do lixo. No entanto, ela é **lenta a trabalhar**. Além disso, ela tem regras rígidas: ela **exige** um armário próprio para colocar a vassoura dela (Obriga-te a ceder o endereço de RAM `0x5B00` para as System Variables) e tem a péssima mania de arrumar certas gavetas sem te avisar (Destrói os valores dos Registos Alternate `HL'` e do registo `IY` sempre que corre)! Se tu tinhas lá coisas guardadas, o computador tem um **Crash Catastrófico**.

**Resumo das Limitações da ROM:**
1. **Lentidão:** O leitor de teclado da ROM só lê 1 tecla de cada vez e é demasiado lento para videojogos de arcada que exigem leitura multi-teclas e reações num milissegundo.
2. **Sacrifício de RAM:** O sistema de variáveis obrigatório rouba as moradas baseadas em `0x5B00` (e só se podes usar o Ecrã livremente se ignorares o BASIC na totalidade).
3. **Mutilação de Registos:** As rotinas da ROM (`RST` e o Interrupt Timer de `RST 38`) destroem garantidamente o Alternate `HL'` e o Registo de Índice `IY`.
4. **Incompatibilidade:** Jogos que usam *Calls* diretos e hardcoded à ROM dão asneira se tentares corrê-los nos famosos "clones" americanos (O Timex Sinclair), cujas ROMs não têm a matemática nos mesmos endereços!
