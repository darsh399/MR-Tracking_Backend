export const permit = (...allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.user?.role;
    console.log('User role:', userRole, 'Allowed roles:', allowedRoles);
    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({ message: 'Access denied: insufficient permissions' });
    }
    next();
  };
};
