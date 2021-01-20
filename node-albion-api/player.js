const request = require("./request")

function getRandomString(length) {
  var randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var result = '';
  for ( var i = 0; i < length; i++ ) {
      result += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
  }
  return result;
}

module.exports = async (toonId) => {
    const results = await request(
      `players/${toonId}?${getRandomString(12)}`
    )
    return results
}
