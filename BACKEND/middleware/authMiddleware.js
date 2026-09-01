const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    // Check that the header exists and starts with "Bearer "
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 401,
        message: 'Authentication required.',
      });
    }

    // Extract the token (everything after "Bearer ")
    const token = authHeader.split(' ')[1];

    // Verify the token and attach the decoded user to the request
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    console.error('Auth error:', error.message);
    return res.status(401).json({
      status: 401,
      message: 'Token expired or invalid.',
    });
  }
}

module.exports = authMiddleware;
