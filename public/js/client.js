document.addEventListener("DOMContentLoaded", () => {
  // Elementos da interface
  const messagesContainer = document.getElementById("messages");
  const messageInput = document.getElementById("message-input");
  const sendButton = document.getElementById("send-btn");
  const connectButton = document.getElementById("connect-btn");
  const disconnectButton = document.getElementById("disconnect-btn");
  const clearButton = document.getElementById("clear-btn");
  const connectionStatus = document.getElementById("connection-status");

  // Variáveis do socket
  let socket = null;
  let connected = false;

  // Função para atualizar o estado da UI
  function updateUIState() {
    if (connected) {
      connectionStatus.textContent = "Conectado";
      connectionStatus.className = "connected";
      messageInput.disabled = false;
      sendButton.disabled = false;
      connectButton.disabled = true;
      disconnectButton.disabled = false;
    } else {
      connectionStatus.textContent = "Desconectado";
      connectionStatus.className = "disconnected";
      messageInput.disabled = true;
      sendButton.disabled = true;
      connectButton.disabled = false;
      disconnectButton.disabled = true;
    }
  }

  // Função para adicionar mensagem ao container
  function addMessage(message, type = "server-message") {
    const messageElement = document.createElement("div");
    messageElement.className = `message ${type}`;
    messageElement.textContent = message;
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Conectar ao servidor
  function connect() {
    try {
      socket = io();

      // Evento de conexão bem-sucedida
      socket.on("connect", () => {
        connected = true;
        updateUIState();
        addMessage("Conectado ao servidor");
      });

      // Evento de desconexão
      socket.on("disconnect", () => {
        connected = false;
        updateUIState();
        addMessage("Desconectado do servidor");
      });

      // Recebimento de mensagem do servidor
      socket.on("message", (message) => {
        // Verificar se é uma mensagem de broadcast
        if (message.includes("[Broadcast de Cliente")) {
          addMessage(message, "broadcast-message");
        } else {
          addMessage(message);
        }
      });

      // Evento de erro
      socket.on("error", (error) => {
        console.error("Erro de socket:", error);
        addMessage(`Erro: ${error}`, "error-message");
      });
    } catch (error) {
      console.error("Erro ao conectar:", error);
      addMessage(`Erro ao conectar: ${error.message}`, "error-message");
    }
  }

  // Desconectar do servidor
  function disconnect() {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  }

  // Enviar mensagem
  function sendMessage() {
    const message = messageInput.value.trim();
    if (message && socket && connected) {
      socket.emit("message", message);
      addMessage(`Você: ${message}`, "client-message");
      messageInput.value = "";
    }
  }

  // Limpar o chat
  function clearChat() {
    messagesContainer.innerHTML = "";
    addMessage("Chat limpo");
  }

  // Event listeners
  connectButton.addEventListener("click", connect);
  disconnectButton.addEventListener("click", disconnect);
  clearButton.addEventListener("click", clearChat);

  sendButton.addEventListener("click", sendMessage);
  messageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  });

  // Atualizar estado inicial da UI
  updateUIState();

  // Mensagem de boas-vindas
  addMessage("Bem-vindo ao Cliente Socket Web!");
  addMessage('Clique em "Conectar" para iniciar.');
});
