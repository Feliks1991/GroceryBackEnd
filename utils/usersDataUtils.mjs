import { dbPath } from "./productPaths.mjs";
import { readJSON, writeJSON } from "./RWservice.mjs";
import path from "path";

export const readUsers = async () => {
  const userListPath = path.join(dbPath, "users", "userList.json");
  const usersData = await readJSON(userListPath);
  return usersData;
};
export const writeUsers = async (data) => {
  const userListPath = path.join(dbPath, "users", "userList.json");
  await writeJSON(userListPath, data);
};

export const writeUser = async (user, users) => {
  const userListPath = path.join(dbPath, "users", "userList.json");
  users[user.id] = user;
  await writeJSON(userListPath, users);
};

export const findUserByID = async (id) => {
  const usersData = await readUsers();
  const findedUser = usersData[id];
  return findedUser;
};
export const createUser = async (user) => {
  const userListPath = path.join(dbPath, "users", "userList.json");
  const usersData = await readJSON(userListPath);

  usersData[user.id] = user;

  await writeUsers(usersData);
};
