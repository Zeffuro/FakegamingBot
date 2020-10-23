const request = require("./request")

function getRandomString(length) {
  var randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var result = '';
  for ( var i = 0; i < length; i++ ) {
      result += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
  }
  return result;
}

module.exports = async (page=1, guildId) => {
  const pageSize = 50;
  const events = await request(
    `battles?sort=recent&limit=${pageSize}&offset=${page === 0 ? 0 : page*pageSize-1}${guildId ? `&guildId=${guildId}` : "" }&${getRandomString(12)}`
  )
  return events;
}
