import * as net from "net";

// Configurações do servidor
const PORT = 3000;
const HOST = "127.0.0.1";

// Contadores e armazenamento de clientes
let clientIdCounter = 0;
const activeClients: Map<number, net.Socket> = new Map();

// Criação do servidor
const server = net.createServer((socket: net.Socket) => {
  // Atribuir ID ao novo cliente
  const clientId = ++clientIdCounter;
  const clientAddress = `${socket.remoteAddress}:${socket.remotePort}`;

  // Armazenar cliente
  activeClients.set(clientId, socket);

  console.log(`Cliente ${clientId} conectado de ${clientAddress}`);

  // Enviar mensagem de boas-vindas
  socket.write(`Bem-vindo ao servidor! Seu ID é ${clientId}\n`);

  // Manipulador de dados recebidos do cliente
  socket.on("data", (data: Buffer) => {
    const message = data.toString().trim();
    console.log(`Mensagem do cliente ${clientId}: ${message}`);

    // Processar comandos especiais
    if (message.startsWith("/broadcast ")) {
      const broadcastMessage = message.substring(11);
      broadcastToAll(clientId, broadcastMessage);
    } else {
      // Eco da mensagem de volta para o cliente
      socket.write(`Eco: ${message}\n`);
    }
  });

  // Manipulador de fechamento de conexão
  socket.on("close", () => {
    console.log(`Cliente ${clientId} desconectado`);
    activeClients.delete(clientId);
  });

  // Manipulador de erros
  socket.on("error", (err: Error) => {
    console.error(`Erro no cliente ${clientId}: ${err.message}`);
    activeClients.delete(clientId);
  });
});

// Função para enviar mensagem a todos os clientes
function broadcastToAll(senderId: number, message: string): void {
  const prefix = `[Broadcast de Cliente ${senderId}]: `;
  console.log(`Enviando broadcast: ${message}`);

  activeClients.forEach((clientSocket, clientId) => {
    if (clientId !== senderId) {
      clientSocket.write(`${prefix}${message}\n`);
    }
  });
}

// Iniciar o servidor
server.listen(PORT, HOST, () => {
  console.log(`Servidor iniciado em ${HOST}:${PORT}`);
});

// Tratamento de erros no servidor
server.on("error", (err: Error) => {
  console.error(`Erro no servidor: ${err.message}`);
});

// Tratamento de sinal SIGINT (Ctrl+C) para encerrar o servidor adequadamente
process.on("SIGINT", () => {
  console.log("\nEncerrando servidor...");

  // Fechando todas as conexões de clientes
  activeClients.forEach((socket) => {
    socket.end("Servidor está sendo desligado. Até logo!\n");
  });

  // Fechando o servidor
  server.close(() => {
    console.log("Servidor encerrado com sucesso.");
    process.exit(0);
  });
});
