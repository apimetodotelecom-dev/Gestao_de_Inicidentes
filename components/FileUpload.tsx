import React, { useCallback } from 'react';
import { ServiceOrder } from '../types';
import { UploadCloud } from 'lucide-react';

interface FileUploadProps {
    onFileProcessed: (data: ServiceOrder[], file: File) => void;
    setIsLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileProcessed, setIsLoading, setError }) => {
    const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setIsLoading(true);
            setError(null);
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = e.target?.result;
                    const workbook = (window as any).XLSX.read(data, { type: 'binary' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];

                    // --- Buscador Inteligente de Cabeçalho ---
                    const rowsAsArrays: any[][] = (window as any).XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
                    let headerRowIndex = -1;

                    for (let i = 0; i < Math.min(5, rowsAsArrays.length); i++) {
                        const potentialHeaders = rowsAsArrays[i].map(h => String(h).trim().toUpperCase());
                        // Verifica se colunas essenciais existem na linha para confirmar que é o cabeçalho
                        if (potentialHeaders.includes('NUMOS') && potentialHeaders.includes('NOMEPARC')) {
                            headerRowIndex = i;
                            break;
                        }
                    }

                    if (headerRowIndex === -1) {
                        throw new Error("Cabeçalho não encontrado. Verifique se as colunas 'NUMOS' e 'NOMEPARC' existem nas 5 primeiras linhas do arquivo.");
                    }
                    
                    // Usa a linha do cabeçalho encontrada para converter o restante da planilha para JSON
                    const json = (window as any).XLSX.utils.sheet_to_json(worksheet, { range: headerRowIndex });
                    
                    if (json.length === 0) {
                        throw new Error("O arquivo está vazio ou em um formato não suportado após a leitura do cabeçalho.");
                    }
                    
                    onFileProcessed(json, file);
                } catch (err) {
                    setError(err instanceof Error ? err.message : 'Erro ao ler o arquivo Excel.');
                    setIsLoading(false);
                }
            };
            reader.onerror = () => {
                setError('Falha ao ler o arquivo.');
                setIsLoading(false);
            };
            reader.readAsBinaryString(file);
        }
    }, [onFileProcessed, setIsLoading, setError]);

    return (
        <div className="bg-white dark:bg-custom-card p-8 rounded-2xl shadow-lg text-center border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-300">
            <div className="flex flex-col items-center">
                <UploadCloud className="h-16 w-16 text-blue-500 mb-4" />
                <h2 className="text-2xl font-semibold mb-2">Carregar Arquivo do Backlog</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">Arraste e solte seu arquivo Excel (.xlsx) aqui, ou clique para selecionar.</p>
                <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept=".xlsx, .xls"
                    onChange={handleFileChange}
                />
                <label htmlFor="file-upload" className="cursor-pointer bg-blue-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors duration-300">
                    Selecionar Arquivo
                </label>
            </div>
            <div className="mt-8 text-left text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2 text-gray-700 dark:text-gray-300">Colunas esperadas no arquivo:</h3>
                <ul className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1">
                    <li>- NUMOS</li>
                    <li>- NOMEGRUPO</li>
                    <li>- EXECUTANTE</li>
                    <li>- STATUS_DA_OS</li>
                    <li>- DHCHAMADA</li>
                    <li>- ENTRADA_SubOS</li>
                    <li>- AGENDAMENTO</li>
                    <li>- SOLUCAO</li>
                    <li>- PRAZO_dd_hr_min_seg</li>
                    <li>- NOMEPARC</li>
                    <li>- RESPONSAVEL_TECNICO</li>
                    <li>- GRUPO_ECONOMICO</li>
                    <li>- PROJETO_FINANCEIRO</li>
                </ul>
            </div>
        </div>
    );
};

export default FileUpload;
