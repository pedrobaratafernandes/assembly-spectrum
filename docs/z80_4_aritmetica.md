# Aritmética no Z80: Fazer Contas (ZX Spectrum)

Este documento aborda o tema de **Assembly Z80 para o ZX Spectrum**. O foco deste capítulo é a matemática básica. O modesto processador Z80 não possui comandos nativos gravados no seu hardware para realizar multiplicações ou divisões diretas; a sua proficiência reside estritamente nas operações de adição (`ADD`) e subtração (`SUB`). Todo o ecossistema aritmético de um videojogo, desde o cálculo de trajetórias complexas à pontuação no ecrã, é alcançado combinando estas duas pedras basilares e manipulando sagazmente o Registo de Estado (Flags).

## A Soma Básica

A instrução `ADD` aglomera o valor de dois locais e guarda o resultado final num destino. Na arquitetura do Z80, os programadores têm à sua disposição a capacidade de efetuar somas "pequenas" de 8 bits e somas "grandes" agregando 16 bits.

Quando o cenário exige somas até ao limite numérico de 255 (a capacidade máxima de 8 bits), o destino final da operação é obrigatoriamente o Acumulador (`A`). A grande vantagem desta via é que o processador atualiza harmoniosamente todas as luzes do seu painel de instrumentos (Flags), como o Zero, o Carry e o Sinal, consoante o resultado da operação.

```assembly
    ld a, 10          ; O Acumulador recebe o número 10
    ld b, 5           ; O Registo B recebe o número 5
    add a, b          ; A matemática decorre, totalizando 15 no Acumulador
```

Efetuar matemática de 8 bits no Z80 assemelha-se a resolver uma conta elementar usando estritamente a mão direita (o Acumulador `A`). O programador tem sempre de colocar a base da conta na sua mão, somar-lhe os valores presentes nos outros registos auxiliares e manter invariavelmente o resultado encerrado na mão inicial.

Por outro lado, quando os números começam a dilatar e o valor do cálculo excede 255 (navegando até aos limites dos 65535, o máximo suportado nativamente pelos 16 bits), temos de recorrer aos pares de registos duplos, como o `HL`, `BC` ou `DE`. Nestes cenários ampliados, é habitualmente o par `HL` a assumir a função da "mão gigante" que serve de receptáculo final à soma.

```assembly
    ld hl, 1000       ; Carregamos o valor base de mil no HL
    ld bc, 500        ; Preparamos a parcela dos quinhentos no BC
    add hl, bc        ; O somatório flúi para o HL, culminando em 1500
```

Contudo, existe uma enorme armadilha nesta expansão. Uma vez que o processador está construído para pensar fundamentalmente em tranches de 8 bits de cada vez, somar 16 bits de uma só assentada constitui um esforço tão massivo que o CPU esgota o seu "tempo cerebral". Como consequência, ele abandona a verificação rigorosa da matemática, o que significa que o comando de soma de 16 bits não altera a flag de Zero (`Z`) nem a flag de Sinal (`S`). Estas luzes de aviso mantêm inalterado o valor exato que detinham antes de a conta ter sequer começado, induzindo frequentemente os principiantes em erro. Apenas o transbordo absoluto e caótico do Carry (`C`) é assinalado de forma fiável caso a conta force o limite máximo dos 65535. Torna-se, portanto, responsabilidade estrita do programador escrever código subsequente que avalie mecanicamente as duas metades do resultado para inferir se o valor atingiu efetivamente o zero pretendido.

## A Magia do "Vai Um": Adição com Carry

Quando desafiamos as leis da física e somamos 255 e 2 num registo de 8 bits exíguo, a matemática dá inevitavelmente a volta (o célebre overflow). O valor mecânico zera e passa a 1, mas uma luz de emergência vital acende no painel: o Carry (`C`). Para conseguir somar números gigantescos de 24 ou 32 bits em processadores tão curtos, usamos ativamente este erro a nosso favor através do comando `ADC` (Add with Carry).

Enquanto o `ADD` soma duas parcelas, o comando `ADC` é tricotómico: ele soma o destino, a origem e injeta ativamente no bolo o valor que estiver ditado pelo bit de Carry. 

```assembly
    add a, c          ; Soma a parte baixa. O Carry reage se exceder 255!
    ld l, a           ; Guardamos temporariamente a metade baixa da resposta em L
    ld a, b           ; Puxamos a parte alta da nossa parcela para análise
    adc a, d          ; Adicionamos a parte alta de D e absorvemos o "Vai Um" (Carry)
    ld h, a           ; Trancamos a metade alta e o cálculo monstruoso conclui
```

Isto é análogo aos primórdios das aulas de matemática de lápis e papel onde separávamos a conta em duas colunas verticais singelas: unidades e dezenas. Ao somarmos primeiro as unidades usando um vulgar `ADD`, se a contabilidade excedesse as balizas dos dez, anunciávamos enfaticamente o "e vai um!". O `ADC` traduz literalmente esta transição, debruçando-se sobre a coluna seguinte e integrando docilmente esse "vai um" na fatia da dezena sem corromper a totalidade do número construído passo a passo.

## A Subtração Ascética

Regredir na linha matemática encerra idiossincrasias particulares sob o teto do Spectrum.

A instrução pura de subtração, a mnemónica `SUB`, atua invariavelmente na destruição do valor que o Acumulador carrega naquele exato milissegundo, amputando-lhe quantias à medida. E, revelando uma certa deficiência assimétrica da construção do Z80, o `SUB` destina-se exclusivamente a trabalhar no reduto dos 8 bits. Não procure o leitor um comando `SUB HL, BC` no manual de instruções, pois ele não foi concebido pela engenharia original.

```assembly
    sub b             ; Subtração linear do Acumulador com base no Registo B
```

Para sanar a ausência gritante de uma subtração nativa para números grandes, os engenheiros forçam-nos a abraçar a mnemónica da subtração espelhada com o vai-um: a `SBC` (Subtract with Carry). Comportando-se como uma irmã siamesa algorítmica da soma, o `SBC` recorta ativamente tanto o número invocado como a penalização ditada pelo "pedido emprestado" da contabilidade do Carry. Consequentemente, para se atingir a meta vulgar de subtrair dois grandes números de 16 bits sem herdar penalizações fantasmagóricas de rotinas transatas, é mandatório preparar o terreno antecipadamente.

```assembly
    or a              ; A esfregona divina: Limpa o painel de luzes!
    sbc hl, de        ; Subtração intacta a 16 bits: HL sofre redução de DE unicamente
```

O uso audaz e insólito da operação condicional disjuntiva (`OR A`) atua como uma autêntica vassoura digital: como está a ser efetuada com ela própria sem somatórias nem permutas, purga qualquer sujidade luminosa do painel de Estado e força imperativamente a queda do Carry aos terrenos do silêncio elétrico. Desimpedido o passivo matemático, a subtração em bloco via `SBC` procede de forma incólume.

## Subir ou Descer de Nível

Para garantir iterações ligeiras e ágeis em repetições de laços (loops), o arsenal enche-se com micro operações dedicadas à subida e à descida em passo unitário: o Incremento (`INC`) e o Decremento (`DEC`). Evidenciam uma rapidez assombrosa em detrimento do uso maçudo de injetar somatórias elementares usando o massivo e letárgico `ADD`.

```assembly
    inc b             ; Aceleração súbita do iterador principal para diante
    dec c             ; Contagem decrescente com agilidade imbatível
```

Contudo, até as ferramentas microscópicas albergam paradoxos colossais de engenharia dentro dos confins dos 16 bits.

Se na modalidade dos 8 bits aplicarmos uma erosão via `DEC B` e a rocha se pulverizar na totalidade roçando o Zero absoluto, o painel do processador reflete triunfalmente a anulação acendendo gloriosa a flag de Zeta (`Z`), e facultando o gatilho perfeito para um `JR Z` nos levar para os terrenos de fuga. Contrastantemente, caso repliquemos o mesmo rigor para as montanhas-russas dos blocos conjugados operando um corpulento `DEC HL` ou um vasto `INC DE`, a indiferença do processador é esmagadora: e todas as luzes continuam letargicamente caladas perante as transições. É perigoso, falacioso e fatal fiar a orientação do código nos LEDs do Z80 imediatamente após a iteração compactada de registos estendidos de 16 bits.

## A Inversão Magnética do Sinal

Os contornos de uma matemática polida num enquadramento assinalado (`signed`) obrigam à interpretação subtil onde o oitavo bit atua como sentinela perante a barreira dicotómica do positivo e do negativo. Se a intenção programática visa espelhar esta natureza num ápice, a singela instrução `NEG` (Negate) responde subtraindo mecanicamente e no interior de uma redoma vazia do zero imaginário o valor flutuante presente no Acumulador, convertendo o valor global no seu reverso geométrico.

```assembly
    ld a, 42          ; O nosso Acumulador ergue-se solarengo até 42 unidades
    neg               ; O tombo cavernoso e súbito esboroa-o perante -42 unidades
```

Desafiando a analogia com clareza, o comando `NEG` assenta a sua fundação algorítmica eximiamente de forma idêntica à tecla singular de permuta de sinal de menos encastrada nos circuitos sintéticos de uma comum e vulgar máquina de bolso das antigas contabilidades caseiras. Transformar quarenta e dois cêntimos em dividendos numa dívida de quarenta e dois cêntimos encontra-se doravante unicamente a uma singela instrução de distância.
