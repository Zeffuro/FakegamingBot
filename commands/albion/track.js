const albion = require("../../helpers/albion");

module.exports = {
    name: "track",
    aliases: [],
    database: true,
    cooldown: 5,
    description: "Track player or guild.",
    guildOnly: false,
    adminOnly: true,
    args: true,
    usage: "<entitytype> <tracktype> <name>",
    async execute(message, args, database) {
        await albion.handleTrackCommand(message, args, database);
    },
};