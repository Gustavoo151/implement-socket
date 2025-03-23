// Definição do protocolo de comunicação

export enum MessageType {
  CONNECT = "CONNECT",
  DISCONNECT = "DISCONNECT",
  CHAT = "CHAT",
  BROADCAST = "BROADCAST",
  PRIVATE = "PRIVATE",
  STATUS = "STATUS",
  ERROR = "ERROR",
}

export interface Message {
  type: MessageType;
  sender?: string;
  recipient?: string;
  content?: string;
  timestamp: number;
}

// Métodos para serialização e desserialização de mensagens
export class Protocol {
  // Converte um objeto Message para uma string a ser enviada pelo socket
  public static serialize(message: Message): string {
    return JSON.stringify(message);
  }

  // Converte uma string recebida pelo socket para um objeto Message
  public static deserialize(data: string): Message | null {
    try {
      return JSON.parse(data) as Message;
    } catch (error) {
      console.error("Erro ao deserializar mensagem:", error);
      return null;
    }
  }

  // Cria uma mensagem de chat
  public static createChatMessage(sender: string, content: string): Message {
    return {
      type: MessageType.CHAT,
      sender,
      content,
      timestamp: Date.now(),
    };
  }

  // Cria uma mensagem de estado/status
  public static createStatusMessage(content: string): Message {
    return {
      type: MessageType.STATUS,
      content,
      timestamp: Date.now(),
    };
  }

  // Cria uma mensagem de erro
  public static createErrorMessage(content: string): Message {
    return {
      type: MessageType.ERROR,
      content,
      timestamp: Date.now(),
    };
  }

  // Cria uma mensagem privada para um destinatário específico
  public static createPrivateMessage(
    sender: string,
    recipient: string,
    content: string
  ): Message {
    return {
      type: MessageType.PRIVATE,
      sender,
      recipient,
      content,
      timestamp: Date.now(),
    };
  }
}
