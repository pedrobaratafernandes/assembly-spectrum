# Gráficos no ZX Spectrum: Bem-vindo à Matriz

Este documento aborda o tema de **Assembly Z80 para o ZX Spectrum**. É aqui que descobrimos como a placa gráfica do Spectrum obriga a acrobacias mentais extremas para pintar 1 único pixel no ecrã!

O Spectrum oferece três caminhos diferentes para desenhar gráficos, com diferentes níveis de complexidade.

## 1. Nível 1: Os Gráficos de Bloco e os UDGs

A forma mais inofensiva de criar jogos simples é usar as ferramentas oferecidas pela ROM do teclado e das Letras.

- **Os Gráficos 2x2 (Códigos `0x80` a `0x8F`):** Podes imprimir (usando o `RST 10` que aprendemos no Episódio 10) os símbolos gráficos que estão escritos nas teclas 1 a 8 do Spectrum. Parecem píxeis gordos, mas são blocos que têm sempre as cores do Paper e Ink atual. Úteis apenas para desenhar molduras.
- **Os UDGs (User Defined Graphics):** É aqui que nascem os teus primeiros heróis (Sprites). O Spectrum cedeu 21 letras (As letras A a U) para tu as desenhares como bem entenderes! A "memória RAM" de desenho destas 21 letras fica nos últimos bytes do computador (a partir de `0xFF58`).
  - *Como desenhar?* Para fazeres uma nave espacial, basta usares a função matemática `LDIR` e copiares 8 Bytes da tua nave espacial algures na memória, e colá-los por cima do endereço `0xFF58`. Quando mandares imprimir a letra "A" (`RST 10` com o código `0x90`), aparece a tua nave de 8x8 píxeis!

---

## 2. Nível Especialista: O Inferno do Bitmap (`0x4000`)

Os verdadeiros jogos de Spectrum não imprimem texto! Eles ligam a caneta na placa de vídeo e pintam diretamente os ecrãs. A memória de vídeo começa na morada sagrada `0x4000` (6144 bytes dedicados). 

- *Explicação para Iniciantes (O Efeito de Loading):* Imaginas que se escreveres bytes de memória consecutivos a partir do `0x4000`, a TV desenha a primeira linha do ecrã e depois desce imediatamente para desenhar a linha 2, certo? **ERRADO**. A memória do Spectrum é entrelaçada para poupar dinheiro em processadores caros nos anos 80! Quando acabas a Linha 0 (O topo), o endereço a seguir vai desenhar a **Linha 8**! Só muito mais tarde volta à Linha 1. É por isso que, quando carregas um jogo por cassete, vês a imagem a surgir de cima a baixo aos terços!

Para pintares um pixel de cor nas coordenadas exatas `X` e `Y`, o Assembly tem de atirar essas variáveis para a liquidificadora e usar `AND`s, `OR`s e Rotações (`RR`) para fabricar um Frankestein de 16 bits.
A morada do Píxel final na memória tem este aspeto:
- **Upper Byte:** `010 (bits do endereço base 0x4000) + y7 y6 (bits de topo do Y) + y2 y1 y0 (bits de fundo do Y)`
- **Lower Byte:** `y5 y4 y3 (bits do meio do Y) + x7 x6 x5 x4 x3 (bits de topo do X)`

*E ainda pior:* O byte encontrado tem 8 píxeis enfiados lá dentro! A cor não é o byte inteiro, é só um dos bits lá dentro. Descobrir qual dos 8 bits tens de ligar a `1` é determinado pelos 3 bits que sobram do `X` (`x2 x1 x0`). É por isso que desenhar píxeis em bruto é lentíssimo em 8 bits!

---

## 3. O Caixote das Cores e o "Color Clash" (`0x5800`)

O ecrã do Spectrum gasta só 1 bit de memória por cada pixel. O pixel é simplesmente `0` ou `1`. E a cor?
A magia das cores está guardada noutra morada, nos **Atributos (`0x5800`)**. Felizmente a matemática aqui é limpa e linear! Tens 32 colunas x 24 linhas de blocos = 768 Bytes coloridos. A fórmula de morada é simples: `(Y * 32) + X`.

- **A Maldição do Color Clash:** Para poupar muita memória, o computador não guarda cores pixel a pixel! O computador guarda a cor num enorme azulejo (tile) de 8x8 píxeis! Ou seja, dentro de um quadrado de 8x8, só podes usar **DUAS CORES**: A Tinta (`Ink` - para onde os píxeis são `1`) e o Fundo (`Paper` - para onde os píxeis são `0`). O Color Clash acontece porque os desenhos sobrepõem-se e as cores sangram umas para as outras no mesmo quadrado!

- **O Byte das Cores (A anatomia do caixote do lixo):**
  Cada byte do `0x5800` dita a cor do azulejo de 8x8. O formato lógico tem 8 slots, sempre nesta ordem:
  `[ Flash ] [ Bright ] [ Paper 2 ] [ Paper 1 ] [ Paper 0 ] [ Ink 2 ] [ Ink 1 ] [ Ink 0 ]`
  - *Flash:* Liga o piscar alucinante (`1`).
  - *Bright:* Dá a cor primária intensa (`1`) ou pálida (`0`).
  - *Paper e Ink:* Usa 3 bits de binário (0 a 7) para o número da cor. (Ex: `010` é Vermelho - Cor 2).

---

## 4. O Atalho do Preguiçoso: Compilar Imagens (`INCBIN`)

Se queres carregar ecrãs gigantes, desenhar em Assembly os bytes hexadecimais de forma manual causaria a destruição de cérebros. A solução real?
Usas um Editor moderno no PC (como o Photoshop ou o Aseprite), exportas uma imagem PNG de 256x192 em modo Indexado (16 cores), e processas com um script de Python as linhas (como o Matt fez) para obteres ficheiros puros de memória: `bitmap.bin` e `colors.bin`.

Finalmente, chamas a majestosa diretiva de montagem (Assembly Directive) que esmaga os binários diretamente no código, chamada `INCBIN`:

```assembly
ecra_grafico:
    incbin "bitmap.bin"     ; Despeja aqui 6 KiloBytes puros de imagem do PC!

ecra_cores:
    incbin "colors.bin"     ; Despeja aqui os 768 Bytes de cor!
    
; Agora basta fazer um LDIR da morada 'ecra_grafico' para a placa de video em '0x4000'!
```
