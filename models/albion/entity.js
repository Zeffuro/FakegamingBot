module.exports = (sequelize, type) => {
    return sequelize.define("entity", {
        id: {
            type: type.STRING,
            primaryKey: true
        },
        name: type.STRING,        
        type: type.INTEGER
    });
};