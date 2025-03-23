import * as net from "net";
import * as readline from "readline";
import { MessageType, Message, Protocol } from "./protocol";

// Configurações de conexão
const SERVER_HOST = "127.0.0.1";
const SERVER_PORT = 3000;

class EnhancedSocketClient {
  private socket: net.Socket;
  private rl: readline.Interface;
  private connected: boolean = false;
  private username: string = "";
  private buffer: string = "";

  constructor() {
    this.socket = new net.Socket();

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    this.initialize();
  }

  private initialize(): void {
    this.socket.on("connect", () => {
      console.log("Conectado ao servidor!");
      this.connected = true;
    });

    this.socket.on("data", (data: Buffer) => {
      // Adicionar dados ao buffer
      this.buffer += data.toString();

      // Verificar se há mensagens completas
      const messages = this.buffer.split("\n");
      this.buffer = messages.pop() || "";

      for (const msg of messages) {
        if (!msg.trim()) continue;

        const message = Protocol.deserialize(msg);
        if (!message) {
          console.log("\nRecebida mensagem em formato inválido");
          continue;
        }

        this.processMessage(message);
      }

      // Reexibir o prompt se necessário
      if (this.connected) {
        process.stdout.write("> ");
      }
    });

    this.socket.on("end", () => {
      console.log("\nConexão encerrada pelo servidor");
      this.connected = false;
      this.rl.close();
    });

    this.socket.on("error", (err: Error) => {
      console.error("\nErro na conexão:", err.message);
      this.connected = false;
      this.socket.destroy();
      this.rl.close();
    });

    this.socket.on("close", () => {
      if (this.connected) {
        console.log("\nConexão com o servidor perdida");
        this.connected = false;
        this.rl.close();
      }
    });
  }

  private processMessage(message: Message): void {
    const timestamp = new Date(message.timestamp).toLocaleTimeString();

    switch (message.type) {
      case MessageType.CHAT:
        if (message.sender && message.content) {
          console.log(`\n[${timestamp}] ${message.sender}: ${message.content}`);
        }
        break;

      case MessageType.PRIVATE:
        if (message.sender && message.content) {
          console.log(
            `\n[${timestamp}] [PRIVADO de ${message.sender}]: ${message.content}`
          );
        }
        break;

      case MessageType.STATUS:
        if (message.content) {
          console.log(`\n[${timestamp}] [SISTEMA] ${message.content}`);

          // Se ainda não temos um nome de usuário, o servidor está pedindo para definirmos
          if (
            !this.username &&
            message.content.includes("Por favor, digite seu nome de usuário")
          ) {
            this.startInputLoop();
          }
        }
        break;

      case MessageType.ERROR:
        if (message.content) {
          console.log(`\n[${timestamp}] [ERRO] ${message.content}`);
        }
        break;

      default:
        console.log(
          `\n[${timestamp}] Mensagem recebida (tipo: ${message.type})`
        );
    }
  }

  private startInputLoop(): void {
    this.rl.question("> ", (input) => {
      if (input.toLowerCase() === "/sair") {
        console.log("Encerrando conexão...");
        this.disconnect();
        return;
      }

      // Se ainda não temos um nome de usuário, a primeira entrada será o nome
      if (!this.username) {
        this.username = input.trim();

        // Enviamos o nome como conteúdo para que o servidor possa processá-lo
        const usernameMsg: Message = {
          type: MessageType.CONNECT,
          content: this.username,
          timestamp: Date.now(),
        };
        this.socket.write(Protocol.serialize(usernameMsg) + "\n");
      }
      // Processamento de comandos
      else if (input.startsWith("/")) {
        const parts = input.split(" ");
        const command = parts[0].toLowerCase();

        switch (command) {
          case "/privado":
          case "/p":
            if (parts.length < 3) {
              console.log("\nUso: /privado <usuário> <mensagem>");
            } else {
              const recipient = parts[1];
              const content = parts.slice(2).join(" ");
              const privateMsg = Protocol.createPrivateMessage(
                this.username,
                recipient,
                content
              );
              this.socket.write(Protocol.serialize(privateMsg) + "\n");
            }
            break;

          case "/usuarios":
          case "/users":
            const statusMsg: Message = {
              type: MessageType.STATUS,
              content: "/users",
              timestamp: Date.now(),
            };
            this.socket.write(Protocol.serialize(statusMsg) + "\n");
            break;

          case "/ajuda":
          case "/help":
            console.log("\nComandos disponíveis:");
            console.log(
              "/privado <usuário> <mensagem> - Envia uma mensagem privada"
            );
            console.log(
              "/p <usuário> <mensagem> - Atalho para mensagem privada"
            );
            console.log("/usuarios ou /users - Lista usuários online");
            console.log("/ajuda ou /help - Exibe esta ajuda");
            console.log("/sair - Encerra a conexão");
            break;

          default:
            console.log(`\nComando desconhecido: ${command}`);
            console.log("Use /ajuda para ver os comandos disponíveis");
        }
      }
      // Mensagem normal de chat
      else if (input.trim()) {
        const chatMsg = Protocol.createChatMessage(this.username, input);
        this.socket.write(Protocol.serialize(chatMsg) + "\n");
      }

      // Continua o loop se ainda estiver conectado
      if (this.connected) {
        this.startInputLoop();
      }
    });
  }

  public connect(): void {
    console.log(`Conectando a ${SERVER_HOST}:${SERVER_PORT}...`);
    this.socket.connect(SERVER_PORT, SERVER_HOST);
  }

  public disconnect(): void {
    if (this.connected) {
      this.socket.end();
      this.connected = false;
    }
    this.rl.close();
  }
}

// Inicialização do cliente
const client = new EnhancedSocketClient();
client.connect();

// Tratamento para encerramento gracioso
process.on("SIGINT", () => {
  console.log("\nEncerrando cliente...");
  client.disconnect();
  process.exit(0);
});
