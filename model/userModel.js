const users = [];
let nextUserId = 1;

function addUser(user) {
  const newUser = {
    id: nextUserId++,
    username: user.username,
    email: user.email,
    passwordHash: user.passwordHash,
  };
  users.push(newUser);
  return newUser;
}

function findByUsername(username) {
  return users.find((u) => u.username === username) || null;
}

module.exports = {
  addUser,
  findByUsername,
};
