
const Sequelize = require("sequelize");
const PlayerModel = require("./models/albion/player");
const InfoModel = require("./models/albion/info");

const sequelize = new Sequelize("database", "user", "password", {
    host: "localhost",
    dialect: "sqlite",
    logging: false,
    // SQLite only
    storage: "database.sqlite",
});

const Player = PlayerModel(sequelize, Sequelize);
const Info = InfoModel(sequelize, Sequelize);

sequelize.sync({force: false})
    .then(() => {
        console.log("Database & tables created!");
    });

module.exports = {
    Database: {
        Albion: {        
            Player,
            Info
        }
    }    
};