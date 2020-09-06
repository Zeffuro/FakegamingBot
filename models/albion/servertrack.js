module.exports = (sequelize, type) => {
    return sequelize.define("servertrack", {
        id: {
            type: type.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        serverId: type.STRING,
        entityId: type.STRING,
        trackType: type.INTEGER,
        channelId: type.STRING
    });
};