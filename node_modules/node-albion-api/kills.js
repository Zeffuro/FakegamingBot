const request = require("node-albion-api/request")

module.exports = async (toonId) => {
    const results = await request(
      `players/${toonId}/kills?range=month&offset=0&limit=100`
    )
    return results
}
