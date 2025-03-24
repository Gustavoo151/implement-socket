import * as net from "net";

// Cria um servidor TCP
const server = net.createServer((socket) => {
  console.log("Cliente conectado");

  // Evento de recebimento de dados
  socket.on("data", (data) => {
    console.log("Recebido do cliente:", data.toString());
    // Envia uma resposta para o cliente
    socket.write("Olá do servidor!");
  });

  // Evento de desconexão do cliente
  socket.on("end", () => {
    console.log("Cliente desconectado");
  });
});

// O servidor escuta na porta 3000
server.listen(3000, () => {
  console.log("Servidor escutando na porta 3000");
});
