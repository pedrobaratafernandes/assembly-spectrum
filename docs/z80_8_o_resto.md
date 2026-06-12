# As Sobras Mágicas do Z80: NOPs, BCD e Pesquisas

Este documento resume o nono episódio do tutorial de **Assembly Z80 para o ZX Spectrum**, criado pelo Matt Heffernan. Com este episódio fechamos as instruções de código máquina do Z80, focando-nos nos comandos órfãos que não têm categoria mas são vitais!

## 1. A Arte de Fazer Nada (`NOP` e `HALT`)

Às vezes, a melhor coisa que o computador tem a fazer é esperar e não estragar nada. 

- **`NOP` (No Operation):** O famoso comando que não faz rigorosamente nada (nem sequer altera *flags*). Mas demora tempo! Gasta exatamente 4 ciclos (T-States), ou seja, um pouco mais que **1 microsegundo**. 
  - *Para que serve?* Para criar atrasos calculados (quando queres que algo espere milissegundos antes de agir) ou para apagar buracos de memória.
- **`HALT` (Parar e Esperar):** Uma pausa gigante. O processador "congela" o teu programa e fica à espera que o Hardware lá fora apite (uma Interrupção).
  - *Para que serve?* No Spectrum, a placa de televisão grita a cada 1/50 segundos (Frame rate de 50hz) para dizer "vou desenhar o ecrã agora". Pões o `HALT` no teu jogo para ele correr a perfeitos 50 FPS sem soluços!

---

## 2. A Magia Matemática do `DAA`

O Z80 não tem o famoso "Decimal Mode" do 6502. Ou seja, ele só sabe Matemática Hexadecimal. Se quiseres contar de 1 a 10 no ecrã e somares `09 + 01`, ele responde `0A`!

- **`DAA` (Decimal Adjust Accumulator):** É a varinha mágica que converte a resposta para Base 10. Para que ela funcione, deves usar a instrução `DAA` **exatamente na linha abaixo** da tua adição ou subtração!

- **Exemplo Prático (Somar de Forma Humana):**
  ```assembly
    ld a, 0x09      ; 'A' tem o valor 9
    add a, 0x01     ; Somamos 1. O Z80 guarda 0x0A no 'A'
    daa             ; Magia Negra: Ele usa o Half-Carry secreto e transforma o 0x0A em 0x10!
                    ; (0x10 em Hexadecimal quando impresso no ecrã como BCD lê-se '10' Decimal!)
  ```

---

## 3. O Motor de Pesquisa Interno (`CPIR` e `CPDR`)

Se quiseres procurar a letra "Z" num texto gigante de 4 KB na memória, tens de criar um Loop manual: testar byte, incrementar endereço, decrementar contador, saltar para o inicio. Demora uma eternidade.
Ou podes simplesmente usar o Motor Pisteiro interno do Z80!

- **`CPIR` (Compare, Increment, Repeat):** Faz uma busca automática para a Frente.
- **`CPDR` (Compare, Decrement, Repeat):** Faz uma busca automática para Trás.

Os preparativos exigem sempre as 3 mesmas variáveis:
- **`HL`** = A morada onde a busca começa.
- **`BC`** = Quantos bytes no máximo vamos caminhar (Tamanho limite).
- **`A`** = O "cheiro" do nosso alvo (O byte ou a letra que queremos encontrar).

- *Explicação para Iniciantes (O Cão Pisteiro):* Imagina que o `CPIR` é um cão. Dás-lhe a morada da casa para entrar (`HL`). Pões-lhe a trela com os metros máximos que ele pode andar (`BC`) e dás-lhe a cheirar o alvo (`A`). O cão corre furiosamente sozinho a verificar tudo e só pára se o rasto acabar (`BC = 0`) ou se encontrar o alvo!
  - **A Grande Rasteira:** O cão avança tão rápido que só pára 1 quadrado à frente do alvo! Portanto, se o alvo for encontrado, a morada `HL` será o `Alvo + 1`. Tens de fazer um `DEC HL` (dar um passo atrás) para apanhares a tua presa.

- **Exemplo Prático:**
  ```assembly
    ld hl, 0x8000   ; O cão começa no endereço 0x8000
    ld bc, 1000     ; A trela tem 1000 bytes de tamanho
    ld a, 0x00      ; Dá-lhe a cheirar o código NOP (Zero)
    
    cpir            ; SOLTEM OS CÃES! O processador congela e procura à velocidade da luz.
    
    ; Quando a próxima linha de código correr, o cão já parou!
    dec hl          ; Dá um passinho atrás para apanhar o NOP, porque o cão parou em HL+1.
  ```

---

## 4. O Sistema Nervoso do Spectrum (`IM`, `EI`, `DI`)

Por último, temos as chaves do sistema de alarme de Hardware, as interrupções.

- **`EI` (Enable Interrupts):** Ligar os Alarmes (O CPU pode ser interrompido para avisos vitais da Televisão ou do Teclado).
- **`DI` (Disable Interrupts):** Desligar os Alarmes (Estás a fazer código ultra sensível de matemática temporal e precisas de ignorar tudo e não ser chateado por nada).
- **`IM` (Interrupt Mode):** O Z80 tem 3 modos de Interrupção.
  - *Modo 0*: Não suportado no Spectrum, não o uses.
  - *Modo 1*: O normal do Spectrum. Sempre que a TV pisca, o CPU salta logo para a morada de ROM `0x0038`.
  - *Modo 2*: O Modo Caótico (será falado num futuro episódio). Permite criares os teus próprios alarmes e funções.
