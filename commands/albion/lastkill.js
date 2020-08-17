const albion = require("../../helpers/albion");

module.exports = {
    name: "lastkill",
    aliases: [],
    database: true,
    cooldown: 5,
    description: "Retrieves your last Albion Kill.",
    guildOnly: false,
    args: false,
    usage: "<name>",
    async execute(message, args, database) {
        await albion.handleKillDeathCommand("lastkill", message, args, database);
    },
};