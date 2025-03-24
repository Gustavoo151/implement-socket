import * as net from "net";

// Cria um cliente TCP e conecta ao servidor
const client = net.createConnection({ port: 3000 }, () => {
  console.log("Conectado ao servidor");
  // Envia uma mensagem para o servidor
  client.write("Olá do cliente!");
});

// Evento de recebimento de dados do servidor
client.on("data", (data) => {
  console.log("Recebido do servidor:", data.toString());
  // Encerra a conexão
  client.end();
});

// Evento de desconexão
client.on("end", () => {
  console.log("Desconectado do servidor");
});
