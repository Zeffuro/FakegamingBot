const albion = require("../../helpers/albion");

module.exports = {
    name: "guild",
    aliases: [],
    database: true,
    cooldown: 5,
    description: "Retrieves information about guild.",
    guildOnly: false,
    adminOnly: false,
    args: true,
    usage: "<name>",
    async execute(message, args, database) {
        await albion.handleEntityCommand(this.name, message, args, database);
    },
};