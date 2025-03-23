import * as net from "net";
import * as readline from "readline";

// Configurações de conexão
const SERVER_HOST = "127.0.0.1";
const SERVER_PORT = 3000;

class SocketClient {
  private socket: net.Socket;
  private rl: readline.Interface;
  private connected: boolean = false;

  constructor() {
    // Criação do socket
    this.socket = new net.Socket();

    // Interface para leitura do console
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    this.initialize();
  }

  // Configuração dos listeners de eventos do cliente
  private initialize(): void {
    // Evento disparado quando a conexão é estabelecida
    this.socket.on("connect", () => {
      console.log("Conectado ao servidor!");
      this.connected = true;
      this.startInputLoop();
    });

    // Evento disparado quando dados são recebidos do servidor
    this.socket.on("data", (data: Buffer) => {
      const message = data.toString();
      process.stdout.write(`\nServidor: ${message}`);

      // Reexibe o prompt após a mensagem do servidor
      if (this.connected) {
        process.stdout.write("> ");
      }
    });

    // Evento disparado quando o servidor fecha a conexão
    this.socket.on("end", () => {
      console.log("\nConexão encerrada pelo servidor");
      this.connected = false;
      this.rl.close();
    });

    // Evento disparado quando ocorre um erro na conexão
    this.socket.on("error", (err: Error) => {
      console.error("\nErro na conexão:", err.message);
      this.connected = false;
      this.socket.destroy();
      this.rl.close();
    });

    // Evento disparado quando a conexão é fechada
    this.socket.on("close", () => {
      if (this.connected) {
        console.log("\nConexão com o servidor perdida");
        this.connected = false;
        this.rl.close();
      }
    });
  }

  // Loop para leitura de entrada do usuário
  private startInputLoop(): void {
    this.rl.question("> ", (input) => {
      if (input.toLowerCase() === "sair") {
        console.log("Encerrando conexão...");
        this.disconnect();
        return;
      }

      // Envia a entrada do usuário para o servidor
      this.socket.write(input);

      // Continua o loop se ainda estiver conectado
      if (this.connected) {
        this.startInputLoop();
      }
    });
  }

  // Conecta ao servidor
  public connect(): void {
    console.log(`Conectando a ${SERVER_HOST}:${SERVER_PORT}...`);
    this.socket.connect(SERVER_PORT, SERVER_HOST);
  }

  // Desconecta do servidor
  public disconnect(): void {
    if (this.connected) {
      this.socket.end();
      this.connected = false;
    }
    this.rl.close();
  }
}

// Inicialização do cliente
const client = new SocketClient();
client.connect();

// Tratamento para encerramento gracioso
process.on("SIGINT", () => {
  console.log("\nEncerrando cliente...");
  client.disconnect();
  process.exit(0);
});
