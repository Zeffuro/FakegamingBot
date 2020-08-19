const albion = require("../../helpers/albion");

module.exports = {
    name: "event",
    aliases: [],
    database: false,
    cooldown: 5,
    description: "Retrieves information about event.",
    guildOnly: false,
    adminOnly: false,
    args: true,
    usage: "<eventId>",
    async execute(message, args) {
        await albion.handleEventCommand(message, args);
    },
};