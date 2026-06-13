# A Pilha de Memória (The Stack) no Z80 (ZX Spectrum)

Este documento aborda o tema de **Assembly Z80 para o ZX Spectrum**. O foco deste capítulo incide sobre a *Stack* (Pilha), uma zona incrivelmente particular da memória RAM que é gerida automaticamente pelo processador e atua como o alicerce fundamental para a estabilidade e o funcionamento ininterrupto de qualquer programa.

## A Natureza da Stack

A Stack é uma área reservada na memória RAM que obedece estritamente ao princípio estrutural clássico das ciências da computação de "O Último a Entrar é o Primeiro a Sair" (conhecido internacionalmente pelo acrónimo LIFO - *Last In, First Out*).

Para não perder o controlo sobre a localização exata da pilha, a arquitetura do processador Z80 aloca um registo especial e exclusivo de 16 bits denominado `SP` (Stack Pointer, ou Apontador da Pilha). A sua única função é monitorizar perenemente o "topo" da pilha em tempo real.
No entanto, a sua física computacional encerra uma idiossincrasia que contraria a intuição inicial do principiante: ao contrário de um edifício que cresce do solo para os céus, a Stack virtual no Z80 cresce de cima para baixo. No cenário clássico do modelo de 48K do ZX Spectrum, o sistema operativo tende a estabelecer o teto inaugural da Stack nos confins finais da memória RAM, empurrando o apontador inicial para endereços vizinhos de `0xFFFF`. À medida que o programador amontoa mais e mais dados no topo desta pilha invisível, o valor numérico do apontador decresce inevitavelmente, arrastando o topo físico da pilha em direção aos endereços de memória cada vez mais baixos.

Na sua essência rudimentar, a melhor forma de visionar este mecanismo cego é traçar uma analogia direta com as molas de pratos nos restaurantes self-service modernos. Quando o cozinheiro despeja um lote de pratos limpos, ele alicerça a pilha vertical. O último prato que as suas mãos largaram passa a reinar incólume no topo do dispensador. Consequentemente, quando um cliente (neste caso, o processador) necessita de um prato, as restrições da mola física obrigam-no imperativamente a recolher o prato que estiver acomodado no topo; o longínquo prato primordial, que inaugurou o poço da mola horas antes, ficará aprisionado na neblina abissal e será, indubitavelmente, o derradeiro e último prato do lote inteiro a ser tocado por mãos humanas.

## Guardar e Recuperar Valores

Para orquestrar a deposição manual de dados preciosos e salvaguardar variáveis nesta infraestrutura temporária, a linguagem presenteou os programadores com dois comandos magnos de cariz absolutamente simétrico. Como o Z80 enxerga a Stack unicamente através da lupa dos grandes contentores, estes comandos operam sempre ao par e exigem, de modo implacável, o recurso a palavras de 16 bits (exigindo o empurrão integral de 2 bytes numa única cadência de relógio).

O primeiro mandamento invoca a ação `PUSH`. A sua função resume-se a sequestrar o montante residente num registo especificado de 16 bits e a arremessá-lo de forma segura para os confins invisíveis que povoam o topo atual do apontador de memória `SP`. Sob os ditames operacionais não supervisionados da arquitetura do chip de silicone, o atuador mecânico processual executa um movimento matemático preparatório automático decrescendo rigorosamente em 2 passos unitários os registos do `SP`, para logo a seguir gravar as amálgamas binárias perfeitamente embaladas na gaveta recém-fresada correspondente.

O contraponto natural surge com a exumação, efetuada em obediência à instrução `POP`. Ele foca a sua atenção eximiamente na crista vigente da pilha de memória, suga vorazmente os 2 últimos bytes acumulados e deposita o conjunto desenterrado no berço que repousa quente na placa matriz dos registos do Z80 indicados pelo programador na sua diretriz. Em plena simetria com a gravitação inversa, mal despacha o último grão do valor da mola para dentro do novo abrigo, o CPU comuta tacitamente uma subida matemática equivalente nos apontamentos internos, repondo a altura virtual somando e recompondo +2 no `SP`.

```assembly
    ld bc, 100        ; Uma variável vital na estrutura interna do programa a correr
    push bc           ; Submerge a variável segura no mar alto da Pilha
    
    ld bc, 50         ; O Registo é barbaramente espoliado por contabilidades irrelevantes...
    
    pop bc            ; À tona a essência ressurge triunfal, encimada em BC de novo nos 100
```

> [!CAUTION]
> **A Regra de Ouro da Pilha:** Tudo o que sobe, tem de inevitavelmente descer. Perante o advento estrutural de um novo `PUSH` algures numa sub-rotina longínqua do nosso código, existe a obrigação imoral e estrita de fechar o parágrafo providenciando o acoplamento exato de um resgate de proporção igual com o mandamento do `POP`, em data e hora a definir antes da debandada ou encerramento logístico da própria dita sub-rotina. Deixar pratos sujos e devolutos esquecidos e afundados sob falsas premissas de topografia redundará numa inevitável hecatombe cósmica e corromperá fatalmente os eixos do Spectrum: conduzindo imediatamente a um reinício espontâneo ou bloqueio integral da rotina face ao desastre do processador perdido na planície sem GPS confiável de moradas válidas.

## O Piloto Automático Invisível

Até ao limiar deste parágrafo, as vicissitudes da manipulação manual transparecem intencionais, guiadas sob o punho apertado do programador. Contudo, nas profundezas impenetráveis da litografia, o silício da Zilog apoderou-se da Stack operando incessantemente às tuas escondidas em todas as manobras e esquinas de mudança de trajetórias, nomeadamente na articulação elementar das chamadas externas via as mnemónicas de `CALL`, dos relâmpagos interativos `RST` e o sagrado selo diplomático de evasão que perfaz a rotina elementar do `RET`.

No limiar dum salto cego alicerçado sobre um `CALL rotina`, paira o fantasma do retorno ao berço do lar nativo. De onde retira a máquina a sabedoria para localizar o ninho inicial? Ela enceta a resposta ancorada na mola de memória da nossa inabalável Pilha. Sem esboçar alarde, o CPU absorve em surdina o complexo logarítmico do Contador de Progresso (o `PC` interno), forjando instintivamente um clone dissimulado sob a forma dum `PUSH` imposto. Segurada pela Stack a morada da retaguarda, o autocarro descola triunfante rumo aos confins de destino do CALL. 
Finda a tarefa com o cruzar natural de linhas face à derradeira fronteira, a baliza da sub-rotina colide frontalmente com a singela palavra do retorno: o `RET`. De novo em surdina, a palavra encerra nos seus desígnios um esguio encerramento do véu transmutado em `POP` dissimulado; arrancando brutalmente dos topos assombrados da mola da Stack os últimos dois traços deixados intencionalmente no passado, espetando-os furiosamente de novo perante os domínios iluminados do comando central e ordenando ao CPU o voo de cegonha que transita o navio regressando são e escorreito com pontaria intocável a casa.

## Abusos Engendrados nas Profundezas da Engenharia

Dado o nível cru de proximidade às bases fundacionais da eletricidade do Z80, os peritos no seu tempo decifraram que o motor ruidoso que orla no coração do ZX Spectrum esconde falhas propositadas que, perante uma arquitetura criativa, redundam em monumentos divinos de rendimento inigualável a velocidades estroboscópicas.

O arsenal ostenta uma artilharia singular sob o epíteto solene de Troca de Ponteiros (`EX (SP), HL`). Um titã disfarçado nas masmorras das extensões menos conhecidas que varre o conteúdo íntegro do Registo colossal de `HL` espelhando a troca numa autêntica inversão imediata perante a neblina dos dois bytes que, simultaneamente, se sentam à superfície da mola do apontador global da Stack. Num espetáculo ausente das fanfarras desgastantes das cópias manuais intercalares por falsos Pop ou Push longínquos com paragens forçadas noutros contentores periféricos; sem perder as amarras transita liminarmente as prateleiras em voo direto inter-galático das bases.

O epítome insano decorre não nas leituras solenes de memórias, mas no arremesso brutal no que passou a ser sobejamente cunhado no jargão retro clássico como O Hack Exponencial da Tela e a Loucura Furiosa. Pintar uma tapeçaria monocromática dotando uma caligrafia de pontilhismo exaustivo esgota os parcos T-States usando corriqueiramente as vulgares travessias manuais. Mas um rasgo de desvario provou que, sob coação mentirosa e despudorada ao regente da consola onde se adultera à força os algarismos residentes no núcleo primordial do apontador oficial do `SP`, transmutando-o fisicamente para os pastos onde correm as frequências catódicas (na célebre grelha pictórica da tela), cada `PUSH` disferido cega na crença do apontador esmaga sem piedade pacotes formidáveis de pixels de 16 bits aos blocos e tranches astronómicas de cor diretamente ao ecrã com velocidade sem paralelo nas mecânicas adjacentes. 

```assembly
    ld (sp_backup), sp ; Eterna Salvaguarda da linha temporal matricial!
    
    ld sp, 0x5800      ; Alvo trancado e redefinido impiedosamente rumo aos atributos coloridos da TV
    ld de, 0x2A2A      ; Estampagem na Bigorna: Prepara Tinta encarnada carmim, sobreposta ao Ciano...
    
    push de            ; IMPACTO PROFUNDO! Matriz dupla pintada com a força dum soco sónico.
    push de            ; Mais tranches gigantes cravadas, e mais, num abismo em cadeia inesgotável
    
    ld sp, (sp_backup) ; Purificação dos pecados mortais, devolvendo a mola inviolável à sagrada morada...
```

Submeter o CPU a uma dieta de devaneios persegue na imaginação de ditar com audácia perante um ilustre confeiteiro para se desvincular transitoriamente da sala reservada aos tachos quentes encravando doravante as suas molas e os ditos caldeirões quentes fisicamente incrustados no coração da própria sala nobre de jantar dos convidados do recinto. Ao desenfrear a lavagem ritmada de empilhar velozmente (a cadência imposta no caloroso e abrutalhado `PUSH`), atira de modo frenético a doçaria colossal com prato e recheios diretamente sobre a feição estupefacta dos infelizes clientes em sala; à luz perversa mas incrivelmente eficiente desta comédia grega burlesca, bastará no fim da efígie recordar com a solenidade solícita as vias sagradas repescando o registo transviado rumo aos bastidores para sanear inquebrantável e incontestada a estabilidade final da memória temporal a salvo dos abismos crónicos.
