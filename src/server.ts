import * as net from "net";
import * as fs from "fs";
import { MessageType, Message, Protocol } from "./protocol";

// Configurações do servidor
const HOST = "127.0.0.1";
const PORT = 3000;

// Classe para gerenciar o servidor socket com protocolo personalizado
class EnhancedSocketServer {
  private server: net.Server;
  private clients: Map<string, { socket: net.Socket; username: string }>;
  private logStream: fs.WriteStream;

  constructor() {
    this.server = net.createServer();
    this.clients = new Map<string, { socket: net.Socket; username: string }>();
    this.logStream = fs.createWriteStream("server_log.txt", { flags: "a" });

    this.initialize();
  }

  private initialize(): void {
    this.server.on("listening", () => {
      console.log(`Servidor rodando em ${HOST}:${PORT}`);
      this.log(`Servidor iniciado em ${new Date().toISOString()}`);
    });

    this.server.on("connection", this.handleConnection.bind(this));

    this.server.on("error", (err: Error) => {
      console.error("Erro no servidor:", err.message);
      this.log(`ERRO: ${err.message}`);
    });

    this.server.on("close", () => {
      console.log("Servidor encerrado");
      this.log("Servidor encerrado");
      this.logStream.end();
    });
  }

  private handleConnection(socket: net.Socket): void {
    const clientId = `${socket.remoteAddress}:${socket.remotePort}`;

    // Inicialmente associamos o cliente com um nome temporário
    this.clients.set(clientId, { socket, username: clientId });

    console.log(`Cliente conectado: ${clientId}`);
    this.log(`Nova conexão: ${clientId}`);

    // Buffer para armazenar dados parciais
    let buffer = "";

    // Enviar mensagem de boas-vindas
    const welcomeMsg = Protocol.createStatusMessage(
      "Bem-vindo ao servidor! Por favor, digite seu nome de usuário:"
    );
    socket.write(Protocol.serialize(welcomeMsg) + "\n");

    socket.on("data", (data: Buffer) => {
      // Adicionar dados recebidos ao buffer
      buffer += data.toString();

      // Verificar se há mensagens completas no buffer (por terminador '\n')
      const messages = buffer.split("\n");
      buffer = messages.pop() || ""; // O último elemento pode ser uma mensagem incompleta

      for (const msg of messages) {
        if (!msg.trim()) continue;

        const message = Protocol.deserialize(msg);
        if (!message) {
          // Mensagem inválida
          const errorMsg = Protocol.createErrorMessage(
            "Formato de mensagem inválido"
          );
          socket.write(Protocol.serialize(errorMsg) + "\n");
          continue;
        }

        this.processMessage(clientId, message);
      }
    });

    socket.on("end", () => {
      const username = this.clients.get(clientId)?.username || clientId;
      console.log(`Cliente desconectado: ${username} (${clientId})`);
      this.log(`Desconexão: ${username} (${clientId})`);

      // Notificar outros clientes sobre a desconexão
      const disconnectMsg = Protocol.createStatusMessage(
        `${username} saiu do chat`
      );
      this.broadcastMessage(clientId, disconnectMsg);

      this.clients.delete(clientId);
    });

    socket.on("error", (err: Error) => {
      console.error(`Erro na conexão com ${clientId}:`, err.message);
      this.log(`ERRO com ${clientId}: ${err.message}`);
      this.clients.delete(clientId);
      socket.destroy();
    });
  }

  private processMessage(clientId: string, message: Message): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    const { socket, username } = client;

    // Se o usuário ainda não definiu um nome, considere a primeira mensagem como definição do nome
    if (username === clientId && message.content) {
      const newUsername = message.content.trim();

      // Verificar se o nome já está em uso
      for (const [id, client] of this.clients.entries()) {
        if (id !== clientId && client.username === newUsername) {
          const errorMsg = Protocol.createErrorMessage(
            "Este nome de usuário já está em uso. Por favor, escolha outro:"
          );
          socket.write(Protocol.serialize(errorMsg) + "\n");
          return;
        }
      }

      // Atualizar o nome do usuário
      this.clients.set(clientId, { socket, username: newUsername });

      // Confirmar o nome para o usuário
      const confirmMsg = Protocol.createStatusMessage(
        `Seu nome de usuário foi definido como: ${newUsername}`
      );
      socket.write(Protocol.serialize(confirmMsg) + "\n");

      // Notificar outros clientes
      const joinMsg = Protocol.createStatusMessage(
        `${newUsername} entrou no chat`
      );
      this.broadcastMessage(clientId, joinMsg);

      console.log(`Cliente ${clientId} definiu nome como: ${newUsername}`);
      this.log(`Cliente ${clientId} definiu nome como: ${newUsername}`);

      return;
    }

    // Processar mensagens com base no tipo
    switch (message.type) {
      case MessageType.CHAT:
        console.log(`Mensagem de ${username}: ${message.content}`);
        this.log(`Chat de ${username}: ${message.content}`);

        // Criar uma mensagem normalizada para broadcast
        const chatMsg = Protocol.createChatMessage(
          username,
          message.content || ""
        );
        this.broadcastMessage(clientId, chatMsg);
        break;

      case MessageType.PRIVATE:
        if (message.recipient && message.content) {
          // Encontrar o destinatário pelo nome de usuário
          let recipientId: string | null = null;
          for (const [id, client] of this.clients.entries()) {
            if (client.username === message.recipient) {
              recipientId = id;
              break;
            }
          }

          if (recipientId && this.clients.has(recipientId)) {
            const recipientSocket = this.clients.get(recipientId)?.socket;
            if (recipientSocket) {
              // Enviar mensagem privada para o destinatário
              const privateMsg = Protocol.createPrivateMessage(
                username,
                message.recipient,
                message.content
              );
              recipientSocket.write(Protocol.serialize(privateMsg) + "\n");

              // Confirmar envio para o remetente
              const confirmMsg = Protocol.createStatusMessage(
                `Mensagem privada enviada para ${message.recipient}`
              );
              socket.write(Protocol.serialize(confirmMsg) + "\n");

              console.log(
                `Mensagem privada de ${username} para ${message.recipient}: ${message.content}`
              );
              this.log(
                `Privado de ${username} para ${message.recipient}: ${message.content}`
              );
            }
          } else {
            // Usuário não encontrado
            const errorMsg = Protocol.createErrorMessage(
              `Usuário '${message.recipient}' não encontrado`
            );
            socket.write(Protocol.serialize(errorMsg) + "\n");
          }
        }
        break;

      case MessageType.STATUS:
        // Processar solicitações de status como lista de usuários online
        if (message.content === "/users") {
          const userList = Array.from(this.clients.values())
            .map((client) => client.username)
            .join(", ");

          const statusMsg = Protocol.createStatusMessage(
            `Usuários online: ${userList}`
          );
          socket.write(Protocol.serialize(statusMsg) + "\n");
        }
        break;

      default:
        // Tipo de mensagem desconhecido
        const errorMsg = Protocol.createErrorMessage(
          "Tipo de mensagem não suportado"
        );
        socket.write(Protocol.serialize(errorMsg) + "\n");
    }
  }

  private broadcastMessage(excludeClientId: string, message: Message): void {
    for (const [clientId, client] of this.clients.entries()) {
      if (clientId !== excludeClientId) {
        client.socket.write(Protocol.serialize(message) + "\n");
      }
    }
  }

  private log(message: string): void {
    this.logStream.write(`[${new Date().toISOString()}] ${message}\n`);
  }

  public start(): void {
    this.server.listen(PORT, HOST);
  }

  public stop(): void {
    const shutdownMsg = Protocol.createStatusMessage(
      "Servidor está sendo encerrado. Conexão será fechada."
    );

    for (const client of this.clients.values()) {
      client.socket.write(Protocol.serialize(shutdownMsg) + "\n");
      client.socket.end();
    }

    this.server.close();
  }
}

// Inicialização do servidor
const server = new EnhancedSocketServer();
server.start();

// Tratamento para encerramento gracioso
process.on("SIGINT", () => {
  console.log("\nEncerrando servidor...");
  server.stop();
  process.exit(0);
});
