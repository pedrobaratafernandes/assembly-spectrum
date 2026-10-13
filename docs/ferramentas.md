# Preparar o Ambiente de Trabalho

Antes de escrever a primeira linha de assembly, precisamos de três coisas:

1. um **editor de texto** qualquer (VS Code, Notepad++, Vim…), para escrever o código-fonte (`.asm`);
2. o **sjasmplus**, o *assembler* que converte o código-fonte em código máquina do Z80;
3. o **Fuse**, um emulador do ZX Spectrum, para correr o resultado.

O sjasmplus é um *cross-assembler*: corre no PC, mas produz código para o Z80. Além de traduzir as instruções, consegue gerar diretamente um ficheiro de cassete (`.tap`) que o emulador carrega como se fosse uma cassete verdadeira.

## Instalar o sjasmplus

O projeto está em [github.com/z00m128/sjasmplus](https://github.com/z00m128/sjasmplus). Todos os exemplos deste livro foram testados com a versão 1.23.

* **Windows:** descarregue o ficheiro `.zip` da página *Releases* do projeto, extraia `sjasmplus.exe` para uma pasta (por exemplo `C:\sjasmplus`) e acrescente essa pasta à variável de ambiente `PATH`.
* **Linux e macOS:** compile a partir do código-fonte (precisa de `git`, `make` e de um compilador de C++):

```bash
git clone --recursive https://github.com/z00m128/sjasmplus.git
cd sjasmplus
make
sudo make install
```

Para confirmar que ficou instalado:

```bash
sjasmplus --version
```

## Instalar o Fuse

* **Windows e macOS:** descarregue o instalador em [fuse-emulator.sourceforge.net](https://fuse-emulator.sourceforge.net/).
* **Debian/Ubuntu:** `sudo apt install fuse-emulator-gtk spectrum-roms`.

No menu *Machine → Select…* escolha **Spectrum 48K**. É a máquina usada em todos os exemplos, exceto no capítulo sobre o chip de som AY, que precisa de um 128K.

## O Molde de Todos os Programas

Todos os programas completos deste livro seguem o mesmo molde. Aqui está o mais pequeno possível, que mostra um ponto de exclamação no canto inferior direito do ecrã:

```assembly
        DEVICE ZXSPECTRUM48
        ORG 32768
start:
        ld a,2              ; canal 2 = ecrã superior.
        call 5633           ; rotina da ROM que abre o canal.
        ld de,texto         ; DE = endereço do texto.
        ld bc,fimtexto-texto ; BC = número de bytes do texto.
        call 8252           ; rotina da ROM que imprime o texto.
        ret                 ; voltar ao BASIC.
texto:  defb 22,21,31,'!'   ; AT 21,31; "!"
fimtexto:
fim:

; --- Carregador BASIC + ficheiro .tap (igual em todos os exemplos) ---
        ORG 23755
basic:  db 0,10                 ; 10 CLEAR 32767: LOAD "" CODE: RANDOMIZE USR 32768
        dw basic_fim-basic-4
        db $FD,$B0,'"32767":',$EF,'""',$AF,':',$F9,$C0,$B0,'"32768"',13
basic_fim:
        EMPTYTAP "ola.tap"
        SAVETAP  "ola.tap",BASIC,"ola",basic,basic_fim-basic,10
        SAVETAP  "ola.tap",CODE,"ola",start,fim-start
```

Grave o código como `ola.asm` e compile-o:

```bash
sjasmplus ola.asm
```

O sjasmplus cria o ficheiro `ola.tap`. No Fuse, abra-o com *File → Open…*. Com a opção *Options → Media → Auto-load media* ligada (vem ligada por omissão), o emulador escreve `LOAD ""` sozinho e o programa arranca. Quando o programa termina, aparece `0 OK` no fundo do ecrã.

### O que faz cada parte do molde

| Linha | Significado |
| :--- | :--- |
| `DEVICE ZXSPECTRUM48` | Diz ao sjasmplus que simule a memória de um Spectrum 48K. É obrigatório para se poder gerar o `.tap`. |
| `ORG 32768` | O código que se segue será colocado a partir do endereço 32768 (`$8000` em hexadecimal). |
| `start:` / `fim:` | Etiquetas (*labels*). Marcam o início e o fim do código; o tamanho do bloco é `fim-start`. |
| `ret` | Devolve o controlo a quem chamou o programa, neste caso o BASIC. |
| `ORG 23755` … `basic_fim:` | Um pequeno programa em BASIC, já em forma tokenizada (ver abaixo). |
| `EMPTYTAP` | Cria um ficheiro `.tap` vazio. |
| `SAVETAP …,BASIC,…,10` | Grava o programa BASIC na cassete, com arranque automático na linha 10. |
| `SAVETAP …,CODE,…` | Grava o bloco de código máquina, de `start` até `fim`. |

O programa BASIC equivale a escrever no Spectrum:

```basic
10 CLEAR VAL "32767": LOAD "" CODE: RANDOMIZE USR VAL "32768"
```

* `CLEAR 32767` reserva a memória a partir de 32768 para o nosso código, para que o BASIC não a use.
* `LOAD "" CODE` carrega o bloco seguinte da cassete (o nosso código) para o endereço onde foi gravado.
* `RANDOMIZE USR 32768` salta para o endereço 32768, ou seja, para `start`.

Os bytes `$FD`, `$B0`, `$EF`, `$AF`, `$F9` e `$C0` são os códigos (*tokens*) das palavras `CLEAR`, `VAL`, `LOAD`, `CODE`, `RANDOMIZE` e `USR`. O `VAL "32767"` em vez de `32767` é um truque clássico: um número escrito diretamente numa linha de BASIC é guardado com mais 6 bytes escondidos (a sua forma binária). Com `VAL` e uma string, esses bytes não são precisos.

O endereço `ORG 23755` não tem importância para o resultado. O bloco BASIC é apenas copiado para a cassete, e o Spectrum coloca-o no sítio certo quando o carrega.

### Porque não usamos ficheiros `.sna`

O sjasmplus também consegue gravar *snapshots* (`SAVESNA`). No entanto, o *snapshot* de 48K que gera arranca com as interrupções desligadas. Isso faz com que qualquer programa que use a instrução `halt` (e quase todos os jogos usam) fique parado para sempre. O ficheiro `.tap` com o carregador BASIC reproduz o que acontecia numa máquina verdadeira e não tem esse problema.

## Regras Práticas

* **Texto só em ASCII.** O Spectrum não conhece letras acentuadas. Um "é" dentro de uma string é gravado pelo editor como dois bytes (UTF-8), que o Spectrum interpreta como palavras-chave do BASIC. Por isso, nas strings que vão aparecer no ecrã, escreva "e" em vez de "é".
* **Números.** O sjasmplus aceita decimal (`32768`), hexadecimal (`$8000`, `#8000` ou `0x8000`) e binário (`%10000000`).
* **Etiquetas** começam na primeira coluna e podem terminar em `:`. As instruções levam pelo menos um espaço antes.
* **Comentários** começam com `;` e vão até ao fim da linha.
* **Voltar ao BASIC.** Um programa pode terminar com `ret` desde que não tenha estragado o registo `IY` nem o registo alternativo `HL'` (o BASIC precisa deles), e desde que a pilha esteja como estava no início. Os jogos normalmente nunca voltam ao BASIC.
* **Fragmentos.** Nem todas as listagens deste livro são programas completos. As que não começam com `DEVICE ZXSPECTRUM48` são rotinas para incluir num programa maior e não se compilam sozinhas.
