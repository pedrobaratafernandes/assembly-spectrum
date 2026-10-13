# A ROM e as Variáveis de Sistema

Os primeiros 16 KB da memória do Spectrum (endereços 0 a 16383) são ROM: memória só de leitura, gravada de fábrica. Contém o interpretador de BASIC e todas as rotinas de que ele precisa: imprimir, ler o teclado, fazer som, calcular, gravar e carregar cassetes. Um programa em assembly pode chamar estas rotinas com `call`, e poupar muito trabalho.

## As Rotinas RST

As instruções `rst` chamam oito endereços fixos no início da ROM. Os mais úteis são:

| Instrução | Endereço | Função |
| :--- | :--- | :--- |
| `rst 0` | 0 | Reinicia o Spectrum (como desligar e ligar). |
| `rst 8` | 8 | Assinala um erro do BASIC. O byte a seguir ao `rst 8` é o número do erro. |
| `rst 16` | 16 (`$10`) | Imprime o carácter que está em `A` no canal atual. |
| `rst 40` | 40 (`$28`) | Entra na calculadora de vírgula flutuante da ROM. |
| `rst 56` | 56 (`$38`) | Rotina de interrupção: lê o teclado e atualiza o relógio. |

## Rotinas Úteis da ROM

Estas são as rotinas usadas ao longo do livro:

| Endereço | Nome | O que faz |
| :--- | :--- | :--- |
| 949 | BEEPER | Toca uma nota: `HL` = tom, `DE` = duração. |
| 3503 | CL-ALL | Limpa o ecrã com as cores de `ATTR-P` e abre o canal 2. |
| 5633 | CHAN-OPEN | Abre o canal indicado em `A` (1 = parte de baixo do ecrã, 2 = ecrã principal, 3 = impressora). |
| 6683 | OUT-NUM-1 | Imprime o número em `BC` (até 9999). |
| 8252 | PR-STRING | Imprime `BC` caracteres a partir do endereço `DE`. |
| 8859 | BORDER | Muda a cor da margem para `A` (de forma permanente). |
| 11563 | STACK-BC | Põe `BC` na pilha da calculadora. |
| 11747 | PRINT-FP | Imprime o número do topo da pilha da calculadora. |

## As Variáveis de Sistema

Entre os endereços 23552 e 23733 ficam as **variáveis de sistema**: os valores de que a ROM precisa para funcionar. Lendo-as e alterando-as, controlamos o comportamento da ROM. As mais úteis:

| Endereço | Nome | Conteúdo |
| :--- | :--- | :--- |
| 23560 | LAST-K | Código da última tecla premida (atualizado pela interrupção). |
| 23606 | CHARS | Endereço da fonte de letras menos 256. |
| 23611 | FLAGS | O bit 5 fica a 1 quando há uma tecla nova em `LAST-K`. |
| 23624 | BORDCR | Cor da margem (e da parte de baixo do ecrã). |
| 23672 | FRAMES | Contador de fotogramas de 3 bytes, aumenta 50 vezes por segundo. |
| 23675 | UDG | Endereço dos gráficos definidos pelo utilizador. |
| 23693 | ATTR-P | Cores permanentes. |
| 23695 | ATTR-T | Cores temporárias (usadas pela próxima impressão). |

A ROM aponta o registo `IY` para 23610, e a partir daí chega às variáveis com `(iy+n)`. Por exemplo, `FLAGS` é `(iy+1)`.

## Ler o Teclado com a ROM

Enquanto as interrupções estiverem em modo 1, a ROM lê o teclado 50 vezes por segundo. Quando deteta uma tecla nova, guarda o código em `LAST-K` e liga o bit 5 de `FLAGS`. Esperar por uma tecla fica assim:

```assembly
espera_tecla:
    res 5,(iy+1)        ; FLAGS: "ainda não há tecla nova".
espera0:
    bit 5,(iy+1)        ; já há?
    jr z,espera0        ; não, continuar à espera.
    ld a,(23560)        ; LAST-K: código da tecla.
    ret
```

Este método é ótimo para menus e para escrever nomes, mas só deteta uma tecla de cada vez e com o atraso de repetição do teclado. Para jogos, lê-se o teclado diretamente pelas portas (capítulo 7).

## Vantagens e Cuidados

Usar a ROM poupa muito trabalho, mas tem custos:

* **É lenta.** As rotinas da ROM foram escritas para o BASIC, a pensar em poupar espaço e não em velocidade. Imprimir com `rst 16` serve para menus e pontuações, mas não para mover gráficos a 50 fotogramas por segundo.
* **Precisa das variáveis de sistema.** Um programa que use a área de 23552 a 23733 para outra coisa não pode chamar a ROM.
* **Precisa de `IY`.** Se o programa alterar `IY`, tem de o repor (23610) antes de chamar a ROM, e as interrupções em modo 1 também o usam. Para voltar ao BASIC, `HL'` também tem de estar como estava no início.
* **Altera registos.** As rotinas da ROM mudam vários registos sem avisar. Guarde na pilha o que precisar.
* **Só funciona com esta ROM.** Os endereços são os da ROM do Spectrum 48K, que se mantêm iguais nos modelos 128K (quando a ROM do 48K está ativa). Clones com ROMs diferentes, como o Timex TC2068, mudam alguns endereços.

## Um Programa Completo

Este programa pede uma tecla e mostra o código dela, usando `LAST-K`/`FLAGS`, a rotina de impressão de números e a rotina `BEEPER`. Repete até se carregar em ENTER.

```assembly
        DEVICE ZXSPECTRUM48
        ORG 32768
start:
    call 3503           ; limpar o ecrã e abrir o canal 2.
ciclo:
    ld de,msg           ; "Tecla: "
    ld bc,msgfim-msg
    call 8252
    call espera_tecla   ; A = código da tecla.
    push af
    cp 32               ; carácter imprimível?
    jr c,naoimp         ; não (por exemplo, ENTER = 13).
    rst 16              ; mostrar a tecla.
naoimp:
    ld a,' '
    rst 16
    pop af
    push af
    ld b,0              ; mostrar o código.
    ld c,a
    call 6683
    ld a,13
    rst 16
    ld hl,800           ; um bip curto.
    ld de,20
    call 949
    pop af
    cp 13               ; ENTER?
    jr nz,ciclo
    ret

espera_tecla:
    res 5,(iy+1)        ; FLAGS: "ainda não há tecla nova".
espera0:
    bit 5,(iy+1)        ; já há?
    jr z,espera0        ; não, continuar à espera.
    ld a,(23560)        ; LAST-K: código da tecla.
    ret

msg:    defb "Tecla: "
msgfim:
fim:

; --- Carregador BASIC + ficheiro .tap (igual em todos os exemplos) ---
        ORG 23755
basic:  db 0,10                 ; 10 CLEAR 32767: LOAD "" CODE: RANDOMIZE USR 32768
        dw basic_fim-basic-4
        db $FD,$B0,'"32767":',$EF,'""',$AF,':',$F9,$C0,$B0,'"32768"',13
basic_fim:
        EMPTYTAP "z80_09_1.tap"
        SAVETAP  "z80_09_1.tap",BASIC,"z80_09_1",basic,basic_fim-basic,10
        SAVETAP  "z80_09_1.tap",CODE,"z80_09_1",start,fim-start
```

Ao carregar em A aparece `Tecla: a 97`. Os códigos abaixo de 32 não são carateres imprimíveis e por isso só se mostra o número: em ENTER aparece `Tecla:  13` e o programa termina.

## Exercícios

1. Altere o programa para tocar uma nota diferente para cada tecla (por exemplo, usando o código da tecla para calcular o tom).
2. Mostre o valor de `FRAMES` (só os dois primeiros bytes) cada vez que se carrega numa tecla.
3. O que acontece se fizer `ld iy,0` no início do programa? Experimente no emulador.
