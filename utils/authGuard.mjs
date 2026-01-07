import jwt from "jsonwebtoken";
import { readUsers } from "./usersDataUtils.mjs";

const authGuard = async (req, res, next) => {
  const receivedHeadersAuth = req.headers.authorization;
  try {
    const token = receivedHeadersAuth?.startsWith("Bearer ")
      ? receivedHeadersAuth.split("Bearer ").at(-1)
      : null;
    if (!token) {
      throw {
        status: 401,
        name: "Athorize error",
        message: "Not authorized",
        details: "Token is not provided",
      };
    }
    const { sub, jti } = jwt.verify(token, process.env.ACCESS_SECRET);
    if (!sub || !jti) {
      throw {
        status: 403,
        name: "Athorize error",
        message: "Not authorized",
        details: "Token is not valid",
      };
    }

    const users = structuredClone(await readUsers());
    const user = users[sub];
    if (!user || !user.systemData.refreshJti.includes(jti)) {
      throw {
        status: 404,
        name: "Not found",
        message: "User is not found",
        details: "No user with such credentials",
      };
    }
    req.auth = { authorized: true, user, users, jti };
    next()
  } catch (error) {
    throw error;
  }
};

export default authGuard;
