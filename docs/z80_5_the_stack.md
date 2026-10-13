# A Pilha (Stack)

A pilha é uma zona da RAM que o Z80 usa para guardar valores temporariamente, segundo a regra "o último a entrar é o primeiro a sair" (LIFO, *Last In, First Out*). É usada automaticamente pelas instruções `call` e `ret` e pelas interrupções, e o programador pode usá-la com `push` e `pop`.

## Como Funciona

O registo `SP` (*Stack Pointer*) contém o endereço do topo da pilha. A pilha **cresce para baixo**: cada valor guardado fica num endereço mais baixo do que o anterior.

* `push rr` subtrai 2 a `SP` e escreve o par de registos `rr` em `(SP)`: primeiro o byte alto em `SP+1` e o byte baixo em `SP`.
* `pop rr` lê 2 bytes de `(SP)` para o par `rr` e soma 2 a `SP`.

Só se podem guardar pares de 16 bits: `AF`, `BC`, `DE`, `HL`, `IX` e `IY`. Para guardar só o `A`, faz-se `push af`.

```assembly
    ld bc,100
    push bc             ; guardar BC (100) na pilha.
    ld bc,50            ; usar BC para outra coisa.
    ; ...
    pop bc              ; BC volta a ser 100.
```

Os valores saem pela ordem inversa à que entraram:

```assembly
    push af
    push bc
    push hl
    ; ...
    pop hl              ; o último a entrar é o primeiro a sair.
    pop bc
    pop af
```

Também se pode usar a pilha para copiar um par para outro que não tem `ld` direto: `push de` / `pop bc` copia `DE` para `BC`. E `push ix` / `pop hl` copia `IX` para `HL`.

Num programa carregado pelo BASIC, como os deste livro, a pilha está logo abaixo do endereço indicado no `CLEAR` (32767) e cresce para baixo, longe do nosso código, que começa em 32768.

## CALL e RET Usam a Pilha

`call endereço` faz o equivalente a `push pc` (com o endereço da instrução seguinte) e salta para `endereço`. `ret` faz o equivalente a `pop pc`. É assim que uma sub-rotina sabe para onde voltar, e é também por isso que as sub-rotinas podem chamar outras sub-rotinas: cada `call` empilha um endereço de retorno, e cada `ret` usa o mais recente.

Daqui resulta a regra mais importante sobre a pilha:

> **Dentro de uma sub-rotina, cada `push` tem de ter o seu `pop` antes do `ret`.** Se ficar um valor a mais na pilha, o `ret` usa-o como endereço de retorno e o programa salta para um sítio qualquer, normalmente bloqueando ou reiniciando o Spectrum.

```assembly
errada:
    push bc
    ; ...
    ret                 ; ERRO: o ret vai usar o valor de BC como endereço!

certa:
    push bc
    ; ...
    pop bc
    ret
```

## Truques com a Pilha

### EX (SP),HL

`ex (sp),hl` troca `HL` com o valor do topo da pilha. Uma utilização clássica é passar dados que estão logo a seguir ao `call`. Dentro da sub-rotina, o topo da pilha é o endereço de retorno, que aponta para esses dados:

```assembly
    call imprime        ; os dados vêm logo a seguir ao call.
    defb "Ola",0        ; texto terminado com 0.
    ; ... o programa continua aqui ...

imprime:
    ex (sp),hl          ; HL = endereço de retorno = início do texto.
imprime0:
    ld a,(hl)
    inc hl
    and a               ; fim do texto?
    jr z,imprime1
    rst 16              ; imprimir o carácter.
    jr imprime0
imprime1:
    ex (sp),hl          ; o endereço de retorno passa a ser o fim do texto.
    ret
```

### Escrever no ecrã com PUSH

`push` escreve 2 bytes na memória em 11 *T-states*, mais depressa do que qualquer outra instrução. Por isso, alguns jogos apontam `SP` para o ecrã e usam `push` para o preencher depressa. Há três cuidados obrigatórios:

1. **Desligar as interrupções** (`di`). Uma interrupção guarda o endereço de retorno na pilha, ou seja, escreveria 2 bytes no ecrã e a rotina de interrupção usaria o "ecrã" como pilha.
2. **Guardar o `SP` original** e repô-lo no fim (`ld (guarda),sp` e `ld sp,(guarda)`).
3. **Lembrar que a pilha cresce para baixo**: `SP` aponta para o **fim** da zona a preencher, e cada `push` escreve nos 2 bytes imediatamente abaixo.

Para pintar os 768 atributos do ecrã (de 22528 a 23295), o `SP` começa em 23296, o endereço logo a seguir ao último atributo.

## Um Programa Completo

Este programa usa a rotina `imprime`, que lê o texto a seguir ao `call`, e depois pinta o ecrã inteiro de ciano com `push`, depois de desligar as interrupções e guardar o `SP`.

```assembly
        DEVICE ZXSPECTRUM48
        ORG 32768
start:
    call 3503           ; limpar o ecrã e abrir o canal 2.
    call imprime
    defb "A pilha guarda o endereco",13
    defb "de retorno de cada call.",0

    call pausa

    di                  ; nada de interrupções com o SP fora do sítio!
    ld (guarda),sp      ; guardar o ponteiro da pilha.
    ld sp,23296         ; fim da área de atributos (22528 + 768).
    ld de,5*8*256+5*8   ; papel ciano (5*8) nos dois bytes.
    ld b,48             ; 48 voltas x 8 push x 2 bytes = 768 bytes.
pinta:
    push de
    push de
    push de
    push de
    push de
    push de
    push de
    push de
    djnz pinta
    ld sp,(guarda)      ; repor o ponteiro da pilha.
    ei                  ; e as interrupções.

    call pausa
    ret

pausa:
    ld b,50             ; 1 segundo.
pausa0:
    halt
    djnz pausa0
    ret

    ; Imprimir o texto (terminado em 0) que está a seguir ao call.
imprime:
    ex (sp),hl          ; HL = endereço de retorno = início do texto.
imprime0:
    ld a,(hl)
    inc hl
    and a               ; fim do texto?
    jr z,imprime1
    rst 16              ; imprimir o carácter.
    jr imprime0
imprime1:
    ex (sp),hl          ; voltar para depois do texto.
    ret

guarda: defw 0          ; cópia do SP original.
fim:

; --- Carregador BASIC + ficheiro .tap (igual em todos os exemplos) ---
        ORG 23755
basic:  db 0,10                 ; 10 CLEAR 32767: LOAD "" CODE: RANDOMIZE USR 32768
        dw basic_fim-basic-4
        db $FD,$B0,'"32767":',$EF,'""',$AF,':',$F9,$C0,$B0,'"32768"',13
basic_fim:
        EMPTYTAP "z80_05_1.tap"
        SAVETAP  "z80_05_1.tap",BASIC,"z80_05_1",basic,basic_fim-basic,10
        SAVETAP  "z80_05_1.tap",CODE,"z80_05_1",start,fim-start
```

## Exercícios

1. Na rotina `errada` acima, o que acontece exatamente quando o `ret` é executado?
2. Altere o programa para pintar só a metade de cima do ecrã (os primeiros 384 atributos). Em que endereço deve começar o `SP`?
3. Escreva uma rotina que troque `BC` e `DE` usando apenas `push` e `pop`.
