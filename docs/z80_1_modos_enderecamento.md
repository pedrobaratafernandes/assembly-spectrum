# Modos de Endereçamento do CPU Z80 (ZX Spectrum)

Este documento aborda o tema de **Assembly Z80 para o ZX Spectrum**. O foco é compreender como o processador Z80 interage com a memória e com os registos através dos vários modos de endereçamento (Addressing Modes).

## Introdução

O sistema Z80 possui um espaço de memória de 16 bits, o que lhe permite endereçar até 64 KB de memória. No ZX Spectrum 48K, a arquitetura é relativamente simples e direta, não sendo necessário recorrer a técnicas complexas como o *banking* (paginação de memória) comum em modelos posteriores. Os primeiros 16 KB da memória correspondem à ROM (Read-Only Memory), uma área apenas de leitura onde reside o sistema operativo do Spectrum. Os restantes 48 KB correspondem à memória RAM, que inclui a área dedicada à memória de vídeo onde os gráficos são desenhados.

## Modos de Endereçamento Oficiais

Para conseguirmos programar o Z80 de forma eficaz, precisamos de dominar as diferentes formas de aceder e manipular os dados. A estas formas chamamos Modos de Endereçamento.

### Modo Implícito (Implied Addressing)

O modo de endereçamento mais fundamental é o Modo Implícito. Trata-se de um conjunto de instruções que não necessita de quaisquer operandos ou argumentos externos. Todo o contexto necessário para que o processador saiba o que fazer já se encontra embutido no próprio *opcode* (o código máquina gerado pela instrução).

Este modo é habitualmente utilizado para operações fixas e intrínsecas à gestão do próprio CPU. Como o processador não precisa de perder tempo a interpretar variáveis adicionais ou a ir buscar dados à memória RAM, estas instruções são incrivelmente compactas e executam-se com a máxima rapidez. Um exemplo clássico é a instrução de retorno:

```assembly
    ret               ; Regressa de onde veio
```

A instrução `RET` é a forma de dizermos ao processador para "retornar". Se imaginarmos que o código principal foi interrompido para executar uma tarefa secundária noutra zona da memória (uma sub-rotina), a instrução `RET` atua como o bilhete de regresso. Ela não precisa que lhe digamos explicitamente para onde voltar, visto que o Z80 é suficientemente inteligente para ter guardado automaticamente o caminho de volta quando iniciou essa tarefa. Outros exemplos incluem comandos como `EI` e `DI` para ligar e desligar interrupções do sistema.

### Modo de Registo (Register Mode)

Quando precisamos de velocidade pura, recorremos ao Modo de Registo. Neste caso, a instrução atua diretamente sobre os registos internos do Z80, sejam eles de 8 bits ou de 16 bits (como `A`, `B`, `HL` ou `AF`).

Como esta operação ocorre unicamente dentro das "entranhas" do processador, é a forma mais rápida de manipular dados, abolindo a necessidade de comunicar com a memória RAM exterior. Quase todas as transferências de dados entre registos resultam num único byte de código máquina. Por este motivo, é a escolha ideal para guardar variáveis ou contadores que sejam acedidos com grande frequência durante a execução de um jogo.

```assembly
    ld b, 10          ; Prepara o número 10 no registo B
    ld a, b           ; Copia o conteúdo do registo B para o A
```

Em linguagem Assembly do Z80, a instrução de base é o `LD`, que significa "Load" (Carregar ou Copiar). A ordem de leitura é estrita e funciona sempre da direita para a esquerda: destino, depois origem. Assim, a instrução `LD A, B` diz ao processador para olhar para o número guardado no registo `B` e fazer uma cópia exata do mesmo para o registo `A`. Este registo `A`, conhecido como Acumulador, é o principal local de trabalho do processador onde a maior parte das operações matemáticas e lógicas tem lugar.

### Modo Imediato (Immediate Addressing)

Por vezes, sabemos de antemão qual é o número exato com o qual queremos trabalhar. Nesses casos, utilizamos o Modo Imediato, no qual o valor numérico é colocado diretamente (ou "chumbado") no próprio código da instrução.

Este modo serve para carregar constantes numéricas ou dados fixos de 8 bits (valores de 0 a 255). A grande vantagem deste método reside, mais uma vez, na rapidez e na economia de ciclos. Como o valor a ser processado já está embutido no código máquina lido pelo processador, este escusa de perder tempo a procurar esse mesmo valor noutro endereço de memória.

```assembly
    ld b, 5           ; Carrega o número 5 diretamente no registo B
```

Em vez de copiarmos o valor de um registo para outro, injetamos um número fixo diretamente no destino. A instrução `LD B, 5` ordena simplesmente que o número 5 seja guardado no registo `B`. Este número 5 não é uma referência a uma morada de memória, mas sim a constante matemática 5.

### Modo Imediato Extendido (Extended Immediate Addressing)

O Modo Imediato Extendido partilha a mesma filosofia do Modo Imediato, mas expande a sua capacidade para lidar com valores maiores. É utilizado para injetar constantes de 16 bits diretamente no código.

Na prática, é tipicamente utilizado para inicializar registos de 16 bits (como o par `HL` ou o indexador `IX`) com um endereço de memória inicial. É também a fundação das instruções de salto absoluto, permitindo ditar ao processador o local exato da memória para onde este deve transferir a execução do código de seguida.

```assembly
    jp 0x8000         ; Salta diretamente para a posição fixa 0x8000
```

A instrução `JP` significa "Jump" (Saltar). O prefixo `0x` indica que o número fornecido está em formato hexadecimal. Assim, o comando diz de forma imperativa: "Abandona a execução na linha atual e salta de imediato para a posição de memória 0x8000, retomando a execução do código a partir desse ponto".

### Modo Extendido ou Direto (Extended/Direct Addressing)

Quando a nossa intenção não é carregar um número fixo, mas sim ir ler ou escrever num local específico da memória RAM, utilizamos o Modo Direto. Aqui, a instrução fornece um endereço de memória de 16 bits, sempre rodeado por parênteses matemáticos, como `(endereço)`.

Devido à arquitetura do Z80, só é possível copiar valores da memória para os registos do processador e vice-versa. O processador não consegue fazer uma cópia direta de uma posição de memória para outra sem usar um registo como intermediário. Este modo é essencial para aceder a variáveis globais do programa ou para interagir de forma cirúrgica com o hardware do computador (como a placa de vídeo ou os atributos de cor), que se encontram mapeados em moradas fixas e conhecidas.

```assembly
    ld a, (0x4000)    ; Copia o valor contido na morada 0x4000 para o registo A
```

Neste contexto, os parênteses fazem toda a diferença. Se os omitíssemos, o processador tentaria guardar o número gigantesco `4000` no diminuto registo `A`, resultando num erro. Com os parênteses presentes, a instrução diz ao Z80: "Desloca-te fisicamente à célula de memória RAM com o número 0x4000, lê o byte que lá estiver guardado, e faz uma cópia do mesmo para o registo A".

### Endereçamento Indireto por Registo (Register Indirect Addressing)

No Endereçamento Indireto por Registo, o endereço de memória que pretendemos aceder não está fixo no código. Em vez disso, a morada encontra-se guardada de forma dinâmica dentro de um registo de 16 bits (geralmente o `HL`, `BC` ou `DE`). Mais uma vez, utilizam-se parênteses em torno do nome do registo.

Esta é, indiscutivelmente, a melhor forma de percorrer grandes blocos de memória, arrays, strings de texto ou dados gráficos. Dentro de um ciclo de repetição, basta incrementar o registo (usando um simples `INC HL`) para que este passe a apontar para a morada do byte seguinte. Esta técnica mantém o código compilado excecionalmente limpo e curto.

```assembly
    ld hl, 0x5000     ; O par de registos HL recebe o valor 0x5000
    ld a, (hl)        ; O A recebe o valor guardado na morada ditada por HL
```

Imagine que o par de registos `HL` tem o valor 0x5000 guardado. A instrução `LD A, (HL)` ordena que o processador verifique a morada que o registo `HL` lhe indica (0x5000) e vá buscar o conteúdo alojado nesse espaço da RAM, copiando-o para o Acumulador. Se logo a seguir incrementarmos o `HL`, a próxima vez que esta instrução correr, o Z80 lerá a porta seguinte (0x5001). É através deste mecanismo elegante que os jogos processam a movimentação de dezenas de sprites no ecrã.

### Endereçamento de Página Zero (Modified Page Zero / RST)

O Endereçamento de Página Zero é um atalho poderoso. Permite chamar diretamente um de oito endereços predefinidos e restritos da chamada "página zero" de memória (os primeiros 256 bytes da arquitetura). Isto é feito através de um comando especial chamado `RST`.

No ZX Spectrum, a utilidade principal destes endereços é servir de porta de entrada rápida para rotinas muito complexas que já se encontram gravadas de fábrica na ROM (como rotinas matemáticas de pontuação ou impressão de caracteres no ecrã). A grande vantagem do `RST` é a drástica poupança de espaço e ganho de velocidade. Enquanto uma chamada regular a uma sub-rotina (`CALL`) consome três bytes de memória, o `RST` ocupa um único byte.

```assembly
    ld a, 0x48        ; Coloca o código da letra 'H' no Acumulador
    rst 0x10          ; Chama a rotina da ROM para imprimir o 'H' na TV
```

A instrução `RST` (Restart) atua como um salto condensado. A morada `0x10` (que corresponde ao decimal 16) é icónica no Spectrum. Sempre que um programa invoca o `RST 0x10`, o computador desperta as funções de vídeo da ROM, verifica qual o valor que o programador colocou no registo `A`, e desenha de forma instantânea esse carácter no ecrã com as cores certas. Este modo poupa a necessidade de ter de criar gráficos vetoriais complexos a partir do zero para imprimir texto simples.

### Endereçamento Relativo (Relative Addressing)

O Endereçamento Relativo é a alma das instruções de salto condicional (`JR`). Aqui, o destino do salto não é referenciado de forma estática com um número absoluto (como a morada `0x8005`). Pelo contrário, é estipulado indicando o número exato de passos e a direção que o processador deve seguir a partir da sua posição atual.

Este modo permite saltos curtos, abrangendo uma distância de até 128 bytes para trás ou 127 bytes para a frente. É a base de qualquer ciclo de repetição apertado ou da lógica condicional de um jogo. Ocupa menos espaço na memória, resultando num código mais eficiente. Importa notar que se a distância do salto pretendido for superior a 127 bytes, o compilador irá gerar um erro, forçando o programador a substituir o salto relativo por um salto absoluto mais dispendioso (`JP`).

```assembly
loop:                 ; Etiqueta que marca o início do ciclo
    dec b             ; Subtrai 1 ao valor guardado no registo B
    jr nz, loop       ; Se o valor não chegou a zero, salta para 'loop'
```

O comando `JR` significa "Jump Relative" (Salto Relativo), enquanto `NZ` é a condição matemática avaliada, significando "Non-Zero". Na prática, esta instrução obriga o processador a avaliar o último cálculo efetuado: se a subtração ao registo `B` não o deixou a zero, então o processador é forçado a regressar à linha marcada com a etiqueta 'loop' e repetir todo o processo. Esta é a forma natural de traduzir em Assembly os ciclos `while` ou `for` que encontramos nas linguagens de programação modernas.

### Endereçamento por Índice (Index Addressing)

Para gerir estruturas de dados mais complexas, o Z80 oferece o Endereçamento por Índice. Este modo engloba um registo indexador dedicado (`IX` ou `IY`) aliado a um *offset* estático (uma diferença fixa de passos) definido pelo programador, como por exemplo `(IX+2)`.

É o modo de excelência para lidar com objetos no contexto de videojogos. Se tivermos os dados de um inimigo estruturados na memória e soubermos que a sua "Vida" está guardada na base do objeto, e que as suas coordenadas X e Y estão guardadas nos dois bytes subsequentes, o registo indexador torna trivial o acesso a todos estes dados em simultâneo.
Contudo, há uma penalização de desempenho a considerar. Como estes registos de índice foram uma adição tardia à arquitetura original do Z80, os seus opcodes necessitam de bytes extras de prefixo. Isto faz com que a execução através de `IX` ou `IY` seja consideravelmente mais morosa do que a mesma operação executada através do clássico endereçamento indireto via `HL`.

```assembly
    ld ix, 0x6000     ; O registo IX passa a apontar para a base do objeto
    ld a, (ix+2)      ; O registo A recebe o dado que está na base + 2 passos
```

Considerando o exemplo acima, se definirmos o endereço 0x6000 como o ponto de partida na RAM, a instrução final obriga o processador a deslocar-se mentalmente à porta apontada por `IX`, avançar duas posições e ir resgatar o valor armazenado na morada final (neste caso, na 0x6002), copiando-o de volta para o registo `A`.

### Endereçamento de Bits (Bit Addressing)

O grau de controlo mais minucioso que o Z80 nos proporciona é alcançado com o Endereçamento de Bits. Este modo permite ler, testar e forçar a alteração de um único bit individual (de 0 a 7) pertencente a um registo ou a uma posição na memória RAM, sem afetar a integridade do restante byte. As instruções centrais desta família são o `BIT`, `SET` e `RES`.

Esta precisão microscópica é indispensável para comunicar diretamente com o hardware físico, processar sinalética binária muito concentrada ou alterar subtilmente valores na memória.

```assembly
    res 5, (ix)       ; Apaga apenas o 5º bit desse byte
```

A mnemónica `RES` traduz-se em "Reset", o que no vocabulário binário significa forçar o estado de algo a desligar-se, assumindo o valor numérico de zero. Na instrução de exemplo, o processador navega até à memória e localiza o 5º bit dentro desse byte (sendo que cada byte é numerado de 0 a 7). Ele obriga esse bit a assumir o valor de zero. De forma quase mágica, esta simples inversão binária tem aplicações dramáticas: se executarmos este comando sobre o código ASCII da letra minúscula "h" (cujo valor binário é 01101000), o apagamento do 5º bit fá-la transitar instantaneamente para a sua variante maiúscula "H" (cujo valor binário é 01001000).

---

## Modos "Não Oficiais"

Para além da categorização estrita dos modos definidos nos manuais da Zilog, a comunidade de programadores aborda certas características da linguagem Assembly como modos independentes, de forma a facilitar a leitura da estrutura lógica do código.

### Condições de Estado (Status Conditions)

As Condições de Estado baseiam-se em bits de aviso (flags) residentes no painel de controlo interno do processador, tais como o bit de transporte ou erro *Carry* (`C` ou `NC`) e o bit sinalizador de *Zero* (`Z` ou `NZ`). Estas flags são frequentemente utilizadas como "condição matemática" no final de um salto ou chamada a uma rotina.
Sem este mecanismo fundamental, o Z80 seria meramente uma máquina de calcular contínua. É a avaliação destas luzes de aviso que confere ao computador a capacidade vital de raciocinar logicamente e tomar decisões condicionalmente.

```assembly
    add a, 200        ; Adiciona 200 ao valor atual do Acumulador
    jp c, limite      ; Se a operação resultou num erro Carry, salta para a etiqueta 'limite'
```

Neste cenário prático, se o resultado de adicionar 200 ao valor pré-existente no Acumulador ultrapassar a barreira mecânica do registo de 8 bits (ou seja, superar 255), o processador aciona internamente um alarme chamado "Carry" (Vai-um). A instrução que se segue é um salto condicional: ela instrui o Z80 a verificar primeiro o estado desse alarme e, caso esteja ativo, saltar de imediato para a secção de código denominada "limite" com o intuito de tratar esse erro. Se a matemática não tiver resultado em excessos, a instrução ignora o salto pacificamente e prossegue para a linha de código seguinte.

### Modos de Interrupção (Interrupt Modes - `IM`)

Finalmente, existem os Modos de Interrupção, criados exclusivamente para lidar e priorizar os eventos de hardware.
Na arquitetura complexa do ZX Spectrum, a norma é ativar o modo de interrupção clássico através do comando `IM 1`, delegando o tratamento das tarefas secundárias do computador à infraestrutura sólida que a ROM fornece. Contudo, em jogos dinâmicos, muitas vezes os criadores optam por recorrer ao versátil `IM 2`, que lhes concede a liberdade total de sobrepor as diretrizes do sistema com rotinas totalmente desenhadas à sua medida.

```assembly
    im 1              ; Dá instrução ao CPU para delegar interrupções à ROM
```

A título de exemplo prático, enquanto o processador se encontra focado em correr as mecânicas intensas de física do jogo, o ULA (o controlador do hardware de vídeo) envia um sinal elétrico - a Interrupção - para avisar o CPU que está na hora de desenhar um novo ecrã na televisão (sendo que num modelo PAL, este pulso é lançado 50 vezes a cada segundo). O comando `IM 1` garante que o processador acate estes "toques no ombro", pause com segurança a sua rotina atual, execute o minúsculo bloco de código pré-gravado na ROM que lida com as operações vitais do sistema e do ecrã e, sem sobressaltos, regresse de imediato ao ponto de partida. Graças a esta harmonia sistémica, o Spectrum é capaz de efetuar gestão de eventos no pano de fundo - como ler simultaneamente as respostas ao teclado sem interromper a fluidez gráfica do jogo principal.

---

## Demonstração Prática: O "Hello World"

O culminar da introdução ao endereçamento é conseguir visualizar todos estes mecanismos a trabalhar de forma conjunta. Para este fim, o programa "Hello World" serve perfeitamente para expor e solidificar o entendimento prático destas arquiteturas. O código apresentado abaixo utiliza a sintaxe moderna característica do compilador **sjasmplus**.

### Código de Exemplo

```assembly
    device zxspectrum48
    org 0x8000

    jp start

string:
    db "hello"

string_length equ 5
rom_cls       equ 0x0daf
color_attr    equ 0x5800
enter         equ 0x0d
black_white   equ 0x07   ; Tinta branca (7) em fundo negro (0)

start:
    im 1
    call rom_cls

    ; --- 1ª Passagem: Imprime "hello" através de registo (HL) ---
    ld hl, string
    ld b, string_length
loop:
    ld a, (hl)
    rst 0x10
    inc hl
    dec b
    jr nz, loop

    ; Inserção de uma mudança de linha
    ld a, enter
    rst 0x10

    ; --- Manipulação Cirúrgica dos Atributos de Cor ---
    ld a, black_white
    ld (color_attr), a

    ; --- Interação Bit a Bit em conjunto com Endereçamento por Índice ---
    ld ix, string
    res 5, (ix)

    ; --- 2ª Passagem: Imprime a variante "Hello" num loop desdobrado ---
    ld a, (ix+0)
    rst 0x10
    ld a, (ix+1)
    rst 0x10
    ld a, (ix+2)
    rst 0x10
    ld a, (ix+3)
    rst 0x10
    ld a, (ix+4)
    rst 0x10

    ; Finalização com quebra de linha
    ld a, enter
    rst 0x10

    ret
```

### Análise da Execução

A leitura sequencial do programa revela claramente como as diretivas do programador se transmutam nos modos de endereçamento abordados.

Começando pela cabeceria estrutural, a instrução de iniciação recorre de imediato ao **Endereçamento Imediato Extendido**. Uma vez que os dados ultrapassam raramente as barreiras dos 127 bytes locais, seria possível recorrer a um singelo `JR start` (Endereçamento Relativo) para tentar poupar preciosos bytes, mas a escolha recai sobre o robusto `JP` absoluto por precaução arquitetural. Paralelamente, os rótulos pseudo-operativos `equ` funcionam como pilares fundamentais de clareza, definindo constantes mágicas como a morada base de limpeza de ecrã (`0x0daf`) ou os atributos dedicados da matriz de cores (`0x5800`).

Quando entra no cerne da rotina (`start:`), o código recorre primeiramente ao Modos de Interrupção 1 para assegurar que o hardware de vídeo subjacente não interfere desnecessariamente, prosseguindo para um **Endereçamento Imediato Extendido** (na forma de `call rom_cls`) que limpa incondicionalmente o quadro visível. Esta invocação remota à rotina principal da ROM culmina no retorno intrínseco, que devolve o controlo ao jogo.

Ao tentar exibir o texto no ecrã pela primeira vez, entramos numa confluência de múltiplos mecanismos clássicos do Z80. Um **Endereçamento de Registo** embutido inicializa o par base `HL` num compasso com o **Endereçamento Imediato** utilizado para o iterador. A grande magia revela-se quando acionamos o **Endereçamento Indireto por Registo** (`ld a, (hl)`) no interior de um pequeno ciclo, alimentando byte a byte as letras sucessivas do texto para o Acumulador central, num circuito constante de escrita, avanço indexado, decremento e um **Endereçamento Relativo** de verificação de fim de ciclo. De seguida, usamos a morada de ROM `0x10` com Endereçamento de Página Zero para delegar de forma eficaz a tarefa complexa de impressão efetiva do pixel para o processador do ecrã.

Para interagir com o ambiente colorido, alteramos as regras do tabuleiro usando o **Endereçamento Direto** `ld (color_attr), a`, que nos permite enviar o formato cromático previamente calculado (tinta branca numa grelha de fundo obscura, cifrado no código hexadecimal `0x07`) para a coordenada rígida de memória gráfica que abarca as fundações da nossa primeira impressão textual, virando visualmente os blocos cinzas para brancos vívidos.

Numa demonstração virtuosa de manipulação da informação bruta, unimos o **Endereçamento por Índice** e o **Endereçamento de Bits** para provar que a letra 'h' inicial pode sofrer uma inversão morfológica, sendo dissecada microscopicamente e tendo um dos seus bits chaves desligado num instante fugaz, regressando à existência como a letra capitular maiúscula sem sequer perturbar as suas vogais contíguas. 

O remate do programa consiste em expor os pormenores do próprio índice. Utilizando o método do **Loop Desdobrado**, acedemos manualmente aos bytes indexados subsequentes invocando saltos fixos (`ix+0`, `ix+1`), ilustrando eximiamente a versatilidade que uma simples diferença matemática associada ao endereçamento pode propiciar. Este percurso iterativo sem paragens poupa efetivamente tempo num cenário em que a iteração programática (`loop`) seria consideravelmente penalizada em matéria de velocidade de execução. Como seria de esperar em programas íntegros e eficientes, encerra silenciosamente com uma instrução de Modo Implícito sob a forma graciosa de um `ret`.
