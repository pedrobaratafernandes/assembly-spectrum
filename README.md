# Escrever Jogos para o ZX Spectrum
Guia em Português de Portugal (PT-PT) sobre como escrever jogos para o ZX Spectrum. 

O livro tem duas partes: uma introdução ao assembly do Z80 e uma tradução adaptada de *How to Write ZX Spectrum Games*, de Jonathan Cauldwell. Está escrito em Markdown e é publicado como um site estático gerado com o **MkDocs**. Todos os programas completos compilam com o **sjasmplus** e geram um ficheiro `.tap` com carregador BASIC, pronto a abrir no emulador.

A documentação online está publicada em:
**[https://pedrobaratafernandes.github.io/assembly-spectrum/](https://pedrobaratafernandes.github.io/assembly-spectrum/)**

---

## Ferramentas Principais

1. **sjasmplus**: Compilador cruzado (*cross-assembler*) moderno para o processador Z80, usado para compilar os códigos deste guia.
2. **Fuse (Free Unix Spectrum Emulator)**: Emulador do ZX Spectrum para testar os ficheiros `.tap` gerados.
3. **Ollama**: Servidor de modelos LLM local utilizado pelo Chatbot integrado na documentação para dar assistência em tempo real.

---

## Inteligência Artificial Utilizada

Este livro foi escrito com o apoio de assistentes de inteligência artificial:

* **Gemini** (Google)
* **Claude** (Anthropic)

---

## Como Correr Localmente (MkDocs)

Para ler a documentação e correr o servidor local de desenvolvimento, siga estes passos:

1. **Criar e Ativar o Ambiente Virtual:**
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```

2. **Instalar Dependências:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Iniciar o Servidor de Desenvolvimento:**
   ```bash
   mkdocs serve
   ```
   Abra o seu browser em **[http://localhost:8000](http://localhost:8000)**.

4. **Compilar para Produção (Estático):**
   ```bash
   mkdocs build
   ```
   Os ficheiros HTML estáticos serão gerados na pasta `site/`.

---

## Chatbot com Integração Ollama Local

O site inclui um chatbot flutuante no canto inferior direito para ajudar com dúvidas sobre Z80, rotinas da ROM e sjasmplus. Comunica diretamente com a sua instância do **Ollama** local.

### Como Ativar:
1. Certifique-se de que tem o **Ollama** a correr no seu computador.
2. Certifique-se de que tem o modelo desejado instalado (exemplo: `deepseek-r1:1.5b` ou `qwen2.5`):
   ```bash
   ollama pull deepseek-r1:1.5b
   ```
3. Inicie o Ollama no seu terminal permitindo conexões CORS a partir do browser:
   ```bash
   OLLAMA_ORIGINS="*" ollama serve
   ```
4. Abra as definições do Chatbot (ícone de engrenagem) no site, selecione/introduza o link do servidor (`http://localhost:11434`) e o nome do modelo (`deepseek-r1:1.5b`).

---

## Como Compilar os Programas Z80

Cada listagem completa do livro (as que começam com `DEVICE ZXSPECTRUM48`) é um programa independente. Copie-a para um ficheiro, por exemplo `exemplo.asm`, e compile:

```bash
sjasmplus exemplo.asm
```

O sjasmplus cria um ficheiro `.tap` com o nome indicado na diretiva `EMPTYTAP` da listagem. Abra-o no Fuse (*File → Open*) e o programa carrega e arranca sozinho. O capítulo [Preparar o Ambiente](docs/ferramentas.md) explica o molde dos programas e porque não se usam ficheiros `.sna`.
