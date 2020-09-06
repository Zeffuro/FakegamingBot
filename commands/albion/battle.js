const albion = require("../../helpers/albion");

module.exports = {
    name: "battle",
    aliases: [],
    database: false,
    cooldown: 5,
    description: "Retrieves information about a battle.",
    guildOnly: false,
    adminOnly: false,
    args: true,
    usage: "<battleId>",
    async execute(message, args) {
        await albion.handleBattleCommand(message, args);
    },
};