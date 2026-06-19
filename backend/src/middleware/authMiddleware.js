import { verifyToken } from '../utils/auth.js';

export const protect = (req, res, next) => {
  let token;
  const reqPath = req.baseUrl + req.path;

  console.log(`[Auth Middleware] Intercepting request to: ${req.method} ${reqPath}`);
  console.log(`- Request headers authorization: ${req.headers.authorization ? 'Present' : 'Absent'}`);
  console.log(`- Request cookies token: ${req.cookies && req.cookies.token ? 'Present' : 'Absent'}`);

  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
    console.log(`- Retreived token from cookies.`);
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
    console.log(`- Retreived token from Authorization header.`);
  }

  if (!token) {
    console.warn(`- Rejecting request: No token found. Returning 'Unauthorized session'`);
    return res.status(401).json({ error: 'Unauthorized session' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    console.warn(`- Rejecting request: Token verification failed (invalid or expired token). Returning 'Invalid token'`);
    return res.status(401).json({ error: 'Invalid token' });
  }

  console.log(`- Authentication successful. User ID: ${decoded.id}, Role: ${decoded.role}`);
  req.user = decoded;
  next();
};
