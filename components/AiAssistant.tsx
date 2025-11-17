import React, { useState } from 'react';
import { ProcessedData } from '../types';
import { getAiAnalysis } from '../services/geminiService';
import { Sparkles, Send } from 'lucide-react';

const AiAssistant: React.FC<{ processedData: ProcessedData }> = ({ processedData }) => {
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [analysis, setAnalysis] = useState('');
    const [error, setError] = useState('');

    const suggestions = [
        "Quais são os principais ofensores de SLA?",
        "Qual grupo tem mais OS em atraso?",
        "Resuma a situação do backlog."
    ];

    const handleQuery = async (userQuery: string) => {
        if (!userQuery.trim()) return;

        setIsLoading(true);
        setAnalysis('');
        setError('');
        try {
            const result = await getAiAnalysis(processedData, userQuery);
            setAnalysis(result);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Ocorreu um erro desconhecido.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const formatAnalysis = (text: string) => {
        return text
            .split('\n')
            .map((line, index) => {
                if (line.startsWith('**') && line.endsWith('**')) {
                    // FIX: Replaced `replaceAll` with `replace` and a global regex for wider browser compatibility.
                    return <h4 key={index} className="font-bold text-lg mt-3 mb-1">{line.replace(/\*\*/g, '')}</h4>;
                }
                if (line.trim().startsWith('* ')) {
                    return <li key={index} className="ml-5 list-disc">{line.substring(2)}</li>;
                }
                 if (line.trim().startsWith('- ')) {
                    return <li key={index} className="ml-5 list-disc">{line.substring(2)}</li>;
                }
                return <p key={index} className="mb-2">{line}</p>;
            });
    };

    return (
        <div className="bg-white dark:bg-custom-card p-6 rounded-xl shadow-lg">
            <div className="flex items-center space-x-3 mb-4">
                <Sparkles className="h-8 w-8 text-yellow-400" />
                <h2 className="text-2xl font-bold">Análise com IA</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Faça uma pergunta sobre os dados carregados para obter insights.</p>

            <div className="flex space-x-2 mb-4">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleQuery(query)}
                    placeholder="Ex: Quais executores estão mais sobrecarregados?"
                    className="flex-grow bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <button onClick={() => handleQuery(query)} disabled={isLoading} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-400 flex items-center">
                    <Send className="h-5 w-5" />
                </button>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4">
                {suggestions.map(s => (
                    <button key={s} onClick={() => {setQuery(s); handleQuery(s);}} className="text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full px-3 py-1 transition-colors">
                        {s}
                    </button>
                ))}
            </div>

            {isLoading && (
                <div className="flex items-center justify-center space-x-2 p-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    <p>A IA está analisando os dados...</p>
                </div>
            )}
            {error && <p className="text-red-500 bg-red-100 dark:bg-red-900/50 p-3 rounded-lg">{error}</p>}
            {analysis && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg prose dark:prose-invert max-w-none">
                    {formatAnalysis(analysis)}
                </div>
            )}
        </div>
    );
};

export default AiAssistant;