# O Z80, a Memória e os Modos de Endereçamento

Este capítulo apresenta o processador do ZX Spectrum, o Z80, e as várias formas que as instruções têm de indicar onde estão os dados com que trabalham: os **modos de endereçamento**. No fim há um programa completo que usa quase todos.

Se ainda não instalou o sjasmplus e o Fuse, comece por [Preparar o Ambiente](ferramentas.md).

## Bits, Bytes e Hexadecimal

O Z80 é um processador de **8 bits**: a maior parte das operações trabalha com bytes, números de 0 a 255. Para endereços de memória usa **16 bits**, números de 0 a 65535.

Em assembly é comum escrever números em hexadecimal (base 16), porque cada algarismo hexadecimal corresponde exatamente a 4 bits:

| Decimal | Binário | Hexadecimal |
| :--- | :--- | :--- |
| 0 | `%00000000` | `$00` |
| 10 | `%00001010` | `$0A` |
| 15 | `%00001111` | `$0F` |
| 16 | `%00010000` | `$10` |
| 255 | `%11111111` | `$FF` |
| 16384 | — | `$4000` |
| 65535 | — | `$FFFF` |

No sjasmplus, os prefixos `$`, `#` e `0x` indicam hexadecimal e `%` indica binário. Os bits de um byte numeram-se de 0 (o da direita, que vale 1) a 7 (o da esquerda, que vale 128).

## A Memória do Spectrum 48K

O Z80 consegue endereçar 64 KB (65536 bytes). No Spectrum 48K estão divididos assim:

| Endereços | Conteúdo |
| :--- | :--- |
| 0 – 16383 (`$0000`–`$3FFF`) | ROM: o BASIC e as rotinas do sistema. Só pode ser lida. |
| 16384 – 22527 (`$4000`–`$57FF`) | Píxeis do ecrã (6144 bytes). |
| 22528 – 23295 (`$5800`–`$5AFF`) | Atributos (cores) do ecrã (768 bytes). |
| 23296 – 23551 (`$5B00`–`$5BFF`) | *Buffer* da impressora. |
| 23552 – 23733 (`$5C00`–`$5CB5`) | Variáveis de sistema. |
| 23734 – … | Canais, programa BASIC, variáveis e área livre. |
| … – 65535 (`$FFFF`) | Fim da RAM. |

Os nossos programas são carregados em 32768 (`$8000`). A partir daí, a RAM é "não contendida": a ULA, o circuito que desenha o ecrã, nunca atrasa o processador quando este acede a ela, por isso o código corre mais depressa do que abaixo de 32768.

## Os Registos

Os registos são pequenas memórias dentro do processador, muito mais rápidas do que a RAM. O Z80 tem estes:

| Registo | Tamanho | Uso principal |
| :--- | :--- | :--- |
| `A` | 8 bits | Acumulador: quase todas as contas de 8 bits e operações lógicas fazem-se aqui. |
| `F` | 8 bits | Flags: bits que guardam informação sobre o resultado da última operação (zero, transporte, sinal…). |
| `B`, `C`, `D`, `E`, `H`, `L` | 8 bits | Uso geral. Podem juntar-se aos pares: `BC`, `DE` e `HL`, de 16 bits. |
| `HL` | 16 bits | O par preferido para apontar para a memória e para somas de 16 bits. |
| `BC` | 16 bits | Muitas vezes usado como contador (`B` sozinho é o contador do `djnz`). |
| `DE` | 16 bits | Muitas vezes usado como endereço de destino. |
| `IX`, `IY` | 16 bits | Registos de índice: apontam para o início de uma estrutura de dados. O BASIC usa `IY`. |
| `SP` | 16 bits | *Stack Pointer*: o topo da pilha (capítulo 5). |
| `PC` | 16 bits | *Program Counter*: o endereço da próxima instrução a executar. |
| `I` | 8 bits | Usado nas interrupções em modo 2 (capítulo 11). |
| `R` | 8 bits | *Refresh*: muda sozinho a cada instrução. |

Existe ainda um segundo conjunto, `AF'`, `BC'`, `DE'` e `HL'`, que não se usa diretamente. Só se lhe chega trocando-o com o conjunto normal (capítulo 2).

## Modos de Endereçamento

A instrução mais usada do Z80 é `ld` (*load*, carregar), que copia um valor de um sítio para outro. Em todas as instruções com dois operandos, o **destino vem primeiro** e a **origem depois**: `ld a,b` copia `B` para `A`. Os modos de endereçamento são as formas de indicar esses operandos.

### Implícito

A instrução não tem operandos: tudo o que precisa está no próprio código da instrução.

```assembly
    ret                 ; voltar da sub-rotina.
    di                  ; desligar as interrupções.
    ei                  ; ligá-las de novo.
```

### Registo

Os operandos são registos. É o modo mais rápido, porque não há acesso à memória.

```assembly
    ld a,b              ; copiar B para A.
    inc c               ; somar 1 a C.
```

### Imediato

O valor está escrito na própria instrução, logo a seguir ao código. Pode ser de 8 bits ou, nas instruções de 16 bits, de 16 bits (a que alguns manuais chamam "imediato estendido").

```assembly
    ld b,5              ; B = 5.
    ld hl,16384         ; HL = 16384.
    add a,10            ; A = A + 10.
```

### Direto (estendido)

A instrução contém um endereço de memória de 16 bits, entre parênteses. Os parênteses querem dizer "o conteúdo da memória nesse endereço".

```assembly
    ld a,(23560)        ; A = byte guardado no endereço 23560.
    ld (32000),a        ; guardar A no endereço 32000.
    ld hl,(23606)       ; L = byte em 23606, H = byte em 23607.
```

Sem parênteses, `ld hl,23606` põe o **número** 23606 em `HL`; com parênteses, `ld hl,(23606)` põe em `HL` o **conteúdo** dos endereços 23606 e 23607. Os valores de 16 bits ficam na memória com o byte baixo primeiro (formato *little-endian*).

O `JP` também usa um endereço de 16 bits, mas sem parênteses, porque não vai ler a memória: salta para lá.

```assembly
    jp 32768            ; continuar a execução no endereço 32768.
```

### Indireto por registo

O endereço está num par de registos: `(HL)`, `(BC)` ou `(DE)`. É a forma natural de percorrer tabelas, textos e gráficos: basta incrementar o par para passar ao byte seguinte.

```assembly
    ld hl,texto         ; HL aponta para o texto.
    ld a,(hl)           ; A = primeiro carácter.
    inc hl              ; HL aponta para o segundo.
```

Com `(HL)` o Z80 aceita qualquer registo de 8 bits (`ld b,(hl)`, `ld (hl),e`…) e até um valor imediato (`ld (hl),0`). Com `(BC)` e `(DE)` só aceita o acumulador: `ld a,(de)` existe, mas `ld b,(de)` não.

### Indexado

O endereço é `IX` ou `IY` mais um deslocamento fixo, de −128 a +127. É útil quando `IX` aponta para o início de um registo de dados com vários campos, como as coordenadas e o estado de um inimigo.

```assembly
    ld ix,inimigo       ; IX aponta para os dados do inimigo.
    ld a,(ix+0)         ; estado.
    ld b,(ix+1)         ; linha.
    ld c,(ix+2)         ; coluna.
```

As instruções com `IX` e `IY` têm um byte de prefixo a mais e são mais lentas: `ld a,(ix+1)` gasta 19 ciclos de relógio (*T-states*), contra 7 de `ld a,(hl)`.

### Relativo

Usado pelos saltos `jr` e `djnz`. Em vez de um endereço completo, a instrução guarda uma distância de −128 a +127 bytes a partir da instrução seguinte. Ocupa 2 bytes em vez dos 3 do `jp`. O assembler calcula a distância sozinho; se o destino estiver longe demais, dá erro e é preciso usar `jp`.

```assembly
    ld b,10
ciclo:
    ; ... fazer qualquer coisa 10 vezes ...
    djnz ciclo          ; B = B - 1; se B não for 0, voltar a "ciclo".
```

### Página zero (RST)

`rst n` é uma chamada de 1 byte a um de oito endereços fixos no início da memória: 0, 8, 16, 24, 32, 40, 48 e 56. No Spectrum, esses endereços estão na ROM e têm rotinas úteis. A mais usada é `rst 16` (`$10`), que imprime o carácter que está em `A`:

```assembly
    ld a,'H'            ; código ASCII de "H" (72).
    rst 16              ; imprimi-lo no canal atual.
```

Um `call` ocupa 3 bytes; `rst` ocupa só 1.

### Bit

As instruções `bit`, `set` e `res` testam, ligam e desligam um bit (0 a 7) de um registo ou de um byte na memória, sem mexer nos outros.

```assembly
    set 7,a             ; ligar o bit 7 de A.
    res 5,(hl)          ; desligar o bit 5 do byte apontado por HL.
    bit 0,c             ; testar o bit 0 de C: a flag Z fica a 1 se o bit for 0.
```

## Um Programa Completo

Este programa usa quase todos os modos de endereçamento. Limpa o ecrã, imprime "hello" num ciclo com endereçamento indireto, pinta de vermelho os atributos dessa linha com endereçamento direto, transforma o "h" em "H" desligando o bit 5 com endereçamento indexado e imprime a palavra outra vez.

```assembly
        DEVICE ZXSPECTRUM48
        ORG 32768
start:
string_length: equ 5
rom_cls:       equ 3503     ; rotina da ROM: limpar o ecrã e abrir o canal 2.

    call rom_cls        ; chamada a um endereço fixo.

    ; 1.ª passagem: imprimir "hello" com endereçamento indireto (HL).
    ld hl,string        ; imediato de 16 bits.
    ld b,string_length  ; imediato de 8 bits.
loop:
    ld a,(hl)           ; indireto por registo.
    rst 16              ; página zero: imprimir A.
    inc hl              ; registo.
    djnz loop           ; relativo: repetir 5 vezes.

    ld a,13             ; código de mudança de linha.
    rst 16

    ; Pintar a primeira linha do ecrã: papel vermelho, tinta branca.
    ld a,2*8+7          ; papel 2 (vermelho), tinta 7 (branco).
    ld hl,22528         ; endereço do primeiro atributo.
    ld b,32             ; 32 colunas.
pinta:
    ld (hl),a           ; indireto: escrever o atributo.
    inc hl
    djnz pinta

    ; Passar o "h" a maiúscula com endereçamento indexado e de bit.
    ld ix,string
    res 5,(ix+0)        ; "h" = %01101000 -> "H" = %01001000.

    ; 2.ª passagem: imprimir com endereçamento indexado.
    ld a,(ix+0)
    rst 16
    ld a,(ix+1)
    rst 16
    ld a,(ix+2)
    rst 16
    ld a,(ix+3)
    rst 16
    ld a,(ix+4)
    rst 16
    ld a,13
    rst 16
    ret                 ; implícito: voltar ao BASIC.

string: defb "hello"
fim:

; --- Carregador BASIC + ficheiro .tap (igual em todos os exemplos) ---
        ORG 23755
basic:  db 0,10                 ; 10 CLEAR 32767: LOAD "" CODE: RANDOMIZE USR 32768
        dw basic_fim-basic-4
        db $FD,$B0,'"32767":',$EF,'""',$AF,':',$F9,$C0,$B0,'"32768"',13
basic_fim:
        EMPTYTAP "z80_01_1.tap"
        SAVETAP  "z80_01_1.tap",BASIC,"z80_01_1",basic,basic_fim-basic,10
        SAVETAP  "z80_01_1.tap",CODE,"z80_01_1",start,fim-start
```

Ao correr, aparece "hello" sobre fundo vermelho na primeira linha e "Hello" na segunda. Repare em três pormenores:

* `rom_cls: equ 3503` não gera código: dá apenas um nome ao número 3503. É boa prática dar nomes aos endereços da ROM e às constantes.
* A diferença entre maiúsculas e minúsculas em ASCII é exatamente o bit 5 (valor 32): "a" = 97 e "A" = 65. Por isso `res 5` passa uma letra a maiúscula e `set 5` a minúscula.
* A rotina 3503 deixa o canal 2 (ecrã superior) aberto, e é por isso que o `rst 16` escreve no ecrã sem mais preparação.

## Exercícios

1. Mude o programa para imprimir o seu nome (sem acentos) e pintar a linha de azul (papel 1).
2. Substitua as cinco instruções `ld a,(ix+n)` / `rst 16` da segunda passagem por um ciclo com `djnz`.
3. Porque é que `ld a,(hl)` funciona, mas `ld (hl),(de)` não existe? (Pista: veja o capítulo seguinte.)
