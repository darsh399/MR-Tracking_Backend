const companyMiddleware = (req, res, next) => {
  req.companyFilter = { companyName: req.user.companyName };
  next();
};

export default companyMiddleware;