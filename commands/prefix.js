module.exports = {
    name: "prefix",
    aliases: [],
    database: true,
    cooldown: 5,
    description: "Sets prefix.",
    guildOnly: true,
    adminOnly: true,
    args: true,
    usage: "<prefix>",
    async execute(message, args, database) {
        if(args[0].length > 1){
            return message.channel.send(`Suggested prefix ${args[0]} is too long, please make sure the prefix you submit is only 1 character long.`);
        }

        let serverInfo = await database.Server.findOne({
            where: { serverId: await message.guild.id },
            raw: true
        });
        
        if(serverInfo){
            await database.Server.update(
                {
                    prefix: args[0]
                },
                {
                    where: { serverId: await message.guild.id },
                    raw: true
                }
            );
            return message.channel.send(`Prefix changed to ${args[0]}`);
        }
    },
};