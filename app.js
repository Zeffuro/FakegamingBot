const Cron = require("node-cron");
const Discord = require("discord.js");
const ReadDir = require("fs-readdir-recursive");
const Readline = require("readline");
const { transports, format, createLogger } = require("winston");
const { Database } = require("./sequelize");
const { token, defaultCooldown } = require("./config.json");
const albion = require("./helpers/albion");

var scanCurrentlyRunning = false;

const client = new Discord.Client();
client.commands = new Discord.Collection();
const cooldowns = new Discord.Collection();

const logger = createLogger({
    level: "info",
    format: format.combine(
        format.timestamp(),
        format.colorize(),
        format.printf(info => `[${info.timestamp}] ${info.level}: ${info.message}`)
    ),
    transports: [
        new transports.Console()
    ]
});

const commandFiles = ReadDir("./commands").filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}

const rl = Readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true
});

rl.on("line", function(line){
    if(line === "scan"){
        albion.scanRecentEvents(Database, client);
    }
});

client.once("ready", () => {
    logger.info("Ready!");
    Cron.schedule("*/1 * * * *", async () => {
        if(!scanCurrentlyRunning){
            scanCurrentlyRunning = true;
            try {
                await albion.scanRecentEvents(Database, client);
            } catch (error) {
                logger.info("Something went wrong with Albion Events skin.");
            }
            scanCurrentlyRunning = false;
        }
    });
});

client.on("message", async message => {
    let serverInfo;
    if(message.channel.type !== "dm"){
        serverInfo = await Database.Server.findOne({
            where: { serverId: await message.guild.id },
            raw: true
        });
        if(!serverInfo){
            await Database.Server.create({
                serverId: await message.guild.id,
                prefix: "!"
            });
            serverInfo = await Database.Server.findOne({
                where: { serverId: await message.guild.id },
                raw: true
            });
        }
    }

    let prefix = "!";
    if(serverInfo) prefix = serverInfo.prefix;

    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    
    const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

    if (!command) return;

    if (command.adminOnly && !message.member.hasPermission("ADMINISTRATOR")) {
        return message.reply("Only Administrator's can use this command!");
    }

    if (command.guildOnly && message.channel.type === "dm") {
        return message.reply("I can't execute that command inside DMs!");
    }

    if (command.args && !args.length) {
        let reply = `You didn't provide any arguments, ${message.author}!`;

        if (command.usage) {
            reply += `\nThe proper usage would be: \`${prefix}${command.name} ${command.usage}\``;
        }

        return message.channel.send(reply);
    }
    
    if (!cooldowns.has(command.name)) {
        cooldowns.set(command.name, new Discord.Collection());
    }
    
    const now = Date.now();
    const timestamps = cooldowns.get(command.name);
    const cooldownAmount = (command.cooldown || defaultCooldown) * 1000;
    
    if (timestamps.has(message.author.id)) {
        const expirationTime = timestamps.get(message.author.id) + cooldownAmount;
    
        if (now < expirationTime) {
            const timeLeft = (expirationTime - now) / 1000;
            return message.reply(`Please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`);
        }
        timestamps.set(message.author.id, now);
        setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
    }

    try {
        
        command.database ? command.execute(message, args, Database) :  command.execute(message, args);
    } catch (error) {
        logger.error(error);
        message.reply("There was an error trying to execute that command!");
    }
});

client.login(token);