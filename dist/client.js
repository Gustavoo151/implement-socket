"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const net = __importStar(require("net"));
const readline = __importStar(require("readline"));
// Configurações do cliente
const PORT = 3000;
const HOST = "127.0.0.1";
// Interface para leitura da entrada do usuário
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});
// Estados do cliente
var ClientState;
(function (ClientState) {
    ClientState[ClientState["DISCONNECTED"] = 0] = "DISCONNECTED";
    ClientState[ClientState["CONNECTING"] = 1] = "CONNECTING";
    ClientState[ClientState["CONNECTED"] = 2] = "CONNECTED";
    ClientState[ClientState["ERROR"] = 3] = "ERROR";
})(ClientState || (ClientState = {}));
class SocketClient {
    constructor() {
        this.socket = new net.Socket();
        this.state = ClientState.DISCONNECTED;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.setupSocketEventHandlers();
    }
    // Configuração de manipuladores de eventos do socket
    setupSocketEventHandlers() {
        // Evento de conexão estabelecida
        this.socket.on("connect", () => {
            this.state = ClientState.CONNECTED;
            this.reconnectAttempts = 0;
            console.log(`Conectado ao servidor ${HOST}:${PORT}`);
        });
        // Evento de recebimento de dados
        this.socket.on("data", (data) => {
            console.log(`\nServidor: ${data.toString().trim()}`);
            this.promptUser();
        });
        // Evento de fechamento de conexão
        this.socket.on("close", (hadError) => {
            this.state = ClientState.DISCONNECTED;
            if (hadError) {
                console.log("Conexão fechada devido a um erro");
            }
            else {
                console.log("Desconectado do servidor");
            }
            // Tentar reconectar automaticamente
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                this.tryReconnect();
            }
            else {
                console.log("Número máximo de tentativas de reconexão atingido");
                this.exit();
            }
        });
        // Evento de erro
        this.socket.on("error", (err) => {
            this.state = ClientState.ERROR;
            console.error(`Erro de socket: ${err.message}`);
        });
    }
    // Conectar ao servidor
    connect() {
        if (this.state === ClientState.DISCONNECTED ||
            this.state === ClientState.ERROR) {
            console.log(`Conectando a ${HOST}:${PORT}...`);
            this.state = ClientState.CONNECTING;
            this.socket.connect({
                port: PORT,
                host: HOST,
            });
        }
    }
    // Tentar reconexão automática
    tryReconnect() {
        this.reconnectAttempts++;
        const delay = this.reconnectAttempts * 1000; // Aumentar delay a cada tentativa
        console.log(`Tentando reconectar em ${delay / 1000} segundos (tentativa ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
        setTimeout(() => {
            this.connect();
        }, delay);
    }
    // Enviar mensagem para o servidor
    sendMessage(message) {
        if (this.state === ClientState.CONNECTED) {
            this.socket.write(message);
        }
        else {
            console.log("Não foi possível enviar a mensagem. Cliente não está conectado.");
        }
    }
    // Desconectar do servidor
    disconnect() {
        if (this.state === ClientState.CONNECTED) {
            console.log("Desconectando do servidor...");
            this.socket.end();
        }
    }
    // Exibir prompt para o usuário
    promptUser() {
        rl.question("> ", (input) => {
            if (input.toLowerCase() === "exit" || input.toLowerCase() === "quit") {
                this.exit();
            }
            else {
                this.sendMessage(input);
            }
        });
    }
    // Encerrar o cliente
    exit() {
        console.log("Encerrando cliente...");
        this.disconnect();
        rl.close();
        process.exit(0);
    }
    // Iniciar o cliente e começar interação
    start() {
        console.log("Cliente de socket iniciado");
        console.log('Digite suas mensagens. Para sair digite "exit" ou "quit"');
        console.log('Use "/broadcast mensagem" para enviar uma mensagem para todos os clientes');
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
