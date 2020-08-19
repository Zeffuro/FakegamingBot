module.exports = (sequelize, type) => {
    return sequelize.define("static", {
        id: {
            type: type.STRING,
            primaryKey: true
        },
        lastEventId: type.STRING
    });
};