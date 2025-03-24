"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Protocol = exports.MessageType = void 0;
var MessageType;
(function (MessageType) {
    MessageType["CONNECT"] = "CONNECT";
    MessageType["DISCONNECT"] = "DISCONNECT";
    MessageType["CHAT"] = "CHAT";
    MessageType["BROADCAST"] = "BROADCAST";
    MessageType["PRIVATE"] = "PRIVATE";
    MessageType["STATUS"] = "STATUS";
    MessageType["ERROR"] = "ERROR";
})(MessageType || (exports.MessageType = MessageType = {}));
class Protocol {
    static serialize(message) {
        return JSON.stringify(message);
    }
    static deserialize(data) {
        try {
            return JSON.parse(data);
        }
        catch (e) {
            console.error("Erro ao deserializar mensagem:", e);
            return {
                type: MessageType.ERROR,
                content: "Formato de mensagem inválido",
                timestamp: Date.now(),
            };
        }
    }
    static createChatMessage(sender, content) {
        return {
            type: MessageType.CHAT,
            sender,
            content,
            timestamp: Date.now(),
        };
    }
    static createPrivateMessage(sender, recipient, content) {
        return {
            type: MessageType.PRIVATE,
            sender,
            recipient,
            content,
            timestamp: Date.now(),
        };
    }
    static createStatusMessage(content) {
        return {
            type: MessageType.STATUS,
            content,
            timestamp: Date.now(),
        };
    }
    static createErrorMessage(content) {
        return {
            type: MessageType.ERROR,
            content,
            timestamp: Date.now(),
        };
    }
}
exports.Protocol = Protocol;
