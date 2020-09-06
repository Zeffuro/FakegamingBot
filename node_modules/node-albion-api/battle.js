const request = require("node-albion-api/request")

module.exports = async (battleId) => {
    const results = await request(
      `battles/${battleId}`
    )
    return results
}
