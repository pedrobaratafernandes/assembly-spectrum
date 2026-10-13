# Interrupções

Uma interrupção é um sinal elétrico que faz o processador parar o que está a fazer, executar uma rotina e depois continuar onde estava. No Spectrum, as interrupções marcam o ritmo de tudo: é com elas que a ROM lê o teclado, que o relógio avança e que os jogos se sincronizam com o ecrã.

## Os Dois Tipos de Interrupção

O Z80 tem duas entradas de interrupção:

* **NMI** (*Non-Maskable Interrupt*): não pode ser desligada e salta sempre para o endereço 102 (`$66`). No Spectrum não é usada pelo próprio computador, só por alguns periféricos ligados atrás (as interfaces que "congelavam" os jogos para os gravar).
* **INT** (*Maskable Interrupt*): pode ser desligada com `di` e ligada com `ei`. No Spectrum, a ULA gera uma INT no início de cada fotograma, 50 vezes por segundo (60 nos modelos americanos).

Quando aceita uma INT, o Z80 desliga as interrupções (para não ser interrompido outra vez a meio), guarda o endereço atual na pilha (como um `call`) e salta para a rotina de serviço. A rotina termina com `ei` (para voltar a aceitar interrupções) e `reti` (para voltar ao programa).

## A Interrupção e o Ecrã

A ULA desenha o ecrã de cima para baixo, linha a linha, sempre ao mesmo ritmo. A interrupção chega quando começa um novo fotograma, no topo da margem de cima. Num Spectrum 48K, cada linha leva 224 *T-states* e há 64 linhas de margem antes da primeira linha da área de papel: cerca de 14 000 *T-states* em que nada do ecrã principal está a ser desenhado.

É por isso que os jogos fazem `halt` (esperar pela interrupção) antes de apagar e redesenhar os *sprites*: se o fizerem logo a seguir, acabam antes de o "pincel" da televisão chegar à zona onde estão, e não há cintilação (*flicker*). E como `halt` espera sempre pelo próximo fotograma, um ciclo principal com um `halt` corre no máximo a 50 voltas por segundo, um ritmo constante e independente da velocidade do código (desde que este caiba num fotograma).

## Modos de Interrupção

A instrução `im` escolhe o que o Z80 faz quando aceita uma INT:

| Modo | Comportamento | No Spectrum |
| :--- | :--- | :--- |
| `im 0` | Executa a instrução que o periférico põe no barramento. | Sem utilidade. |
| `im 1` | Faz sempre `rst 56`: salta para o endereço 56 (`$38`). | O modo normal. A rotina da ROM em 56 lê o teclado e atualiza `FRAMES`. |
| `im 2` | Salta para um endereço lido de uma tabela apontada pelo registo `I`. | Permite usar uma rotina nossa. |

### Como funciona o modo 2

Em modo 2, o Z80 forma um endereço de 16 bits com o registo `I` no byte alto e o valor que encontra no barramento de dados no byte baixo. Lê nesse endereço um ponteiro de 2 bytes e salta para onde ele aponta.

O problema é que, no Spectrum, nenhum periférico põe um valor definido no barramento: o byte baixo é normalmente 255, mas pode ser qualquer um. A solução clássica é:

1. Reservar uma tabela de **257 bytes**, todos com o mesmo valor `v`, a começar num endereço múltiplo de 256 (`I` × 256). Seja qual for o byte baixo, o ponteiro lido tem os dois bytes iguais a `v`: aponta para `v × 256 + v`.
2. Pôr nesse endereço a rotina de interrupção, ou um `jp` para ela.

Uma escolha comum é a tabela em `$FE00` (65024) cheia de `$FD`, e a rotina em `$FDFD` (65021). Assim tudo fica no topo da memória, longe do programa. O capítulo 17 da Parte 2 mostra a mesma técnica com outros endereços.

A tabela e a rotina devem ficar acima de 32768. Abaixo desse endereço, a ULA disputa a memória com o processador, e com o registo `I` entre `$40` e `$7F` o Spectrum 48K mostra um efeito de "neve" no ecrã e pode mesmo bloquear.

### A rotina de serviço

* Tem de guardar e repor **todos** os registos que altera (`push`/`pop`), porque pode interromper o programa em qualquer instrução.
* Pode chamar `rst 56` para a ROM continuar a ler o teclado e a atualizar `FRAMES` (desde que `IY` tenha o valor do BASIC, 23610).
* Termina com `ei` e `reti`.
* Deve ser curta: enquanto corre, o programa principal está parado.

## Um Programa Completo

Este programa instala uma rotina de interrupção em modo 2 com a tabela em `$FE00` e o salto em `$FDFD`. A rotina conta os fotogramas; o programa principal mostra os segundos que passaram, de 0 a 5, e depois repõe o modo 1 e volta ao BASIC.

```assembly
        DEVICE ZXSPECTRUM48
        ORG 32768
start:
    di                  ; preparar tudo sem interrupções.
    ld hl,$FE00         ; tabela de 257 bytes em $FE00...
    ld (hl),$FD         ; ...cheia de $FD.
    ld de,$FE01
    ld bc,256
    ldir
    ld a,$C3            ; em $FDFD, a instrução "jp int".
    ld ($FDFD),a
    ld hl,int
    ld ($FDFE),hl
    ld a,$FE            ; I = byte alto da tabela.
    ld i,a
    im 2
    ei

    call 3503           ; limpar o ecrã e abrir o canal 2.
    xor a
    ld (segs),a
mostra:
    ld a,22             ; AT 10,10.
    rst 16
    ld a,10
    rst 16
    ld a,10
    rst 16
    ld a,(segs)
    add a,'0'           ; mostrar os segundos (0 a 5).
    rst 16
espera:
    halt                ; esperar pelo próximo fotograma.
    ld a,(conta)
    cp 50               ; já passaram 50 fotogramas?
    jr c,espera
    xor a               ; sim: recomeçar a contar
    ld (conta),a
    ld hl,segs          ; e somar um segundo.
    inc (hl)
    ld a,(hl)
    cp 6                ; chegou aos 6?
    jr nz,mostra

    di                  ; repor o modo normal antes de sair.
    ld a,63             ; valor normal de I no Spectrum.
    ld i,a
    im 1
    ei
    ret

    ; Rotina de serviço de interrupção.
int:
    push af
    push hl
    ld hl,conta
    inc (hl)            ; mais um fotograma.
    rst 56              ; deixar a ROM ler o teclado e o relógio.
    pop hl
    pop af
    ei
    reti

conta:  defb 0          ; fotogramas desde o último segundo.
segs:   defb 0          ; segundos.
fim:

; --- Carregador BASIC + ficheiro .tap (igual em todos os exemplos) ---
        ORG 23755
basic:  db 0,10                 ; 10 CLEAR 32767: LOAD "" CODE: RANDOMIZE USR 32768
        dw basic_fim-basic-4
        db $FD,$B0,'"32767":',$EF,'""',$AF,':',$F9,$C0,$B0,'"32768"',13
basic_fim:
        EMPTYTAP "z80_11_1.tap"
        SAVETAP  "z80_11_1.tap",BASIC,"z80_11_1",basic,basic_fim-basic,10
        SAVETAP  "z80_11_1.tap",CODE,"z80_11_1",start,fim-start
```

Repare que o programa principal só lê e altera `conta` entre dois `halt`, logo a seguir a uma interrupção, por isso não há perigo de a rotina de interrupção a alterar ao mesmo tempo.

## Exercícios

1. Altere a rotina de interrupção para mudar a cor da margem a cada segundo.
2. Retire o `rst 56` da rotina. O que deixa de funcionar? (Experimente premir teclas e ver a variável `FRAMES`.)
3. O que acontece se se esquecer de repor `im 1` antes do `ret`? E se a tabela tivesse só 256 bytes?
