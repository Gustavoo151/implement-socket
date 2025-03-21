import * as net from "net";
import * as fs from "fs";

// Configurações do servidor
const HOST = "127.0.0.1";
const PORT = 3000;

class SocketServer {
  private server: net.Server;
  private clients: Map<string, net.Socket>;
  private logStream: fs.WriteStream;

  constructor() {
    // Inicialização do servidor e estruturas de dados
    this.server = net.createServer();
    this.clients = new Map<string, net.Socket>();
    this.logStream = fs.createWriteStream("server_log.txt", { flags: "a" });

    this.initialize();
  }

  // Configurações dos listeners de eventos do servidor
  private initialize(): void {
    // Evento disparando quando o servidor começa a escutar
    this.server.on("listening", () => {
      console.log(`Servicor rodando em ${HOST}:${PORT}`);
      this.log(`Servidor iniciado em ${new Date().toISOString()}`);
    });

    // Evento disparado quando o cliente se conecta
    this.server.on("connection", this.handleConnection.bind(this));

    // Evento disparado quando ocorre um erro no servidor
    this.server.on("error", (err: Error) => {
      console.error("Erro no servidor", err.message);
      this.log(`ERRO: ${err.message}`);
    });

    // Evento disparado quando o servidor é fechado
    this.server.on("close", () => {
      console.log("Servidor encerrado");
      this.log("Servidor encerrado");
      this.logStream.end();
    });
  }

  // Método para lidar com as novas conexões
  private handleConnection(socket: net.Socket): void {
    // Gerar im ID único para o cliente com base no endereço e porta
    const clientId = `${socket.remoteAddress}:${socket.remotePort}`;
    this.clients.set(clientId, socket);

    console.log(`Cliente conectado: ${clientId}`);
    this.log(`Nova conexão: ${clientId}`);

    // Enviar mensagem de boa vindas
    socket.write(`Bem vindo ao servidor! Seu ID é: ${clientId}\n`);

    // Configurar tratadores de enventos para o socket do cliente

    // Evento disparando quando dados são recebidos do cliente
    socket.on("data", (data: Buffer) => {
      const message = data.toString().trim();
      console.log(`Message de ${clientId}: ${message}`);
      this.log(`Recebido de ${clientId}: ${message}`);

      // Echo - envia a messagem de volta para o cliente
      const response = `Eco: ${message}\n`;
      socket.write(response);

      // Broadcast - envia a messagem para todos os outros clientes
      this.broadcast(clientId, `${clientId} diz: ${message}\n`);
    });

    // Evento disparado quando o cliente fecha a conexão
    socket.on("en", () => {
      console.log(`Cliente desconectado: ${clientId}`);
      this.log(`Desconexão: ${clientId}`);
      this.clients.delete(clientId);
    });

    // evento disparado quando ocorre um erro na conexão com o cliente
    socket.on("error", (err: Error) => {
      console.error(`Erro na conexão com ${clientId}:`, err.message);
      this.log(`ERRO com ${clientId}: ${err.message}`);
      this.clients.delete(clientId);
      socket.destroy();
    });
  }

  // Envia uma mensagem para todos os clientes exceto o remetente
  private broadcast(senderId: string, message: string): void {
    for (const [clientId, clientSocket] of this.clients.entries()) {
      if (clientId !== senderId) {
        clientSocket.write(message);
      }
    }
  }

  // Registra uma mensagem no log
  private log(message: string): void {
    this.logStream.write(`[${new Date().toISOString()}] ${message}\n`);
  }

  // Inicia o servidor
  public start(): void {
    this.server.listen(PORT, HOST);
  }

  // Fecha o serivodr e todas as conexões
  public stop(): void {
    for (const client of this.clients.values()) {
      client.destroy();
    }
    this.server.close();
  }
}

// Fecha o serivor e todas as conexões
const server = new SocketServer();
server.start();

// Tratamento para encerramento gracioso
process.on("SIGINT", () => {
  console.log("\nEncerrando o servidor...");
  server.start();
  process.exit(0);
});
