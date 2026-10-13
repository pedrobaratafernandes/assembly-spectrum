# Mover Dados

Grande parte de qualquer programa consiste em copiar valores de um lado para o outro: de um registo para outro, da memória para um registo, de uma zona da memória para outra. Este capítulo mostra as instruções que o Z80 tem para isso e as suas limitações.

## A Instrução LD

`ld destino,origem` copia a origem para o destino. A origem não muda. A instrução `ld` nunca altera as flags (a única exceção são `ld a,i` e `ld a,r`).

O Z80 tem muitas variantes de `ld`, mas não aceita todas as combinações. As que existem são:

| Forma | Exemplo | Notas |
| :--- | :--- | :--- |
| registo ← registo (8 bits) | `ld a,b` | Entre `A`, `B`, `C`, `D`, `E`, `H` e `L`. |
| registo ← valor | `ld c,42` | |
| registo ← `(hl)` | `ld e,(hl)` | Qualquer registo de 8 bits. |
| `(hl)` ← registo ou valor | `ld (hl),a`, `ld (hl),0` | |
| `a` ← `(bc)` ou `(de)` | `ld a,(de)` | Só com o acumulador. |
| `(bc)` ou `(de)` ← `a` | `ld (de),a` | Só com o acumulador. |
| `a` ← `(endereço)` | `ld a,(23560)` | Só com o acumulador. |
| `(endereço)` ← `a` | `ld (32000),a` | Só com o acumulador. |
| par ← valor | `ld hl,16384` | `BC`, `DE`, `HL`, `SP`, `IX`, `IY`. |
| par ← `(endereço)` | `ld de,(23606)` | Lê 2 bytes: o baixo primeiro. |
| `(endereço)` ← par | `ld (32000),hl` | Escreve 2 bytes: o baixo primeiro. |
| `sp` ← `hl`, `ix` ou `iy` | `ld sp,hl` | |
| `a` ↔ `i` ou `r` | `ld a,i`, `ld r,a` | Só com o acumulador. |
| com índice | `ld b,(ix+3)`, `ld (iy-1),7` | |

Algumas combinações que **não existem**, e a forma de as contornar:

```assembly
    ; ld (32000),(32001)  -> não existe: memória para memória.
    ld a,(32001)        ; passar pelo acumulador.
    ld (32000),a

    ; ld b,(de)           -> não existe: só o acumulador lê por (de).
    ld a,(de)
    ld b,a

    ; ld bc,de            -> não existe: não há cópias entre pares.
    ld b,d              ; copiar as duas metades.
    ld c,e

    ; ld c,i              -> não existe: I só comunica com A.
    ld a,i
    ld c,a
```

A ordem dos bytes na memória é importante. `ld (32000),hl` guarda `L` em 32000 e `H` em 32001. Por isso, se `HL` = 16384 (`$4000`), o byte em 32000 fica 0 e o byte em 32001 fica 64 (`$40`). As diretivas `defw` / `dw` do assembler seguem a mesma ordem.

## Trocar em Vez de Copiar

A instrução `ex` troca o conteúdo de dois sítios, sem precisar de um registo intermédio:

```assembly
    ex de,hl            ; trocar DE com HL (muito usada: HL tem mais instruções).
    ex af,af'           ; trocar AF com o AF' alternativo.
    exx                 ; trocar BC, DE e HL com BC', DE' e HL'.
    ex (sp),hl          ; trocar HL com os 2 bytes do topo da pilha.
```

`ex af,af'` e `exx` dão acesso ao conjunto alternativo de registos. São uma forma muito rápida (4 *T-states* cada) de ter mais registos à mão, por exemplo para guardar valores durante uma rotina sem os pôr na memória. Dois cuidados:

* se o programa vai voltar ao BASIC, tem de deixar `HL'` como o encontrou, porque o BASIC precisa dele;
* não existe forma de copiar diretamente de `B` para `B'`: só se troca o conjunto inteiro.

## Copiar Blocos de Memória

Para copiar muitos bytes seguidos, o Z80 tem instruções próprias, que usam sempre os mesmos registos: `HL` = origem, `DE` = destino e `BC` = número de bytes.

| Instrução | O que faz |
| :--- | :--- |
| `ldi` | Copia 1 byte de `(HL)` para `(DE)`; `HL` e `DE` aumentam 1, `BC` diminui 1. |
| `ldir` | Repete `ldi` até `BC` chegar a 0. |
| `ldd` | Copia 1 byte de `(HL)` para `(DE)`; `HL` e `DE` diminuem 1, `BC` diminui 1. |
| `lddr` | Repete `ldd` até `BC` chegar a 0. |

Copiar o ecrã inteiro (píxeis e atributos, 6912 bytes) para um buffer em 49152:

```assembly
    ld hl,16384         ; origem: o ecrã.
    ld de,49152         ; destino: o buffer.
    ld bc,6912          ; 6144 bytes de píxeis + 768 de atributos.
    ldir
```

Cuidado: `ldir` com `BC` = 0 não copia zero bytes, copia 65536, e destrói toda a memória.

### Quando usar LDDR

Se a origem e o destino se sobrepõem, a direção conta. Para deslocar um bloco para endereços **mais altos**, é preciso copiar do fim para o princípio com `lddr`; caso contrário, os primeiros bytes copiados apagam bytes da origem que ainda não foram lidos. Por exemplo, para abrir um espaço de 1 byte no início de uma tabela de 100 bytes:

```assembly
    ld hl,tabela+98     ; último byte a mover (origem).
    ld de,tabela+99     ; uma posição à frente (destino).
    ld bc,99            ; mover 99 bytes.
    lddr                ; do fim para o princípio.
```

### Preencher memória com LDIR

Um truque clássico: para encher uma zona de memória com o mesmo valor, escreve-se o valor no primeiro byte e copia-se a zona sobre si própria, uma posição à frente. Cada byte copiado é o valor que acabou de ser escrito.

```assembly
    ld hl,22528         ; primeiro atributo.
    ld (hl),56          ; preto sobre branco.
    ld de,22529         ; uma posição à frente.
    ld bc,767           ; os restantes 767 atributos.
    ldir                ; agora são todos 56.
```

## Um Programa Completo

Este programa usa as instruções do capítulo. Enche o ecrã de carateres, guarda uma cópia do ecrã num buffer com `ldir`, apaga os píxeis com o truque do preenchimento e, depois de uma pausa, repõe o ecrã a partir da cópia.

```assembly
        DEVICE ZXSPECTRUM48
        ORG 32768
start:
    call 3503           ; limpar o ecrã e abrir o canal 2.
    ld b,0              ; 256 vezes...
texto:
    ld a,b
    and 63              ; ...um carácter entre 32 e 95.
    add a,32
    rst 16
    djnz texto
    ld b,0              ; mais 256.
texto2:
    ld a,b
    and 63
    add a,32
    rst 16
    djnz texto2

    ld hl,16384         ; guardar o ecrã no buffer.
    ld de,49152
    ld bc,6912
    ldir

    call pausa

    ld hl,16384         ; apagar os píxeis: preencher com zeros.
    ld (hl),0
    ld de,16385
    ld bc,6143
    ldir

    call pausa

    ld hl,49152         ; repor o ecrã a partir do buffer.
    ld de,16384
    ld bc,6912
    ldir
    ret

pausa:
    ld b,50             ; 50 fotogramas = 1 segundo.
pausa0:
    halt
    djnz pausa0
    ret
fim:

; --- Carregador BASIC + ficheiro .tap (igual em todos os exemplos) ---
        ORG 23755
basic:  db 0,10                 ; 10 CLEAR 32767: LOAD "" CODE: RANDOMIZE USR 32768
        dw basic_fim-basic-4
        db $FD,$B0,'"32767":',$EF,'""',$AF,':',$F9,$C0,$B0,'"32768"',13
basic_fim:
        EMPTYTAP "z80_02_1.tap"
        SAVETAP  "z80_02_1.tap",BASIC,"z80_02_1",basic,basic_fim-basic,10
        SAVETAP  "z80_02_1.tap",CODE,"z80_02_1",start,fim-start
```

## Exercícios

1. Altere o programa para, em vez de apagar os píxeis, pintar todos os atributos de amarelo (papel 6) antes de repor o ecrã.
2. Escreva uma rotina que troque os valores das variáveis de 16 bits `var1` e `var2` usando `ex de,hl`.
3. O que acontece se, no truque do preenchimento, usar `lddr` em vez de `ldir` (com os endereços ajustados ao fim da zona)?
