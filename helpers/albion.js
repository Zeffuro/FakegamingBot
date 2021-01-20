const albion = require("albion-api-zeff");
const axios = require("axios");
const { registerFont, createCanvas, loadImage, Image } = require("canvas");
const { transports, format, createLogger } = require("winston");
const Discord = require("discord.js");
const fs = require("fs");
const moment = require("moment");
const Sequelize = require("sequelize");

const logger = createLogger({
    level: "info",
    format: format.combine(
        format.timestamp(),
        format.printf(info => `[${info.timestamp}] ${info.level}: ${info.message}`)
    ),
    transports: [
        new transports.Console()
    ]
});

module.exports = {
    handleBuildCommand: handleBuildCommand,
    handleBattleCommand: handleBattleCommand,
    handleEntityCommand: handleEntityCommand,
    handleEventCommand: handleEventCommand,
    handleKillDeathCommand: handleKillDeathCommand,
    handleTrackCommand: handleTrackCommand,
    scanRecentEvents: scanRecentEvents,
    scanRecentBattles: scanRecentBattles
};

async function createBattleImage (battle){
    const width = 800;
    let height = 300;
    
    let mainParticipants = getBattleParticipants(battle);

    if(mainParticipants.length < 5){
        height += mainParticipants.length * 30;
    }else{
        height += (5 * 30);
    }    

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

    let participantsTitle = `${mainParticipants[0].name} (${mainParticipants[0].players}) vs ${mainParticipants[1].name} (${mainParticipants[1].players})`;
    if(mainParticipants.length > 2){
        participantsTitle = `${mainParticipants[0].name} (${mainParticipants[0].players}) vs ${mainParticipants[1].name} (${mainParticipants[1].players}) vs ${mainParticipants[2].name} (${mainParticipants[2].players})`;
    }

    let currentY = 40;
    context.font = "30px \"Sansation Bold\"";
    context.fillText(participantsTitle, width / 2, currentY);

    currentY += 40;
    context.fillText(moment.utc(battle.startTime).format("DD-MM-YYYY HH:mm:ss"), width / 2, currentY);

    const factionX = 125;
    const playersX = 250;
    const killsX = 375;
    const deathsX = 500;
    const killFameX = 625;

    currentY += 50;
    context.font = "24px \"Sansation Bold\"";
    context.fillStyle = "#a6a6a6";
    context.fillText("FACTION", factionX, currentY);
    context.fillText("PLAYERS", playersX, currentY);
    context.fillText("KILLS", killsX, currentY);
    context.fillText("DEATHS", deathsX, currentY);
    context.fillText("KILLFAME", killFameX, currentY);

    currentY += 30;
    let i = 0;

    for (let participant of mainParticipants.slice(0, 5)) {
        if(i === 0){
            context.fillStyle = "#88ff00";
        }else if(i === 1){
            context.fillStyle = "#ff4e4e";
        }else{
            context.fillStyle = "#fff";
        }
        context.fillText(participant.name, factionX, currentY);
        context.fillText(participant.players, playersX, currentY);
        context.fillText(participant.kills, killsX, currentY);
        context.fillText(participant.deaths, deathsX, currentY);
        context.fillText(participant.killFame.toLocaleString(), killFameX, currentY);
        currentY += 25;
        i++;
    }

    currentY += 30;
    context.font = "30px \"Sansation Bold\"";
    context.fillStyle = "#fff";
    context.fillText(`A total of ${battle.totalKills} players slaughtered`, width / 2, currentY);
    currentY += 30;
    let duration = moment.duration(moment(battle.endTime).diff(battle.startTime));
    context.fillText(`in a battle that took ${duration.minutes()} minutes and ${duration.seconds()} seconds`, width / 2, currentY);
    currentY += 30;
    context.fillText("for the total killfame of", width / 2, currentY);
    currentY += 30;

    let fameString = battle.totalFame.toLocaleString();
    let fameWidth = context.measureText(fameString);
    let fameIconLocationX = ((width / 2) - Math.floor((fameWidth.width) / 2)) - 40;
    let fameIconLocationY = currentY;
    let fameImage = await loadImage("images/FAME.png");

    context.drawImage(fameImage, fameIconLocationX, fameIconLocationY - 28, 35, 35);
    context.fillText(fameString, 400, fameIconLocationY);

    return canvas.toBuffer("image/png", { compressionLevel: 1, filters: canvas.PNG_FILTER_NONE });
}

async function createPlayerImage (entityDetails){
    const width = 800;
    const height = 400;

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

    let currentY = 40;
    context.font = "30px \"Sansation Bold\"";

    let guildString = entityDetails.AllianceName !== "" ? `[${entityDetails.AllianceName}] ${entityDetails.GuildName}` : entityDetails.GuildName;

    context.fillText(guildString, width / 2, currentY);
    currentY += 40;
    context.fillText(entityDetails.Name, width / 2, currentY);

    currentY += 50;
    context.font = "24px \"Sansation Bold\"";
    context.textAlign = "left";

    let totalFame = entityDetails.KillFame + 
    entityDetails.LifetimeStatistics.PvE.Total + 
    entityDetails.LifetimeStatistics.Gathering.All.Total + 
    entityDetails.LifetimeStatistics.Crafting.Total +
    entityDetails.LifetimeStatistics.CrystalLeague;

    context.fillText(`Total: ${totalFame.toLocaleString()}`, 20, 120);
    context.fillText(`PVP: ${entityDetails.KillFame.toLocaleString()}`, 20, 150);
    context.fillText(`PVE: ${entityDetails.LifetimeStatistics.PvE.Total.toLocaleString()}`, 20, 180);
    context.fillText(`Gathering: ${entityDetails.LifetimeStatistics.Gathering.All.Total.toLocaleString()}`, 20, 210);
    context.fillText(`Crafting: ${entityDetails.LifetimeStatistics.Crafting.Total.toLocaleString()}`, 20, 240);
    context.fillText(`Crystal League: ${entityDetails.LifetimeStatistics.CrystalLeague.toLocaleString()}`, 20, 270);
    context.fillText(`DeathFame: ${entityDetails.DeathFame.toLocaleString()}`, 20, 300);
    context.fillText(`FameRatio: ${entityDetails.FameRatio}`, 20, 330);

    context.fillText("PVE Fame Breakdown", 420, 120);
    context.fillText(`Royal Zones: ${entityDetails.LifetimeStatistics.PvE.Royal.toLocaleString()}`, 420, 150);
    context.fillText(`Outland Zones: ${entityDetails.LifetimeStatistics.PvE.Outlands.toLocaleString()}`, 420, 180);
    context.fillText(`Roads of Avalon: ${entityDetails.LifetimeStatistics.PvE.Avalon.toLocaleString()}`, 420, 210);
    context.fillText(`Hellgates: ${entityDetails.LifetimeStatistics.PvE.Hellgate.toLocaleString()}`, 420, 240);
    context.fillText(`Corrupted Dungeons: ${entityDetails.LifetimeStatistics.PvE.CorruptedDungeon.toLocaleString()}`, 420, 270);

    /*
    let fameString = battle.totalFame.toLocaleString();
    let fameWidth = context.measureText(fameString);
    let fameIconLocationX = ((width / 2) - Math.floor((fameWidth.width) / 2)) - 40;
    let fameIconLocationY = currentY;
    let fameImage = await loadImage("images/FAME.png");

    context.drawImage(fameImage, fameIconLocationX, fameIconLocationY - 28, 35, 35);
    context.fillText(fameString, 400, fameIconLocationY);
    */

    return canvas.toBuffer("image/png", { compressionLevel: 1, filters: canvas.PNG_FILTER_NONE });
}

async function createGuildImage (entityDetails){
    const width = 800;
    const height = 400;

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

    let currentY = 40;
    context.font = "30px \"Sansation Bold\"";

    let guildString = entityDetails.AllianceName !== "" ? `[${entityDetails.AllianceName}] ${entityDetails.GuildName}` : entityDetails.GuildName;

    context.fillText(guildString, width / 2, currentY);
    currentY += 40;
    context.fillText(entityDetails.Name, width / 2, currentY);

    currentY += 50;
    context.font = "24px \"Sansation Bold\"";

    let totalFame = entityDetails.KillFame + 
    entityDetails.LifetimeStatistics.PvE.Total + 
    entityDetails.LifetimeStatistics.Gathering.All.Total + 
    entityDetails.LifetimeStatistics.Crafting.Total +
    entityDetails.LifetimeStatistics.CrystalLeague;

    context.fillText(`Total: ${totalFame.toLocaleString()}`, 100, 120);
    context.fillText(`PVP: ${entityDetails.KillFame.toLocaleString()}`, 100, 150);
    context.fillText(`PVE: ${entityDetails.LifetimeStatistics.PvE.Total.toLocaleString()}`, 100, 180);
    context.fillText(`Gathering: ${entityDetails.LifetimeStatistics.Gathering.All.Total.toLocaleString()}`, 100, 210);
    context.fillText(`Crafting: ${entityDetails.LifetimeStatistics.Crafting.Total.toLocaleString()}`, 100, 240);
    context.fillText(`Crystal League: ${entityDetails.LifetimeStatistics.CrystalLeague.toLocaleString()}`, 100, 270);
    context.fillText(`DeathFame: ${entityDetails.DeathFame.toLocaleString()}`, 100, 300);
    context.fillText(`FameRatio: ${entityDetails.FameRatio}`, 100, 330);

    context.fillText("PVE Fame Breakdown", 500, 120);
    context.fillText(`Royal Zones: ${entityDetails.LifetimeStatistics.PvE.Royal.toLocaleString()}`, 500, 150);
    context.fillText(`Outland Zones: ${entityDetails.LifetimeStatistics.PvE.Outlands.toLocaleString()}`, 500, 180);
    context.fillText(`Roads of Avalon: ${entityDetails.LifetimeStatistics.PvE.Avalon.toLocaleString()}`, 500, 210);
    context.fillText(`Hellgates: ${entityDetails.LifetimeStatistics.PvE.Hellgate.toLocaleString()}`, 500, 240);
    context.fillText(`Corrupted Dungeons: ${entityDetails.LifetimeStatistics.PvE.CorruptedDungeon.toLocaleString()}`, 500, 270);

    /*
    let fameString = battle.totalFame.toLocaleString();
    let fameWidth = context.measureText(fameString);
    let fameIconLocationX = ((width / 2) - Math.floor((fameWidth.width) / 2)) - 40;
    let fameIconLocationY = currentY;
    let fameImage = await loadImage("images/FAME.png");

    context.drawImage(fameImage, fameIconLocationX, fameIconLocationY - 28, 35, 35);
    context.fillText(fameString, 400, fameIconLocationY);
    */

    return canvas.toBuffer("image/png", { compressionLevel: 1, filters: canvas.PNG_FILTER_NONE });
}

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
    context.fillText(Math.floor(battle.Killer.AverageItemPower), 350, 60);
    context.textAlign = "left";
    context.fillText(Math.floor(battle.Victim.AverageItemPower), 450, 60);

    let powerDifference = battle.Killer.AverageItemPower - battle.Victim.AverageItemPower;
    
    context.fillStyle = Math.sign(powerDifference) <= 0 ? "#ffff00" : "#88ff00";
    context.textAlign = "center";
    context.fillText(`${Math.sign(powerDifference) <= 0 ? "" : "+"}${Math.floor(powerDifference)}`, 400, 60);

    context.fillStyle = "#fff";

    let fameString = battle.TotalVictimKillFame.toLocaleString();
    let fameWidth = context.measureText(fameString);
    let fameIconLocationX = (400 - Math.floor((fameWidth.width) / 2)) - 24;
    let fameIconLocationY = 30;
    let fameImage = await loadImage("images/FAME.png");

    context.drawImage(fameImage, fameIconLocationX, fameIconLocationY - 16, 20, 20);
    context.fillText(fameString, 400, fameIconLocationY);

    context.fillText(moment(battle.TimeStamp).format("DD-MM-YYYY HH:mm:ss"), 400, 85);

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

async function createBattleEmbed (battle) {
    let image = await createBattleImage(battle);

    let mainParticipants = getBattleParticipants(battle);

    let participantsTitle = `${mainParticipants[0].name} (${mainParticipants[0].players}) vs ${mainParticipants[1].name} (${mainParticipants[1].players})`;
    if(mainParticipants.length > 2){
        participantsTitle = `${mainParticipants[0].name} (${mainParticipants[0].players}) vs ${mainParticipants[1].name} (${mainParticipants[1].players}) vs ${mainParticipants[2].name} (${mainParticipants[2].players})`;
    }

    let mainAttach = new Discord.MessageAttachment(image, "main.png");
    let embed = new Discord.MessageEmbed()
        .setTitle(participantsTitle)
        .attachFiles(mainAttach)
        .setImage("attachment://main.png")
        .setURL(`https://handholdreport.com/killboard/${battle.id}`)
        .setFooter("Contact me on Discord (Zeffuro#3033) for any questions.");

    return embed;
}

async function createEntityEmbed (entityDetails, type) {
    let image;
    switch(type){
    case 0:
        image = await createPlayerImage(entityDetails);
        break;
    case 1:
        image = await createGuildImage(entityDetails);
        break;
    default:
        break;
    }
 
    let mainAttach = new Discord.MessageAttachment(image, "main.png");
    let mainEmbed = new Discord.MessageEmbed()
        .setTitle(`Profile for ${entityDetails.Name}`)
        .attachFiles(mainAttach)
        .setImage("attachment://main.png")
        .setURL(`https://albiononline.com/en/killboard/${type == 0 ? "player" : "guild"}/${entityDetails.Id}`)
        .setFooter("Contact me on Discord (Zeffuro#3033) for any questions.");

    return mainEmbed;
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

    let itemList = [];
    for (const [name, item] of Object.entries(equipment)) {
        if(item !== null){
            let location = equipLocation[name];
            let imagePath = "";
            try {
                imagePath = await getOrSaveItemImage(item);
                let image = await loadImage(imagePath);
                context.drawImage(image, location.x, location.y, itemSize, itemSize);
            } catch(err){
                logger.error(imagePath);
                logger.error(err);
            }            

            context.fillStyle = "#fff";
            context.fillText(item.Count, location.x + 80, location.y + 85);

            itemList.push(
                {
                    name: item.Type,
                    quality: item.Quality,
                    amount: item.Count
                }
            );
        }
    }    

    if(itemList.length === 0){
        let naked = await loadImage("images/NAKED.png");
        context.drawImage(naked, 0, -100, width, height);
    }else{
        await createEstimatedPricesImage(itemList, context, 0, 440);
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
                logger.error(imagePath);
                logger.error(err);
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
    let itemList = [];
    for (let i = 0; i < inventoryArray.length; i++) {
        let item = inventoryArray[i];
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

        itemList.push(
            {
                name: item.Type,
                quality: item.Quality,
                amount: item.Count
            }
        );
    }
    currentX = 0;
    currentY += 120;

    context.textAlign = "left";

    await createEstimatedPricesImage(itemList, context, currentX, currentY);

    return canvas.toBuffer();
}

async function createEstimatedPricesImage(itemList, context, x, y) {
    let locations = ["Bridgewatch", "Caerleon", "Fort Sterling", "Lymhurst", "Martlock"];
    let itemTypeList = itemList.map(function(item) {
        return item.name;
    });
    let itemPrices = await getItemMarketPrices(itemTypeList.toString());
    let itemLocationPrices = [];
    for (let location of locations) {
        itemLocationPrices[location] = 0;
    }
    for (let item of itemList) {        
        for (let location of locations) {
            let itemPrice = itemPrices.find(x => x.quality == item.quality && x.item_id == item.name && x.city == location);
            if(itemPrice !== undefined){
                itemLocationPrices[location] += (item.amount * itemPrice.sell_price_min);
            }
        }

    }

    let currentX = x;
    let currentY = y;
    context.font = "18px \"Sansation Bold\"";
    context.fillText("Est. Market Value", currentX, currentY);
    currentY += 20;
    let drawPrice = false;
    for (const [location, price] of Object.entries(itemLocationPrices)) {
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

function getBattleParticipants(battle){
    let factions = [];
    for (let player of Object.values(battle.players)) {
        let factionName;
        let factionType;
        if(player.allianceName){
            factionName = player.allianceName;
            factionType = "Alliance";
        }else if(player.guildName){
            factionName = player.guildName;
            factionType = "Guild";
        }else{
            factionName = player.name;
            factionType = "Player";
        }
        if(!factions.find(x => x.name == factionName)){
            factions.push({
                name: factionName,
                type: factionType,
                kills: 0,
                deaths: 0,
                killFame: 0,
                players: 0
            });
        }
        let factionIndex = factions.findIndex(x => x.name == factionName);
        factions[factionIndex].kills += player.kills;
        factions[factionIndex].deaths += player.deaths;
        factions[factionIndex].killFame += player.killFame;
        factions[factionIndex].players++;

    }
    factions.sort((a, b) => b.killFame - a.killFame);
    return factions;
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

async function getItemMarketPrices(itemList){
    //let response = await axios.get(`https://www.albion-online-data.com/api/v2/stats/history/${itemType}?time-scale=24`);
    let response = await axios.get(`https://www.albion-online-data.com/api/v2/stats/Prices/${itemList}`);
    return response.data; 
}

async function getPlayerKills (player){
    try{
        return await Promise.resolve(albion.kills(player.id));
    }catch(err){
        logger.error(err);
    }
}

async function getPlayerDeaths (player){
    try{
        return await Promise.resolve(albion.deaths(player.id));
    }catch(err){
        logger.error(err);
    }
}

async function getBattleData (battleId){
    try{
        return await Promise.resolve(albion.battle(battleId));
    }catch(err){
        logger.error(err);
    }
}

async function getEventData (eventId){
    try{
        return await Promise.resolve(albion.event(eventId));
    }catch(err){
        logger.error(err);
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
        try{
            await downloadImage(`https://render.albiononline.com/v1/item/${item.Type}.png?quality=${item.Quality}`, imageItemPath);
        } catch (err){
            logger.error(err);
        }    
    }

    return imageItemPath;
}

async function handleBuildCommand(message, args, database) {

}

async function handleBattleCommand(message, args) {
    let loadingMessage = await message.channel.send("Retrieving data from Albion Online API, sometimes this can take a very long time.");
    let battleId = args[0];
    let battle = await getBattleData(battleId);

    if(battle.length === 0){
        return loadingMessage.edit(`No results found for ${battleId}`);
    }

    handleBattleData(battle, message.channel, loadingMessage);
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

async function handleBattleData(battleData, channel, loadingMessage){
    let embed = await createBattleEmbed(battleData);

    if(loadingMessage){
        loadingMessage.delete();
    }

    channel.send(embed);
}

async function handleEntityCommand(command, message, args, database) {
    let loadingMessage = await message.channel.send("Retrieving data from Albion Online API, sometimes this can take a very long time.");
    let entityInfo;
    let entityDetails;

    switch(command){
    case "player":
        entityInfo = await getEntityInfo(args[0], 0, database);
        if(!entityInfo) return loadingMessage.edit("Player not found...");
        entityDetails = await albion.player(entityInfo.id);
        handleEntityData(entityDetails, 0, message.channel, loadingMessage);
        break;
    case "guild":
        entityInfo = await getEntityInfo(args[0], 1, database);
        if(!entityInfo) return loadingMessage.edit("Guild not found...");
        entityDetails = await albion.guild(entityInfo.id);
        handleEntityData(entityDetails, 1, message.channel, loadingMessage);
        break;
    default:
        break;
    }
}

async function handleEntityData(entityDetails, type, channel, loadingMessage){
    let embed = await createEntityEmbed(entityDetails, type);

    if(loadingMessage){
        loadingMessage.delete();
    }

    channel.send(embed);
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
        let nickname = message.member ? message.member.displayName : message.author.username;
        playerInfo = await getEntityInfo(nickname, 0, database);
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
        return message.channel.send("No valid entitytype provided, valid entitytypes are: player, guild.");
    }

    let trackType;
    switch(args[1]){
    case "events":
        trackType = 0;
        break;
    case "battles":
        trackType = 1;
        break;
    default:
        return message.channel.send("No valid tracktype provided, valid tracktypes are: events, battles.");
    }

    let entity = args.slice(2).join(" ");
    let entityInfo;

    entityInfo = await getEntityInfo(entity, type, database);
    if(!entityInfo){
        return message.channel.send(`The ${args[0]} ${entity} doesn't seem to exist!`);
    }

    let trackEntry = await database.Albion.ServerTrack.findAll({
        where: {
            serverId: await message.guild.id,
            entityId: entityInfo.id,
            trackType: trackType
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
            channelId: message.channel.id,
            trackType: trackType
        });
    }else{
        await database.Albion.ServerTrack.destroy({
            where: {
                serverId: await message.guild.id,
                entityId: entityInfo.id,
                trackType: trackType
            }
        });
    }

    return message.channel.send(`Tracking for ${args[0]} ${entity} for ${args[1]} now ${remove ? "removed" : "added"}!`);
}

async function scanRecentEvents (database, client){
    logger.info("[Events] Starting scheduled scan.");

    let trackEntries = await database.Albion.ServerTrack.findAll({
        where: { 
            trackType: 0
        },
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
            logger.info(`[Events] Getting page ${page + 1}`);
            let newEvents = await albion.events(page);
            events = events.concat(newEvents);
            logger.info(`[Events] First ID Page: ${newEvents[0].EventId} - Last ID Page: ${newEvents[newEvents.length - 1].EventId} - Last ID DB: ${info.lastEventId}`);
            page++;
            if(doOnePage){
                break;
            }
            processNextPage = events.filter(x => x.EventId <= info.lastEventId).length === 0 && page !== 20;
        }
        while(processNextPage);

        logger.info(`[Events] Updating ID in DB: ${events[0].EventId}`);
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
                let channel = client.channels.cache.get(trackEntry.channelId);
                if(channel === undefined){
                    logger.error(`[Events] Channel ID for ${trackEntry["entity.name"]} for Server ID ${trackEntry.serverId} seems to be invalid.`);
                    return;
                }
                switch(trackEntry["entity.type"]){
                case 0:     // Player
                    if((event.Killer.Id == trackEntry.entityId) || (event.Victim.Id == trackEntry.entityId)){
                        logger.info(`[Events] Found event for ${trackEntry["entity.name"]}.`);
                        handleEventData(event, channel);
                    }
                    break;
                case 1:     // Guild
                    if((event.Killer.GuildId == trackEntry.entityId) || (event.Victim.GuildId == trackEntry.entityId)){
                        logger.info(`[Events] Found event for ${trackEntry["entity.name"]}.`);
                        handleEventData(event, channel);
                    }
                    break;
                default:    // Invalid
                    break;
                }
            }
        }
    } catch(err){
        logger.error(err);
        Promise.reject();
    }
    logger.info("[Events] Scan done.");
    Promise.resolve();
}

async function scanRecentBattles (database, client){
    logger.info("[Battles] Starting scheduled scan.");

    let trackEntries = await database.Albion.ServerTrack.findAll({
        where: { 
            trackType: 1
        },
        include: [{model: database.Albion.Entity}],
        raw: true
    });

    let info = await database.Albion.Static.findOne({
        where: { 
            id: 2
        },
        raw: true
    });

    let battles = [];
    let page = 0;
    let doOnePage = info.lastEventId === "0";
    let processNextPage = true;
    try{
        do {
            logger.info(`[Battles] Getting page ${page + 1}`);
            let newBattles = await albion.battles(page);
            battles = battles.concat(newBattles);
            logger.info(`[Battles] First ID Page: ${newBattles[0].id} - Last ID Page: ${newBattles[newBattles.length - 1].id} - Last ID DB: ${info.lastEventId}`);
            page++;
            if(doOnePage){
                break;
            }
            processNextPage = battles.filter(x => x.id <= info.lastEventId).length === 0 && page !== 20;
        }
        while(processNextPage);

        await database.Albion.Static.update(
            {
                lastEventId: battles[0].id
            },
            {
                where: {
                    id: 2
                }
            }
        );

        for (const battle of battles) {
            if(battle.id <= info.lastEventId){
                break;
            }
            for (const trackEntry of trackEntries) {
                switch(trackEntry["entity.type"]){
                case 0:     // Player
                    if(battle.players[trackEntry.entityId]){
                        logger.info(`[Battles] Found battle for ${trackEntry["entity.name"]}.`);
                        handleBattleData(battle, client.channels.cache.get(trackEntry.channelId));
                    }
                    break;
                case 1:     // Guild
                    if(battle.guilds[trackEntry.entityId]){
                        logger.info(`[Battles] Found battle for ${trackEntry["entity.name"]}.`);
                        handleBattleData(battle, client.channels.cache.get(trackEntry.channelId));
                    }
                    break;
                default:    // Invalid
                    break;
                }
            }
        }
    } catch(err){
        logger.error(err);
        Promise.reject();
    }
    logger.info("[Battles] Scan done.");
    Promise.resolve();
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