import React, { useState } from 'react';
import { ProcessedData, ServiceOrder, AnalysisByExecutor } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FileText, AlertTriangle, UserCheck, BarChart2, SearchCheck, Truck } from 'lucide-react';
import MetricCard from './MetricCard';
import DataTable from './DataTable';
import AiAssistant from './AiAssistant';


const TABS = [
    { name: "Visão Geral", icon: FileText },
    { name: "Alertas Críticos", icon: AlertTriangle },
    { name: "Status Suspeitos", icon: SearchCheck },
    { name: "Análise por Executor", icon: UserCheck },
    { name: "Análise Logística", icon: Truck },
    { name: "Gráficos", icon: BarChart2 }
];

const Dashboard: React.FC<{ data: ProcessedData, fileName: string }> = ({ data, fileName }) => {
    const [activeTab, setActiveTab] = useState(TABS[0].name);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
    const SLA_COLORS = { 'Dentro do SLA': '#22c55e', 'Fora do SLA': '#ef4444' };

    const renderContent = () => {
        switch (activeTab) {
            case "Visão Geral":
                return (
                 <div className="space-y-8">
                    <DataTable<ServiceOrder>
                        title="Backlog Completo"
                        data={data.allOrders}
                        columns={[
                            { key: 'NUMOS', header: 'OS' },
                            { key: 'NOMEPARC', header: 'Parceiro'},
                            { key: 'NOMEGRUPO', header: 'Grupo' },
                            { key: 'EXECUTANTE', header: 'Executor' },
                            { key: 'ANALISTA_RESPONSAVEL', header: 'Analista Resp.' },
                            { key: 'STATUS_DA_OS', header: 'Status' },
                            { key: 'DIAS_PARADO', header: 'Dias Parado' },
                        ]}
                    />
                    <ChartCard title="Distribuição de OS por Analista Responsável">
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={data.analystDistribution} layout="vertical" margin={{ top: 5, right: 30, left: 120, bottom: 5 }}>
                                 <XAxis type="number" />
                                 <YAxis type="category" dataKey="name" width={120} tick={{ fill: 'currentColor', fontSize: 12 }} />
                                 <Tooltip />
                                 <Bar dataKey="value" name="Qtd OS" fill="#4299e1">
                                    {data.analystDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                 </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>
                 </div>
                );
            case "Alertas Críticos":
                return (
                    <div className="space-y-8">
                         <DataTable<ServiceOrder>
                            title="Atraso de Campo (>= 3 dias parado)"
                            description="OS com 3+ dias parados, excluindo status AGENDADO e PENDENTE DE AGENDAMENTO."
                            data={data.offenders.atrasoCampo}
                            columns={[
                                { key: 'NUMOS', header: 'OS' },
                                { key: 'EXECUTANTE', header: 'Executor' },
                                { key: 'ANALISTA_RESPONSAVEL', header: 'Analista Resp.' },
                                { key: 'NOMEGRUPO', header: 'Grupo' },
                                { key: 'STATUS_DA_OS', header: 'Status' },
                                { key: 'DIAS_PARADO', header: 'Dias Parado' },
                            ]}
                        />
                        <DataTable<ServiceOrder>
                            title="Agendamento Pendente"
                            data={data.offenders.pendentesAgendamentoSegmentado}
                            columns={[
                                { key: 'NUMOS', header: 'OS' },
                                { key: 'EXECUTANTE', header: 'Executor' },
                                { key: 'ANALISTA_RESPONSAVEL', header: 'Analista Resp.' },
                                { key: 'DIAS_PARADO', header: 'Dias Parado' },
                            ]}
                        />
                        <DataTable<ServiceOrder>
                            title="Pendências Internas"
                            data={data.offenders.pendentesInternas}
                            columns={[
                                { key: 'NUMOS', header: 'OS' },
                                { key: 'EXECUTANTE', header: 'Executor' },
                                { key: 'ANALISTA_RESPONSAVEL', header: 'Analista Resp.' },
                                { key: 'DIAS_PARADO', header: 'Dias Parado' },
                            ]}
                        />
                         <DataTable<ServiceOrder>
                            title="OS Agendadas Vencidas"
                            data={data.offenders.agendadasVencidas}
                            columns={[
                                { key: 'NUMOS', header: 'OS' },
                                { key: 'EXECUTANTE', header: 'Executor' },
                                { key: 'AGENDAMENTO', header: 'Agendamento' },
                                { key: 'DIAS_PARADO', header: 'Dias Parado' },
                            ]}
                        />
                    </div>
                );
            case "Status Suspeitos":
                 return (
                    <DataTable<ServiceOrder>
                        title="OS com Status de Encerradas no Backlog"
                        description="Estas OS estão com status de RESOLVIDO/FECHADO mas ainda aparecem no backlog."
                        data={data.offenders.statusEncerradosIncorretos}
                        columns={[
                           { key: 'NUMOS', header: 'OS' },
                           { key: 'EXECUTANTE', header: 'Executor' },
                           { key: 'ANALISTA_RESPONSAVEL', header: 'Analista Resp.' },
                           { key: 'STATUS_DA_OS', header: 'Status' },
                           { key: 'DIAS_PARADO', header: 'Dias Parado' },
                        ]}
                    />
                );
            case "Análise por Executor":
                return <DataTable<AnalysisByExecutor>
                    title="Desempenho por Executor"
                    data={data.analysisByExecutor}
                    columns={[
                        { key: 'EXECUTANTE', header: 'Executor' },
                        { key: 'QTD_OS', header: 'Qtd OS' },
                        { key: 'DIAS_MEDIO', header: 'Média Dias Parado' },
                        { key: 'DIAS_MAXIMO', header: 'Máx Dias Parado' },
                    ]}
                />;
            case "Análise Logística":
                 const { logisticsData } = data;
                 return (
                    <div className="space-y-8">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                           <MetricCard title="Itens Logística" value={logisticsData.totalItems} colorClass={logisticsData.totalItems > 50 ? "yellow" : "green"} />
                           <MetricCard title="Dentro do SLA" value={`${logisticsData.totalItems > 0 ? ((logisticsData.itemsDentroSLA / logisticsData.totalItems) * 100).toFixed(1) : '100.0'}%`} colorClass="green" />
                           <MetricCard title="Agend. Vencidos" value={logisticsData.agendamentosVencidos} colorClass={logisticsData.agendamentosVencidos > 0 ? "red" : "green"} />
                           <MetricCard title="Dias Parado (Média)" value={logisticsData.mediaDiasParado.toFixed(1)} colorClass={logisticsData.mediaDiasParado > 2 ? "red" : "green"} />
                        </div>
                         <DataTable<ServiceOrder>
                            title="Alertas Críticos - Logística"
                            description="Itens com SLA estourado, agendamento vencido ou parados há mais de 2 dias úteis."
                            data={[...logisticsData.slaEstouradoItems, ...logisticsData.agendamentosVencidosItems, ...logisticsData.itensSuspeitos].filter((v,i,a)=>a.findIndex(t=>(t.NUMOS === v.NUMOS))===i)}
                            columns={[
                                { key: 'NUMOS', header: 'OS' },
                                { key: 'EXECUTANTE', header: 'Executor' },
                                { key: 'STATUS_DA_OS', header: 'Status' },
                                { key: 'DIAS_PARADO', header: 'Dias Parado' },
                                { key: 'PRAZO_dd_hr_min_seg', header: 'Prazo' },
                            ]}
                        />
                        <DataTable<AnalysisByExecutor>
                            title="Desempenho por Executor - Logística"
                            data={logisticsData.analysisByExecutor}
                            columns={[
                                { key: 'EXECUTANTE', header: 'Executor' },
                                { key: 'QTD_OS', header: 'Qtd OS' },
                                { key: 'DIAS_MEDIO', header: 'Média Dias Parado' },
                                { key: 'DIAS_MAXIMO', header: 'Máx Dias Parado' },
                            ]}
                        />
                    </div>
                );
            case "Gráficos":
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <ChartCard title="Distribuição de SLA">
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie data={data.slaDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                        {data.slaDistribution.map((entry) => (
                                            <Cell key={`cell-${entry.name}`} fill={SLA_COLORS[entry.name as keyof typeof SLA_COLORS]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartCard>
                        <ChartCard title="Distribuição de Status">
                             <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie data={data.statusDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                       {data.statusDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip/>
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartCard>
                        <ChartCard title="SLA por Grupo">
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={data.slaByGroup} layout="vertical" margin={{ top: 5, right: 30, left: 120, bottom: 5 }}>
                                    <XAxis type="number" hide />
                                    <YAxis type="category" dataKey="name" width={120} tick={{ fill: 'currentColor' }} />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="Dentro do SLA" stackId="a" fill="#22c55e" />
                                    <Bar dataKey="Fora do SLA" stackId="a" fill="#ef4444" />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartCard>
                         <ChartCard title="Média de Dias Parado por Executor (Top 10)">
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={data.analysisByExecutor.slice(0, 10)}>
                                    <XAxis dataKey="EXECUTANTE" tick={{ fill: 'currentColor', fontSize: 12 }} angle={-25} textAnchor="end" height={60} />
                                    <YAxis tick={{ fill: 'currentColor' }}/>
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="DIAS_MEDIO" fill="#8884d8" name="Dias Médio Parado"/>
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartCard>
                    </div>
                );
        }
    };

    return (
        <div className="space-y-8">
            <div className="bg-white dark:bg-custom-card p-4 rounded-xl shadow-md">
                <p className="text-sm text-gray-500 dark:text-gray-400">Analisando arquivo: <span className="font-semibold text-blue-600 dark:text-blue-400">{fileName}</span></p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {data.metrics.map(metric => (
                    <MetricCard key={metric.title} {...metric} />
                ))}
            </div>
            
            <AiAssistant processedData={data} />

            <div className="bg-white dark:bg-custom-card p-4 sm:p-6 rounded-xl shadow-lg">
                <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                    <nav className="-mb-px flex space-x-2 sm:space-x-4 overflow-x-auto" aria-label="Tabs">
                        {TABS.map(tab => (
                            <button
                                key={tab.name}
                                onClick={() => setActiveTab(tab.name)}
                                className={`${
                                    activeTab === tab.name
                                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors duration-200`}
                            >
                                <tab.icon className="h-5 w-5" />
                                <span>{tab.name}</span>
                            </button>
                        ))}
                    </nav>
                </div>
                <div>
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

const ChartCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white dark:bg-custom-card p-6 rounded-xl shadow-lg">
        <h3 className="font-semibold text-lg mb-4">{title}</h3>
        {children}
    </div>
);

export default Dashboard;
