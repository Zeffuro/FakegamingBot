module.exports = (sequelize, type) => {
    return sequelize.define("player", {
        id: {
            type: type.STRING,
            primaryKey: true
        },
        name: type.STRING,
        guildId: type.STRING,
        guildName: type.STRING,
        allianceId: type.STRING,
        allianceName: type.STRING,
        lastEventId: type.STRING,
        trackKills: type.INTEGER,
        trackDeaths: type.INTEGER,
        discordId: type.STRING
    });
};