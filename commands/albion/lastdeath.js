const albion = require("../../helpers/albion");

module.exports = {
    name: "lastdeath",
    aliases: [],
    database: true,
    cooldown: 5,
    description: "Retrieves your last Albion Death.",
    guildOnly: false,
    adminOnly: false,
    args: false,
    usage: "<name>",
    async execute(message, args, database) {
        await albion.handleKillDeathCommand(this.name, message, args, database);
    },
};