# Documentação do Sistema de Chat com Sockets

Este projeto implementa um sistema de chat cliente-servidor usando sockets TCP em Node.js com TypeScript. Abaixo está a documentação completa da implementação.

## Visão Geral da Arquitetura

O sistema consiste em três componentes principais:

1. **Protocol (protocol.ts)**: Define o protocolo de comunicação entre cliente e servidor
2. **Servidor (server.ts)**: Gerencia conexões e mensagens entre os clientes
3. **Cliente (client.ts)**: Interface para usuários se conectarem ao servidor

## Protocol.ts - Protocolo de Comunicação

O arquivo protocol.ts define a estrutura das mensagens trocadas entre cliente e servidor:

```typescript
enum MessageType {
  CONNECT,
  DISCONNECT,
  CHAT,
  BROADCAST,
  PRIVATE,
  STATUS,
  ERROR,
}

interface Message {
  type: MessageType;
  sender?: string;
  recipient?: string;
  content?: string;
  timestamp: number;
}
```

A classe `Protocol` fornece métodos para:

- Serializar/deserializar mensagens em formato JSON
- Criar diferentes tipos de mensagens (chat, status, erro, privada)

Este protocolo padroniza a comunicação, garantindo que todas as mensagens tenham formato consistente.

## Server.ts - Implementação do Servidor

O servidor implementa um chat TCP na porta 3000 com as seguintes funcionalidades:

1. **Gerenciamento de Conexões**:

   - Aceita novas conexões de clientes
   - Rastreia clientes conectados em um Map
   - Gerencia desconexões

2. **Processamento de Mensagens**:

   - Recebe mensagens serializadas
   - Implementa buffer para recebimento de dados parciais
   - Processa mensagens de acordo com seu tipo

3. **Recursos**:
   - Registro de nome de usuário
   - Broadcast de mensagens para todos os usuários
   - Mensagens privadas entre usuários
   - Notificações de entrada/saída de usuários
   - Listagem de usuários online
   - Logs de atividades em arquivo

## Client.ts - Implementação do Cliente

O cliente permite que os usuários se conectem ao servidor e interajam com outros usuários:

1. **Interface de Usuário**:

   - Interface de linha de comando via readline
   - Exibe mensagens recebidas formatadas por tipo

2. **Comunicação**:

   - Conecta-se ao servidor TCP
   - Envia mensagens serializadas
   - Processa mensagens recebidas
   - Implementa buffer para dados fragmentados

3. **Comandos Suportados**:
   - Mensagens normais: `texto qualquer`
   - Mensagens privadas: `/privado <usuário> <mensagem>` ou `/p <usuário> <mensagem>`
   - Listar usuários: `/usuarios` ou users
   - Ajuda: `/ajuda` ou `/help`
   - Sair: `/sair`

## Como o Sistema Funciona

1. **Inicialização**:

   - O servidor inicia e aguarda conexões na porta 3000
   - Clientes se conectam ao servidor

2. **Registro de Usuário**:

   - Ao se conectar, o servidor solicita um nome de usuário
   - O cliente envia o nome escolhido
   - O servidor verifica se o nome está disponível
   - O servidor confirma o registro e notifica outros usuários

3. **Troca de Mensagens**:

   - Mensagens são serializadas usando o protocolo
   - O servidor processa cada mensagem de acordo com seu tipo
   - Mensagens chat são enviadas para todos os usuários
   - Mensagens privadas são enviadas apenas para o destinatário

4. **Encerramento**:
   - O cliente pode encerrar a conexão com `/sair`
   - O servidor notifica outros usuários quando alguém sai
   - O servidor pode ser encerrado de forma controlada (SIGINT)

## Recursos de Segurança e Robustez

- Validação de mensagens recebidas
- Tratamento de erros de conexão e deserialização
- Buffer para lidar com dados fragmentados
- Notificações de erro para o cliente
- Logging de atividades do servidor

Para executar o projeto, use os comandos:

- Servidor: `node src/server.js` (ou `ts-node src/server.ts`)
- Cliente: `node src/client.js` (ou `ts-node src/client.ts`)

O sistema é uma demonstração de comunicação baseada em sockets usando TCP com um protocolo personalizado sobre JSON.

# Como Executar o Projeto de Chat com Sockets

Para executar este projeto de chat baseado em sockets, siga estas instruções:

## Pré-requisitos

- Node.js (versão 14 ou superior)
- npm (gerenciador de pacotes do Node)

## Instalação

1. Primeiro, instale as dependências do projeto:

```bash
npm install
```

Se for a primeira execução e não houver um arquivo package.json, crie-o primeiro:

```bash
npm init -y
npm install typescript ts-node @types/node --save-dev
```

## Execução

### 1. Servidor

Para iniciar o servidor, abra um terminal e execute:

```bash
npm run start:server
```

Ou diretamente com:

```bash
node dist/server.js
```

Se estiver usando TypeScript sem compilação prévia:

```bash
npx ts-node src/server.ts
```

O servidor iniciará na porta 3000, e você verá uma mensagem confirmando que está pronto para aceitar conexões.

### 2. Cliente

Para iniciar um cliente, abra outro terminal e execute:

```bash
npm run start:client
```

Ou diretamente com:

```bash
node dist/client.js
```

Se estiver usando TypeScript sem compilação prévia:

```bash
npx ts-node src/client.ts
```

Você pode iniciar múltiplos clientes abrindo vários terminais e repetindo este comando.

## Compilação (se usar TypeScript)

Se precisar compilar o código TypeScript antes da execução:

```bash
npx tsc
```

## Usando o Chat

Após iniciar o cliente, você será solicitado a inserir um nome de usuário. Em seguida, você pode:

- Enviar mensagens digitando e pressionando Enter
- Usar comandos como `/privado <usuário> <mensagem>` ou `/usuarios`
- Sair do chat digitando `/sair`

## Solução de Problemas

- **Erro "Address already in use"**: O servidor já está rodando em outro processo. Encerre-o ou mude a porta no código.
- **Erro de conexão recusada**: Verifique se o servidor está rodando antes de iniciar os clientes.
- **Mensagens não chegando**: Verifique se todos os clientes estão conectados ao mesmo endereço/porta do servidor.
