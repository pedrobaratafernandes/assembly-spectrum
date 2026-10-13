# Condições, Saltos e Ciclos

Um programa precisa de tomar decisões: "se a tecla está premida, mover o jogador", "repetir isto 10 vezes". No Z80, todas as decisões se tomam da mesma forma: uma instrução altera as **flags** e, a seguir, um salto condicional verifica-as.

## O Registo de Flags

O registo `F` guarda, em bits separados, informação sobre o resultado da última operação aritmética ou lógica:

| Bit | Flag | Fica a 1 quando… | Condições |
| :---: | :--- | :--- | :--- |
| 7 | S (sinal) | o bit 7 do resultado é 1 (número negativo, em complemento para dois) | `m` (*minus*), `p` (*plus*) |
| 6 | Z (zero) | o resultado é 0 | `z`, `nz` |
| 4 | H (meio transporte) | há transporte do bit 3 para o bit 4 (usado por `daa`) | — |
| 2 | P/V (paridade / *overflow*) | depende da instrução: paridade par ou transbordo com sinal | `pe`, `po` |
| 1 | N (subtração) | a última operação foi uma subtração (usado por `daa`) | — |
| 0 | C (*carry*, transporte) | uma soma passa de 255 ou uma subtração precisa de "pedir emprestado" | `c`, `nc` |

Nem todas as instruções alteram todas as flags. Por exemplo, `ld` nunca as altera, `inc` e `dec` de 8 bits alteram Z mas não C, e `inc`/`dec` de 16 bits não alteram nenhuma. Na dúvida, consulte uma tabela de instruções do Z80.

## Comparar: CP

`cp n` compara o acumulador com `n`: faz a subtração `A − n`, altera as flags e deita fora o resultado, por isso `A` fica igual. Depois de `cp n`:

| Situação | Flags | Salto a usar |
| :--- | :--- | :--- |
| `A = n` | Z = 1 | `jr z,…` |
| `A ≠ n` | Z = 0 | `jr nz,…` |
| `A < n` (sem sinal) | C = 1 | `jr c,…` |
| `A ≥ n` (sem sinal) | C = 0 | `jr nc,…` |

`cp` aceita um valor (`cp 42`), um registo (`cp b`) ou um byte na memória (`cp (hl)`, `cp (ix+2)`).

```assembly
    ld a,(vida)
    cp 10               ; vida < 10?
    jr c,pouca_vida     ; sim.
    cp 100              ; vida = 100?
    jr z,vida_cheia     ; sim.
```

Para testar se `A` é zero não é preciso `cp 0`: `and a` ou `or a` deixam `A` igual e põem a flag Z de acordo com o seu valor (e limpam o *carry*), e ocupam um byte em vez de dois.

## Saltos

| Instrução | Tamanho | Alcance | Condições | *T-states* |
| :--- | :---: | :--- | :--- | :--- |
| `jp endereço` | 3 bytes | qualquer endereço | todas: `z`, `nz`, `c`, `nc`, `m`, `p`, `pe`, `po` | 10 (salte ou não) |
| `jr endereço` | 2 bytes | −128 a +127 bytes | só `z`, `nz`, `c`, `nc` | 12 se salta, 7 se não salta |
| `jp (hl)` | 1 byte | o endereço em `HL` | nenhuma | 4 |
| `djnz endereço` | 2 bytes | −128 a +127 bytes | `B` ≠ 0 após decrementar | 13 se salta, 8 se não salta |

`jr` é mais pequeno e, quando a condição falha, mais rápido. `jp` chega a todo o lado e tem mais condições. Em ciclos curtos usa-se normalmente `jr` ou `djnz`.

O Spectrum corre a 3,5 MHz: cerca de 3 500 000 *T-states* por segundo e 69 888 em cada fotograma de 1/50 s. Estes números servem para estimar quanto tempo demora uma rotina.

## Sub-rotinas e Retornos Condicionais

`call endereço` guarda na pilha o endereço da instrução seguinte e salta; `ret` vai buscar esse endereço e volta. Tanto `call` como `ret` têm versões condicionais, com as mesmas condições que `jp`:

```assembly
    call z,explode      ; chamar "explode" só se Z = 1.
    ret nc              ; voltar só se C = 0.
```

Um `ret` condicional no início de uma rotina é uma forma compacta de "se não houver nada a fazer, sair":

```assembly
mover_inimigo:
    ld a,(ix+0)         ; estado do inimigo.
    and a               ; está a 0 (morto)?
    ret z               ; sim, não há nada a fazer.
    ; ... mover o inimigo ...
    ret
```

## Ciclos com DJNZ

`djnz` (*Decrement and Jump if Not Zero*) subtrai 1 a `B` e salta se `B` não ficou a 0. Não altera as flags. É a forma mais simples de repetir algo um número fixo de vezes (até 256, com `B` = 0 no início):

```assembly
    ld b,8              ; 8 vezes.
ciclo:
    ; ... corpo do ciclo ...
    djnz ciclo
```

A etiqueta tem de ficar **depois** de `ld b,8`. Se ficasse antes, `B` voltaria a 8 em cada volta e o ciclo nunca acabaria. Se o corpo do ciclo usar `B` (ou chamar uma rotina que o use), guarde-o com `push bc` e `pop bc`.

Para contar mais de 256 vezes, usa-se um par de registos. Como `dec bc` não altera as flags, testa-se o zero com `ld a,b` e `or c`:

```assembly
    ld bc,1000          ; 1000 vezes.
ciclo2:
    ; ... corpo do ciclo ...
    dec bc
    ld a,b
    or c                ; BC = 0?
    jr nz,ciclo2
```

## "Se… Senão"

Um `if/else` traduz-se com dois saltos: um para o ramo "senão" e outro, no fim do ramo "se", para saltar por cima do "senão". Este exemplo aproxima `A` de 42 em uma unidade:

```assembly
aproxima:
    cp 42               ; comparar A com 42.
    ret z               ; já é 42: nada a fazer.
    jr nc,muito_alto    ; A > 42.
    inc a               ; A < 42: subir.
    ret
muito_alto:
    dec a               ; descer.
    ret
```

## O Carry à Mão

Três instruções mexem diretamente na flag de *carry*:

| Instrução | Efeito |
| :--- | :--- |
| `scf` | Põe C = 1. |
| `ccf` | Inverte C (não o limpa!). |
| `and a` ou `or a` | Põem C = 0 (e não alteram `A`). |

Para limpar o *carry* antes de um `sbc hl,de` (capítulo seguinte), usa-se `and a` ou `or a`.

## Um Programa Completo

Este programa conta de 9 até 0, mostrando cada número, e depois classifica três valores em relação a 42, mostrando "<", "=" ou ">". Usa `djnz`, `cp` e saltos condicionais.

```assembly
        DEVICE ZXSPECTRUM48
        ORG 32768
start:
    call 3503           ; limpar o ecrã e abrir o canal 2.

    ld b,10             ; contagem decrescente de 9 a 0.
conta:
    ld a,b
    dec a               ; B vai de 10 a 1; mostrar B-1.
    add a,'0'           ; transformar o algarismo em carácter.
    rst 16
    ld a,' '
    rst 16
    djnz conta
    ld a,13
    rst 16

    ld a,10             ; classificar 10, 42 e 200.
    call classifica
    ld a,42
    call classifica
    ld a,200
    call classifica
    ret

    ; Mostrar "<", "=" ou ">" conforme A seja menor, igual ou maior que 42.
classifica:
    cp 42
    jr z,igual
    jr c,menor
    ld a,'>'            ; nem igual nem menor: maior.
    jr mostra
igual:
    ld a,'='
    jr mostra
menor:
    ld a,'<'
mostra:
    rst 16
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
        EMPTYTAP "z80_03_1.tap"
        SAVETAP  "z80_03_1.tap",BASIC,"z80_03_1",basic,basic_fim-basic,10
        SAVETAP  "z80_03_1.tap",CODE,"z80_03_1",start,fim-start
```

O resultado é a linha `9 8 7 6 5 4 3 2 1 0` seguida de `<`, `=` e `>`.

## Exercícios

1. Altere `classifica` para mostrar "<" só se `A` for menor do que 10.
2. Use `djnz` para desenhar uma linha de 32 asteriscos.
3. Reescreva o ciclo de contagem com `jr nz` em vez de `djnz`. Qual das versões ocupa menos bytes?
