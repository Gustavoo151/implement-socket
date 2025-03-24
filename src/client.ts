import * as net from "net";
import * as readline from "readline";

// Configurações do cliente
const PORT = 3000;
const HOST = "127.0.0.1";

// Interface para leitura da entrada do usuário
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Estados do cliente
enum ClientState {
  DISCONNECTED,
  CONNECTING,
  CONNECTED,
  ERROR,
}

class SocketClient {
  private socket: net.Socket;
  private state: ClientState;
  private reconnectAttempts: number;
  private readonly maxReconnectAttempts: number;

  constructor() {
    this.socket = new net.Socket();
    this.state = ClientState.DISCONNECTED;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;

    this.setupSocketEventHandlers();
  }

  // Configuração de manipuladores de eventos do socket
  private setupSocketEventHandlers(): void {
    // Evento de conexão estabelecida
    this.socket.on("connect", () => {
      this.state = ClientState.CONNECTED;
      this.reconnectAttempts = 0;
      console.log(`Conectado ao servidor ${HOST}:${PORT}`);
    });

    // Evento de recebimento de dados
    this.socket.on("data", (data: Buffer) => {
      console.log(`\nServidor: ${data.toString().trim()}`);
      this.promptUser();
    });

    // Evento de fechamento de conexão
    this.socket.on("close", (hadError: boolean) => {
      this.state = ClientState.DISCONNECTED;

      if (hadError) {
        console.log("Conexão fechada devido a um erro");
      } else {
        console.log("Desconectado do servidor");
      }

      // Tentar reconectar automaticamente
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.tryReconnect();
      } else {
        console.log("Número máximo de tentativas de reconexão atingido");
        this.exit();
      }
    });

    // Evento de erro
    this.socket.on("error", (err: Error) => {
      this.state = ClientState.ERROR;
      console.error(`Erro de socket: ${err.message}`);
    });
  }

  // Conectar ao servidor
  public connect(): void {
    if (
      this.state === ClientState.DISCONNECTED ||
      this.state === ClientState.ERROR
    ) {
      console.log(`Conectando a ${HOST}:${PORT}...`);
      this.state = ClientState.CONNECTING;

      this.socket.connect({
        port: PORT,
        host: HOST,
      });
    }
  }

  // Tentar reconexão automática
  private tryReconnect(): void {
    this.reconnectAttempts++;
    const delay = this.reconnectAttempts * 1000; // Aumentar delay a cada tentativa

    console.log(
      `Tentando reconectar em ${delay / 1000} segundos (tentativa ${
        this.reconnectAttempts
      }/${this.maxReconnectAttempts})...`
    );

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  // Enviar mensagem para o servidor
  public sendMessage(message: string): void {
    if (this.state === ClientState.CONNECTED) {
      this.socket.write(message);
    } else {
      console.log(
        "Não foi possível enviar a mensagem. Cliente não está conectado."
      );
    }
  }

  // Desconectar do servidor
  public disconnect(): void {
    if (this.state === ClientState.CONNECTED) {
      console.log("Desconectando do servidor...");
      this.socket.end();
    }
  }

  // Exibir prompt para o usuário
  private promptUser(): void {
    rl.question("> ", (input) => {
      if (input.toLowerCase() === "exit" || input.toLowerCase() === "quit") {
        this.exit();
      } else {
        this.sendMessage(input);
      }
    });
  }

  // Encerrar o cliente
  public exit(): void {
    console.log("Encerrando cliente...");
    this.disconnect();
    rl.close();
    process.exit(0);
  }

  // Iniciar o cliente e começar interação
  public start(): void {
    console.log("Cliente de socket iniciado");
    console.log('Digite suas mensagens. Para sair digite "exit" ou "quit"');
    console.log(
      'Use "/broadcast mensagem" para enviar uma mensagem para todos os clientes'
    );

    this.connect();

    // Começar a interação após um breve atraso para permitir a conexão
    setTimeout(() => {
      this.promptUser();
    }, 1000);
  }
}

// Criar e iniciar o cliente
const client = new SocketClient();
client.start();

// Tratamento de sinal SIGINT (Ctrl+C) para encerrar o cliente adequadamente
process.on("SIGINT", () => {
  console.log("\nSinal de interrupção recebido");
  client.exit();
});
