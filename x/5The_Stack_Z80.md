# A Pilha de Memória (The Stack) no Z80 (ZX Spectrum)

Este documento aborda o tema de **Assembly Z80 para o ZX Spectrum**. O foco deste episódio é a *Stack* (Pilha), uma zona especial da memória gerida automaticamente pelo processador e fundamental para o funcionamento de qualquer programa.

## 1. O que é a Stack?

A Stack é uma área reservada na memória RAM que funciona com a regra de "O Último a Entrar é o Primeiro a Sair" (em inglês, LIFO - *Last In, First Out*).

Para controlar onde a Stack está, o Z80 usa um registo especial de 16-bits chamado **`SP` (Stack Pointer)**.
- O `SP` aponta sempre para o "topo da pilha".
- Ao contrário do que a intuição dita, **a Stack cresce de cima para baixo**. No ZX Spectrum 48K, a Stack costuma começar no último endereço da RAM (`0xFFFF`) e vai crescendo em direção aos endereços mais baixos.

- *Explicação para Iniciantes:* Imagina a Stack como uma **Pilha de Pratos** num restaurante. Quando o empregado traz um prato limpo, ele coloca-o no **topo** da pilha. Quando o cozinheiro precisa de um prato, ele tira obrigatoriamente o prato que está no **topo**. O primeiro prato a ter sido colocado na pilha vai ficar preso lá no fundo e será o último a ser usado!

---

## 2. Guardar e Recuperar: `PUSH` e `POP`

Para mexeres na Stack, tens dois comandos sagrados que operam sempre aos pares e sempre com valores de 16-bits (2 bytes). 

- **`PUSH`:** Pega num registo de 16-bits e "empurra-o" para o topo da pilha.
  - *Como funciona:* O processador subtrai automaticamente 2 ao `SP` e escreve o valor nessa morada da RAM.
- **`POP`:** Vai ao topo da pilha, "saca" o valor que lá estiver e mete-o num registo.
  - *Como funciona:* O processador lê a RAM onde o `SP` aponta, escreve no registo e depois soma 2 ao `SP` para descer a pilha.

- **Exemplo Prático:**
  ```assembly
    ld bc, 100        ; Uma variável super importante no BC
    push bc           ; Guarda os dados na Stack para não os perder!
    
    ld bc, 50         ; Destrói o BC com outros dados inúteis
    
    pop bc            ; Recupera o valor sagrado (100) que estava na Stack de volta para o BC!
  ```

> [!WARNING]
> **A Regra de Ouro:** "Tudo o que sobe, tem de descer". Por cada `PUSH` que fazes, tens **obrigatoriamente** de ter um `POP` correspondente antes de acabares o bloco de código. Se te esqueceres de fazer `POP` a um valor, vais deixar um prato a mais na pilha e o teu computador vai bloquear (crash) instantaneamente!

---

## 3. Piloto Automático: `CALL`, `RST` e `RET`

Tu usas a Stack manualmente com o `PUSH` e o `POP`. No entanto, o Z80 usa a Stack nas tuas costas sem te dizer nada! Quando usas o comando de "salto para subrotina" (`CALL`), o processador precisa de saber como voltar ao sítio original quando acabar. Como ele decora o caminho? **Usando a Stack!**

- **`CALL`**: Quando dás a instrução `CALL rotina`, o processador pega no "Endereço da Linha de Código Onde Ele Estava" e faz um `PUSH` escondido desse endereço para a Stack. Depois, salta para a rotina.
- **`RET`**: A instrução de "Regresso" pura e simplesmente faz um `POP` escondido, tira esse endereço do topo da pilha, e obriga o processador a saltar de volta para lá!
- **`RST` (Restart)**: É uma versão ultra-rápida do `CALL` (ocupa só 1 byte) mas só te deixa saltar para locais fixos da ROM. O seu uso da Stack é idêntico ao do `CALL`.

---

## 4. Truques de Mestre e *Stack Hacks*

A arquitetura do Z80 permite abusar das mecânicas da Stack para ganhar velocidade impressionante.

### O Troca-Tintas: `EX (SP), HL`
Este é um dos comandos mais poderosos do Z80. Ele pega no valor atual do registo `HL` e **troca-o fisicamente** com os dois bytes que estão no topo da Stack. Não há `POP` nem `PUSH`! O prato que estava no topo da pilha é trocado por outro na mão do empregado à velocidade da luz.
É usado frequentemente para recuperar endereços sem estragar registos!

### Velocidade Furiosa: O Hack do Ecrã
Escrever no ecrã ponto-a-ponto com `LD (HL), A` demora o seu tempo. Mas há um hack assombroso: Se nós **mentirmos** ao computador e mudarmos a morada do `SP` para apontar para a memória do Ecrã, o comando `PUSH` vai escrever no ecrã dois blocos gigantes de pixels de cada vez a uma velocidade astronómica!

- **Exemplo Prático (O Hack):**
  ```assembly
    ld (sp_backup), sp ; 1. Guarda a morada verdadeira da Stack para não crashar!
    
    ld sp, 0x5800      ; 2. Aponta a Stack para o Ecrã (Cores do ZX Spectrum)
    ld de, 0x2A2A      ; 3. Prepara a cor "Tintas Vermelhas e Fundo Ciano"
    
    push de            ; BUM! Desenhou 2 blocos de cores instantaneamente!
    push de            ; BUM! Mais dois blocos gigantes... (repetes as vezes que quiseres)
    
    ld sp, (sp_backup) ; 4. Põe a Stack de volta no sítio original como se nada fosse!
  ```
  - *Explicação para Iniciantes:* Isto é o equivalente a dizer ao cozinheiro que a "Pilha de Pratos" dele agora é na mesa dos clientes. Quando ele arruma pratos velozmente (o `PUSH`), ele está na verdade a espetar-lhes a comida na cara a uma velocidade brutal! Desde que te lembres de voltar a pôr a pilha na cozinha no final (com a variável de *backup*), tudo corre bem!
