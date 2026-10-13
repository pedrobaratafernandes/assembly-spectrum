# Gráficos no ZX Spectrum

O ecrã do Spectrum tem 256 × 192 píxeis e é guardado em duas zonas da memória: uma para os píxeis e outra para as cores. Este capítulo mostra como estão organizadas e as três formas principais de desenhar: com caracteres, com píxeis e com imagens completas.

## A Memória do Ecrã

| Zona | Endereços | Tamanho | Conteúdo |
| :--- | :--- | :--- | :--- |
| Píxeis (*bitmap*) | 16384 – 22527 | 6144 bytes | 1 bit por píxel: 1 = tinta, 0 = papel. Cada byte são 8 píxeis seguidos na horizontal. |
| Atributos | 22528 – 23295 | 768 bytes | 1 byte de cor por cada célula de 8 × 8 píxeis (32 colunas × 24 linhas). |

### Os atributos

Cada byte de atributo define as cores de um quadrado de 8 × 8 píxeis:

| Bits | Significado |
| :--- | :--- |
| 0 – 2 | Tinta (0 a 7): preto, azul, vermelho, magenta, verde, ciano, amarelo, branco. |
| 3 – 5 | Papel (0 a 7), nas mesmas cores. |
| 6 | Brilho (1 = cores mais vivas). |
| 7 | *Flash* (1 = tinta e papel trocam de lugar, duas vezes por segundo). |

Ou seja, atributo = tinta + papel × 8 + 64 (se brilhante) + 128 (se *flash*). Os atributos estão por ordem, linha a linha: o endereço da célula na linha `l` (0-23) e coluna `c` (0-31) é `22528 + l × 32 + c`.

Como cada quadrado de 8 × 8 só tem duas cores (tinta e papel), quando um objeto colorido passa por cima de outro, as cores de um "contaminam" o outro. É o famoso *colour clash* do Spectrum, e é por isso que tantos jogos usam *sprites* de uma só cor, ou um fundo preto.

### Os píxeis

A zona dos píxeis **não** está organizada linha a linha. O ecrã divide-se em três terços de 64 linhas, e dentro de cada terço as linhas estão entrelaçadas: primeiro vêm as primeiras linhas de píxeis das 8 linhas de caracteres, depois as segundas, e assim por diante. Na prática, o endereço do byte que contém o píxel (`x`, `y`), com `y` = 0 no topo, forma-se a partir dos bits das coordenadas assim:

| Byte alto | Byte baixo |
| :---: | :---: |
| `0 1 0 y7 y6 y2 y1 y0` | `y5 y4 y3 x7 x6 x5 x4 x3` |

* `y7 y6` escolhem o terço do ecrã;
* `y5 y4 y3` escolhem a linha de caracteres dentro do terço;
* `y2 y1 y0` escolhem a linha de píxeis dentro do carácter;
* `x7 … x3` escolhem a coluna (byte) na linha;
* `x2 x1 x0` escolhem o bit dentro do byte: 0 é o píxel mais à esquerda (bit 7 do byte).

Uma consequência útil: dentro de uma célula de carácter, a linha de píxeis seguinte está sempre 256 bytes à frente, por isso basta `inc h` para descer uma linha.

## Desenhar com Caracteres

A forma mais simples é imprimir caracteres com `rst 16`, como nos capítulos anteriores. Além das letras, o Spectrum tem:

* **Gráficos de blocos** (códigos 128 a 143): 16 combinações de quatro quadrados de 4 × 4 píxeis, os desenhos que estão nas teclas 1 a 8.
* **UDGs** (*User Defined Graphics*, códigos 144 a 164): 21 caracteres que podemos desenhar. A variável de sistema `UDG` (endereço 23675) indica onde estão os seus desenhos, 8 bytes cada. Basta apontá-la para os nossos dados.

```assembly
    ld hl,nave          ; os nossos desenhos.
    ld (23675),hl       ; variável UDG.
    ld a,144            ; código do primeiro UDG.
    rst 16
    ; ...
nave:
    defb %00011000      ; 8 bytes = 8 linhas de 8 píxeis.
    defb %00111100
    defb %01111110
    defb %11011011
    defb %11111111
    defb %00100100
    defb %01011010
    defb %10100101
```

## Desenhar Píxeis

Para desenhar um píxel calcula-se o endereço do byte com a tabela de bits acima, e liga-se o bit certo com uma máscara. A rotina seguinte faz isso:

```assembly
    ; Ligar o píxel (x em C, 0-255; y em B, 0-191, 0 = topo).
plot:
    ld a,b
    and 7               ; y2 y1 y0
    or 64               ; 0 1 0 0 0 y2 y1 y0
    ld h,a
    ld a,b
    rra
    rra
    rra
    and 24              ; y7 y6 nos bits 4 e 3
    or h
    ld h,a              ; H = 0 1 0 y7 y6 y2 y1 y0
    ld a,b
    rla
    rla
    and 224             ; y5 y4 y3 nos bits 7, 6 e 5
    ld l,a
    ld a,c
    rra
    rra
    rra
    and 31              ; x7 ... x3 nos bits 4 a 0
    or l
    ld l,a              ; L = y5 y4 y3 x7 x6 x5 x4 x3
    ld a,c
    and 7               ; posição do píxel dentro do byte
    ld b,a
    ld a,128            ; máscara para o píxel mais à esquerda.
    jr z,plot1          ; posição 0: a máscara já está certa.
plot0:
    rrca                ; deslocar a máscara para a direita.
    djnz plot0
plot1:
    or (hl)             ; juntar aos píxeis que já lá estão.
    ld (hl),a
    ret
```

Para apagar o píxel em vez de o ligar, inverte-se a máscara (`cpl`) e usa-se `and (hl)`; para o trocar, usa-se `xor (hl)`. A ROM também tem uma rotina de `PLOT`, mas usa coordenadas com `y` = 0 em baixo e é bastante mais lenta.

## Imagens Completas

Para mostrar um ecrã inteiro desenhado num programa de desenho, usa-se um ficheiro `.scr`: os 6912 bytes do ecrã (6144 de píxeis e 768 de atributos), pela ordem em que estão na memória. A diretiva `incbin` do sjasmplus inclui o ficheiro no programa, e um `ldir` copia-o para o ecrã:

```assembly
    ld hl,imagem        ; origem: a imagem incluída no programa.
    ld de,16384         ; destino: o ecrã.
    ld bc,6912          ; píxeis + atributos.
    ldir
    ; ...
imagem:
    incbin "imagem.scr" ; ficheiro de 6912 bytes.
```

Para um ecrã de carregamento, nem é preciso incluí-lo no programa: o carregador BASIC pode carregá-lo diretamente com `LOAD ""SCREEN$` (capítulo 18 da Parte 2).

## Um Programa Completo

Este programa desenha uma moldura e uma diagonal com a rotina `plot`, pinta a metade de cima do ecrã de azul, e mostra os 16 gráficos de blocos e um UDG. A moldura só ocupa as primeiras 176 linhas de píxeis (`y` de 0 a 175): as duas últimas linhas de caracteres são a parte do ecrã onde o BASIC escreve as mensagens, e seriam apagadas quando o programa volta ao BASIC e mostra `0 OK`.

```assembly
        DEVICE ZXSPECTRUM48
        ORG 32768
start:
    call 3503           ; limpar o ecrã e abrir o canal 2.

    ld e,0              ; linhas horizontais: x de 0 a 255.
horiz:
    ld c,e              ; topo (y = 0).
    ld b,0
    call plot
    ld c,e              ; fundo (y = 175).
    ld b,175
    call plot
    inc e
    jr nz,horiz         ; até E dar a volta a 0.

    ld d,0              ; linhas verticais e diagonal: y de 0 a 175.
vert:
    ld b,d              ; margem esquerda (x = 0).
    ld c,0
    call plot
    ld b,d              ; margem direita (x = 255).
    ld c,255
    call plot
    ld b,d              ; diagonal (x = y).
    ld c,d
    call plot
    inc d
    ld a,d
    cp 176
    jr nz,vert

    ld hl,22528         ; pintar as primeiras 12 linhas de atributos:
    ld (hl),1*8+7       ; papel azul, tinta branca.
    ld de,22529
    ld bc,12*32-1
    ldir

    ld a,22             ; AT 20,8.
    rst 16
    ld a,20
    rst 16
    ld a,8
    rst 16
    ld a,128            ; os 16 gráficos de blocos.
blocos:
    push af             ; rst 16 não preserva A.
    rst 16
    pop af
    inc a
    cp 144
    jr nz,blocos

    ld hl,nave          ; e um UDG.
    ld (23675),hl
    ld a,' '
    rst 16
    ld a,144
    rst 16
    ret

    ; Ligar o píxel (x em C, 0-255; y em B, 0-191, 0 = topo).
plot:
    ld a,b
    and 7
    or 64
    ld h,a
    ld a,b
    rra
    rra
    rra
    and 24
    or h
    ld h,a
    ld a,b
    rla
    rla
    and 224
    ld l,a
    ld a,c
    rra
    rra
    rra
    and 31
    or l
    ld l,a
    ld a,c
    and 7
    ld b,a
    ld a,128
    jr z,plot1
plot0:
    rrca
    djnz plot0
plot1:
    or (hl)
    ld (hl),a
    ret

nave:
    defb %00011000
    defb %00111100
    defb %01111110
    defb %11011011
    defb %11111111
    defb %00100100
    defb %01011010
    defb %10100101
fim:

; --- Carregador BASIC + ficheiro .tap (igual em todos os exemplos) ---
        ORG 23755
basic:  db 0,10                 ; 10 CLEAR 32767: LOAD "" CODE: RANDOMIZE USR 32768
        dw basic_fim-basic-4
        db $FD,$B0,'"32767":',$EF,'""',$AF,':',$F9,$C0,$B0,'"32768"',13
basic_fim:
        EMPTYTAP "z80_10_1.tap"
        SAVETAP  "z80_10_1.tap",BASIC,"z80_10_1",basic,basic_fim-basic,10
        SAVETAP  "z80_10_1.tap",CODE,"z80_10_1",start,fim-start
```

Repare no `push af` / `pop af` à volta do `rst 16` no ciclo dos blocos: a rotina de impressão da ROM altera `A` (e as flags), por isso o contador tem de ser guardado na pilha antes de cada impressão.

## Exercícios

1. Escreva uma rotina `unplot` que apague um píxel, e use-a para apagar a diagonal.
2. Desenhe um retângulo cheio de 32 × 16 píxeis no centro do ecrã.
3. Pinte cada uma das 24 linhas de atributos com uma cor de papel diferente (use `and 7` sobre o número da linha).
