module.exports = (sequelize, type) => {
    return sequelize.define("info", {
        guildId: {
            type: type.STRING,
            primaryKey: true
        },
        channelId: type.STRING,
        lastEventId: type.STRING
    });
};