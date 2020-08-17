const Cron = require("node-cron");
const Discord = require("discord.js");
const ReadDir = require("fs-readdir-recursive");
const Readline = require("readline");
const { Database } = require("./sequelize");
const { prefix, token, defaultCooldown } = require("./config.json");
const albion = require("./helpers/albion");

const client = new Discord.Client();
client.commands = new Discord.Collection();
const cooldowns = new Discord.Collection();

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
    console.log("Ready!");
    Cron.schedule("*/15 * * * *", () => {
        console.log("Running scheduled scan of Albion events.");
        albion.scanRecentEvents(Database, client);
    });
});

client.on("message", message => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    
    const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

    if (!command) return;

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
        console.error(error);
        message.reply("There was an error trying to execute that command!");
    }
});

client.login(token);