const request = require("node-albion-api/request")

module.exports = async (eventId) => {
    const results = await request(
      `events/${eventId}`
    )
    return results
}
