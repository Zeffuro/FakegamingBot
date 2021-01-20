const request = require("./request")

module.exports = async (name) => {
    const results = await request(
      `search?q=${escape(name)}`
    )
    return results
}
