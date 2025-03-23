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

export class Protocol {
  static serialize(message: Message): string {
    return JSON.stringify(message);
  }

  static deserialize(data: string): Message {
    return JSON.parse(data) as Message;
  }

  static createChatMessage(sender: string, content: string): Message {
    return {
      type: MessageType.CHAT,
      sender,
      content,
      timestamp: Date.now(),
    };
  }

  static createPrivateMessage(
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

  static createStatusMessage(content: string): Message {
    return {
      type: MessageType.STATUS,
      content,
      timestamp: Date.now(),
    };
  }

  static createErrorMessage(content: string): Message {
    return {
      type: MessageType.ERROR,
      content,
      timestamp: Date.now(),
    };
  }
}
