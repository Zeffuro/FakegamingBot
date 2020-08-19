const albion = require("../../helpers/albion");

module.exports = {
    name: "untrack",
    aliases: [],
    database: true,
    cooldown: 5,
    description: "Untrack player or guild.",
    guildOnly: false,
    adminOnly: true,
    args: true,
    usage: "<type> <name>",
    async execute(message, args, database) {
        await albion.handleTrackCommand(message, args, database, true);
    },
};