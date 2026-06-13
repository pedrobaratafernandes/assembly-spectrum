# O Mundo Cá Fora: Input e Output (ZX Spectrum)

Este documento aborda o tema de **Assembly Z80 para o ZX Spectrum**. Após exaustivos capítulos encerrados nas profundezas do "cérebro" da máquina processando lógica e matemática isoladas nas moradas virtuais, o nosso foco recai sobre o tangível: a interação viva com a dimensão física cá de fora, nomeadamente espiando o premir exato do Teclado humano e ressoando a nossa voz no mundo através dos apitos do Beeper nativo.

## As Portas Mágicas e a ULA

Numa grande maioria dos microprocessadores que popularizaram os lares na mesma década (sendo o 6502 da Nintendo um exemplo paradigmático), o hardware impunha aos arquitetos a reserva compulsiva de preciosos endereços de memória RAM para a consulta estrita de comandos externos ou atributos de imagem. A isto chama-se "Memory Mapped I/O" e subtrai espaço útil de jogo. A filosofia estrutural do Z80 contorna este desperício por via de separação de domínios: a sua memória é cem por cento votada para o armazenamento exclusivo de código e variáveis. Para escutar ou ditar recados ao hardware que guarnece a carcaça de plástico preta, foi cunhada uma via de comunicação eletromecânica intrínseca denominada "Portas de I/O" (Input/Output).

Na engrenagem do clássico ZX Spectrum, existe um componente supremo encarregue de orquestrar as luzes vitais, varrer o sinal PAL da TV, zumbir a cápsula de som e traduzir o pisar acrílico das dezenas de teclas. O seu nome é ULA (Uncommitted Logic Array). Como guardião intransigente do sistema externo, ele aceita recados e atende invariavelmente e apenas as chamadas telefónicas oriundas de Portas I/O cujo endereço ostente um número par e imaculado, isto é, que encerre os seus zeros lógicos e determine que o byte assente no valor hexadecimal `0xFE`.

Para assimilação pacífica, basta que o programador encare o veloz Z80 como o corriqueiro cidadão de uma província próspera - a gigantesca Matriz RAM onde todas as casas desde o logradouro 0 à moradia 65535 se encontram acessíveis por calçada. Porém, o famigerado Teclado e a cápsula do Altifalante são aldeias cravadas noutra latitude; a sua dimensão física não partilha calçadas connosco. A única ponte que as une atua via estação de correios oficial - que na analogia traduz fisicamente as Portas de I/O. A sede majestosa dos correios da ULA ostenta de forma intocável o código postal remate `0xFE`. Um envio imperativo endereçado para os trâmites do `0xFE` voa liminarmente de dentro da cidade central caindo no tapete rolante do hardware exótico que rodeia o coração da pastilha Z80.

## Auscultar o Teclado

Na intenção inabalável de coligir os humores e vontades do humano, o CPU vale-se do seu mensageiro mais fiável: a sagrada instrução de entrada `IN` (Input).

No emaranhado de fios que desenham o teclado num ZX Spectrum, a constatação vital revela que as teclas não operam singularmente numa panóplia caótica, mas assentam ordeiramente através duma grelha matriz de linhas. Para questionar o CPU e exigir a leitura completa duma linha restrita, torna-se forçoso erigir e enviar uma instrução assente em 16 longos bits:
A metade inferior obedece perpetuamente ao valor de `0xFE`, assinalando a chamada primordial de despertamento da ULA supra falada.
O remanescente segmento de topo assume então a batuta indicativa ditando a qual das artérias da matriz de borracha pertence a solicitação de vigilância requerida pelo nosso crivo (ex: focar estritamente o quadrante agrupando a sequência transversal das famosas `A, S, D, F e G`).

> [!WARNING]
> **A Rasteira Constante dos Zeros:** Sob os desígnios tortuosos dos velhos tempos de engenharia digital barata, dita a lógica invertida nas condutas que a matriz assenta por defeito os seus pinos em tensão elétrica pura e vibrante. Significa, pois, que se o dedo mantiver repouso e a tecla seguir impoluta, o processador absorve esse silêncio num `1` afirmativo brilhante e ressoante. Assim que o polegar esmaga finalmente a membrana cortando de raspão as correntes orgânicas, o painel do CPU é informado por um escuro e ríspido abismo no bit, traduzindo as vontades do leitor pressionado como um absoluto e indubitável `0`! 

```assembly
    ld a, 0xFE        ; Depositamos metodicamente o Endereço Alto da matriz almejada (Fila V a CAPS)
    in a, (0xFE)      ; A Invocação!
```

Neste simples compasso encerra-se um portento mecânico fascinante: a instrução apoderou-se magicamente do conteúdo retido internamente no interior da gaveta residente de topo e, sub-repticiamente juntando ao acoplamento constante `(0xFE)` encastrado fixo por definição no código máquina redigido pelo compilador da instrução, expediu rumo aos circuitos ULA longínquos o formidável e composto pedido duplo unificado pela amálgama `0xFEFE`. Atendida que é a porta do correio, este `IN` encarrega-se sem tréguas nem intermédios de verter a dita resposta recolhida da grelha de plástico obliterando num arrasto esmagador as vontades exatas destas precisas cinco chaves isoladas no mesmo peito do incansável Acumulador (`A`).

Se na arte do refinamento programático urgir apartar das mãos do atarefado Acumulador a responsabilidade mesquinha e volátil das requisições do teclado intermédias para melhor proveito futuro da fluência logarítmica de batalha no ciclo de jogo: o sistema Z80 prevê um recanto ordenado emparedando sem confusões e subentendidos crípticos a construção meticulosa inteira da fachada portuária no sólido suporte par alojado na estrutura de 16 bits de nomeada `BC` esvaziando comodamente os frutos de vigilância da tecla num desígnio à parte como na cabine exata `D`.

```assembly
    ld bc, 0xFEFE     ; O edifício completo transigido inteiramente na segurança dos 16 bits BC
    in d, (c)         ; A recolha cega desfecha perante as portas colhidas em C rumo ao ninho de D
```

## Romper com a Barreira do Som: A Exalação Através do Beeper

Invocado o espírito de entrada, urge reverter o sentido da maré perante a exigência altiva de exprimir no exterior vontades forjadas a ferro dentro do seio do silicone. Em Assembly de Z80, isto corporiza a essência estrita do comando reverso assinalado na sigla `OUT` e a consequente viagem expedita ao exterior dos "Correios". 

É consabido historicamente que a encarnação original dos 48K do ZX Spectrum não perfilhava qualquer regalia sob a figura pomposa e dedicada na glória imponente dum sintetizador musical puro. A máquina bramia e grunhia alicerçando o espectro sonoro inteiro unicamente num solitário sensor circular rudimentar soldado à placa eletrónica num engate de latão piezométrico (simples e vulgarmente conhecido nas ruas por *Beeper*). Ele confina as nuances acústicas obedecendo terna e passivamente à cadência intermitente dum paupérrimo e individual canal, um pino binário aprisionado em estrito rigor arquitetónico dentro da redoma do *Bit 4* do pórtico universal de nome `0xFE`.

Nesta planície infértil e restrita a estados absolutos e limitados à ausência e presença ("On" contra "Off"), compor melodia ou proferir o ruído afigura-se num bailado vertiginoso dependente, de modo brutal, dos abanões enérgicos de pulsação e oscilação de estados instáveis do próprio pórtico induzindo as estridências por arrasto do cone material num esticão infindável de subidas vertiginosas perante quebras rápidas. Para gerar tons com distinção há que alternar ciclicamente em torpor vibracional da mesma índole em que uma corda de guitarra impoluta reage: tencionada no trambolhão libertada a voos longos perante oscilações intermédias e imensamente afinadas em ondas contínuas de frequência imutável. 

```assembly
    ei                ; Rompem-se os selos auditivos do silêncio; a porta atende os apelos de Hardware
    ld c, 0xFE        ; Morada sacrossanta fincada nas portas ULA
  
  som_infinito:
    xor 0x10          ; Máscara imposta sob artes negras, visando cegamente a integridade do Bit 4
                      ; Comutando ritmadamente em negação e encarnando no reverso imediato o que repousava no estado do bit sonoro.
                      
    halt              ; Espera dócil e plácida pelas pinceladas de transição vertical PAL aos ritmos da TV.
    out (c), a        ; Injeta fisicamente através do porte central (em C) o espasmo sonoro vital na membrana externa.
    
    jr som_infinito   ; Puxão infinito sem contemplações tecendo espirais cíclicas num zumbido inquebrantável a 25 Hz brutos.
```

No dealbar primitivo dum modelo de 48K puro a sonoplastia traduzia-se num pesadelo de monopólio abissal canibalizando perversamente um processamento nevrálgico precioso da ação fluída devido à estrita imposição síncrona manual e dedicada do envio e escuta do som; não raras vezes a custo integral do próprio jogo perante a mudez súbita das tréguas de combate em pausas acústicas. Sombras deste fardo hercúleo que o futuro nos reservará e apaziguará mais adiante num amadurecimento dos ensinamentos que libertará esta caixa de latão por tons celestes e composições plásticas a desvendar em vias iminentes nesta obra.
