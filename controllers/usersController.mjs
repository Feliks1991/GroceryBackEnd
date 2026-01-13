import jwt from "jsonwebtoken";
import { writeUsers, readUsers, writeUser, createUser } from "../utils/usersDataUtils.mjs";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { registerDataParse, updateDataParse } from "../zodShemas/userShema.mjs";

const signTokens = (id, jti) => {
  const accessToken = jwt.sign({ sub: id, jti }, process.env.ACCESS_SECRET, {
    expiresIn: process.env.ACCESS_EXPIRES,
  });
  const refreshToken = jwt.sign({ sub: id, jti }, process.env.REFRESH_SECRET, {
    expiresIn: process.env.REFRESH_EXPIRES,
  });
  return { accessToken, refreshToken };
};

function clearRefreshCookie(res) {
  res.clearCookie("refreshToken", { path: "/auth" });
}

const emailToID = (email) => {
  return crypto.createHash("sha256").update(email.toLowerCase().trim()).digest("hex").slice(0, 12);
};

const setRefreshCookie = (res, token) => {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: true, //заменить в проде на true
    sameSite: "none",
    path: "/auth",
    maxAge: 1000 * 60 * 60 * 24 * 15,
  });
};

const jtiUpdate = (user, oldJti, newJti = null) => {
  if (!user) {
    return;
  }
  const userJtis = user.systemData.refreshJti;
  const currentJtiIndex = userJtis.indexOf(oldJti);
  if (currentJtiIndex === -1) {
    return false;
  }
  newJti ? userJtis.splice(currentJtiIndex, 1, newJti) : userJtis.splice(currentJtiIndex, 1);

  return userJtis;
};

export const userRegister = async (req, res, next) => {
  const newUserData = registerDataParse(req.body);
  const users = await readUsers();

  for (const key in users) {
    if (users[key].phone === newUserData.phone || users[key].email === newUserData.email) {
      throw { status: 409, name: "UserAlreadyExists", message: "The user with this data exists" };
    }
  }

  const hashedPassword = await bcrypt.hash(newUserData.password, 10);
  const id = emailToID(newUserData.email);
  const newUser = {
    id: id,
    name: newUserData.name,
    lastname: newUserData.lastname,
    sex: newUserData.sex,
    birthday: newUserData.birthday,
    password: hashedPassword,
    country: newUserData.country,
    city: newUserData.city,
    phone: newUserData.phone,
    email: newUserData.email,
    favourite: [],
    systemData: {
      role: "user",
      refreshJti: [],
      createdAt: Date.now(),
      status: "active",
    },
  };

  await createUser(newUser);
  res.status(200).json({
    message: "You are registered",
  });
};

export const userLogin = async (req, res, next) => {
  const { email, password } = req.body;

  // const { authorized } = req.auth;

  // if (authorized) {
  //   throw {
  //     status: 403,
  //     name: "UserLoggedIn",
  //     message: "User is already logged in",
  //   };
  // }

  const id = emailToID(email);
  const users = await readUsers();
  const user = structuredClone(users[id]);

  // Timing attack guard
  const passwordHash = users[id] ? users[id].password : process.env.DUMMY_HASH;

  const isCorrectPassword = await bcrypt.compare(password, passwordHash);

  if (!isCorrectPassword) {
    throw { status: 404, name: "UserNotFound", message: "No user with such credentials" };
  }

  const newJTI = uuidv4();

  const { accessToken, refreshToken } = signTokens(user.id, newJTI);
  setRefreshCookie(res, refreshToken);

  user.systemData.refreshJti.push(newJTI);
  await writeUser(user, users);

  const { systemData, password: pass, ...safeUser } = user;
  res.status(200).json({ message: "Login successful", accessToken, ...safeUser });
};

export const tokensRefresh = async (req, res, next) => {
  const currentRefreshToken = req.cookies?.refreshToken;
  if (!currentRefreshToken) {
    throw { status: 403, name: "NoRefreshToken", message: "Refresh jwt must be provided" };
  }

  const users = structuredClone(await readUsers());

  try {
    const { sub, jti } = jwt.verify(currentRefreshToken, process.env.REFRESH_SECRET);

    const user = users[sub];
    const newJti = uuidv4();
    const updatedJti = jtiUpdate(user, jti, newJti);
    if (!updatedJti) {
      throw new jwt.JsonWebTokenError("Jti not found, token is invalid");
    }

    user.systemData.refreshJti = updatedJti;
    await writeUser(user, users);
    const { accessToken, refreshToken } = signTokens(sub, newJti);
    setRefreshCookie(res, refreshToken);
    res.status(200).json({ accessToken });
  } catch (error) {
    const { sub, jti } = jwt.decode(currentRefreshToken, process.env.REFRESH_SECRET);

    const user = users[sub];
    const updatedJti = jtiUpdate(user, jti);
    if (updatedJti) {
      user.systemData.refreshJti = updatedJti;
      await writeUser(user, users);
    }

    clearRefreshCookie(res);
    throw { status: 403, name: error.name, message: error.message };
  }
};

export const getUser = (req, res, next) => {
  const { authorized, user, error } = req.auth;

  if (!authorized) {
    throw error;
  }
  const { password, systemData, ...safeUser } = user;
  res.status(200).json({ message: "Login restored", ...safeUser });
};

export const userUpdate = async (req, res, next) => {
  const { authorized, user, users, error } = req.auth;

  if (!authorized) {
    throw error;
  }
  const modifyData = updateDataParse(req.body);
  for (const key in modifyData) {
    if (modifyData[key]) {
      user[key] = modifyData[key];
    }
  }

  await writeUser(user, users);
  const { password, systemData, ...safeUser } = user;
  res.status(200).json({ message: "User updated", ...safeUser });
};

export const userDelete = async (req, res, next) => {
  const { authorized, user, users, error } = req.auth;
  if (!authorized) {
    throw error;
  }
  delete users[user.id];
  await writeUsers(users);
  clearRefreshCookie(res);
  res.status(200).json({ message: "User deleted"});
};

export const userLogout = async (req, res, next) => {
  const { authorized, user, users, jti, error } = req.auth;
  const currentRefreshToken = req.cookies?.refreshToken;

  let removedJti = jti;
  let usersList = users;
  let currentUser = user;

  if (!authorized && currentRefreshToken) {
    try {
      const { jti, sub } = jwt.verify(currentRefreshToken, process.env.REFRESH_SECRET, {
        ignoreExpiration: true,
      });
      usersList = structuredClone(await readUsers());
      currentUser = usersList[sub];
      removedJti = jti;
    } catch (err) {
      console.warn(err.message);
      return res.status(200).json({ message: "Already logged out" });
    }
  }

  const updatedJti = jtiUpdate(currentUser, removedJti);
  if (updatedJti) {
    currentUser.systemData.refreshJti = updatedJti;
    await writeUser(currentUser, usersList);
  }
  clearRefreshCookie(res);
  if (!authorized) {
    console.warn(error.message);
    return res.status(200).json({ message: "Already logged out" });
  }

  res.status(200).json({ message: "You are logged out" });
};
