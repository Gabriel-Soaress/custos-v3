const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Em desenvolvimento local, o frontend roda na 3000 e o backend na 3002.
// Em produção (Vercel), as rotas /api/ são servidas automaticamente.
export const API_BASE_URL = isLocal ? 'http://localhost:3002' : '';

export default API_BASE_URL;
