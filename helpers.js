// find user with email in database
const getUserByEmail = (email, database) => {
  for (const user in database) {
    if (database[user].email === email) {
      return database[user];
    }
  }
  return undefined;
}


function generateRandomString() {
  let randomStr = Math.random().toString(36).substring(6);
  if (randomStr.length !== 6) {
    randomStr = generateRandomString();
  }
  return randomStr;
}

// returns the URLs where the userID is equal to the id of the currently logged-in user
const urlsForUser = (id, database) => {
  let userUrls = {};
  for (const tinyUrl in database) {
    if (database[tinyUrl].userID === id) {
      userUrls[tinyUrl] = database[tinyUrl]
    }
  }
  return userUrls;
}


module.exports = { getUserByEmail, generateRandomString, urlsForUser };