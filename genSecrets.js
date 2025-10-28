import crypto from 'crypto';

function generateSecret() {
  return crypto.randomBytes(64).toString('hex');
}

console.log("ACCESS_TOKEN_SECRET=", generateSecret());
console.log("REFRESH_TOKEN_SECRET=", generateSecret());
