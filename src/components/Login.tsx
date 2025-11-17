import React, { useState } from 'react';
import { Bot, User, Lock, Eye, EyeOff } from 'lucide-react';

interface LoginProps {
  onLogin: (username, password) => Promise<void>;
  error: string | null;
  isLoading: boolean;
}

const Login: React.FC<LoginProps> = ({ onLogin, error, isLoading }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin12DADOS');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(username, password);
  };
  
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-custom-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-custom-card border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl">
          <div className="p-8 text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-500 flex items-center justify-center shadow-lg">
                <Bot className="w-8 h-8 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                Dashboard de Análise de SLA
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                Faça login para continuar
              </p>
            </div>
          </div>

          <div className="p-8 pt-0">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Usuário
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Digite seu usuário"
                    className="pl-10 w-full h-12 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    disabled={isLoading}
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="space-y-2">
                 <label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite sua senha"
                    className="pl-10 pr-10 w-full h-12 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {error && <p className="text-sm text-center text-red-500">{error}</p>}

              <button
                type="submit"
                className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg shadow-md transition-all duration-300 disabled:bg-gray-400 flex items-center justify-center"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    <span>Entrando...</span>
                  </>
                ) : (
                  'Entrar'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;