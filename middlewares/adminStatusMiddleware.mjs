const adminStatusMiddleware = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "You is not admin" });
  }
  next();
};

export default adminStatusMiddleware;
