const request = require("./request")

module.exports = async (guildId) => {
    const results = await request(
      `guilds/${guildId}`
    )
    return results
}
