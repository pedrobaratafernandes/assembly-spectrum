# Entrada e Saída

Além da memória, o Z80 tem um segundo espaço de endereços: as **portas** de entrada/saída, onde estão ligados os periféricos. Lê-se de uma porta com `in` e escreve-se com `out`. No Spectrum 48K quase tudo passa por uma única porta, a 254 (`$FE`), que pertence à ULA: o teclado, a cor da margem, o altifalante e a ficha de gravação.

## As Instruções IN e OUT

Os endereços das portas também têm 16 bits. Há duas formas de os indicar:

```assembly
    ld a,$FE            ; byte alto do endereço.
    in a,(254)          ; ler a porta A*256+254: o byte alto vem de A.

    ld bc,$FEFE         ; endereço completo em BC.
    in d,(c)            ; ler a porta BC para D (qualquer registo).

    out (254),a         ; escrever A na porta A*256+254.
    out (c),e           ; escrever E na porta BC.
```

Apesar de se escrever `(c)`, a instrução usa o par `BC` inteiro como endereço. A ULA só olha para o bit 0 do byte baixo do endereço (tem de ser 0), mas o teclado usa o byte alto, como se vê a seguir.

## Ler o Teclado

O teclado do Spectrum tem 40 teclas, organizadas em 8 meias-linhas de 5. Para ler uma meia-linha, põe-se a 0 o bit correspondente do byte alto do endereço:

| Byte alto | Porta | Teclas (bit 0 … bit 4) |
| :--- | :--- | :--- |
| `$FE` = `11111110` | 65278 | CAPS SHIFT, Z, X, C, V |
| `$FD` = `11111101` | 65022 | A, S, D, F, G |
| `$FB` = `11111011` | 64510 | Q, W, E, R, T |
| `$F7` = `11110111` | 63486 | 1, 2, 3, 4, 5 |
| `$EF` = `11101111` | 61438 | 0, 9, 8, 7, 6 |
| `$DF` = `11011111` | 57342 | P, O, I, U, Y |
| `$BF` = `10111111` | 49150 | ENTER, L, K, J, H |
| `$7F` = `01111111` | 32766 | SPACE, SYMBOL SHIFT, M, N, B |

O valor lido tem uma tecla em cada um dos bits 0 a 4, com **0 = premida** e 1 = solta. Os bits 5 a 7 não interessam para o teclado. Por exemplo, para saber se a tecla Q está premida:

```assembly
    ld a,$FB            ; meia-linha Q, W, E, R, T.
    in a,(254)
    bit 0,a             ; Q é o bit 0.
    jr z,q_premida      ; bit a 0: premida.
```

Se pusermos vários bits do byte alto a 0, lemos várias meias-linhas ao mesmo tempo (os resultados juntam-se com um "e"). Com o byte alto a 0, lemos o teclado inteiro: se `in` devolver os bits 0-4 todos a 1, não há nenhuma tecla premida.

```assembly
espera:
    xor a               ; byte alto = 0: todas as meias-linhas.
    in a,(254)
    cpl                 ; inverter: agora 1 = premida.
    and 31              ; só os bits das teclas.
    jr z,espera         ; nenhuma tecla: continuar à espera.
```

O joystick Kempston lê-se na porta 31, com a lógica ao contrário: 1 = acionado. Os bits são 0 = direita, 1 = esquerda, 2 = baixo, 3 = cima e 4 = disparo.

## Escrever na Porta 254

O byte escrito na porta 254 controla três coisas:

| Bits | Função |
| :--- | :--- |
| 0 – 2 | Cor da margem (0 a 7). |
| 3 | Saída MIC (gravação em cassete). |
| 4 | Altifalante (*beeper*). |

```assembly
    ld a,2              ; margem vermelha, altifalante desligado.
    out (254),a
```

Esta cor dura só até a ROM mudar a margem outra vez. Para a mudar de forma permanente, chama-se a rotina da ROM em 8859 (capítulo 1 da Parte 2).

## Fazer Som

O altifalante do 48K só tem dois estados: ligado e desligado (bit 4). Para produzir um som, liga-se e desliga-se o bit 4 muitas vezes por segundo: a frequência do som é o número de ciclos completos (liga + desliga) por segundo. Entre cada mudança espera-se um pouco, e a duração dessa espera define o tom: espera curta, som agudo; espera longa, som grave.

Enquanto o programa gera som, não faz mais nada: o Z80 está ocupado a contar o tempo entre mudanças. As interrupções também perturbam o tom, por isso desligam-se com `di` durante o som.

## Um Programa Completo

Este programa mostra no ecrã o estado da meia-linha Q-W-E-R-T, como bits, enquanto muda a cor da margem quando se carrega em Q. Quando se carrega em SPACE, toca um som curto pelo altifalante e volta ao BASIC.

```assembly
        DEVICE ZXSPECTRUM48
        ORG 32768
start:
    call 3503           ; limpar o ecrã e abrir o canal 2.
ciclo:
    halt                ; uma leitura por fotograma.
    ld a,22             ; AT 0,0.
    rst 16
    xor a
    rst 16
    xor a
    rst 16
    ld a,$FB            ; meia-linha Q, W, E, R, T.
    in a,(254)
    push af
    call bits5          ; mostrar os 5 bits das teclas.
    pop af
    and 1               ; Q: bit 0 (0 = premida).
    ld a,7              ; margem branca...
    jr nz,solta
    ld a,2              ; ...ou vermelha, se Q estiver premida.
solta:
    out (254),a
    ld a,$7F            ; meia-linha SPACE, SYMBOL SHIFT, M, N, B.
    in a,(254)
    rra                 ; SPACE é o bit 0: passa para o carry.
    jr c,ciclo          ; carry = 1: solta, continuar.

    di                  ; som: nada de interrupções.
    ld a,7              ; margem branca, bit 4 a 0.
    ld b,0              ; 256 meios-ciclos.
    ld c,a
som:
    ld a,c
    xor 16              ; trocar o bit 4 (altifalante).
    ld c,a
    out (254),a
    ld e,100            ; espera: define o tom.
som0:
    dec e
    jr nz,som0
    djnz som
    ei
    ret

    ; Mostrar os bits 4 a 0 de A como "0" e "1".
bits5:
    rlca                ; deitar fora os bits 7, 6 e 5...
    rlca
    rlca
    ld b,5              ; ...e mostrar os 5 seguintes.
bits50:
    rlca                ; próximo bit para o carry.
    push af
    ld a,'0'
    jr nc,bits51
    inc a
bits51:
    rst 16
    pop af
    djnz bits50
    ret
fim:

; --- Carregador BASIC + ficheiro .tap (igual em todos os exemplos) ---
        ORG 23755
basic:  db 0,10                 ; 10 CLEAR 32767: LOAD "" CODE: RANDOMIZE USR 32768
        dw basic_fim-basic-4
        db $FD,$B0,'"32767":',$EF,'""',$AF,':',$F9,$C0,$B0,'"32768"',13
basic_fim:
        EMPTYTAP "z80_07_1.tap"
        SAVETAP  "z80_07_1.tap",BASIC,"z80_07_1",basic,basic_fim-basic,10
        SAVETAP  "z80_07_1.tap",CODE,"z80_07_1",start,fim-start
```

Sem nenhuma tecla premida, aparece `11111` (lido da esquerda para a direita: T, R, E, W, Q). Com Q premida, aparece `11110` e a margem fica vermelha.

## Exercícios

1. Mude o programa para mostrar a meia-linha P-O-I-U-Y.
2. Altere a espera do som (`ld e,100`) para 50 e para 200. O que acontece ao tom e à duração?
3. Escreva uma rotina que devolva Z = 1 se nenhuma tecla estiver premida.
