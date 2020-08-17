const albion = require("../../helpers/albion");

module.exports = {
    name: "event",
    aliases: [],
    database: false,
    cooldown: 5,
    description: "Retrieves your last Albion Death.",
    guildOnly: false,
    args: true,
    usage: "<eventId>",
    async execute(message, args) {
        await albion.handleEventCommand(message, args);
    },
};