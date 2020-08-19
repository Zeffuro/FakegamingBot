const Sequelize = require("sequelize");
const EntityModel = require("./models/albion/entity");
const StaticModel = require("./models/albion/static");
const ServerTrackModel = require("./models/albion/servertrack");
const ServerModel = require("./models/server");

const sequelize = new Sequelize("database", "user", "password", {
    host: "localhost",
    dialect: "sqlite",
    logging: false,
    // SQLite only
    storage: "database.sqlite",
});

const Entity = EntityModel(sequelize, Sequelize);
const Server = ServerModel(sequelize, Sequelize);
const ServerTrack = ServerTrackModel(sequelize, Sequelize);
const Static = StaticModel(sequelize, Sequelize);

Entity.hasMany(ServerTrack);
ServerTrack.belongsTo(Entity);

sequelize.sync({force: false})
    .then(() => {
        console.log("Database & tables created!");
    });

module.exports = {
    Database: {
        Server,
        Albion: {        
            Entity,
            ServerTrack,
            Static
        }
    }    
};