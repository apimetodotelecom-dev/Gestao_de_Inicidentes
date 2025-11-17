
const AUTH_TOKEN_KEY = 'authToken';
const USER_KEY = 'authUser';

// Simulação de uma base de dados de usuários, que em um ambiente real viria de um backend.
// Isso substitui a lógica de login hardcoded anterior.
const MOCK_USERS = [
    { username: 'admin', password: 'admin123', role: 'admin' },
    // Outros usuários poderiam ser adicionados aqui para simular o 'usuarios.db'
];


export const authService = {
  login: async (username?: string, password?: string): Promise<{ success: boolean; user: string }> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const foundUser = MOCK_USERS.find(
          (user) => user.username === username && user.password === password
        );

        if (foundUser) {
          const mockToken = `fake-jwt-token-for-${foundUser.username}`;
          localStorage.setItem(AUTH_TOKEN_KEY, mockToken);
          localStorage.setItem(USER_KEY, foundUser.username);
          resolve({ success: true, user: foundUser.username });
        } else {
          reject(new Error('Credenciais inválidas. Verifique seu usuário e senha.'));
        }
      }, 500);
    });
  },
  logout: (): void => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
  isAuthenticated: (): boolean => {
    return localStorage.getItem(AUTH_TOKEN_KEY) !== null;
  },
  getCurrentUser: (): string | null => {
    return localStorage.getItem(USER_KEY);
  },
};
