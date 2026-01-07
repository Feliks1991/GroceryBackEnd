const getUserMessage = (err) => {

  const customError = {
    status: err.status || 500,
    name: err.name || "Error",
    message: err.message || "Internal server error",
    code: err.code || null,
    details: null,
  };

  const message = (err.message || "").toLowerCase();
  if (message.includes("enoent")) {
    customError.status = 404;
    customError.message = "Not found";
  }
  if (message.includes("eacces")) {
    customError.status = 403;
    customError.message = "No access";
  }
  if (message.includes("eexist")) {
    customError.status = 409;
    customError.message = "Already exists";
  }

  if (["JsonWebTokenError", "TokenExpiredError", "NotBeforeError"].includes(err.name)) {
    customError.status = err.status || 401;
    customError.name = err.name;
    customError.message = err.message;
  }

  if (err.name === "ZodError") {
    customError.status = 422;
    customError.message = "Validation error"
    customError.details = err.issues.map((e) => {
      return {
        expect: e.message.split(": ").at(-1),
        field: e.path[0],
      };
    });
  }
  return customError;
};

export default getUserMessage;
