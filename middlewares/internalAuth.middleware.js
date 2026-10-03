const internalAuth = (req, res, next) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  const userId = req.headers["x-user-id"];

  if (!userId) {
    return res.status(400).json({
      message: "User ID is required",
    });
  }

  req.userId = userId;

  next();
};

module.exports = {
  internalAuth,
};