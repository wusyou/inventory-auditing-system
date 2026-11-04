import rateLimit from "express-rate-limit";

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    const retryAfterMinutes = Math.ceil(
      req.rateLimit.resetTime
        ? (req.rateLimit.resetTime - Date.now()) / 60000
        : 15,
    );
    res.status(429).json({
      error: `Too many login attempts. Try again in ${retryAfterMinutes} minute(s).`,
    });
  },
});
