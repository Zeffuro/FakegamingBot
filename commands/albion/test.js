const albion = require("../../helpers/albion");

module.exports = {
    name: "test",
    aliases: [],
    database: true,
    cooldown: 5,
    description: "Test command.",
    guildOnly: false,
    adminOnly: false,
    args: true,
    usage: "",
    async execute(message, args, database) {
        await albion.handleKillDeathCommand(this.name, message, args, database);
    },
};