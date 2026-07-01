export const enforceOnboardingComplete = (req, res, next) => {
  if (req.user?.isFirstLogin) {
    return res.status(403).json({ message: 'Please reset your temporary password before accessing the application.' });
  }
  if (!req.user?.isOnboarded) {
    return res.status(403).json({ message: 'Please complete onboarding before accessing the application.' });
  }
  next();
};
