# Modos de Endereçamento do CPU Z80 (ZX Spectrum)

Este documento aborda o tema de **Assembly Z80 para o ZX Spectrum**. O foco é compreender como o processador Z80 interage com a memória e com os registos através dos vários **Modos de Endereçamento** (Addressing Modes).

## Introdução
O sistema Z80 possui um espaço de memória de 16 bits, o que lhe permite endereçar até 64 KB de memória. No ZX Spectrum 48K, não é necessário fazer *banking* (paginação de memória):
- Os primeiros **16 KB** correspondem à **ROM** (memória apenas de leitura).
- Os restantes **48 KB** correspondem à **RAM** (incluindo a memória de vídeo).

## Modos de Endereçamento Oficiais
### 1. Modo Implícito (Implied Addressing)
São instruções que não necessitam de operandos (argumentos). O próprio *opcode* (código máquina) contém toda a informação necessária para a operação. 
- **Para que serve / Quando usar:** Utilizado para operações fixas e intrínsecas ao CPU, como regressar de uma rotina (`RET`) ou ligar/desligar interrupções (`EI`/`DI`). Como o processador não precisa de interpretar operandos adicionais, estas instruções são o mais pequenas e rápidas possível.
- **Exemplo Prático:**
  ```assembly
    ret               ; Regressa de onde veio (sem argumentos)
  ```
  - *Explicação para Iniciantes:* A instrução `RET` diz ao processador para "retornar". Imagina que estavas a executar um pedaço de código separado do resto (uma sub-rotina). O comando `RET` manda o processador voltar ao sítio onde estava antes de a sub-rotina ter sido chamada. Não precisa de dizer "para onde", porque o processador guardou o caminho sozinho.

### 2. Modo de Registo (Register Mode)
A instrução atua diretamente sobre os registos internos do Z80 (de 8 bits ou 16 bits, como `A`, `B`, `HL`, `AF`).
- **Para que serve / Diferenças:** Como atua unicamente dentro das "entranhas" do processador, é o modo **mais rápido** de manipular dados. Não há necessidade de ir à RAM buscar informação. Quase todas as transferências de dados entre registos resultam num único byte de código máquina. É ideal usar os registos para guardar variáveis ou contadores frequentemente acedidos.
- **Exemplo Prático:**
  ```assembly
    ld b, 10          ; Prepara o número 10 no registo B
    ld a, b           ; Copia o conteúdo do registo B para o A
  ```
  - *Explicação para Iniciantes:* O comando `LD` significa "Load" (Carregar ou Copiar). Em Assembly Z80, a ordem de leitura é sempre `LD Destino, Origem`. Portanto, `LD A, B` diz ao processador para olhar para o número que está guardado no registo `B` e fazer uma cópia desse número para dentro do registo `A`. O registo `A` é também conhecido como Acumulador, e é o principal sítio onde se fazem contas.

### 3. Modo Imediato (Immediate Addressing)
O valor numérico com o qual se pretende operar encontra-se diretamente (chumbado/"hard-coded") na instrução (no próprio código).
- **Para que serve / Diferenças:** Serve para carregar **constantes** ou números mágicos de 8 bits (0 a 255). A principal vantagem face à alternativa (ler da memória) é a rapidez: como o valor já está embutido no *opcode*, o processador escusa de procurar esse valor num endereço extra.
- **Exemplo Prático:**
  ```assembly
    ld b, 5           ; Carrega o número 5 diretamente no registo B
  ```
  - *Explicação para Iniciantes:* Em vez de copiar o valor de outro registo, estamos a injetar um número fixo diretamente. `LD B, 5` diz "Lê o número 5 e guarda-o no registo B". O número 5 já faz parte do comando que o CPU lê.

### 4. Modo Imediato Extendido (Extended Immediate Addressing)
Semelhante ao Modo Imediato, mas lida com valores fixos de **16 bits** diretamente embutidos no código.
- **Para que serve / Diferenças:** É tipicamente utilizado para inicializar registos de 16 bits (`HL`, `IX`) com o endereço inicial de uma rotina ou array, e muito comum em instruções de salto absoluto (`JP`), onde se diz ao código exatamente para onde ir de seguida na memória.
- **Exemplo Prático:**
  ```assembly
    jp 0x8000         ; Salta diretamente para a posição fixa 0x8000
  ```
  - *Explicação para Iniciantes:* O comando `JP` significa "Jump" (Saltar). O `0x` indica que o número a seguir (`8000`) está em formato Hexadecimal. A instrução diz "Abandona a linha de código em que estás agora e salta de imediato para a posição de memória número 0x8000, continuando a executar o código a partir daí".

### 5. Modo Extendido ou Direto (Extended/Direct Addressing)
Em vez de conter o valor, a instrução possui um **endereço de 16 bits** rodeado por parênteses: `(endereço)`.
- **Para que serve / Diferenças:** Indica ao CPU para ir à RAM escrever ou ler naquele endereço fixo específico. Devido a limitações de arquitetura, no Z80 só é possível copiar valores de memória para registos (ou vice-versa). Nunca se consegue copiar de uma posição de memória para outra diretamente. É ideal para ir ler/escrever valores em variáveis globais ou interagir isoladamente com blocos de hardware num endereço fixo conhecido.
- **Exemplo Prático:**
  ```assembly
    ld a, (0x4000)    ; Pega no valor contido na morada 0x4000 e põe no A
  ```
  - *Explicação para Iniciantes:* Os parênteses fazem toda a diferença! Sem os parênteses, o processador tentaria guardar o número `4000` gigante no registo `A` (daria erro, o A só guarda números pequenos até 255). Ao ter parênteses `(0x4000)`, o comando diz "Vai fisicamente à gaveta da memória RAM número 0x4000, olha para o número de 0 a 255 que estiver lá guardado, e traz uma cópia dele para o registo A".

### 6. Endereçamento Indireto por Registo (Register Indirect Addressing)
O endereço com o qual se pretende interagir não está fixo no código, mas encontra-se dinamicamente guardado num registo de 16 bits (geralmente `HL`, `BC` ou `DE`). Usa parênteses em torno do nome do registo.
- **Para que serve / Diferenças:** Excelente para percorrer blocos inteiros de memória, arrays, strings ou gráficos, visto que, num *loop*, basta simplesmente incrementar o registo (`INC HL`) para apontar para o byte seguinte. O código da instrução em si mantém-se limpo e super curto (normalmente apenas 1 byte, comparado a 3 bytes num Endereçamento Direto).
- **Exemplo Prático:**
  ```assembly
    ld hl, 0x5000     ; O HL aponta para a morada 0x5000
    ld a, (hl)        ; O A recebe o valor guardado na morada que HL indica
  ```
  - *Explicação para Iniciantes:* Imagina que o par de registos `HL` tem o número 0x5000 lá dentro. O comando `LD A, (HL)` (com os parênteses) diz: "Vê a morada que o HL te dá (0x5000). Agora vai lá à rua da RAM e procura a porta 0x5000, pega no valor que lá está e copia-o para o A". Se de seguida somares 1 ao HL, na próxima vez ele vai ler a porta seguinte (0x5001). É assim que os jogos lêem imagens e textos.

### 7. Endereçamento de Página Zero (Modified Page Zero / RST)
Chama um de oito endereços predefinidos e restritos da "página zero" de memória (os primeiros 256 bytes) invocados pelo comando especial `RST`.
- **Para que serve / Diferenças:** No ZX Spectrum, estes endereços correspondem a rotinas ROM muito usadas (como ler teclado ou imprimir letras no ecrã). Serve para ganhar velocidade e espaço radicalmente face à instrução regular equivalente (`CALL`). O `RST` usa apenas **1 byte**, face aos 3 bytes dispendiosos da instrução de salto ou de chamada genérica.
- **Exemplo Prático:**
  ```assembly
    ld a, 0x48        ; Coloca o código da letra 'H' no Acumulador
    rst 0x10          ; Chama a rotina da ROM para imprimir o 'H' na TV
  ```
  - *Explicação para Iniciantes:* A instrução `RST` (Restart) é uma espécie de salto rápido. A morada `0x10` (o número 16) é muito famosa no Spectrum: sempre que chamas um `RST 0x10`, o computador desperta, olha para o valor que puseste no registo `A` e desenha instantaneamente essa letra no ecrã e na cor certa! Não precisas de programar gráficos complexos do zero, basta usar as rotinas que já vêm embutidas na máquina usando o `RST`.

### 8. Endereçamento Relativo (Relative Addressing)
Usado nas instruções de salto (`JR`), onde o destino não é referenciado com o seu número absoluto (ex: `0x8005`), mas sim indicando o número de passos e a direção que o CPU tem a dar a partir da posição onde se encontra (-128 passos para trás a +127 passos para a frente).
- **Para que serve / Diferenças:** Usado em saltos curtos (*loops* rápidos, condicionalidades `if`). Poupa espaço em memória (são opcodes mais pequenos). Quando o salto excede a distância imposta (+- 127 bytes), a compilação falha e o programador passa a ser forçado a usar Endereçamento Imediato Extendido absoluto (Instrução `JP`), mais pesada.
- **Exemplo Prático:**
  ```assembly
loop:                 ; Etiqueta que marca o início do ciclo
    dec b             ; Subtrai 1 ao registo B
    jr nz, loop       ; Se o B não for zero, salta de volta para o 'loop'
  ```
  - *Explicação para Iniciantes:* `JR` significa "Jump Relative" (Salto Relativo a onde estamos agora). `NZ` significa "Non-Zero" (Não-Zero). Ou seja, a instrução está a avaliar uma condição matemática: "Se a última conta que fizeste NÃO deu zero, então dá um salto e volta à etiqueta de texto que chamei de 'loop'". É assim que em Assembly se cria o equivalente ao comando repetição `while` e `for` noutras linguagens mais modernas (ficas às voltas no código até uma contagem acabar).

### 9. Endereçamento por Índice (Index Addressing)
Combina um registo indexador (`IX` ou `IY`) com um *offset* (uma diferença fixa) estipulada pelo programador: ex. `(IX+2)`.
- **Para que serve / Diferenças:** É perfeito para aceder a dados estruturados em memória ("structs" ou objetos de um jogo), em que conheces que a Vida do monstro está na posição +1 e os Danos na posição +2. 
- **O contra:** As instruções de índice (`IX` / `IY`) foram adicionadas como uma extensão do CPU Z80 original (derivado do 8080), por isso exigem que o CPU carregue **bytes adicionais de prefixo** no `opcode`. Isto torna a execução consideravelmente **mais lenta** do que as instruções do modo Indireto via `HL`.
- **Exemplo Prático:**
  ```assembly
    ld ix, 0x6000     ; IX aponta para a base do objeto
    ld a, (ix+2)      ; O A recebe o que está na base + 2 passos (0x6002)
  ```
  - *Explicação para Iniciantes:* Se o teu registo `IX` apontar para a morada do teu herói no jogo (ex: morada base 0x6000), o comando diz: "Vai à morada guardada em IX, soma-lhe 2 passos mentalmente (ou seja, olha para a gaveta 0x6002 da RAM), e copia o que lá estiver para dentro do registo A". 

### 10. Endereçamento de Bits (Bit Addressing)
Permite ler, testar, alterar ou apagar um único bit isolado (de 0 a 7) de um registo ou valor de memória. Instruções base: `BIT`, `SET`, `RES`.
- **Para que serve / Diferenças:** Manipular bytes individualmente ao nível dos bits. É indispensável para configurar interfaces de hardware em específico (ex: ativar apenas o relé correspondente no porto de interface), processar lógicas binárias, mascarar sinais, ou capitalizar letras como visto neste exemplo.
- **Exemplo Prático:**
  ```assembly
    res 5, (ix)       ; Apaga (põe a 0) apenas o 5º bit desse byte indexado
  ```
  - *Explicação para Iniciantes:* O comando `RES` significa "Reset", que no mundo do binário significa "Forçar a transformar-se num Zero". O número 5 é a posição daquela minúscula parcela de memória (um byte é composto por 8 bits, numerados de 0 a 7). Assim, o comando diz: "Vai à morada apontada por IX e independentemente do número de lá estar, força apenas o seu 5º bit a desligar-se (Zero)". Como explicado anteriormente, se fizeres isto à letra minúscula "h", ela transforma-se magicamente na letra maiúscula "H".

---

## Modos "Não Oficiais"

Para além dos modos oficiais descritos no manual do Zilog, existem formas de endereçamento frequentemente encaradas como modos à parte devido à forma como o assembly está estruturado:

### 11. Condições de Estado (Status Conditions)
Condições como o bit de *Carry* (`C`/`NC`) e *Zero* (`Z`/`NZ`), utilizadas para avaliar saltos condicionais. Isto é o que torna o CPU Turing-completo, permitindo lógica e decisões.
- **Exemplo Prático:**
  ```assembly
    add a, 200        ; Soma 200 ao registo A (pode ultrapassar 255)
    jp c, limite      ; Se a luz de Carry acender, salta para 'limite'
  ```
  - *Explicação para Iniciantes:* Quando o processador faz uma conta que "dá a volta" ao limite de espaço (por exemplo, somar 200 + 100 numa gaveta que só vai até 255), ele acende uma luz de aviso interna chamada "Carry" (Vai-um). O comando `JP C, label` significa "Jump if Carry": o processador avalia essa luz de aviso e diz "Se a luz do Carry estiver acesa, salta para a etiqueta de texto chamada 'label'. Se não estiver, ignora e segue em frente". É o equivalente direto a um comando `if` (se) nas linguagens de programação modernas.

### 12. Modos de Interrupção (Interrupt Modes - `IM`)
Modos para lidar com o *hardware*. No Spectrum, usa-se o `IM 1` para delegar as interrupções para a rotina da ROM ou `IM 2` para executar rotinas personalizadas pelo utilizador. 
- **Exemplo Prático:**
  ```assembly
    im 1              ; Diz ao CPU para usar a ROM nas interrupções
  ```
  - *Explicação para Iniciantes:* Imagina que o processador está super concentrado a executar o teu código a alta velocidade. De repente, a placa de vídeo toca-lhe no ombro para avisar: "Olha, passaram 1/50 segundos, vou atualizar a imagem na TV". A isto chama-se uma **Interrupção** (Interrupt) de Hardware. O comando `IM 1` (Interrupt Mode 1) diz ao processador: "Sempre que a máquina te tocar no ombro, não stresses. Pausa o que estás a fazer, executa o pequeno programa que já vem gravado de fábrica no computador (ROM) para lidar com esse toque, e só depois volta ao código". É o que permite ao Spectrum fazer coisas em pano de fundo sozinho (como saber se carregaste numa tecla enquanto jogas) sem tu teres de programar essa mecânica do zero.
---

## Demonstração Prática: "Hello World" Detalhado

O programa "Hello World" construído neste exemplo tem o objetivo de demonstrar a aplicação prática e intencional de quase todos os modos de endereçamento abordados. O código completo baseia-se na sintaxe do assembler **sjasmplus**.

### Código Completo

```assembly
    device zxspectrum48
    org 0x8000

    jp start

string:
    db "hello"

string_length equ 5
rom_cls       equ 0x0daf
color_attr    equ 0x5800
enter         equ 0x0d
black_white   equ 0x07   ; White ink (7) on Black paper (0)

start:
    im 1
    call rom_cls

    ; --- 1ª Passagem: Imprime "hello" usando registo (HL) ---
    ld hl, string
    ld b, string_length
loop:
    ld a, (hl)
    rst 0x10
    inc hl
    dec b
    jr nz, loop

    ; Muda para a próxima linha
    ld a, enter
    rst 0x10

    ; --- Manipulação de Atributos de Cor ---
    ; Altera a cor do primeiro caráter para branco sobre fundo preto
    ld a, black_white
    ld (color_attr), a

    ; --- Manipulação de Bits e Endereçamento por Índice ---
    ; Coloca a primeira letra em maiúscula apagando o bit 5 (0x68 -> 0x48)
    ld ix, string
    res 5, (ix)

    ; --- 2ª Passagem: Imprime "Hello" com o loop desdobrado ---
    ld a, (ix+0)
    rst 0x10
    ld a, (ix+1)
    rst 0x10
    ld a, (ix+2)
    rst 0x10
    ld a, (ix+3)
    rst 0x10
    ld a, (ix+4)
    rst 0x10

    ; Nova linha final
    ld a, enter
    rst 0x10

    ret
```

### Explicação Passo-a-Passo

O texto detalha minuciosamente como cada bloco opera, cruzando a teoria de endereçamento com a forma como as instruções são guardadas na memória (visto através do ficheiro `.lst` gerado durante a compilação).

#### 1. Cabeçalho e Definição de Dados
- **`jp start`**: Usa **Endereçamento Imediato Extendido**. O instrutor refere que como os dados a saltar têm menos de 127 bytes, poderia usar-se um simples `JR start` (Endereçamento Relativo) para poupar um byte, mas prefere usar `JP` para ser mais extensível caso se adicione mais texto à variável `string` no futuro.
- **Constantes (`equ`)**: São definidos vários identificadores para os números para facilitar a leitura. Ex: `rom_cls` para o endereço da rotina de ecrã (0x0daf), `color_attr` para o endereço base da cor do ecrã (0x5800), e `enter` para o código especial do Spectrum que muda de linha (0x0d, diferente do ASCII tradicional 0x0a). A constante `black_white` define cor de tinta branca (bit 0-2) sobre fundo preto (bit 3-5), totalizando o valor 0x07.

#### 2. Início (`start:`)
- **`im 1`**: Usa o **Modo de Interrupção 1**. Diz ao CPU para recorrer à rotina ROM predefinida do Spectrum para lidar com as interrupções, pois o nosso programa só quer desenhar texto e não precisa de lidar com *hardware* específico em plano de fundo.
- **`call rom_cls`**: Usa **Endereçamento Imediato Extendido** (passando 0x0daf). A instrução `CALL` empurra o estado atual para a *stack* e vai para a rotina. A rotina ROM tem no seu final um `RET`, o que fará o ecrã ficar limpo e o programa prosseguir para a próxima linha. Quando compilado para máquina, a instrução fica armazenada como `CD AF 0D` (demonstrando o formato **Little Endian**, invertendo os bytes do endereço).

#### 3. O Loop de Impressão (1ª Passagem)
- **`ld hl, string`**: Usa **Endereçamento de Registo** (`HL`) em conjunto com **Endereçamento Imediato Extendido** (o endereço gerado da `string` - 0x8003). Se tivesse parênteses `(string)`, seria Modo Direto e os bytes "h" e "e" da string ficavam guardados em `H` e `L`. Sem os parênteses, apenas se carrega o valor 0x8003 (onde 0x80 vai para `H` e 0x03 para `L`).
- **`ld b, string_length`**: **Endereçamento Imediato**. Prepara `B` como o contador do loop.
- **`ld a, (hl)`**: **Endereçamento Indireto por Registo**. Lê da memória (posição 0x8003 para a frente) para o Acumulador (`A`).
- **`rst 0x10`**: **Endereçamento de Página Zero**. Esta instrução chama a rotina da ROM que imprime o caratere que estiver no registo `A`. Só consome 1 byte (`D7`).
- **`jr nz, loop`**: **Endereçamento Relativo**. O instrutor menciona que `dec b` seguido de `jr nz` podia ser compactado num `djnz` (uma instrução feita exatamente para iterar o `B`), mas mantém em separado propositadamente para que consigamos ver os diferentes Modos de Endereçamento condicional não-zero.

#### 4. Manipular Atributos de Cor no Ecrã
- **`ld (color_attr), a`**: Usa **Endereçamento Direto**. Depois de colocar `0x07` (black_white) no registo `A`, a instrução escreve na memória RAM de vídeo. Isto faz com que a grelha de 8x8 pixeis correspondente ao primeiro caractere ("h") invertam a sua cor de "preto em cinza" para "branco em preto". 

#### 5. Capitalização Manipulando Bits
- **`ld ix, string`** e **`res 5, (ix)`**: Demonstra a combinação de **Endereçamento de Bits** com **Endereçamento por Índice**. O registo de índice `IX` aponta para o primeiro byte ("h", ASCII 0x68). O comando `RES` apaga o 5º bit dessa posição de memória. Apagar esse bit em particular diminui o valor hexadecimal para 0x48, que corresponde ao ASCII de "H" (maiúscula).
- O instrutor mostra a desvantagem deste modo indexado: a instrução `res 5, (ix)` consome **4 bytes** no total (três bytes de prefixo/opcode + um byte com o `offset` zero), enquanto que `res 5, (hl)` ocuparia apenas 2.

#### 6. Loop Desdobrado (Unrolled Loop)
- Para ilustrar a capacidade total do modo de índice `IX`, em vez de criar um loop e aumentar gradualmente o registo, o código recorre a uma abordagem "desdobrada": `ld a, (ix+0)`, depois `ld a, (ix+1)`, etc. Isto mostra diretamente como a diferença/offset do indexador de endereçamento atua dentro dos limites de 8 bits (-128 a +127).

#### Conclusão e Listagem
Após executar todas estas variações complexas para imprimir a frase, o código salta de linha novamente (`ld a, enter / rst 0x10`) e termina com a instrução de Modo Implícito **`ret`**.

Ao correr o `build.sh`, podemos comparar a sintaxe vista no ecrã com o `.lst` exportado pelo **sjasmplus**, demonstrando que todo este programa tem apenas **64 bytes (0x40 bytes)**. O ficheiro ilustra detalhadamente para o utilizador como as diretivas e Modos de Endereçamento do Z80 se transformam em curtos opcodes em Hexadecimal a processar pelo Spectrum.
