module.exports = (sequelize, type) => {
    return sequelize.define("server", {
        serverId: {
            type: type.STRING,
            primaryKey: true
        },
        prefix: type.STRING,
        battleChannelId: type.STRING,
        eventChannelId: type.STRING
    });
};