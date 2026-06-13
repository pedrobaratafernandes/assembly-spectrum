# O Mundo Cá Fora: Input e Output (ZX Spectrum)

Este documento aborda o tema de **Assembly Z80 para o ZX Spectrum**. Depois de passarmos episódios trancados no "cérebro" do computador a fazer contas na memória, chegou a altura de interagir com o mundo real: ler o Teclado e apitar no Altifalante (Beeper)!

## 1. As Portas Mágicas e a ULA

Na maioria dos processadores clássicos (como o 6502 da Nintendo), tu usas os endereços normais da memória RAM para ler os botões dos comandos. É o chamado "Memory Mapped I/O". Mas o Z80 é diferente: a RAM dele está **100% reservada para código e memória**. Para falar com o mundo exterior, ele usa uma via separada chamada de **Portas de I/O** (Input/Output).

No ZX Spectrum, a peça de hardware que controla as luzes, a imagem da TV, o som e o teclado chama-se **ULA** (Uncommitted Logic Array). E ela atende sempre chamadas em qualquer porta cujo número seja **Par** (ou seja, cujo último byte termine em `0xFE`).

- *Explicação para Iniciantes:* Imagina o CPU como se fosses tu e a Memória RAM como a "Cidade". Tu podes andar pela cidade toda (0 a 65535) e visitar as casas (bytes). O Teclado e o Altifalante moram noutra cidade distante, por isso não há casas para eles na tua cidade. Para lhes mandares encomendas, tens de ir aos Correios (As Portas I/O). O código postal da agência principal dos correios do Spectrum (a ULA) termina sempre em `FE`. Quando envias uma carta para a porta `FE`, sai da Cidade e vai para as mãos do hardware exterior!

---

## 2. Ler o Teclado (`IN`)

Para leres o estado do mundo, o Z80 usa a instrução sagrada **`IN`** (Input). 

No ZX Spectrum, o teclado está ligado por filas (matrizes). Para leres uma fila de teclas, o endereço da porta que tens de pedir tem **16 bits**:
- O **Byte de Baixo** é sempre `0xFE` (Para dizer "Olá ULA").
- O **Byte de Cima** define a fila de teclas que queres espreitar (ex: a fila do A, S, D, F, G).

> [!WARNING]
> **A Rasteira dos Zeros:** O Spectrum usa lógica invertida no teclado. Quando tu **pressionas** uma tecla, o bit no painel passa para `0`. Se a tecla **não estiver pressionada** (relaxada), o bit marca `1`!

- **Exemplo Prático (Ler o teclado para o Acumulador):**
  ```assembly
    ld a, 0xFE        ; Colocamos o "Byte de Cima" (Fila das teclas V, C, X, Z e CAPS SHIFT)
    in a, (0xFE)      ; A magia acontece:
                      ; 1) O 'IN' junta o (0xFE) que escreveste ao 0xFE que já estava no 'A'.
                      ; 2) Pede a informação à Porta 0xFEFE.
                      ; 3) O 'A' recebe a resposta: um byte com o estado de 5 teclas!
  ```
- **Exemplo Avançado (Ler para outros registos):**
  Se quiseres ser organizado, em vez do truque marado de usar o `A` para metades de endereços, podes montar um endereço direitinho no registo de 16 bits `BC` e despejar o resultado noutro registo qualquer:
  ```assembly
    ld bc, 0xFEFE     ; O endereço 16-bit inteiro vai para o BC
    in d, (c)         ; Lê a porta (que o BC aponta) e atira os resultados para o D!
  ```

---

## 3. Fazer Barulho: O Beeper (`OUT`)

Para enviar mensagens para o mundo, usamos a instrução **`OUT`**. Tal como o Input, no Z80 não se escreve em RAM, escreve-se para "Caixas de Correio".

O ZX Spectrum 48k original não tem chip de som dedicado. Tem um simples sensor piezoelétrico soldado na placa (o Beeper). O Beeper reage a **um único pino elétrico** que é comandado pelo **Bit 4 da Porta `0xFE`**.

Como fazemos música com uma coisa que só tem On/Off? Abanando o bit muito rápido de um lado para o outro!

- *Explicação para Iniciantes:* Imagina que tens uma corda de guitarra. Para tirares um som contínuo e afinado dela, não chega "ligar" a corda puxando-a. Tens de a largar, e voltar a puxar, e voltar a largar à mesma velocidade de forma constante. Uma onda sonora pura é feita de um sobe e desce contínuo. 

- **Exemplo Prático (Um Tom de Frequência Contínua usando a Televisão):**
  No Spectrum, a forma mais preguiçosa de manter o tempo é usar a interrupção gerada pelo chip da imagem da Televisão (o sinal de PAL de 50 Frames por Segundo). 
  ```assembly
    ei                ; Permite que o Z80 receba avisos do Hardware
    ld c, 0xFE        ; O endereço da caixa do som é na ULA (0xFE)
  
  som_infinito:
    xor 0x10          ; Lembras-te da Magia Negra dos bits? 0x10 é o Bit 4!
                      ; O 'XOR' pega no Acumulador e inverte SOMENTE o bit do Beeper.
                      ; Se estava 0 fica 1. Se estava 1 fica 0!
                      
    halt              ; Espera quietinho que a Televisão desenhe uma frame nova (1/50 de seg)
    out (c), a        ; Envia o choque novo (On ou Off) para a caixa de som!
    
    jr som_infinito   ; Puxa a corda da guitarra para sempre, criando um Zumbido de 25 Hz!
  ```
  O som do 48k é muito primitivo e ocupa muito tempo do processador! Nos próximos episódios vamos poder descobrir como fazer sons mais sérios, mas por agora já tens o teu "olá mundo" auditivo!
