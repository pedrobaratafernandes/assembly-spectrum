# Aritmética no Z80: Fazer Contas (ZX Spectrum)

Este documento resume o quinto episódio do tutorial de **Assembly Z80 para o ZX Spectrum**, da autoria do Matt Heffernan. O foco deste episódio é a matemática. O Z80 não possui comandos nativos para multiplicação ou divisão; ele apenas consegue fazer **Somas (Add)** e **Subtrações (Sub)**. Toda a magia acontece manipulando o *Registo de Estado (Flags)*.

## 1. A Soma Básica (`ADD`)

A instrução `ADD` junta dois valores e guarda o resultado. No Z80, tens a possibilidade de fazer somas "pequenas" (8-bits) e somas "grandes" (16-bits).

### Somas a 8-bits
Para somas até ao valor 255 (8-bits), o destino é obrigatoriamente o **Acumulador (`A`)**. Todas as luzes (flags) são atualizadas como esperado (Zero, Carry, Sinal, etc).
- **Exemplo Prático:**
  ```assembly
    ld a, 10          ; Coloca 10 na "gaveta" A
    ld b, 5           ; Coloca 5 na "gaveta" B
    add a, b          ; Faz A = A + B. O A passa a valer 15!
  ```
  - *Explicação para Iniciantes:* Fazer contas de 8-bits no Z80 é como fazeres uma conta de somar na cabeça usando a tua mão direita (o `A`). Trazes sempre o número que queres somar à tua mão, juntas o que já lá estava, e ficas com o resultado na mesma mão. 

### Somas a 16-bits
Para valores superiores a 255 (até 65535), usamos os registos duplos (`HL`, `BC`, `DE`). O `HL` atua como a tua "mão direita" gigante para onde vêm parar os resultados.
- **A Grande Armadilha:** Fazer um `ADD` a 16-bits **não altera a flag de Zero (`Z`)** nem a flag de Sinal (`S`)! Ficam exatamente com o valor que tinham antes da conta. Apenas a flag de *Carry* (`C`) é atualizada se ultrapassares os 65535.
- **Exemplo Prático:**
  ```assembly
    ld hl, 1000       ; Carrega 1000 no HL
    ld bc, 500        ; Carrega 500 no BC
    add hl, bc        ; Faz HL = HL + BC. O HL passa a valer 1500!
  ```
  - *Explicação para Iniciantes:* Como o CPU só consegue pensar em 8 bits de cada vez, somar 16 bits é um esforço tão grande para ele que ele não tem "tempo cerebral" para verificar se o resultado deu exatamente zero para te avisar nas luzes do painel. Tens de ser tu, depois de fazeres a conta, a testar as duas metades para saberes se deu zero!

---

## 2. A Magia do "Vai Um": Adição com Carry (`ADC`)

Quando tentas somar 255 + 2 num registo de 8 bits, o resultado "dá a volta" (overflow) e fica a 1, mas a luz do **Carry (`C`)** acende. Como somamos números ainda maiores (como 24 ou 32-bits)? Encadeando contas com o `ADC` (Add with Carry).

A instrução `ADC` soma três coisas ao mesmo tempo: `Destino = Destino + Origem + Luz do Carry`.
- **Exemplo Prático (Somar de pedaço em pedaço):**
  ```assembly
    ; Imagina que estamos a somar um número gigante guardado em partes...
    add a, c          ; Soma a parte pequena (baixa). Se passar de 255, acende o Carry!
    ld l, a           ; Guarda o bocado pequeno da resposta no L
    ld a, b           ; Pega na parte grande do número (alta)
    adc a, d          ; Soma a parte grande + D + (O "Vai Um" da conta anterior!)
    ld h, a           ; Guarda o bocado grande da resposta no H
  ```
  - *Explicação para Iniciantes:* Lembras-te de quando estavas na escola primária a aprender a somar no papel? Fazias duas colunas: as unidades e as dezenas. Primeiro somavas as unidades (usando o `ADD`). Se passasse de 10, dizias **"e vai um!"**. A instrução `ADC` faz exatamente isso na coluna seguinte: soma os números grandes, mas vai buscar a luzinha do "vai um" e adiciona-a ao bolo! 

---

## 3. A Subtração (`SUB` e `SBC`)

A matemática para trás tem regras ligeiramente diferentes no Z80.

- **`SUB` (Subtração Normal):** É **exclusivamente de 8-bits**! Não existe um comando `SUB HL, BC` em lado nenhum da máquina. Funciona apagando o valor de outro registo do Acumulador (`A`).
  ```assembly
    sub b             ; Equivalente a A = A - B
  ```

- **`SBC` (Subtract with Carry):** Funciona exatamente como a soma, subtraindo o número e também o "pediu emprestado" (Carry). Como o Z80 não tem o `SUB` de 16-bits, os programadores são obrigados a usar o `SBC HL, BC` para subtrações grandes!
- **Exemplo Prático (A Subtração a 16-bits):**
  ```assembly
    or a              ; Truque de mestre! Apaga o "Carry" para garantir que é zero.
    sbc hl, de        ; Subtrai a 16-bits: HL = HL - DE - Carry(0). 
  ```
  - *Explicação para Iniciantes:* A instrução de subtrair coisas grandes vem sempre "estragada", porque ela tenta sempre subtrair também o "pedido emprestado" (o Carry) das contas anteriores. Para a usarmos como uma subtração normal limpinha, temos de usar o truque `OR A` (uma operação lógica falsa) que varre a sujidade do painel de luzes e apaga o Carry. Depois sim, a conta corre bem!

---

## 4. Subir ou Descer de Nível (`INC` e `DEC`)

Para contar os passos de um *loop*, usamos as ferramentas rápidas Incremento (somar 1) e Decremento (subtrair 1). Elas são muitíssimo mais eficientes que gastar ciclos com o `ADD` ou `SUB`.

- **Exemplo Prático:**
  ```assembly
    inc b             ; B = B + 1 (Muito rápido!)
    dec c             ; C = C - 1
  ```
- **A Grande Armadilha de 16-bits:**
  ```assembly
    dec hl            ; Subtrai 1 ao HL (16-bits).
  ```
  - *Explicação para Iniciantes:* O Z80 tem falhas nas ferramentas grandes. Se fizeres `DEC B` e o valor chegar a Zero, ele acende a luz `Z` no painel orgulhosamente e podes usar um `JR Z, sair`. Mas se fizeres `DEC HL` ou `INC DE`, **todas as luzes ficam inalteradas**! Não te podes fiar no painel depois de incrementares blocos de 16-bits.

---

## 5. Inversão de Sinal (`NEG`)

A matemática assinalada (`signed`) significa que o 8º bit de um número diz se ele é positivo ou negativo. A instrução `NEG` permite-te subtrair imediatamente o valor do Acumulador (`A`) por Zero, de forma a inverter o seu sinal.

- **Exemplo Prático:**
  ```assembly
    ld a, 42          ; A vida mudou a um passo de +42...
    neg               ; ...para um doloroso tombo de -42!
  ```
  - *Explicação para Iniciantes:* O comando `NEG` (Negate) é o equivalente no teu teclado do sinal de "menos" numa calculadora. Se estavas no lucro de 42 euros, usas o `NEG` e passas para uma dívida de 42 euros. Fácil e rápido!
