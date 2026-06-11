# Escrever Jogos para o ZX Spectrum

Tradução e adaptação para Português de Portugal (PT-PT) do aclamado livro **"How to Write ZX Spectrum Games"** de Jonathan Cauldwell. 

Este repositório contém os capítulos traduzidos estruturados em Markdown e configurados como um site de documentação estática gerado com o **MkDocs**. Além disso, todos os blocos de código Z80 Assembly foram adaptados para serem totalmente compatíveis com o compilador moderno **sjasmplus**, incluindo carregadores BASIC automáticos (`.tap`) e instantâneos (`.sna`).

A documentação online está publicada em:
**[https://pedrobaratafernandes.github.io/assembly-spectrum/](https://pedrobaratafernandes.github.io/assembly-spectrum/)**

---

## Ferramentas Principais

1. **sjasmplus**: Compilador cruzado (*cross-assembler*) moderno para o processador Z80, usado para compilar os códigos do livro.
2. **Fuse (Free Unix Spectrum Emulator)**: Emulador fiel do ZX Spectrum para testar os ficheiros gerados (`.tap` / `.sna`).
3. **Ollama**: Servidor de modelos LLM local utilizado pelo Chatbot integrado na documentação para dar assistência em tempo real.

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

Os exemplos de código máquina presentes nos capítulos estão prontos para compilar. Exemplo de compilação:

```bash
sjasmplus docs/codigo/capitulo1_exemplo.asm
```
Isto gerará automaticamente os ficheiros `.tap` e `.sna` prontos a arrastar para o emulador Fuse.
