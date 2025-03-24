import * as net from 'net';
import * as express from 'express';
import * as http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import * as path from 'path';

// Configurações do servidor
const PORT = 3000;
const HOST = '127.0.0.1';
const WEB_PORT = 8080;

// Contadores e armazenamento de clientes
let clientIdCounter = 0;
const activeClients: Map<number, net.Socket | any> = new Map();
const clientTypes: Map<number, 'tcp' | 'web'> = new Map();

// Criação do servidor TCP
const server = net.createServer((socket: net.Socket) => {
    // Atribuir ID ao novo cliente
    const clientId = ++clientIdCounter;
    const clientAddress = `${socket.remoteAddress}:${socket.remotePort}`;
    
    // Armazenar cliente
    activeClients.set(clientId, socket);
    clientTypes.set(clientId, 'tcp');
    
    console.log(`Cliente TCP ${clientId} conectado de ${clientAddress}`);
    
    // Enviar mensagem de boas-vindas
    socket.write(`Bem-vindo ao servidor! Seu ID é ${clientId}\n`);
    
    // Manipulador de dados recebidos do cliente
    socket.on('data', (data: Buffer) => {
        const message = data.toString().trim();
        console.log(`Mensagem do cliente TCP ${clientId}: ${message}`);
        
        // Processar comandos especiais
        if (message.startsWith('/broadcast ')) {
            const broadcastMessage = message.substring(11);
            broadcastToAll(clientId, broadcastMessage);
        } else {
            // Eco da mensagem de volta para o cliente
            socket.write(`Eco: ${message}\n`);
        }
    });
    
    // Manipulador de fechamento de conexão
    socket.on('close', () => {
        console.log(`Cliente TCP ${clientId} desconectado`);
        activeClients.delete(clientId);
        clientTypes.delete(clientId);
    });
    
    // Manipulador de erros
    socket.on('error', (err: Error) => {
        console.error(`Erro no cliente TCP ${clientId}: ${err.message}`);
        activeClients.delete(clientId);
        clientTypes.delete(clientId);
    });
});

// Configuração do servidor Express para a interface web
const app = express();
const httpServer = http.createServer(app);
const io = new SocketIOServer(httpServer);

// Configuração de arquivos estáticos
app.use(express.static(path.join(__dirname, '../public')));

// Rota principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Configuração do Socket.IO para clientes web
io.on('connection', (socket) => {
    const clientId = ++clientIdCounter;
    
    // Armazenar cliente
    activeClients.set(clientId, socket);
    clientTypes.set(clientId, 'web');
    
    console.log(`Cliente Web ${clientId} conectado`);
    
    // Enviar mensagem de boas-vindas
    socket.emit('message', `Bem-vindo ao servidor! Seu ID é ${clientId}`);
    
    // Manipulador de mensagens do cliente web
    socket.on('message', (message: string) => {
        console.log(`Mensagem do cliente Web ${clientId}: ${message}`);
        
        // Processar comandos especiais
        if (message.startsWith('/broadcast ')) {
            const broadcastMessage = message.substring(11);
            broadcastToAll(clientId, broadcastMessage);
        } else {
            // Eco da mensagem de volta para o cliente
            socket.emit('message', `Eco: ${message}`);
        }
    });
    
    // Manipulador de desconexão
    socket.on('disconnect', () => {
        console.log(`Cliente Web ${clientId} desconectado`);
        activeClients.delete(clientId);
        clientTypes.delete(clientId);
    });
});

// Função para enviar mensagem a todos os clientes
function broadcastToAll(senderId: number, message: string): void {
    const prefix = `[Broadcast de Cliente ${senderId}]: `;
    console.log(`Enviando broadcast: ${message}`);
    
    activeClients.forEach((client, clientId) => {
        if (clientId !== senderId) {
            const clientType = clientTypes.get(clientId);
            
            if (clientType === 'tcp') {
                // Cliente TCP
                (client as net.Socket).write(`${prefix}${message}\n`);
            } else if (clientType === 'web') {
                // Cliente Web (Socket.IO)
                (client as any).emit('message', `${prefix}${message}`);
            }
        }
    });
}

// Iniciar os servidores
server.listen(PORT, HOST, () => {
    console.log(`Servidor TCP iniciado em ${HOST}:${PORT}`);
});

httpServer.listen(WEB_PORT, () => {
    console.log(`Servidor Web iniciado em http://${HOST}:${WEB_PORT}`);
});

// Tratamento de erros no servidor
server.on('error', (err: Error) => {
    console.error(`Erro no servidor TCP: ${err.message}`);
});

// Tratamento de sinal SIGINT (Ctrl+C) para encerrar os servidores adequadamente
process.on('SIGINT', () => {
    console.log('\nEncerrando servidores...');
    
    // Fechando todas as conexões de clientes
    activeClients.forEach((client, clientId) => {
        const clientType = clientTypes.get(clientId);
        
        if (clientType === 'tcp') {
            // Cliente TCP
            (client as net.Socket).end('Servidor está sendo desligado. Até logo!\n');
        } else if (clientType === 'web') {
            // Cliente Web (Socket.IO)
            (client as any).emit('message', 'Servidor está sendo desligado. Até logo!');
        }
    });
    
    // Fechando os servidores
    server.close(() => {
        httpServer.close(() => {
            console.log('Servidores encerrados com sucesso.');
            process.exit(0);
        });
    });
});