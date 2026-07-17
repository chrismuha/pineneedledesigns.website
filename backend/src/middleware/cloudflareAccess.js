import { createRemoteJWKSet, jwtVerify } from 'jose';

import { config } from '../config/index.js';

const accessIssuer = `https://${config.cloudflareAccess.teamDomain}`;
const accessKeys = createRemoteJWKSet(new URL(`${accessIssuer}/cdn-cgi/access/certs`));

const cookieValue = (cookieHeader, name) => {
  const prefix = `${name}=`;
  const entry = String(cookieHeader || '')
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));

  return entry ? decodeURIComponent(entry.slice(prefix.length)) : '';
};

const accessToken = (req) => (
  String(req.get('cf-access-jwt-assertion') || '')
  || cookieValue(req.get('cookie'), 'CF_Authorization')
);

export const requireCloudflareAccess = async (req, res, next) => {
  // Local development does not run behind Cloudflare Access.
  if (!config.isProduction) return next();

  const token = accessToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Cloudflare Access authentication is required.' });
  }

  try {
    const { payload } = await jwtVerify(token, accessKeys, {
      audience: config.cloudflareAccess.audience,
      issuer: accessIssuer,
    });
    req.cloudflareAccess = payload;
    return next();
  } catch {
    return res.status(401).json({ error: 'Cloudflare Access authentication is invalid or expired.' });
  }
};
