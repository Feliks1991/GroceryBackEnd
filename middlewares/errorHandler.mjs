import getUserMassage from "../utils/getUserMessage.mjs";

const errorHandler = (err, req, res, next) => {
  const {status, ...error} = getUserMassage(err);
  res.status(status).json(error);
};

export default errorHandler;
