const jwt = require('jsonwebtoken');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2ZGYxMWQxLTMzZjktNDY5Ni05NjgzLWFmOTE2OWI1NTEyOCIsImVtYWlsIjoicm9kcmlnb2VzcGMwM0BnbWFpbC5jb20iLCJyb2wiOiJET0NUT1IiLCJpYXQiOjE3NTQ0MjE3MjcsImV4cCI6MTc1NDUwODEyN30.whXJWqAXmFr-E81YMbGSvS4Z3b1a5FihfzQoqtn3ZKI';

const secret = 'tu_secreto_jwt_super_seguro_2024';

console.log('🔍 Debuggeando token...');
console.log('🔑 Token:', token);
console.log('🔐 Secret:', secret);

try {
  const decoded = jwt.verify(token, secret);
  console.log('✅ Token válido!');
  console.log('📋 Decoded:', decoded);
} catch (error) {
  console.log('❌ Error verificando token:', error.message);
}

// Probar con diferentes secrets
const secrets = [
  'tu_secreto_jwt_super_seguro_2024',
  process.env.JWT_SECRET,
  'tu_secreto...',
  'default_secret'
];

console.log('\n🧪 Probando con diferentes secrets...');
secrets.forEach((secret, index) => {
  if (!secret) return;
  
  try {
    const decoded = jwt.verify(token, secret);
    console.log(`✅ Secret ${index + 1} funciona:`, secret.substring(0, 10) + '...');
    console.log('📋 Decoded:', decoded);
  } catch (error) {
    console.log(`❌ Secret ${index + 1} falla:`, secret.substring(0, 10) + '...', error.message);
  }
}); 
 
 