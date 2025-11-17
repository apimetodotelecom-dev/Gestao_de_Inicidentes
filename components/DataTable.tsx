import React, { useState, useMemo } from 'react';
import { Download } from 'lucide-react';

interface Column<T> {
    key: keyof T;
    header: string;
}

interface DataTableProps<T> {
    title: string;
    data: T[];
    columns: Column<T>[];
    description?: string;
}

function DataTable<T,>({ title, data, columns, description }: DataTableProps<T>) {
    const [sortConfig, setSortConfig] = useState<{ key: keyof T; direction: 'asc' | 'desc' } | null>(null);

    const sortedData = useMemo(() => {
        let sortableData = [...data];
        if (sortConfig !== null) {
            sortableData.sort((a, b) => {
                const valA = a[sortConfig.key];
                const valB = b[sortConfig.key];
                if (valA === null || valA === undefined) return 1;
                if (valB === null || valB === undefined) return -1;
                if (valA < valB) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (valA > valB) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableData;
    }, [data, sortConfig]);

    const requestSort = (key: keyof T) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const downloadCSV = () => {
        const header = columns.map(c => c.header).join(',');
        const rows = sortedData.map(row => 
            columns.map(col => {
                let value = row[col.key] as any;
                if (typeof value === 'string') {
                    value = `"${value.replace(/"/g, '""')}"`;
                }
                return value ?? '';
            }).join(',')
        );
        const csvContent = "data:text/csv;charset=utf-8," + [header, ...rows].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${title.replace(/\s+/g, '_').toLowerCase()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (data.length === 0) {
        return (
            <div>
                <h3 className="font-semibold text-lg mb-2">{title}</h3>
                {description && <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{description}</p>}
                <div className="bg-gray-50 dark:bg-gray-900/50 text-center p-8 rounded-lg">
                    <p className="text-gray-500 dark:text-gray-400">Nenhum dado para exibir.</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-4">
                <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-xl">{title}</h3>
                    <button 
                        onClick={downloadCSV} 
                        className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold py-2 px-3 rounded-lg transition-colors duration-200">
                        <Download className="h-4 w-4" />
                        <span>Exportar CSV</span>
                    </button>
                </div>
                 {description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>}
            </div>
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                            {columns.map((col) => (
                                <th
                                    key={String(col.key)}
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                                    onClick={() => requestSort(col.key)}
                                >
                                    {col.header}
                                    {sortConfig?.key === col.key ? (sortConfig.direction === 'asc' ? ' ▲' : ' ▼') : ''}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-custom-card divide-y divide-gray-200 dark:divide-gray-700">
                        {sortedData.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                {columns.map((col) => (
                                    <td key={String(col.key)} className="px-6 py-4 whitespace-nowrap text-sm">
                                        {String(item[col.key] ?? '')}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default DataTable;
