export const requireApiKey = (req, res, next) => {
  const apiKey = req.header('x-api-key');
  if (!apiKey) return res.status(401).json({ error: 'API key ontbreekt' });
  next();
};


