import React, { useState, useCallback, useEffect } from 'react';
import { ServiceOrder, ProcessedData } from './types';
import { processDataFile } from './services/dataProcessor';
import FileUpload from './components/FileUpload';
import Dashboard from './components/Dashboard';
import { LayoutDashboard, LogOut, User as UserIcon } from 'lucide-react';
import { authService } from './services/authService';
import Login from './components/Login';

const App: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());
    const [currentUser, setCurrentUser] = useState<string | null>(null);
    const [authError, setAuthError] = useState<string | null>(null);
    const [isAuthLoading, setIsAuthLoading] = useState(false);
    
    const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string>('');

    useEffect(() => {
        if (isAuthenticated) {
            setCurrentUser(authService.getCurrentUser());
        }
    }, [isAuthenticated]);

    const handleLogin = async (username, password) => {
        setIsAuthLoading(true);
        setAuthError(null);
        try {
            const { user } = await authService.login(username, password);
            setIsAuthenticated(true);
            setCurrentUser(user);
        } catch (err) {
            setAuthError(err instanceof Error ? err.message : 'Falha no login.');
        } finally {
            setIsAuthLoading(false);
        }
    };

    const handleLogout = () => {
        authService.logout();
        setIsAuthenticated(false);
        setCurrentUser(null);
        handleReset(); // Also reset dashboard data on logout
    };

    const handleFileProcessed = useCallback((data: ServiceOrder[], file: File) => {
        setIsLoading(true);
        setError(null);
        setFileName(file.name);
        try {
            const result = processDataFile(data);
            setProcessedData(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido ao processar o arquivo.');
            setProcessedData(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleReset = () => {
        setProcessedData(null);
        setError(null);
        setFileName('');
    };

    if (!isAuthenticated) {
        return <Login onLogin={handleLogin} error={authError} isLoading={isAuthLoading} />;
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-custom-bg text-gray-900 dark:text-custom-text p-4 sm:p-6 lg:p-8">
            <header className="mb-8">
                <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center space-x-3">
                         <div className="p-2 bg-blue-500 rounded-lg">
                            <LayoutDashboard className="h-8 w-8 text-white" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">
                            Dashboard de Análise de SLA
                        </h1>
                    </div>
                     <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2 text-sm">
                            <UserIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                            <span className="font-medium">Bem-vindo, {currentUser}!</span>
                        </div>
                        {processedData && (
                            <button 
                                onClick={handleReset} 
                                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300">
                                Analisar Novo Arquivo
                            </button>
                        )}
                         <button 
                            onClick={handleLogout} 
                            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 flex items-center space-x-2">
                            <LogOut className="h-5 w-5" />
                            <span>Sair</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto">
                {!processedData ? (
                    <FileUpload onFileProcessed={handleFileProcessed} setIsLoading={setIsLoading} setError={setError} />
                ) : (
                    <Dashboard data={processedData} fileName={fileName} />
                )}

                {isLoading && (
                    <div className="mt-8 flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        <p className="text-lg">Processando dados...</p>
                    </div>
                )}
                
                {error && <p className="mt-4 text-center text-red-500 bg-red-100 dark:bg-red-900/50 p-3 rounded-lg">{error}</p>}
            </main>
             <footer className="text-center mt-12 text-gray-500 dark:text-gray-400 text-sm">
                <p>&copy; {new Date().getFullYear()} Gerado por IA. Todos os direitos reservados.</p>
            </footer>
        </div>
    );
};

export default App;