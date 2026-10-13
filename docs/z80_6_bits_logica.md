# Bits, Lógica e Rotações

No Spectrum, muita informação está guardada em bits individuais: cada bit do ecrã é um píxel, cada bit lido do teclado é uma tecla, e os atributos juntam tinta, papel, brilho e *flash* num só byte. Este capítulo mostra as instruções que trabalham com bits.

## Operações Lógicas

As operações lógicas atuam bit a bit entre o acumulador e outro valor, e deixam o resultado em `A`:

| Instrução | Bit do resultado é 1 quando… | Uso típico |
| :--- | :--- | :--- |
| `and n` | os dois bits são 1 | **apagar** bits: os bits a 0 na máscara ficam a 0 |
| `or n` | pelo menos um dos bits é 1 | **ligar** bits: os bits a 1 na máscara ficam a 1 |
| `xor n` | os bits são diferentes | **inverter** bits: os bits a 1 na máscara trocam de valor |
| `cpl` | (só `A`) o bit era 0 | inverter todos os bits de `A` |

O valor `n` chama-se **máscara**. Exemplos com atributos (tinta nos bits 0-2, papel nos bits 3-5, brilho no bit 6, *flash* no bit 7):

```assembly
    ld a,(hl)           ; atributo atual.
    and %00000111       ; ficar só com a tinta (and 7).
    ld a,(hl)
    and %11111000       ; apagar a tinta, manter o resto.
    or 2                ; e pôr tinta vermelha.
    ld (hl),a
    xor %10000000       ; trocar o flash (ligado <-> desligado).
```

Três truques que aparecem em quase todos os programas:

* `xor a` põe `A` a zero (1 byte, mais curto do que `ld a,0`) e limpa o *carry*.
* `and a` e `or a` deixam `A` igual, atualizam a flag Z conforme `A` seja zero e limpam o *carry*.
* As operações lógicas limpam sempre o *carry*. A flag P/V passa a indicar a paridade (número par de bits a 1).

## Testar, Ligar e Desligar um Bit

Para trabalhar com um só bit, sem máscaras, existem `bit`, `set` e `res`. Funcionam com qualquer registo de 8 bits, com `(hl)` e com `(ix+n)`/`(iy+n)`:

```assembly
    bit 0,a             ; testar o bit 0: Z = 1 se o bit estiver a 0.
    jr nz,ligado        ; o bit está a 1.
    set 7,(hl)          ; ligar o bit 7 do byte apontado por HL.
    res 5,b             ; desligar o bit 5 de B.
```

Atenção à lógica de `bit`: a flag Z fica a 1 quando o bit é **0**. Ou seja, `jr z` salta se o bit estiver desligado e `jr nz` se estiver ligado.

`set` e `res` sobre um registo levam 8 *T-states*, e `and`/`or` com um valor levam 7. Para mexer em vários bits do acumulador de uma só vez, uma máscara é mais rápida do que vários `set`/`res`.

## Deslocamentos (Shifts)

Os deslocamentos movem todos os bits uma posição. O bit que sai vai para a flag de *carry*:

| Instrução | Efeito | Equivale a |
| :--- | :--- | :--- |
| `sla r` | todos os bits para a esquerda; entra 0 no bit 0 | multiplicar por 2 |
| `srl r` | todos os bits para a direita; entra 0 no bit 7 | dividir por 2 (sem sinal) |
| `sra r` | todos os bits para a direita; o bit 7 mantém-se | dividir por 2 (com sinal) |

```assembly
    ld a,5              ; %00000101
    sla a               ; %00001010 = 10
    sla a               ; %00010100 = 20
    srl a               ; %00001010 = 10
```

Para multiplicar `A` por uma potência de 2 é ainda mais rápido usar `add a,a` (4 *T-states*, contra 8 de `sla a`). Para 16 bits, `add hl,hl` multiplica `HL` por 2.

Combinando deslocamentos e somas, multiplica-se por outros números. Por exemplo, × 10 = × 8 + × 2:

```assembly
    ; A = A * 10 (para A até 25).
    add a,a             ; × 2
    ld b,a              ; guardar × 2.
    add a,a             ; × 4
    add a,a             ; × 8
    add a,b             ; × 8 + × 2 = × 10
```

## Rotações

As rotações são como os deslocamentos, mas o bit que sai volta a entrar pelo outro lado. Há duas famílias:

* **Rotações de 8 bits** (`rlc`, `rrc`): o bit que sai entra do outro lado e é também copiado para o *carry*.
* **Rotações de 9 bits** (`rl`, `rr`): o *carry* funciona como um nono bit. O bit que sai vai para o *carry*, e o valor antigo do *carry* entra do outro lado.

| Instrução | Direção | Bits |
| :--- | :--- | :--- |
| `rlc r` / `rlca` | esquerda | 8 (bit 7 → bit 0 e carry) |
| `rrc r` / `rrca` | direita | 8 (bit 0 → bit 7 e carry) |
| `rl r` / `rla` | esquerda | 9 (carry → bit 0, bit 7 → carry) |
| `rr r` / `rra` | direita | 9 (carry → bit 7, bit 0 → carry) |

`rlca`, `rrca`, `rla` e `rra` só trabalham com o acumulador, mas ocupam 1 byte e levam 4 *T-states*, metade das versões gerais. Atenção: não alteram as flags Z e S.

As rotações de 9 bits permitem deslocar números maiores do que um byte, passando o bit de um byte para o seguinte através do *carry*. Por exemplo, para deslocar 3 bytes de um *sprite* um píxel para a direita:

```assembly
    and a               ; carry = 0: entra um píxel apagado à esquerda.
    rr c                ; byte da esquerda: o bit 0 sai para o carry...
    rr d                ; ...e entra no bit 7 do byte do meio...
    rr e                ; ...e daí para o byte da direita.
```

É assim que funcionam as rotinas de *sprites* do capítulo 8 da Parte 2.

## Um Programa Completo

Este programa mostra um byte em binário, rodando-o 8 vezes para o *carry*, e usa máscaras para separar a tinta e o papel de um atributo. Também converte uma palavra para maiúsculas apagando o bit 5 de cada letra.

```assembly
        DEVICE ZXSPECTRUM48
        ORG 32768
start:
    call 3503           ; limpar o ecrã e abrir o canal 2.

    ld a,%10110010      ; mostrar 178 em binário.
    call binario

    ld a,6*8+1+64       ; atributo: papel amarelo, tinta azul, brilho.
    push af
    and 7               ; só a tinta.
    call binario        ; 00000001
    pop af
    and %00111000       ; só o papel...
    rrca                ; ...deslocado para os bits 0-2.
    rrca
    rrca
    call binario        ; 00000110

    ld hl,palavra       ; converter para maiúsculas.
    ld b,6
maius:
    res 5,(hl)          ; bit 5 a 0: minúscula -> maiúscula.
    ld a,(hl)
    rst 16
    inc hl
    djnz maius
    ret

    ; Mostrar A em binário (8 algarismos) e mudar de linha.
binario:
    ld b,8              ; 8 bits.
binario0:
    rlca                ; o bit 7 vai para o carry (e para o bit 0).
    push af
    ld a,'0'
    jr nc,binario1      ; carry = 0: mostrar "0".
    inc a               ; carry = 1: mostrar "1".
binario1:
    rst 16
    pop af
    djnz binario0
    ld a,13             ; mudar de linha.
    rst 16
    ret

palavra: defb "zxspec"
fim:

; --- Carregador BASIC + ficheiro .tap (igual em todos os exemplos) ---
        ORG 23755
basic:  db 0,10                 ; 10 CLEAR 32767: LOAD "" CODE: RANDOMIZE USR 32768
        dw basic_fim-basic-4
        db $FD,$B0,'"32767":',$EF,'""',$AF,':',$F9,$C0,$B0,'"32768"',13
basic_fim:
        EMPTYTAP "z80_06_1.tap"
        SAVETAP  "z80_06_1.tap",BASIC,"z80_06_1",basic,basic_fim-basic,10
        SAVETAP  "z80_06_1.tap",CODE,"z80_06_1",start,fim-start
```

O resultado é `10110010`, `00000001`, `00000110` e `ZXSPEC`. Como `rlca` roda os 8 bits em círculo, depois das 8 rotações `A` volta ao valor original.

## Exercícios

1. Escreva uma rotina que conte quantos bits de `A` estão a 1.
2. Usando `xor`, faça um ciclo que alterne a cor da margem entre duas cores a cada fotograma.
3. Escreva `A = A × 3` usando só `add` e `ld`.
