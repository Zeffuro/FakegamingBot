module.exports = (sequelize, type) => {
    return sequelize.define("servertrack", {
        id: {
            type: type.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        serverId: type.STRING,
        entityId: type.STRING,
        channelId: type.STRING
    });
};