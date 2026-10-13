# Outras Instruções Úteis

Este capítulo junta as instruções que não couberam nos anteriores: as que não fazem nada (ou esperam), o ajuste decimal, as de pesquisa em blocos e as de controlo das interrupções.

## NOP e HALT

`nop` não faz nada: ocupa 1 byte e gasta 4 *T-states*. Serve para pequenos atrasos de duração exata e para reservar espaço no código que vai ser alterado mais tarde.

`halt` para o processador até chegar a próxima interrupção. No Spectrum, a ULA gera uma interrupção no início de cada fotograma, 50 vezes por segundo. Por isso `halt` é a forma mais simples de sincronizar um jogo com o ecrã e de fazer pausas:

```assembly
    ld b,50             ; 50 fotogramas = 1 segundo.
pausa:
    halt
    djnz pausa
```

Se as interrupções estiverem desligadas (`di`), `halt` nunca termina e o Spectrum fica parado.

## DAA e Números Decimais (BCD)

Em BCD (*Binary Coded Decimal*) cada byte guarda dois algarismos decimais, um em cada metade de 4 bits: o número 45 guarda-se como `$45`. É útil para pontuações, porque cada algarismo se mostra diretamente, sem divisões.

O Z80 soma em binário, por isso `$09 + $01` dá `$0A`, que não é um número BCD válido. A instrução `daa` (*Decimal Adjust Accumulator*), executada logo a seguir a uma soma ou subtração, corrige o resultado para BCD: transforma `$0A` em `$10`. Para isso usa as flags H e N da operação anterior, e por isso tem de vir imediatamente depois dela.

```assembly
    ld a,$09
    add a,$01           ; A = $0A (binário)
    daa                 ; A = $10 (BCD: "10")
```

Para números com mais de dois algarismos, somam-se os bytes do menos significativo para o mais significativo, com `adc` e `daa` em cada um. O *carry* produzido pelo `daa` passa para o byte seguinte.

## Pesquisar em Blocos: CPIR e CPDR

`cpir` procura o valor que está em `A` num bloco de memória: começa no endereço em `HL`, examina no máximo `BC` bytes e para quando encontra o valor ou quando `BC` chega a 0. `cpdr` faz o mesmo, mas a andar para trás.

No fim:

* se encontrou, a flag Z fica a 1 e `HL` aponta para o byte **a seguir** ao encontrado (daí o `dec hl`);
* se não encontrou, a flag Z fica a 0 e `BC` = 0.

```assembly
    ld hl,texto         ; onde procurar.
    ld bc,100           ; quantos bytes, no máximo.
    ld a,'Z'            ; o que procurar.
    cpir
    jr nz,nao_ha        ; Z = 0: não encontrou.
    dec hl              ; HL aponta para o "Z" encontrado.
```

Também existem `cpi` e `cpd`, que fazem uma só comparação.

## Interrupções: DI, EI e IM

* `di` desliga as interrupções e `ei` volta a ligá-las. Desligam-se quando o programa não pode ser interrompido: a mexer no `SP`, a gerar som ou a fazer temporizações exatas.
* `im 0`, `im 1` e `im 2` escolhem o **modo de interrupção**. O Spectrum arranca em modo 1, em que cada interrupção chama a rotina da ROM no endereço 56 (`$38`): é ela que lê o teclado e atualiza o relógio `FRAMES`. O modo 2 permite usar uma rotina nossa (capítulo 11). O modo 0 não tem utilidade no Spectrum.

## Um Programa Completo

Este programa conta de 0 a 99 em BCD, mostrando os dois algarismos de cada número sem nenhuma divisão, e depois usa `cpir` para encontrar a posição da letra "Z" num texto.

```assembly
        DEVICE ZXSPECTRUM48
        ORG 32768
start:
    call 3503           ; limpar o ecrã e abrir o canal 2.

    xor a               ; contador BCD a 0.
    ld b,100            ; 100 números.
conta:
    push af
    push bc
    call mostra_bcd
    ld a,' '
    rst 16
    pop bc
    pop af
    add a,1             ; somar 1...
    daa                 ; ...e corrigir para BCD.
    djnz conta
    ld a,13
    rst 16

    ld hl,texto         ; procurar "Z" no texto.
    ld bc,fimtexto-texto
    ld a,'Z'
    cpir
    jr nz,nao_ha        ; não encontrou.
    dec hl              ; HL aponta para o "Z".
    ld de,texto
    and a
    sbc hl,de           ; HL = posição dentro do texto.
    ld b,h
    ld c,l
    call 6683           ; mostrar a posição.
nao_ha:
    ret

    ; Mostrar os dois algarismos BCD de A.
mostra_bcd:
    push af
    rrca                ; algarismo das dezenas: 4 bits de cima.
    rrca
    rrca
    rrca
    and 15
    add a,'0'
    rst 16
    pop af
    and 15              ; algarismo das unidades: 4 bits de baixo.
    add a,'0'
    rst 16
    ret

texto:  defb "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
fimtexto:
fim:

; --- Carregador BASIC + ficheiro .tap (igual em todos os exemplos) ---
        ORG 23755
basic:  db 0,10                 ; 10 CLEAR 32767: LOAD "" CODE: RANDOMIZE USR 32768
        dw basic_fim-basic-4
        db $FD,$B0,'"32767":',$EF,'""',$AF,':',$F9,$C0,$B0,'"32768"',13
basic_fim:
        EMPTYTAP "z80_08_1.tap"
        SAVETAP  "z80_08_1.tap",BASIC,"z80_08_1",basic,basic_fim-basic,10
        SAVETAP  "z80_08_1.tap",CODE,"z80_08_1",start,fim-start
```

O programa mostra `00 01 02 … 99` e, por fim, `25`: o "Z" é o 26.º carácter, na posição 25 a contar de 0.

## Exercícios

1. Mude o contador para contar de 99 até 0 com `sub 1` e `daa`.
2. Escreva uma rotina que some uma pontuação BCD de 3 bytes (6 algarismos) a outra.
3. Use `cpir` para contar quantas vezes a letra "A" aparece num texto.
