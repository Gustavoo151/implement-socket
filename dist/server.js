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
// Configurações do servidor
const PORT = 3000;
const HOST = "127.0.0.1";
// Contadores e armazenamento de clientes
let clientIdCounter = 0;
const activeClients = new Map();
// Criação do servidor
const server = net.createServer((socket) => {
    // Atribuir ID ao novo cliente
    const clientId = ++clientIdCounter;
    const clientAddress = `${socket.remoteAddress}:${socket.remotePort}`;
    // Armazenar cliente
    activeClients.set(clientId, socket);
    console.log(`Cliente ${clientId} conectado de ${clientAddress}`);
    // Enviar mensagem de boas-vindas
    socket.write(`Bem-vindo ao servidor! Seu ID é ${clientId}\n`);
    // Manipulador de dados recebidos do cliente
    socket.on("data", (data) => {
        const message = data.toString().trim();
        console.log(`Mensagem do cliente ${clientId}: ${message}`);
        // Processar comandos especiais
        if (message.startsWith("/broadcast ")) {
            const broadcastMessage = message.substring(11);
            broadcastToAll(clientId, broadcastMessage);
        }
        else {
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
    socket.on("error", (err) => {
        console.error(`Erro no cliente ${clientId}: ${err.message}`);
        activeClients.delete(clientId);
    });
});
// Função para enviar mensagem a todos os clientes
function broadcastToAll(senderId, message) {
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
server.on("error", (err) => {
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
