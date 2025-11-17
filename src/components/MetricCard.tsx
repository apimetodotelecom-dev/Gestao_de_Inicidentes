import React from 'react';
import { Metric } from '../types';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const MetricCard: React.FC<Metric> = ({ title, value, colorClass }) => {
    
    const colorStyles: { [key: string]: { bg: string; text: string; border: string, icon: React.ReactNode } } = {
        red: {
            bg: 'bg-red-50 dark:bg-red-900/40',
            text: 'text-red-600 dark:text-red-400',
            border: 'border-red-500/50',
            icon: <TrendingDown className="h-6 w-6 text-red-500" />
        },
        yellow: {
            bg: 'bg-yellow-50 dark:bg-yellow-900/40',
            text: 'text-yellow-600 dark:text-yellow-400',
            border: 'border-yellow-500/50',
            icon: <Minus className="h-6 w-6 text-yellow-500" />
        },
        green: {
            bg: 'bg-green-50 dark:bg-green-900/40',
            text: 'text-green-600 dark:text-green-400',
            border: 'border-green-500/50',
            icon: <TrendingUp className="h-6 w-6 text-green-500" />
        }
    };

    const styles = colorStyles[colorClass] || colorStyles.yellow;

    return (
        <div className={`p-4 rounded-xl shadow-md border ${styles.bg} ${styles.border}`}>
            <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                {styles.icon}
            </div>
            <p className={`text-3xl font-bold ${styles.text}`}>{value}</p>
        </div>
    );
};

export default MetricCard;