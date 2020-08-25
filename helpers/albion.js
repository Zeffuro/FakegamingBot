const albion = require("node-albion-api");
const axios = require("axios");
const { registerFont, createCanvas, loadImage, Image } = require("canvas");
const Discord = require("discord.js");
const fs = require("fs");
const moment = require("moment");
const Sequelize = require("sequelize");

module.exports = {
    handleBuildCommand: handleBuildCommand,
    handleEventCommand: handleEventCommand,
    handleKillDeathCommand: handleKillDeathCommand,
    handleTrackCommand: handleTrackCommand,
    scanRecentEvents: scanRecentEvents
};

async function createFightImage (battle){
    const width = 800;
    const height = 560;

    registerFont("fonts/sansation_regular.ttf", { family: "Sansation" });
    registerFont("fonts/sansation_bold.ttf", { family: "Sansation Bold" });

    const canvas = createCanvas(width, height);
    const context = canvas.getContext("2d");

    context.imageSmoothingQuality = "high";
    context.font = "24px \"Sansation Bold\"";

    context.fillStyle = "#2f3136";
    context.fillRect(0, 0, width, height);

    context.fillStyle = "#fff";
    context.textAlign = "center";

    let killerEquip = new Image();
    killerEquip.onload = () => context.drawImage(killerEquip, 0, 88);
    killerEquip.src = await createEquipment(battle.Killer.Equipment);

    let guildString = battle.Killer.AllianceName !== "" ? `[${battle.Killer.AllianceName}] ${battle.Killer.GuildName}` : battle.Killer.GuildName;
    context.fillText(guildString, 150, 40);
    context.fillText(battle.Killer.Name, 150, 70);

    let victimEquip = new Image();
    victimEquip.onload = () => context.drawImage(victimEquip, 490, 88);
    victimEquip.src = await createEquipment(battle.Victim.Equipment);
    
    guildString = battle.Victim.AllianceName !== "" ? `[${battle.Victim.AllianceName}] ${battle.Victim.GuildName}` : battle.Victim.GuildName;
    context.fillText(guildString, 640, 40);
    context.fillText(battle.Victim.Name, 640, 70);

    context.fillStyle = "#ff4e4e";
    context.textAlign = "right";
    context.fillText(Math.floor(battle.Killer.AverageItemPower), 280, 450);
    context.textAlign = "left";
    context.fillText(Math.floor(battle.Victim.AverageItemPower), 510, 450);

    let powerDifference = battle.Killer.AverageItemPower - battle.Victim.AverageItemPower;
    
    context.fillStyle = Math.sign(powerDifference) <= 0 ? "#ffff00" : "#88ff00";
    context.textAlign = "center";
    context.fillText(`${Math.sign(powerDifference) <= 0 ? "" : "+"}${Math.floor(powerDifference)}`, 400, 450);

    context.fillStyle = "#fff";
    context.fillText(moment(battle.TimeStamp).format("DD-MM-YYYY HH:mm:ss"), 400, 500);

    let fameString = battle.TotalVictimKillFame.toLocaleString();
    let fameWidth = context.measureText(fameString);
    let fameIconLocationX = (400 - Math.floor((fameWidth.width) / 2)) - 40;
    let fameIconLocationY = 410;
    let fameImage = await loadImage("images/FAME.png");

    context.drawImage(fameImage, fameIconLocationX, fameIconLocationY - 28, 35, 35);
    context.fillText(fameString, 400, fameIconLocationY);

    let usefulPlayerActions = getUsefulPlayerActions(battle);
    for (let i = 0; i < usefulPlayerActions.length; i++) {
        let y = 130 + (i * 24);
        let player = usefulPlayerActions[i];
        context.fillStyle = player.Type === "Damage" ? "#ff4e4e" : "#88ff00";
        let currentPlayerName = player.Name;
        let actionLine = `${currentPlayerName}: ${Math.floor(player.Value)}`;

        while(context.measureText(actionLine).width > 190){
            currentPlayerName = currentPlayerName.slice(0, -1);
            actionLine = `${currentPlayerName}: ${Math.floor(player.Value)}`;
        }
        
        context.fillText(actionLine, 400, y);
    }

    return canvas.toBuffer("image/png", { compressionLevel: 1, filters: canvas.PNG_FILTER_NONE });
}

async function createMiniFight (battle){
    const width = 800;
    const height = 100;
    
    const canvas = createCanvas(width, height);
    const context = canvas.getContext("2d");

    context.imageSmoothingQuality = "high";
    context.font = "14px \"Sansation Bold\"";

    context.fillStyle = "#fff";
    context.textAlign = "center";

    let killerEquip = new Image();
    let victimEquip = new Image();

    let guildString = battle.Killer.AllianceName !== "" ? `[${battle.Killer.AllianceName}] ${battle.Killer.GuildName}` : battle.Killer.GuildName;

    context.fillText(guildString, 150, 15);
    context.fillText(battle.Killer.Name, 150, 35);

    killerEquip.onload = () => context.drawImage(killerEquip, 0, 40);
    killerEquip.src = await createMiniEquipment(battle.Killer.Equipment);

    guildString = battle.Victim.AllianceName !== "" ? `[${battle.Victim.AllianceName}] ${battle.Victim.GuildName}` : battle.Victim.GuildName;
    context.fillText(guildString, 650, 15);
    context.fillText(battle.Victim.Name, 650, 35);

    victimEquip.onload = () => context.drawImage(victimEquip, 500, 40);
    victimEquip.src = await createMiniEquipment(battle.Victim.Equipment);

    context.fillStyle = "#ff4e4e";
    context.textAlign = "right";
    context.fillText(Math.floor(battle.Killer.AverageItemPower), 350, 75);
    context.textAlign = "left";
    context.fillText(Math.floor(battle.Victim.AverageItemPower), 450, 75);

    let powerDifference = battle.Killer.AverageItemPower - battle.Victim.AverageItemPower;
    
    context.fillStyle = Math.sign(powerDifference) <= 0 ? "#ffff00" : "#88ff00";
    context.textAlign = "center";
    context.fillText(`${Math.sign(powerDifference) <= 0 ? "" : "+"}${Math.floor(powerDifference)}`, 400, 75);

    context.fillStyle = "#fff";

    let fameString = battle.TotalVictimKillFame.toLocaleString();
    let fameWidth = context.measureText(fameString);
    let fameIconLocationX = (400 - Math.floor((fameWidth.width) / 2)) - 24;
    let fameIconLocationY = 40;
    let fameImage = await loadImage("images/FAME.png");

    context.drawImage(fameImage, fameIconLocationX, fameIconLocationY - 16, 20, 20);
    context.fillText(fameString, 400, fameIconLocationY);

    return canvas.toBuffer();
}

async function createMiniFightCollection (eventData){
    const width = 800;
    const height = 1000;

    registerFont("fonts/sansation_regular.ttf", { family: "Sansation" });
    registerFont("fonts/sansation_bold.ttf", { family: "Sansation Bold" });

    const canvas = createCanvas(width, height);
    const context = canvas.getContext("2d");

    context.imageSmoothingQuality = "high";
    context.font = "14px \"Sansation Bold\"";

    context.fillStyle = "#2f3136";
    context.fillRect(0, 0, width, height);

    context.fillStyle = "#fff";
    context.textAlign = "center";

    let currentX = 0;
    let currentY = 0;

    let image = new Image();

    for (const battle of eventData) {
        image.onload = () => context.drawImage(image, currentX, currentY);
        image.src = await createMiniFight(battle);

        currentX = 0;
        currentY += 100;

        context.fillStyle = "#17181b";
        context.fillRect(0, currentY - 4, width, 2);
    }

    return canvas.toBuffer("image/png", { compressionLevel: 1, filters: canvas.PNG_FILTER_NONE });
}

async function createEmbed (battle) {
    let image = await createFightImage(battle);
 
    let mainAttach = new Discord.MessageAttachment(image, "main.png");
    let mainEmbed = new Discord.MessageEmbed()
        .setTitle(`${battle.Killer.Name} has killed ${battle.Victim.Name}`)
        .attachFiles(mainAttach)
        .setImage("attachment://main.png")
        .setURL(`https://albiononline.com/en/killboard/kill/${battle.EventId}`)
        .setFooter("Contact me on Discord (Zeffuro#3033) for any questions.");

    let inventoryArray = Object.values(battle.Victim.Inventory).filter(x => x !== null);
    let inventoryEmbed;
    if(inventoryArray.length > 0){
        let inventory = await createInventory(battle.Victim.Inventory);
        let inventoryAttach = new Discord.MessageAttachment(inventory, "inventory.png");
        inventoryEmbed = new Discord.MessageEmbed()
            .setTitle("Inventory")
            .attachFiles(inventoryAttach)
            .setImage("attachment://inventory.png");
    }  

    return {
        main: mainEmbed,
        inventory: inventoryEmbed
    };
}

async function createMiniEmbed (eventData) {
    let image = await createMiniFightCollection(eventData);
    //let image = await createMiniEquipment(eventData[0].Killer.Equipment);
 
    let mainAttach = new Discord.MessageAttachment(image, "main.png");
    let mainEmbed = new Discord.MessageEmbed()
        .attachFiles(mainAttach)
        .setImage("attachment://main.png")
        .setFooter("Contact me on Discord (Zeffuro#3033) for any questions.");

    return {
        main: mainEmbed,
        inventory: undefined
    };
}

async function createEquipment (equipment) {
    const width = 300;
    const height = 560;
    const itemSize = 110;

    registerFont("fonts/sansation_regular.ttf", { family: "Sansation" });
    registerFont("fonts/sansation_bold.ttf", { family: "Sansation Bold" });

    const canvas = createCanvas(width, height);
    const context = canvas.getContext("2d");
    context.font = "14px \"Sansation\"";

    let equipLocation = {
        Bag: { x: 0, y: 10 },
        Head: { x: 100, y: 0 },
        Cape: { x: 200, y: 10 },
        MainHand: { x: 0, y: 110 },
        Armor: { x: 100, y: 100 },
        OffHand: { x: 200, y: 110 },
        Food: { x: 0, y: 210 },
        Shoes: { x: 100, y: 200 },
        Potion: { x: 200, y: 210 },
        Mount: { x: 100, y: 300 },
    };

    let itemList = {};
    for (const [name, item] of Object.entries(equipment)) {
        if(item !== null){
            let location = equipLocation[name];
            let imagePath = "";
            try {
                imagePath = await getOrSaveItemImage(item);
                let image = await loadImage(imagePath);
                context.drawImage(image, location.x, location.y, itemSize, itemSize);
            } catch(err){
                console.log(imagePath);
                console.log(err);
            }            

            context.fillStyle = "#fff";
            context.fillText(item.Count, location.x + 80, location.y + 85);
            let itemMarket = await getItemMarketPrices(item.Type);
            itemList[item.Type] = itemMarket;
        }
    }

    if(Object.entries(itemList).length === 0){
        let naked = await loadImage("images/NAKED.png");
        context.drawImage(naked, 0, -100, width, height);
    }else{
        createEstimatedPricesImage(itemList, context, 0, 440);
    }

    return canvas.toBuffer();
}

async function createMiniEquipment (equipment) {
    const width = 300;
    const height = 60;
    const itemSize = 55;

    registerFont("fonts/sansation_regular.ttf", { family: "Sansation" });
    registerFont("fonts/sansation_bold.ttf", { family: "Sansation Bold" });

    const canvas = createCanvas(width, height);
    const context = canvas.getContext("2d");
    context.font = "14px \"Sansation\"";

    let equipLocation = {
        Bag: { x: -100, y: -100 },
        Head: { x: 50, y: 0 },
        Cape: { x: 200, y: 0 },
        MainHand: { x: 0, y: 0 },
        Armor: { x: 100, y: 0 },
        OffHand: { x: 250, y: 0 },
        Food: { x: -100, y: -100 },
        Shoes: { x: 150, y: 0 },
        Potion: { x: -100, y: -100 },
        Mount: { x: -100, y: -100 },
    };

    for (const [name, item] of Object.entries(equipment)) {
        if(item !== null){
            let location = equipLocation[name];
            let imagePath = "";
            try {
                imagePath = await getOrSaveItemImage(item);
                let image = await loadImage(imagePath);
                context.drawImage(image, location.x, location.y, itemSize, itemSize);
            } catch(err){
                console.log(imagePath);
                console.log(err);
            }
        }
    }

    return canvas.toBuffer();
}

async function createInventory (inventory) {
    const width = 800;

    let inventoryArray = Object.values(inventory).filter(x => x !== null);
    
    const height = (Math.ceil(inventoryArray.length / 8) * 100) + 60;
    const itemSize = 110;
    const spacing = 100;

    registerFont("fonts/sansation_regular.ttf", { family: "Sansation" });
    registerFont("fonts/sansation_bold.ttf", { family: "Sansation Bold" });

    const canvas = createCanvas(width, height);
    const context = canvas.getContext("2d");
    
    context.fillStyle = "#2f3136";
    context.fillRect(0, 0, width, height);

    context.font = "14px \"Sansation\"";

    let currentX = 0;
    let currentY = 0;
    context.fillStyle = "#fff";
    context.textAlign = "center";

    let j = 0;
    let itemList = {};
    for (let i = 0; i < inventoryArray.length; i++) {
        const item = inventoryArray[i];
        let imagePath = await getOrSaveItemImage(item);
        let image = await loadImage(imagePath);
        
        context.drawImage(image, currentX, currentY, itemSize, itemSize);        
        context.fillText(item.Count, currentX + 83, currentY + 85);
        currentX += spacing;
        j++;
        if(j === 8){
            j = 0;
            currentX = 0;
            currentY += spacing;
        }
        let itemMarket = await getItemMarketPrices(item.Type);
        itemList[item.Type] = itemMarket;
    }
    currentX = 0;
    currentY += 120;

    context.textAlign = "left";

    createEstimatedPricesImage(itemList, context, currentX, currentY);

    return canvas.toBuffer();
}

function createEstimatedPricesImage(itemList, context, x, y) {
    let itemPrices = {};
    for (const market of Object.values(itemList)) {
        for (const location of market) {
            let price = location.data[location.data.length - 1].avg_price;
            if(itemPrices[location.location] === undefined){
                itemPrices[location.location] = price;
            }else{
                itemPrices[location.location] += price;
            }
        }
    }

    let currentX = x;
    let currentY = y;
    context.font = "18px \"Sansation Bold\"";
    context.fillText("Est. Market Value", currentX, currentY);
    currentY += 20;
    let drawPrice = false;
    for (const [location, price] of Object.entries(itemPrices)) {
        switch(location){
        case "Bridgewatch":     // Yellow
            context.fillStyle = "#ffff00";
            currentX = 0;
            drawPrice = true;
            break;
        case "Caerleon":        // Red
            context.fillStyle = "#ff4e4e";
            currentX = 60;
            drawPrice = true;
            break;
        case "Fort Sterling":   // White
            context.fillStyle = "#ffffff";
            currentX = 120;
            drawPrice = true;
            break;
        case "Lymhurst":        // Green
            context.fillStyle = "#88ff00";
            currentX = 180;
            drawPrice = true;
            break;
        case "Martlock":        // Blue
            context.fillStyle = "#00bfff";
            currentX = 240;
            drawPrice = true;
            break;
        default:                // Ignore Black Market and Rests
            drawPrice = false;
            break;
        }
        if(drawPrice){
            context.fillText(abbreviateNumber(price), currentX, currentY);
        }
    }
}

function getUsefulPlayerActions(battle) {
    let usefulPlayerActions = [];

    for (let player of battle.Participants) {
        if(player.DamageDone > 0) {
            player.Type = "Damage";
            player.Value = player.DamageDone;
            usefulPlayerActions.push(player);
        }
        if(player.SupportHealingDone > 0) {
            player.Type = "Healing";
            player.Value = player.SupportHealingDone;
            usefulPlayerActions.push(player);
        }
    }
    usefulPlayerActions.sort((a, b) => a.Value - b.Value);
    usefulPlayerActions.sort((a, b) => {
        if(a.Type < b.Type){
            return -1;
        }
        if(a.Type > b.Type){
            return 1;
        }
        return 0;
    });
    return usefulPlayerActions.slice(0,11);
}

async function getItemMarketPrices(itemType){
    let response = await axios.get(`https://www.albion-online-data.com/api/v2/stats/history/${itemType}?time-scale=24`);
    return response.data; 
}

async function getPlayerKills (player){
    try{
        return await Promise.resolve(albion.kills(player.id));
    }catch(err){
        console.log(err);
    }
}

async function getPlayerDeaths (player){
    try{
        return await Promise.resolve(albion.deaths(player.id));
    }catch(err){
        console.log(err);
    }
}

async function getEventData (eventId){
    try{
        return await Promise.resolve(albion.event(eventId));
    }catch(err){
        console.log(err);
    }
}

async function getEntityInfo (name, type, database){
    let entityInfo = await database.Albion.Entity.findOne({
        where: { 
            name: {
                [Sequelize.Op.like]: name
            }
        },
        raw: true
    });
    
    if(!entityInfo){
        let foundEntity;
        let searchResults = await Promise.resolve(albion.search(name));
        switch(type){
        case 0:     // Player
            foundEntity = searchResults.players.find(x => x.Name == name);
            break;
        case 1:     // Guild
            foundEntity = searchResults.guilds.find(x => x.Name == name);
            break;
        case 2:     // Alliance
            foundEntity = searchResults.guilds.find(x => x.Name == name);
            break;
        default:    // Invalid type
            break;
        }

        if(foundEntity !== undefined){
            await database.Albion.Entity.create({
                id: foundEntity.Id,
                name: foundEntity.Name,
                type: type
            });

            entityInfo = await database.Albion.Entity.findOne({
                where: { 
                    name: {
                        [Sequelize.Op.like]: name
                    }
                },
                raw: true
            });
        }
    }

    return entityInfo;
}

async function getOrSaveItemImage(item){
    let imageItemPath = `images/items/${item.Type}-${item.Quality}.png`;
    if(!fs.existsSync(imageItemPath)){
        await downloadImage(`https://render.albiononline.com/v1/item/${item.Type}.png?quality=${item.Quality}`, imageItemPath);
    }

    return imageItemPath;
}

async function handleBuildCommand(message, args, database) {

}

async function handleEventCommand(message, args) {
    let loadingMessage = await message.channel.send("Retrieving data from Albion Online API, sometimes this can take a very long time.");
    let eventId = args[0];
    let event = await getEventData(eventId);

    if(event.length === 0){
        return loadingMessage.edit(`No results found for ${eventId}`);
    }

    handleEventData(event, message.channel, loadingMessage);
}

async function handleEventData(eventData, channel, loadingMessage, mini = false){
    let embed;
    if(mini){
        embed = await createMiniEmbed(eventData);
    }else{
        embed = await createEmbed(eventData);
    }

    if(loadingMessage){
        loadingMessage.delete();
    }

    channel.send(embed.main);
    if(embed.inventory !== undefined){
        channel.send(embed.inventory);
    }
}

async function handlePlayerArguments(command, loadingMessage, message, args, database){
    let player = args[0];
    let playerInfo;

    if(args.length === 0){
        playerInfo = await getEntityInfo(message.author.username, 0, database);
        if(!playerInfo) return loadingMessage.edit(`Player not found, please use \`!${command} <name>\` or change your username to your charactername. ${message.author}`);
    }

    if(!playerInfo){
        playerInfo = await getEntityInfo(player, 0, database);
    }

    if(!playerInfo){
        return loadingMessage.edit(`Unable to load data for ${player}, are you sure you typed your character name correctly?`);
    }

    await loadingMessage.edit(`Found player, now retrieving ${command} data from Albion Online API, sometimes this can take a very long time.`);

    return playerInfo;
}

async function handleKillDeathCommand(command, message, args, database) {
    let loadingMessage = await message.channel.send("Retrieving data from Albion Online API, sometimes this can take a very long time.");
    let playerInfo = await handlePlayerArguments(command, loadingMessage, message, args, database);

    let event;
    switch(command){
    case "lastkill":
        event = await getPlayerKills(playerInfo);
        if(event.length === 0){
            return loadingMessage.edit(`${playerInfo.Name} has no kills, this is probably a new player or a scout...`);
        }
        handleEventData(event[0], message.channel, loadingMessage);
        break;
    case "lastdeath":
        event = await getPlayerDeaths(playerInfo);
        if(event.length === 0){
            return loadingMessage.edit(`${playerInfo.Name} has no deaths, this man is probably a god!`);
        }
        handleEventData(event[0], message.channel, loadingMessage);
        break;
    case "last10kills":
        event = await getPlayerKills(playerInfo);
        if(event.length === 0){
            return loadingMessage.edit(`${playerInfo.Name} has no kills, this is probably a new player or a scout...`);
        }
        handleEventData(event, message.channel, loadingMessage, true);
        break;
    case "last10deaths":
        event = await getPlayerDeaths(playerInfo);
        if(event.length === 0){
            return loadingMessage.edit(`${playerInfo.Name} has no deaths, this man is probably a god!`);
        }
        handleEventData(event, message.channel, loadingMessage, true);
        break;
    default:
        break;
    }
}

async function handleTrackCommand(message, args, database, remove = false){
    if(args.length < 2){
        return message.channel.send("Not enough arguments provided.");
    }
    
    let type;
    switch(args[0]){
    case "player":
        type = 0;
        break;
    case "guild":
        type = 1;
        break;
    default:
        return message.channel.send("No valid type provided, valid types are: player, guild.");
    }
    let entity = args.slice(1).join(" ");
    let entityInfo;

    entityInfo = await getEntityInfo(entity, type, database);
    if(!entityInfo){
        return message.channel.send(`The ${args[0]} ${entity} doesn't seem to exist!`);
    }

    let trackEntry = await database.Albion.ServerTrack.findAll({
        where: {
            serverId: await message.guild.id,
            entityId: entityInfo.id
        },
        raw: true
    });

    if(trackEntry.length === 1 && !remove){
        return message.channel.send(`The ${args[0]} ${entity} is already being tracked!`);
    }
    if(trackEntry.length === 0 && remove){        
        return message.channel.send(`The ${args[0]} ${entity} is not being tracked!`);
    }

    if(!remove){
        await database.Albion.ServerTrack.create({
            serverId: await message.guild.id,
            entityId: entityInfo.id,
            channelId: message.channel.id
        });
    }else{
        await database.Albion.ServerTrack.destroy({
            where: {
                serverId: await message.guild.id,
                entityId: entityInfo.id
            }
        });
    }

    return message.channel.send(`Tracking for ${args[0]} ${entity} now ${remove ? "removed" : "added"}!`);
}

async function scanRecentEvents (database, client){
    let trackEntries = await database.Albion.ServerTrack.findAll({
        include: [{model: database.Albion.Entity}],
        raw: true
    });

    let info = await database.Albion.Static.findOne({
        where: { 
            id: 1
        },
        raw: true
    });

    let events = [];
    let page = 0;
    let doOnePage = info.lastEventId === "0";
    let processNextPage = true;
    try{
        do {
            console.log(`Getting events page ${page}`);
            let newEvents = await albion.events(page);
            events = events.concat(newEvents);
            console.log(`Last eventId on page: ${newEvents[newEvents.length - 1].EventId} - Last eventId database: ${info.lastEventId}`);
            page++;
            if(doOnePage){
                break;
            }
            processNextPage = events.filter(x => x.EventId <= info.lastEventId).length === 0 && page !== 20;
        }
        while(processNextPage);

        await database.Albion.Static.update(
            {
                lastEventId: events[0].EventId
            },
            {
                where: {
                    id: 1
                }
            }
        );

        for (const event of events) {
            if(event.EventId <= info.lastEventId){
                break;
            }
            for (const trackEntry of trackEntries) {
                switch(trackEntry["entity.type"]){
                case 0:     // Player
                    if((event.Killer.Id == trackEntry.entityId) || (event.Victim.Id == trackEntry.entityId)){
                        console.log(`Found event for ${trackEntry["entity.name"]}.`);
                        handleEventData(event, client.channels.cache.get(trackEntry.channelId));
                    }
                    break;
                case 1:     // Guild
                    if((event.Killer.GuildId == trackEntry.entityId) || (event.Victim.GuildId == trackEntry.entityId)){
                        console.log(`Found event for ${trackEntry["entity.name"]}.`);
                        handleEventData(event, client.channels.cache.get(trackEntry.channelId));
                    }
                    break;
                default:    // Invalid
                    break;
                }
            }
        }
    } catch(err){
        console.log(err);
    }
    console.log("Scan done.");
}

async function downloadImage (url, path) {
    const writer = fs.createWriteStream(path);
    // axios image download with response type "stream"
    const response = await axios({
        method: "GET",
        url: url,
        responseType: "stream"
    });

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
    });
}

const SI_SYMBOL = ["", "k", "M", "G", "T", "P", "E"];

function abbreviateNumber(number){
    let tier = Math.log10(number) / 3 | 0;
    if(tier == 0) return number;
    let suffix = SI_SYMBOL[tier];
    let scale = Math.pow(10, tier * 3);
    let scaled = number / scale;
    return scaled.toFixed(1) + suffix;
}