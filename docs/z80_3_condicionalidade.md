# Condicionalidade no Z80: Como o Processador Toma Decisões (ZX Spectrum)

Este documento resume o quarto episódio do tutorial de **Assembly Z80 para o ZX Spectrum**, pelo Matt Heffernan. O foco deste episódio é desvendar como a arquitetura do processador lida com testes lógicos e condições matemáticas para implementar fluxos de código (como os famosos `If/Else` e `While loops` das linguagens modernas).

## 1. O Painel de Instrumentos: O Registo `F` (Flags)
Toda a tomada de decisão no Z80 baseia-se num único registo de 8 bits chamado `F` (Flags / Estado). Ele atua como um painel de avisos do processador. Certas operações matemáticas (ou comandos específicos) acendem ou apagam as luzes (bits) deste registo de forma automática.

As luzes (Flags) mais importantes para nós são:
- **`Z` (Zero):** Acende (fica a 1) se o resultado da última conta matemática ou decremente/incremento for **Zero**.
- **`C` (Carry):** Acende se uma conta matemática ultrapassou o limite do espaço (ex: tentar somar de forma a passar de 255 num registo de 8 bits) ou se o valor for menor numa comparação.
- **`S` (Sign / Sinal):** Acende se o resultado for um número negativo (o bit mais significativo do resultado for 1).
- **`P/V` (Parity / Overflow):** Usado para detetar quebras de sinal (Overflow) numa matemática avançada ou contar se os bits pares são paridade par/ímpar.

Para mandar o computador saltar ou tomar decisões, usamos **Mnemónicas de Condição** agregadas aos comandos de salto:
- **`Z` / `NZ`**: Salta se for Zero / Não Zero (Equal / Not Equal).
- **`C` / `NC`**: Salta se houver Carry / Não Carry.
- **`M` / `P`**: Salta se Menos (Negativo) / Plus (Positivo).
- **`PE` / `PO`**: Salta se Parity Even / Parity Odd.

---

## 2. A Arte de Tomar Decisões: O Comando `CP` (Compare)
Para fazermos um `If`, precisamos de testar valores. O comando `CP` (Compare) permite-nos comparar um número com o valor atual do Acumulador (`A`) **sem destruir o valor de A**. Ele internamente faz uma subtração matemática só de faz de conta para atualizar o painel de luzes `F`.

- **Exemplo Prático:**
  ```assembly
    ld a, 40          ; A vida do nosso herói é 40
    cp 42             ; Compara a vida com o número mágico 42
    jr c, pouca_vida  ; Se acendeu a luz de Carry (A < 42), salta para o alarme!
    jr z, vida_exata  ; Se acendeu a luz Zero (A == 42), salta para outra rotina
  ```
  - *Explicação para Iniciantes:* A instrução `CP` é como um fiscal que põe as duas caixas numa balança, vê quem é mais pesada, acende as luzes de aviso do painel do computador e vai-se embora sem estragar nada. 
  Se as duas caixas forem idênticas (`A` for 42), a balança marca "Zero" diferença, acendendo a luz `Z`.
  Se a primeira caixa for mais leve que a segunda (`A` for menor que 42), não há peso suficiente, e acende-se a luz do `C` (Carry / Vai-um). Usamos logo a seguir comandos `JR` ("Jump Relative" condicional) que olham para o painel de luzes e saltam as linhas de código com base no que virem aceso.

---

## 3. Saltos Condicionais e a Otimização de T-States (`JP` vs `JR`)
Em Assembly tens duas grandes formas de saltar para outras partes do código: o Jump Absoluto (`JP`) e o Jump Relativo (`JR`). Qual deves usar? A resposta está nos **T-States** (os ciclos do processador). O Z80 do Spectrum roda a 3.5 MHz (3.5 milhões de ciclos por segundo).

- **O Todo-Poderoso `JP` (Salto Longo):** Pode saltar para qualquer posição da memória e avaliar todas as condições. Demora **sempre 10 ciclos (T-States)** a executar, quer o salto aconteça quer não.
- **O Ágil `JR` (Salto Curto):** Ocupa menos espaço na memória, mas só verifica as luzes de `Z/NZ` e `C/NC`. Em termos de velocidade, ele tem um truque escondido:
  - Se a condição do salto **falhar** (não saltar), ele demora **apenas 7 ciclos** (super rápido!).
  - Se o salto **acontecer**, ele tem de calcular o destino e demora **12 ciclos** (mais lento que o `JP`!).

> **Onde usar?** Para ciclos (`loops`) onde vais testar uma condição repetidamente, o `JR` é o rei! Imagina um loop repetido 100 vezes: em 99 dessas vezes não saltas porque não chegaste ao fim (apenas 7 ciclos de custo), e só saltas 1 vez no final (12 ciclos). Poupas imenso tempo em relação ao `JP` que custaria sempre 10 ciclos!

- **Exemplo Prático:**
  ```assembly
    jp m, valor_negativo ; Salta para uma subrotina longe se a conta deu número negativo
  ```
  - *Explicação para Iniciantes:* Se tiveres de mandar o computador virar na próxima rua (perto), usas o comando `JR`. Se a estrada obrigar a avaliar condições exóticas ou precisares de viajar para a outra ponta do país, usas um autocarro maior `JP`. O `JR` é o carro ágil da cidade!

---

## 4. Retornos Condicionais (`RET`)
Nós já vimos que para sair de uma sub-rotina usamos `RET` para devolver o controlo ao código principal. A magia do Z80 é que também podemos atrelar condições às "portas de saída".

- **Exemplo Prático:**
  ```assembly
  verifica_inimigo:
    cp 0              ; O inimigo tem 0 vida?
    ret z             ; Se Zero for verdade, baza logo daqui (regressa)!
    dec a             ; Caso contrário (se não regressou), tira-lhe mais vida...
    ret               ; Regresso final normal
  ```
  - *Explicação para Iniciantes:* Numa linguagem moderna (como Python ou C), isto seria o equivalente a escreveres `if vida == 0: return`. Em vez de complicarmos a vida com saltos para o fundo do código, simplesmente dizemos "Se a luz Z acender, sai imediatamente desta sala e volta a quem te chamou. Caso contrário, ignora a instrução de saída e continua a ler a linha seguinte".

---

## 5. O Ciclo Supremo: `DJNZ`
Fazer ciclos (`for loops`) é tão comum que os desenhadores do Z80 criaram um comando brutal com um nome enorme: `Decrement and Jump if Not Zero` (`DJNZ`).
Ele subtrai automaticamente 1 ao registo `B` e, se o `B` não chegar a Zero, ele salta. Incrivelmente, ele faz isto nos bastidores **sem afetar as luzes de aviso do Registo F**! 

- **Exemplo Prático:**
  ```assembly
    ld b, 5           ; Vamos repetir o ciclo 5 vezes
  meu_ciclo:
    sla a             ; Desloca os bits do Acumulador para a esquerda (Matemática)
    djnz meu_ciclo    ; Subtrai 1 ao B. Se o B não for zero, volta à etiqueta 'meu_ciclo'
  ```
  - *Explicação para Iniciantes:* Em vez de gastarmos memória a mandar o computador fazer a matemática de subtrair `-1` e testar a luz do Zero, o comando `DJNZ` é uma autêntica máquina de lavar com temporizador. Dás-lhe o número de lavagens (no registo B) e a cada ciclo ele conta mentalmente para trás e repete a tarefa sozinho até acabar, sem acender luzes no painel que possam interferir com a matemática importante que estás a fazer lá dentro (neste caso, a instrução `SLA`).

---

## 6. Lógica Complexa (If-Else) num Piscar de Olhos
Juntando o poder do `CP`, com as luzes do `C` e do `Z` e os retornos condicionais, conseguimos replicar perfeitamente a estrutura de um `if-else` tradicional numa linguagem de alto-nível.

Se quisermos que a variável no Acumulador normalize para o número exato 42 (se for menor sobe 1, se for maior desce 1):
```assembly
normaliza_para_42:
    cp 42             ; Testa o valor no Acumulador contra o número 42
    ret z             ; Se a luz Z acendeu (é exatamente 42), baza, trabalho feito!
    jr nc, muito_alto ; Se a luz C NÃO acendeu (Significa que A é maior que 42), salta!

muito_baixo:
    inc a             ; Se o código não saltou lá em cima, é porque o valor é menor que 42
    ret               ; Sobe o valor e regressa
    
muito_alto:
    dec a             ; Esta é a porta de aterragem do salto "jr nc".
    ret               ; Baixa o valor e regressa
```
Este fluxo lógico elegante e contínuo é o que torna o Assembly do Z80 incrivelmente denso e eficiente. É pura arte em código máquina!

---

## 7. Errata do Episódio 4: Controlo Manual da Flag de Carry
No processador Z80, há momentos em que precisamos de ligar ou desligar explicitamente a luz de *Carry* (`C`) no painel de controlo. O vídeo original continha algumas imprecisões que foram corrigidas na **Errata oficial**:

- **Ligar o Carry (`SCF`):** Significa *Set Carry Flag*. Apenas acende a luz do Carry (`C=1`) independentemente de tudo o resto. (Nota técnica: também desliga as luzes H e N do painel).
- **O Mito do `CCF`:** Muitas pessoas pensam que significa *Clear Carry Flag* (Desligar Carry), mas isso é **falso**! Na verdade, significa **Complement Carry Flag** (Inverter o Carry). Se a luz estiver acesa, ele desliga-a. Se estiver desligada, ele acende-a. Funciona como um interruptor de parede!

- **Exemplo Prático:**
  ```assembly
    scf               ; Força a luz do Carry a acender (Fica a 1)
    ccf               ; Inverte a luz! Como estava a 1, agora desliga (Fica a 0)
    ccf               ; Inverte de novo! Volta a acender a luz do Carry.
  ```
  - *Explicação para Iniciantes:* O comando `SCF` é como carregares no botão "ON" do comando da TV. Já o comando `CCF` é como bateres com a mão num interruptor que alterna a luz: se a sala estava às escuras, fica clara; se estava clara, fica às escuras.

**Dica de Mestre:** Se o `CCF` não serve para apagar com segurança o *Carry* (porque não sabes o estado anterior da luz), como fazes para ter a certeza que o *Carry* fica garantidamente apagado? Usas a operação matemática lógica:
```assembly
  or a                ; O truque universal para forçar o Carry a Zero!
```
