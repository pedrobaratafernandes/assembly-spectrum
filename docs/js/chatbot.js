// Floating Chatbot JS Logic
document.addEventListener("DOMContentLoaded", function () {
    // Inject Chatbot HTML Structure
    const chatbotHtml = `
        <div id="chatbot-container">
            <button id="chatbot-button" aria-label="Abrir assistente">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
            </button>
            <div id="chatbot-window">
                <div class="chatbot-header">
                    <div class="chatbot-header-info">
                        <div class="chatbot-avatar">ZX</div>
                        <div class="chatbot-title">
                            <h4>Assistente Spectrum</h4>
                            <span>Ollama Local Assistant</span>
                        </div>
                    </div>
                    <div class="chatbot-header-actions">
                        <button id="chatbot-toggle-settings" class="chatbot-header-btn" title="Configurar Ollama">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="3"></circle>
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l-.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                            </svg>
                        </button>
                        <button id="chatbot-close" class="chatbot-header-btn" title="Fechar">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                </div>
                
                <div id="chatbot-settings">
                    <div class="settings-group">
                        <label for="chatbot-ollama-url">URL do Servidor Ollama:</label>
                        <input type="text" id="chatbot-ollama-url" placeholder="http://localhost:11434">
                    </div>
                    <div class="settings-group">
                        <label for="chatbot-ollama-model">Modelo (ex: deepseek-r1:1.5b):</label>
                        <input type="text" id="chatbot-ollama-model" placeholder="deepseek-r1:1.5b">
                    </div>
                    <div class="settings-group">
                        <button id="chatbot-save-settings">Guardar Configuração</button>
                    </div>
                </div>

                <div class="chatbot-messages" id="chatbot-messages-list">
                    <!-- Dynamic Messages will load here -->
                </div>

                <div class="chatbot-input-bar">
                    <input type="text" id="chatbot-input-field" placeholder="Pergunte-me algo sobre Z80 ou ZX Spectrum...">
                    <button class="chatbot-send-btn" id="chatbot-send-btn" aria-label="Enviar mensagem">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13"></line>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    `;

    // Append to body
    const body = document.querySelector("body");
    if (body) {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = chatbotHtml.trim();
        body.appendChild(tempDiv.firstChild);
    }

    // Grab elements
    const chatbotButton = document.getElementById("chatbot-button");
    const chatbotWindow = document.getElementById("chatbot-window");
    const chatbotClose = document.getElementById("chatbot-close");
    const chatbotToggleSettings = document.getElementById("chatbot-toggle-settings");
    const chatbotSettings = document.getElementById("chatbot-settings");
    const chatbotOllamaUrl = document.getElementById("chatbot-ollama-url");
    const chatbotOllamaModel = document.getElementById("chatbot-ollama-model");
    const chatbotSaveSettings = document.getElementById("chatbot-save-settings");
    const chatbotMessagesList = document.getElementById("chatbot-messages-list");
    const chatbotInputField = document.getElementById("chatbot-input-field");
    const chatbotSendBtn = document.getElementById("chatbot-send-btn");

    // Load saved settings
    let savedUrl = localStorage.getItem("ollama_url") || "http://localhost:11434";
    let savedModel = localStorage.getItem("ollama_model") || "deepseek-r1:1.5b";
    
    chatbotOllamaUrl.value = savedUrl;
    chatbotOllamaModel.value = savedModel;

    // Toggle Chat Panel
    chatbotButton.addEventListener("click", function () {
        chatbotWindow.classList.toggle("open");
        if (chatbotWindow.classList.contains("open") && chatbotMessagesList.children.length === 0) {
            sendWelcomeMessage();
        }
    });

    chatbotClose.addEventListener("click", function () {
        chatbotWindow.classList.remove("open");
    });

    // Toggle Settings Panel
    chatbotToggleSettings.addEventListener("click", function () {
        chatbotSettings.classList.toggle("open");
    });

    // Save Settings
    chatbotSaveSettings.addEventListener("click", function () {
        const url = chatbotOllamaUrl.value.trim() || "http://localhost:11434";
        const model = chatbotOllamaModel.value.trim() || "deepseek-r1:1.5b";
        
        localStorage.setItem("ollama_url", url);
        localStorage.setItem("ollama_model", model);
        
        savedUrl = url;
        savedModel = model;
        
        chatbotSettings.classList.remove("open");
        appendBotMessage(`Configuração guardada! Conectando ao Ollama em ${url} usando o modelo ${model}.`);
    });

    // Send Message Actions
    chatbotSendBtn.addEventListener("click", handleSendMessage);
    chatbotInputField.addEventListener("keypress", function (e) {
        if (e.key === "Enter") {
            handleSendMessage();
        }
    });

    function appendMessage(sender, text) {
        const msgWrapper = document.createElement("div");
        msgWrapper.className = `chatbot-msg-wrapper ${sender}`;
        
        const bubble = document.createElement("div");
        bubble.className = "chatbot-msg-bubble";
        bubble.innerText = text;

        const time = document.createElement("div");
        time.className = "chatbot-msg-time";
        const now = new Date();
        time.innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        msgWrapper.appendChild(bubble);
        msgWrapper.appendChild(time);
        chatbotMessagesList.appendChild(msgWrapper);
        chatbotMessagesList.scrollTop = chatbotMessagesList.scrollHeight;
    }

    function appendUserMessage(text) {
        appendMessage("user", text);
    }

    function appendBotMessage(text) {
        appendMessage("bot", text);
    }

    function sendWelcomeMessage() {
        appendBotMessage("Olá! Sou o seu assistente local de programação para o ZX Spectrum. Posso ajudá-lo com rotinas da ROM, opcodes Z80, portas ou sjasmplus.");
        appendBotMessage(`Estou configurado para comunicar localmente com o Ollama em:\n- URL: ${savedUrl}\n- Modelo: ${savedModel}\n\nSe quiser alterar estes valores, clique no botão de engrenagem no topo.`);
        appendBotMessage("Importante: Certifique-se de que tem o Ollama a correr no seu computador e que o iniciou permitindo CORS. Em Linux/macOS, lance o terminal com:\nOLLAMA_ORIGINS=\"*\" ollama serve");
    }

    function showTypingIndicator() {
        const indicator = document.createElement("div");
        indicator.id = "chatbot-typing-indicator";
        indicator.className = "chatbot-msg-wrapper bot";
        
        const bubble = document.createElement("div");
        bubble.className = "chatbot-msg-bubble";
        
        const typing = document.createElement("div");
        typing.className = "chatbot-typing";
        typing.innerHTML = `
            <div class="chatbot-dot"></div>
            <div class="chatbot-dot"></div>
            <div class="chatbot-dot"></div>
        `;
        
        bubble.appendChild(typing);
        indicator.appendChild(bubble);
        chatbotMessagesList.appendChild(indicator);
        chatbotMessagesList.scrollTop = chatbotMessagesList.scrollHeight;
    }

    function removeTypingIndicator() {
        const indicator = document.getElementById("chatbot-typing-indicator");
        if (indicator) {
            indicator.remove();
        }
    }

    function handleSendMessage() {
        const text = chatbotInputField.value.trim();
        if (!text) return;

        appendUserMessage(text);
        chatbotInputField.value = "";
        showTypingIndicator();

        callOllama(text);
    }

    function callOllama(userPrompt) {
        const endpoint = `${savedUrl}/api/chat`;
        
        // Grab the main text content of the active documentation page
        const mainContentEl = document.querySelector('div[role="main"]') || document.querySelector('article') || document.body;
        const pageContext = mainContentEl ? mainContentEl.innerText.slice(0, 10000) : ""; // Limit to 10k chars to avoid context overflow

        const systemContent = `És um assistente especialista em programação do ZX Spectrum, processador Z80, linguagem assembly e compilador sjasmplus. Responde sempre de forma clara, directa, amigável e em português de Portugal (PT-PT).

Aqui está o contexto da página do livro que o utilizador está a ler atualmente (podes usar esta informação para responder a dúvidas de código ou explicações contidas na página):
---
${pageContext}
---`;
        
        const payload = {
            model: savedModel,
            messages: [
                {
                    role: "system",
                    content: systemContent
                },
                {
                    role: "user",
                    content: userPrompt
                }
            ],
            stream: false
        };

        fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro HTTP (${response.status})`);
            }
            return response.json();
        })
        .then(data => {
            removeTypingIndicator();
            if (data.message && data.message.content) {
                let reply = data.message.content.trim();
                // Strip reasoning tags if using deepseek-r1 to make the UI look cleaner
                reply = reply.replace(/<think>[\s\S]*?<\/think>\s*/g, "");
                appendBotMessage(reply);
            } else {
                appendBotMessage("Recebi uma resposta inesperada do Ollama.");
            }
        })
        .catch(err => {
            removeTypingIndicator();
            appendBotMessage(`Não consegui ligar ao Ollama. Detalhe: ${err.message}.\n\nCertifique-se de que:\n1. O Ollama está a correr no seu computador.\n2. O modelo '${savedModel}' está instalado (corra: ollama pull ${savedModel}).\n3. Iniciou o Ollama com OLLAMA_ORIGINS="*" para evitar bloqueios de segurança (CORS) do browser.`);
        });
    }
});
