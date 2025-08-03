// Тип сообщения (пользователь или система)
export var MessageType;
(function (MessageType) {
    MessageType["USER"] = "user";
    MessageType["BOT"] = "bot";
})(MessageType || (MessageType = {}));
