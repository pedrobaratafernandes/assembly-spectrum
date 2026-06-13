# Magia Negra dos Bits: Lógica e Rotações (ZX Spectrum)

Este documento aborda o tema de **Assembly Z80 para o ZX Spectrum**. O foco deste episódio desce ao nível mais baixo possível: a manipulação de bits individuais dentro dos bytes!

## 1. Lógica Booleana (`AND`, `OR`, `XOR`, `CPL`)

O Z80 tem 4 comandos clássicos que atuam cruzando as "luzinhas" (bits) do teu Acumulador (`A`) com os bits de outro registo. Servem essencialmente para criar "Máscaras".

- **`AND` (Filtro/Apagador):** Compara dois números e o bit resultante só fica aceso (`1`) se **ambos** os bits originais forem 1. 
  - *Truque Mágico:* Se fizeres `AND A`, o valor de A não muda, mas a instrução **apaga a flag de Carry (`C=0`)** automaticamente!
- **`OR` (Pincel/Acendedor):** O bit resultante fica aceso (`1`) se **pelo menos um** dos originais for 1.
- **`XOR` (Exclusivo / Inversor):** O bit resultante só acende se os bits originais forem **diferentes**.
  - *Truque Mágico Mítico:* Fazer `XOR A` (XOR contra si mesmo) obriga todos os bits a ficarem a Zero, porque todos os bits são iguais! É a forma mais rápida do universo Z80 para limpar o Acumulador e colocá-lo a 0.
- **`CPL` (Complemento):** Pega em todos os bits do Acumulador e vira-os do avesso (os 0 viram 1, os 1 viram 0). 

- **Exemplo Prático (Apagar com Máscara):**
  ```assembly
    ld a, 0xFF        ; O 'A' tem todos os bits acesos (11111111)
    and 0x0F          ; Passa a máscara (00001111)
                      ; O 'A' fica com o valor 0x0F (00001111). Os bits de cima foram apagados!
    xor a             ; Coloca imediatamente o 'A' a Zero (00000000). Rápido e eficaz!
  ```

---

## 2. Deslizamento de Bits (Shifts)

Sem um comando nativo de Multiplicar ou Dividir, os programadores Z80 encontraram uma solução mecânica genial: empurrar os bits todos de um byte para a esquerda (Multiplica por 2) ou empurrá-los todos para a direita (Divide por 2).

- **`SLA` (Shift Left Arithmetic):** Desliza os 8 bits para a esquerda. O espaço em branco que fica à direita é preenchido com um Zero (`0`). O bit que caiu da ponta esquerda não se perde: cai dentro da flag de **Carry (`C`)**. Usado para **Multiplicar por 2**.
- **`SRA` (Shift Right Arithmetic):** Desliza para a direita. Para não estragar os números negativos, a ponta esquerda preserva o bit original (sinal). Usado para **Dividir por 2**.
- **`SRL` (Shift Right Logical):** Desliza para a direita, mas preenche sempre a ponta esquerda com Zero (`0`).

---

## 3. A Roda-Gigante dos Bits (Rotates)

E se em vez de empurrares bits para o abismo, eles dessem a volta?
Aqui entram as Rotações (Rotate). Para simplificar a confusão gigantesca destas instruções, vamos usar uma analogia de uma **Roda-Gigante**.

### Rotação Simples: `RL` e `RR`
- *Explicação para Iniciantes:* Imagina uma Roda-Gigante que tem **9 cadeiras**. Oito cadeiras representam o teu byte. A 9ª cadeira é especial e fica no painel de controlo (É a luz de **Carry**). 
  - Quando dás a instrução `RL` (Rotate Left), a roda gira. O gajo que estava na última cadeira do byte salta para a cadeira especial do painel (Carry). O gajo que já estava na cadeira do Carry salta lá de cima para a primeira cadeira do byte. Toda a gente deu a volta em círculo perfeito (incluindo a luz de Carry)!

### Rotação Circular: `RLC` e `RRC`
- *Explicação para Iniciantes:* Esta roda é mais pequena, só tem **8 cadeiras**. 
  - Quando dás a instrução `RLC`, a roda gira. O gajo da última cadeira salta diretamente para a primeira cadeira. No entanto, enquanto ele salta, ele grita para a cadeira especial de **Carry** e ela copia-o (acende ou apaga dependendo de como ele era). O Carry aqui é apenas um clone do bit que deu a volta, e não faz parte da roda!
  - Existem versões super-rápidas que só afetam o Acumulador: `RLCA` e `RRCA`.

---

## 4. Operações de Sniper: Manipular Bits Individuais

As vezes não queremos máscaras gigantes, queremos só olhar e alterar um único bit de um byte. O Z80 tem uma família de comandos especiais para isso (Sniper).

- **`BIT [numero], registo` (Testar):** Testa o estado de um bit (de 0 a 7).
  - *A Grande Rasteira:* A intuição diz-te que se o bit testado for 1, o painel acende a luz de confirmação. **É o oposto!** Se o bit que testaste for ZERO, ele acende a luz de Zero (`Z=1`). Se o bit for UM, ele apaga a luz de Zero (`Z=0`). 
- **`SET [numero], registo` (Ligar):** Força violentamente o bit escolhido a ligar (`1`), sem tocar nos outros ou nas flags.
- **`RES [numero], registo` (Desligar):** Força o bit escolhido a desligar (`0`).

- **Exemplo Prático (Testar o teclado ou botões):**
  ```assembly
    bit 0, a          ; Imagina que a vida do herói (vivo/morto) é guardada no Bit 0
    jr nz, heroi_vivo ; Se a luz Z não acendeu (NZ), significa que o bit estava a 1! Salta!
    
    ; ... (heroi está morto)
    set 0, a          ; Revivemos o herói forçando o Bit 0 a ligar de novo!
  ```
  - *Nota Técnica:* Os comandos `SET` e `RES` são fantásticos, mas lentos. Se estiveres a operar no Acumulador e precisares de muita velocidade, continua a ser mais rápido usar máscaras com `OR` ou `AND`.
