# Data in Motion: Mover Dados no Z80 (ZX Spectrum)

Este documento aborda o tema de **Assembly Z80 para o ZX Spectrum**. O foco deste capítulo é aprofundar as formas como os dados fluem pelo processador e pela memória RAM e ROM, explorando as limitações da instrução de carga, as otimizações fantásticas permitidas pela troca de registos e os poderosos comandos concebidos para a cópia de blocos inteiros de memória.

## A Instrução Universal: O Comando de Carga

Desde o início da nossa exploração da linguagem Assembly que constatámos que a instrução de base para a movimentação de dados é o `LD` (Load). A sua sintaxe obedece a um rigor inflexível: lê-se sempre da direita para a esquerda, assumindo o formato de destino seguido da origem. Apesar de parecer um comando singular, a mnemónica `LD` traduz-se em cento e oitenta e quatro comandos de máquina diferentes, o que representa sensivelmente um quarto de todo o léxico do processador Z80!

Embora a arquitetura ofereça treze registos distintos de 8 bits, o processador não permite que movamos dados entre qualquer par de forma arbitrária. Existem limitações físicas. Por exemplo, os registos de Interrupção (`I`) e de Refrescamento de memória (`R`) são de uma natureza muito especial e só possuem "caminhos" diretos para trocar dados com o Acumulador (`A`). Da mesma forma, as metades dos registos de índice (`IXh`, `IXl`, `IYh`, `IYl`) não podem de todo ser emparelhadas com os clássicos `H` ou `L`, nem com as metades do registo de índice oposto.

```assembly
    ld a, i           ; Acesso válido ao registo I através do Acumulador
    ld c, a           ; Transferência do valor para o destino final
```

Na prática, a instrução `LD` copia um valor simulando a transferência de um papel retirado de uma gaveta (a origem) e colocado noutra (o destino). Contudo, a "envergadura" do processador é curta para certas travessias. Se precisarmos de transferir uma informação do registo `I` para o registo `C`, somos fisicamente incapazes de o fazer num movimento único e fluído. Temos obrigatoriamente de pousar essa informação primeiro na nossa mesa de trabalho principal, o Acumulador, para só de seguida a conseguirmos copiar validamente para o destino desejado.

Esta limitação estende-se inevitavelmente ao manuseamento da própria memória. Como referido anteriormente nos Modos de Endereçamento, o Z80 não é arquitetonicamente capaz de efetuar cópias diretas de uma posição da RAM para outra posição da RAM.

```assembly
    ld a, (0x4000)    ; Leitura da memória RAM para o Acumulador
    ld (0x5000), a    ; Escrita do Acumulador para um novo endereço
```

Imaginando que temos o ecrã do jogo (a VRAM) numa prateleira e a memória dedicada ao comportamento de um monstro noutra prateleira distinta, o processador não consegue esticar os dois braços em simult বহুম para trocar elementos diretamente. É imperativo recorrer a um "bolso" - habitualmente um registo primário como o `A` ou o `B` - para carregar transitoriamente a informação no trajeto entre as duas prateleiras.

## Instruções de Troca Rápida

Para além de cópias estritas, o Z80 dispõe de mecanismos de malabarismo. A instrução `EX` (Exchange) não atua copiando dados num sentido unidirecional; em vez disso, ela efetua uma troca simultânea e imediata entre o conteúdo de dois locais distintos.

Um dos segredos mais bem guardados da arquitetura do Z80 é a existência de um conjunto "gémeo" de registos escondido no seu interior. Para cada registo principal, existe um alternativo na sombra (`A'`, `F'`, `B'`, `C'`, `D'`, `E'`, `H'`, `L'`). Como estes não são acessíveis pelos comandos de rotina normais, tornam-se no repositório perfeito para salvaguardar cópias de segurança de forma ultrarrápida, mitigando a necessidade morosa de gravar dados na memória RAM exterior ou de empurrar valores para a *Stack*.

```assembly
    ex af, af'        ; Guarda o Acumulador e as Flags a salvo
```

A instrução de troca do Acumulador e Estado envia os valores vigentes no Acumulador e no registo de Flags (os sinalizadores matemáticos) para os seus respetivos clones. Isto revela-se excelente para interromper subitamente um cálculo complexo de forma a dar resposta a uma emergência do sistema e, posteriormente, retomar a operação matemática exatamente do ponto onde foi deixada. É análogo a estarmos a resolver uma equação extensa num quadro magnético, rodá-lo cento e oitenta graus para obtermos uma face limpa para um apontamento urgente e, finda a urgência, rodá-lo novamente para recuperar intacta a equação original.

O expoente máximo destas trocas ocorre através do comando generalizado `EXX`. Com o modesto custo de um único byte de memória, esta diretiva inverte instantaneamente os três pares completos de 16 bits (`BC`, `DE` e `HL`) pelas suas contrapartes escondidas (`BC'`, `DE'` e `HL'`).

```assembly
    exx               ; Troca 6 registos inteiros simultaneamente
```

Se a inversão singular de um quadro magnético já se apresenta como uma otimização imensa, o comando `EXX` equivale ao luxo de podermos rodar três secretárias atoladas em folhas e afazeres, comutando imediatamente para um ambiente de trabalho limpo sem tocar numa única gaveta. Esta técnica permite, por exemplo, que a rotina principal de um jogo controle o cálculo das físicas na secretária principal, enquanto o desenho gráfico dos elementos atua confortavelmente nas secretárias da sombra, alternando entre elas com uma fluidez inatingível por operações de cópia convencionais.

No que toca a trocas mais mundanas, a mnemónica permite também inverter comodamente os conteúdos do par `DE` com o par `HL`. Sendo este último o predileto incontestado para as funções de manipulação e endereçamento de memória, é frequente que um endereço relevante que tenha acabado no registo `DE` requeira transferência. 

```assembly
    ex de, hl         ; Troca de conteúdos entre as mãos do CPU
```

Neste cenário, a permuta direta não só é elegante como consideravelmente mais expedita do que forjar uma transferência intrincada através do uso engenhoso de múltiplos registos intermédios de 8 bits.

## Cópias de Blocos de Memória em Massa

Quando enfrentamos a necessidade hercúlea de transpor vastas áreas de memória - como a cópia monumental de 6912 bytes requerida para transferir um quadro visual inteiro para o ecrã no clássico método de *Double Buffering* -, a repetição incansável de comandos normais revelaria ser um desastre a nível de velocidade. Felizmente, os engenheiros dotaram o Z80 de macroinstruções gravadas diretamente no hardware que varrem autonomamente grandes extensões da RAM.

### Load Increment Repeat (LDIR)

Esta modesta instrução composta por dois bytes corporiza uma verdadeira central automática de duplicação. A sua mecânica dita que o byte lido na origem apontada por `HL` é imediatamente gravado no destino apontado por `DE`. Concluído esse micrôpasso, a instrução age organicamente incrementando tanto o endereço da origem como o do destino e subtraindo de imediato uma unidade ao contador global estipulado no par `BC`. Exibindo a natureza de repetição inscrita na sua nomenclatura, a instrução atua então num microcosmo e repete agressivamente o ciclo inteiro de cópia vezes sem conta, de forma ininterrupta, até que o contador de viagens assinale o cobiçado valor zero.

```assembly
    ld hl, 0x4000     ; Origem: Início do ecrã antigo
    ld de, 0xE000     ; Destino: Início da área de sombra
    ld bc, 6912       ; Quantidade total a transportar
    ldir              ; Execução autónoma da macro cópia
```

Em vez de termos de congeminar lógicas sofisticadas de iteração recorrendo a saltos e verificações intrincadas, o simples apelo a um `LDIR` resume-se a alicerçar corretamente a logística dos "camiões". Definimos a morada onde a carga repousa, o ponto final de entrega e o número exato de embalagens a lidar; de seguida, o processador assimila as ordens e lida com toda a travessia debaixo do capô da arquitetura de forma absolutamente diligente.

### Load Decrement Repeat (LDDR)

A faceta espelhada da instrução supra encontra-se na sua prima decremental: a `LDDR`. O seu encargo é substancialmente o mesmo, com a drástica diferença de percorrer as moradas orientada em marchas-atrás. Após efetuar a cópia exata de um byte, o processador atua por subtrair valores às origens e destinos (`HL - 1`, `DE - 1`), diminuindo igualmente as passagens sobrantes alojadas no contador.

A utilidade magna desta abordagem retrógrada manifesta-se nos cenários perigosos onde o bloco de memórias inicial colide frontalmente ou se sobrepõe parcialmente com o destino almejado da cópia. 

```assembly
    ld hl, 0x5FFF     ; Origem: Final exato do bloco
    ld de, 0xFFFF     ; Destino: Final exato da secção recetora
    ld bc, 100        ; Contador dos bytes a copiar
    lddr              ; Avanço regressivo 
```

Sem a cautela proporcionada pela travessia regressiva, arriscamo-nos a que a onda de dados avance sobre si mesma, aniquilando a vanguarda do conteúdo intato em prol das retaguardas já recopiadas. O `LDDR` serve assim de seguro indispensável à integridade da nossa memória, forçando a operação a começar na cauda da procissão garantindo um desfasamento natural de fuga à sobreposição de cópia em progressão.
