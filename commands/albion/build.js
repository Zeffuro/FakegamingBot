const albion = require("../../helpers/albion");

module.exports = {
    name: "build",
    aliases: [],
    database: true,
    cooldown: 5,
    description: "Retrieves a build.",
    guildOnly: false,
    adminOnly: false,
    args: true,
    usage: "",
    async execute(message, args, database) {
        await albion.handleBuildCommand(message, args, database);
    },
};