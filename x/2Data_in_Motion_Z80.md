# Data in Motion: Mover Dados no Z80 (ZX Spectrum)

Este documento aborda o tema de **Assembly Z80 para o ZX Spectrum**. O foco deste episódio é aprofundar as formas como os dados fluem pelo processador e pela memória RAM/ROM, explorando as limitações do comando `LD`, as otimizações fantásticas de troca de registos e os poderosos comandos de cópia de blocos inteiros de memória.

## 1. A Instrução Universal: `LD` (Load)

Desde o início que vimos que a instrução de base para mover dados é o `LD`. A sua sintaxe é muito rigorosa: sempre **`LD Destino, Origem`**. Lê sempre da direita para a esquerda.
Apesar de parecer apenas um comando, o `LD` traduz-se em 184 *opcodes* (comandos de máquina) diferentes, o que representa quase um quarto de todas as instruções do processador Z80!

### Limitações nas Cargas de 8-Bits
Embora existam 13 registos diferentes de 8-bits, o Z80 não permite que movas dados entre qualquer par arbitrariamente:
- Os registos `I` (Interrupt) e `R` (Refresh) são muito especiais e só conseguem trocar dados com o Acumulador (`A`). Nunca consegues fazer um `LD B, I`.
- As metades dos registos de Índice (`IXh`, `IXl`, `IYh`, `IYl`) não podem ser emparelhadas com os registos `H` ou `L`, nem com as metades do outro registo de índice.

- **Exemplo Prático:**
  ```assembly
    ld a, i           ; Funciona perfeitamente
    ld c, a           ; Movemos o valor de I para C usando o A como ponte
  ```
  - *Explicação para Iniciantes:* A instrução `LD` copia um valor como se fosse um papel tirado de uma gaveta (Origem) e copiado para outra (Destino). Contudo, o processador tem "braços curtos" para algumas gavetas. Se quiseres passar da gaveta `I` para a `C`, não consegues fazê-lo diretamente num movimento; tens obrigatoriamente de pousar o papel primeiro na mesa de trabalho principal (o Acumulador `A`), e só depois copiá-lo para a gaveta `C`.

### Limitações de Memória para Memória
Tal como vimos nos Modos de Endereçamento, o Z80 não é capaz de fazer cópias diretas de uma posição da RAM para outra posição da RAM.

- **Exemplo Prático (A Forma Tradicional):**
  ```assembly
    ld a, (0x4000)    ; 1. Vamos à RAM buscar o valor e pomos no A
    ld (0x5000), a    ; 2. Vamos ao A buscar o valor e pomos noutra parte da RAM
  ```
  - *Explicação para Iniciantes:* Imagina que tens o ecrã do jogo (VRAM) numa prateleira e a memória do monstro noutra prateleira. O processador não pode esticar os dois braços e trocar coisas entre prateleiras diretamente. Tem sempre de usar o "bolso" dele (um registo como o `A` ou `B`) para carregar a informação de uma prateleira até à outra.

---

## 2. Instruções de Troca Rápida (`EX` e `EXX`)

A instrução `EX` (Exchange) não copia dados; em vez disso, **troca simultaneamente** o valor entre dois locais. 

### O Truque dos Registos Alternativos
O Z80 esconde um "gémeo" de cada registo principal no seu interior (`A'`, `F'`, `B'`, `C'`, `D'`, `E'`, `H'`, `L'`). Eles são inacessíveis pelos comandos normais, o que os torna num local perfeito para guardar cópias de segurança ultra-rápidas, sem ter de gravar nada na memória exterior (RAM) ou na *Stack*.

#### A. Trocar o Acumulador e Estado (`EX AF, AF'`)
- **Para que serve:** Troca os valores atuais de `A` (Acumulador) e `F` (Flags/Status Bits) com os seus respetivos clones sombra `A'` e `F'`. É excelente para interromper uma matemática complexa temporariamente para resolver uma emergência, e depois recuperar exatamente a conta onde ias.
- **Exemplo Prático:**
  ```assembly
    ex af, af'        ; Guarda o Acumulador e as Flags a salvo, trocando com as sombras
  ```
  - *Explicação para Iniciantes:* Imagina que estás a fazer uma conta de matemática no quadro (Registo A). De repente, o professor pede-te para calcular outra coisa urgente. Em vez de apagares o quadro ou escreveres o número num papel (ir à memória), rodas o quadro magnético 180 graus (comando `EX`). Ficas com um quadro limpo (o A' alternativo) para a urgência. Quando acabares, voltas a rodar o quadro (`EX`) e a tua conta antiga está lá intacta!

#### B. Trocar Todos os Registos Secundários (`EXX`)
- **Para que serve:** Com apenas 1 byte, este comando troca os pares completos `BC`, `DE`, e `HL` pelos seus gémeos `BC'`, `DE'`, e `HL'`. É o Santo Graal das otimizações.
- **Exemplo Prático:**
  ```assembly
    exx               ; Troca 6 registos inteiros (3 pares de 16 bits) instantaneamente
  ```
  - *Explicação para Iniciantes:* Se rodares o quadro das contas foi impressionante, o comando `EXX` permite-te rodar três secretárias inteiras cheias de trabalho de uma só vez! Permite que um jogo tenha, por exemplo, o movimento do herói nas secretárias normais, e os dados de desenho no ecrã nas secretárias sombra, alternando entre elas magicamente e poupando imenso tempo ao computador.

#### C. Trocar DE com HL (`EX DE, HL`)
- **Para que serve:** O registo `HL` é o rei da manipulação de memória no Z80. Quando precisas de ler um endereço que, por azar, está no registo `DE`, é muito mais rápido pedir ao processador para "trocar de mãos" do que tentar copiar os valores usando um registo intermédio.
- **Exemplo Prático:**
  ```assembly
    ex de, hl         ; O que estava em DE passa para HL, e vice-versa
  ```
  - *Explicação para Iniciantes:* O processador tem muito mais facilidade em usar a mão direita (`HL`) do que a esquerda (`DE`) para interagir com a memória. Se tiveres a morada que queres aceder na mão esquerda, usas o `EX DE, HL` para ele passar a informação para a mão "boa" num instante de olho.

---

## 3. Cópias de Blocos de Memória em Massa

Se quisermos copiar 6912 bytes de ecrã (como num ecrã de loading duplo ou "Double Buffer"), usar o comando `LD` repetidamente seria um desastre lento. O Z80 possui instruções de macro incrustadas em hardware feitas especificamente para varrer grandes pedaços de memória.

### LDIR (Load Increment Repeat)
Esta pequena instrução de 2 bytes é uma autêntica central de cópia de dados.
- **Para que serve:** Copia o byte apontado por `HL` para a morada de memória apontada por `DE`. Depois disto, ele **aumenta** o `HL` (+1), **aumenta** o `DE` (+1) e **diminui** o contador de voltas `BC` (-1). Como se chama "Repeat", ele repete a instrução até que o `BC` chegue a Zero!
- **Exemplo Prático:**
  ```assembly
    ld hl, 0x4000     ; 1. Origem: Início do ecrã antigo
    ld de, 0xE000     ; 2. Destino: Início do ecrã de sombra
    ld bc, 6912       ; 3. Quantidade de bytes: O tamanho total da VRAM de imagem
    ldir              ; 4. Faz a cópia dos 6912 bytes sozinho e de seguida!
  ```
  - *Explicação para Iniciantes:* Em vez de ordenares ao trabalhador (processador) para mover uma caixa de cada vez usando um pedaço de código complexo e cheio de `ifs` e saltos, com o `LDIR` apenas tens de preparar os camiões: Dizes "A fonte começa aqui (`HL`), os pacotes devem ser despejados aqui (`DE`) e tens 6912 caixas para transportar (`BC`). Agora copia-as e não voltes a falar comigo até as caixas acabarem!" 

### LDDR (Load Decrement Repeat)
Exatamente igual ao `LDIR`, mas anda para **trás**. 
- **Para que serve:** Em vez de avançar na memória, ele copia de `HL` para `DE` e depois **diminui** ambos os endereços (`HL - 1`, `DE - 1`), diminuindo também o contador `BC`. Isto é muito usado quando a área de destino se sobrepõe/choca de alguma forma com a área de origem, impedindo que apagues dados antigos antes de teres a oportunidade de os copiar.
- **Exemplo Prático:**
  ```assembly
    ld hl, 0x5FFF     ; 1. Origem: O final da área de memória a copiar
    ld de, 0xFFFF     ; 2. Destino: O final da zona que vai receber a cópia
    ld bc, 100        ; 3. Quantidade: Vamos copiar 100 bytes
    lddr              ; 4. Copia os 100 bytes andando de costas (do FFFF para trás)
  ```
  - *Explicação para Iniciantes:* Imagina que tens uma fila indiana de 10 caixas (`HL`) e queres chegar as caixas todas duas posições para a frente (`DE`). Se começares a copiar pela caixa Nº 1 para o lugar Nº 3, vais esmagar/apagar a velha caixa Nº 3 que ainda lá estava! A solução inteligente do Z80? O comando `LDDR` faz o trabalhador começar na última caixa (Nº 10) e andar para trás, evitando todos e quaisquer atropelos na memória.

---
*Nota do autor: As instruções de passo-a-passo (`LDI` e `LDD` sem o "R") fazem o mesmo mas dão apenas 1 passo, exigindo que coloques a tua própria lógica e loops manuais no código caso queiras injetar comportamentos no meio da travessia dos dados.*
