# Aritmética

O Z80 sabe somar e subtrair, em 8 e em 16 bits. Não tem instruções de multiplicação nem de divisão: essas fazem-se com somas, subtrações e deslocamentos de bits (capítulos 6 e 15 da Parte 2).

## Soma e Subtração de 8 Bits

Em 8 bits, o resultado fica sempre no acumulador:

```assembly
    ld a,10
    ld b,5
    add a,b             ; A = 10 + 5 = 15.
    add a,20            ; A = 35.
    sub 3               ; A = 32.
    sub b               ; A = 27.
    add a,(hl)          ; somar o byte apontado por HL.
```

Repare que `add` se escreve com o `a,` e `sub` sem ele: é a convenção dos manuais da Zilog, e o sjasmplus aceita as duas formas.

Um registo de 8 bits só guarda valores de 0 a 255. Se uma soma passar de 255, o resultado "dá a volta" e a flag de *carry* fica a 1: 250 + 10 dá 4, com C = 1. Da mesma forma, 3 − 5 dá 254, com C = 1 (houve um "empréstimo").

## Somar e Subtrair com Transporte

`adc` (*add with carry*) soma também o valor da flag C, e `sbc` (*subtract with carry*) subtrai-o. Servem para fazer contas com números maiores do que um registo, uma parte de cada vez, tal como se faz à mão com o "e vai um". Para somar dois números de 16 bits guardados em `B,C` e `D,E` com resultado em `H,L`:

```assembly
    ld a,c
    add a,e             ; somar os bytes baixos; C = 1 se passou de 255.
    ld l,a
    ld a,b
    adc a,d             ; somar os bytes altos mais o transporte.
    ld h,a              ; HL = BC + DE.
```

Este método estende-se a 24, 32 ou mais bits: soma-se o byte mais baixo com `add` e todos os seguintes com `adc`.

## Aritmética de 16 Bits

Para números de 16 bits há instruções próprias, quase todas com `HL` como destino:

```assembly
    ld hl,1000
    ld bc,500
    add hl,bc           ; HL = 1500.
    add hl,hl           ; HL = 3000 (multiplicar por 2).
    adc hl,de           ; HL = HL + DE + carry.
    sbc hl,de           ; HL = HL - DE - carry.
    add ix,bc           ; também existe para IX e IY.
```

Três pormenores importantes:

* **Não existe `sub hl,de`.** Só existe `sbc hl,de`, que subtrai também o *carry*. Por isso, antes de uma subtração de 16 bits, limpa-se o *carry* com `and a` (ou `or a`):

  ```assembly
      and a               ; C = 0.
      sbc hl,de           ; HL = HL - DE.
  ```

* `add hl,…` só altera a flag C (e duas flags internas). As flags Z e S ficam como estavam, por isso **não** se pode usar `jr z` logo a seguir a um `add hl,bc` para saber se o resultado é zero. `adc hl,…` e `sbc hl,…` alteram todas as flags normalmente.
* Para comparar dois números de 16 bits, subtrai-se e volta-se a somar: `and a` / `sbc hl,de` / `add hl,de` deixam `HL` igual e as flags (C e Z do `sbc`) mostram se `HL` < `DE` ou se são iguais. O `add hl,de` final não altera Z.

## Incrementar e Decrementar

`inc` e `dec` somam ou subtraem 1, e são mais rápidos e mais pequenos do que `add` e `sub`:

```assembly
    inc a               ; A = A + 1.
    dec b               ; B = B - 1.
    inc (hl)            ; somar 1 ao byte apontado por HL.
    inc hl              ; HL = HL + 1.
    dec de              ; DE = DE - 1.
```

Atenção às flags:

* `inc` e `dec` de **8 bits** alteram Z (e S), mas **não** alteram C. `dec b` seguido de `jr nz` funciona.
* `inc` e `dec` de **16 bits** não alteram **nenhuma** flag. Depois de `dec bc`, a flag Z não diz se `BC` chegou a zero; é preciso testar com `ld a,b` / `or c`.

## Números Negativos

Em complemento para dois, o mesmo byte pode ser lido como um número de 0 a 255 ou como um número com sinal de −128 a +127. Os valores 128 a 255 representam −128 a −1: 255 é −1, 254 é −2, e assim por diante. A grande vantagem é que as mesmas instruções `add` e `sub` funcionam para os dois casos.

* `neg` troca o sinal do acumulador: `A = 0 − A`. Por exemplo, 5 passa a 251 (−5).
* A flag S fica igual ao bit 7 do resultado (1 = negativo).
* A flag P/V indica *overflow*: o resultado com sinal não cabe em −128..+127 (por exemplo, 100 + 100 = 200, que com sinal seria −56).
* `cpl` inverte todos os bits; `neg` é o mesmo que `cpl` seguido de `inc a`.

Uma forma prática de obter o valor absoluto de uma diferença, muito usada nos jogos:

```assembly
    ld a,(x1)
    sub b               ; A = x1 - B.
    jr nc,positivo      ; sem empréstimo: já é positivo.
    neg                 ; negativo: trocar o sinal.
positivo:
```

## Um Programa Completo

Este programa faz algumas contas e mostra os resultados com a rotina da ROM que imprime o número em `BC` (até 9999), usada no capítulo 1 da Parte 2.

```assembly
        DEVICE ZXSPECTRUM48
        ORG 32768
start:
    call 3503           ; limpar o ecrã e abrir o canal 2.

    ld a,250            ; 250 + 10 em 8 bits: dá a volta.
    add a,10
    call mostra_a       ; mostra 4.

    ld a,3              ; 3 - 5 em 8 bits.
    sub 5
    call mostra_a       ; mostra 254 (= -2).

    ld hl,1000          ; 1000 + 500 em 16 bits.
    ld bc,500
    add hl,bc
    call mostra_hl      ; mostra 1500.

    ld hl,1500          ; 1500 - 2000 + 2500 em 16 bits.
    ld de,2000
    and a               ; limpar o carry antes do sbc.
    sbc hl,de           ; HL = -500 (65036).
    ld de,2500
    add hl,de           ; HL = 2000.
    call mostra_hl      ; mostra 2000.

    ld bc,300           ; soma de 16 bits feita com 8 bits:
    ld de,700           ; HL = BC + DE com add e adc.
    ld a,c
    add a,e
    ld l,a
    ld a,b
    adc a,d
    ld h,a
    call mostra_hl      ; mostra 1000.

    ld a,5              ; trocar o sinal de 5.
    neg
    call mostra_a       ; mostra 251 (= -5).
    ret

mostra_a:
    ld c,a              ; BC = A.
    ld b,0
    jr mostra
mostra_hl:
    ld b,h              ; BC = HL.
    ld c,l
mostra:
    call 6683           ; ROM: imprimir BC.
    ld a,13             ; mudar de linha.
    rst 16
    ret
fim:

; --- Carregador BASIC + ficheiro .tap (igual em todos os exemplos) ---
        ORG 23755
basic:  db 0,10                 ; 10 CLEAR 32767: LOAD "" CODE: RANDOMIZE USR 32768
        dw basic_fim-basic-4
        db $FD,$B0,'"32767":',$EF,'""',$AF,':',$F9,$C0,$B0,'"32768"',13
basic_fim:
        EMPTYTAP "z80_04_1.tap"
        SAVETAP  "z80_04_1.tap",BASIC,"z80_04_1",basic,basic_fim-basic,10
        SAVETAP  "z80_04_1.tap",CODE,"z80_04_1",start,fim-start
```

## Exercícios

1. Some 40000 e 30000 com `add hl,de`. Que valor aparece, e como fica a flag C?
2. Escreva uma rotina que some 1 a um número de 32 bits guardado em quatro bytes (`defb 0,0,0,0`), propagando o transporte.
3. Use a técnica de "subtrair e voltar a somar" para escrever uma rotina que devolva C = 1 se `HL` < `DE`.
