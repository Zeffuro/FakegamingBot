const albion = require("../../helpers/albion");

module.exports = {
    name: "player",
    aliases: [],
    database: true,
    cooldown: 5,
    description: "Retrieves information about player.",
    guildOnly: false,
    adminOnly: false,
    args: true,
    usage: "<name>",
    async execute(message, args, database) {
        await albion.handleEntityCommand(this.name, message, args, database);
    },
};