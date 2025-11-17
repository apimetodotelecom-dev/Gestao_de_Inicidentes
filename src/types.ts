export interface ServiceOrder {
    NUMOS: string;
    NOMEGRUPO?: string;
    EXECUTANTE?: string;
    STATUS_DA_OS?: string;
    DHCHAMADA?: string;
    ENTRADA_SubOS?: string;
    AGENDAMENTO?: string;
    DEFEITO?: string;
    SOLUCAO?: string;
    PRAZO_dd_hr_min_seg?: string;
    DIAS_PARADO: number;
    Status_SLA: 'Dentro do SLA' | 'Fora do SLA';
    // Novos campos para atribuição de analista
    RESPONSAVEL_TECNICO?: string;
    PROJETO_FINANCEIRO?: string;
    GRUPO_ECONOMICO?: string;
    NOMEPARC?: string;
    ANALISTA_RESPONSAVEL: string;
}

export interface Metric {
    value: number | string;
    title: string;
    colorClass: string;
}

export interface AnalysisByExecutor {
    EXECUTANTE: string;
    QTD_OS: number;
    DIAS_MEDIO: number;
    DIAS_MAXIMO: number;
}

export interface LogisticsData {
    totalItems: number;
    itemsDentroSLA: number;
    itemsForaSLA: number;
    agendamentosVencidos: number;
    mediaDiasParado: number;
    allItems: ServiceOrder[];
    agendamentosVencidosItems: ServiceOrder[];
    slaEstouradoItems: ServiceOrder[];
    itensSuspeitos: ServiceOrder[];
    analysisByExecutor: AnalysisByExecutor[];
}


export interface ProcessedData {
    allOrders: ServiceOrder[];
    metrics: Metric[];
    offenders: {
        pendentesAgendamento: ServiceOrder[];
        agendadasVencidas: ServiceOrder[];
        statusEncerradosIncorretos: ServiceOrder[];
        pendentesAgendamentoSegmentado: ServiceOrder[];
        pendentesInternas: ServiceOrder[];
        atrasoCampo: ServiceOrder[];
    };
    analysisByExecutor: AnalysisByExecutor[];
    analystDistribution: { name: string; value: number }[];
    slaByGroup: any[];
    statusDistribution: { name: string; value: number }[];
    slaDistribution: { name: string; value: number }[];
    logisticsData: LogisticsData;
}


export interface PerformanceMetric {
    totalOS: number;
    percentualSLA: string;
    mediaDiasParado: string;
}

export interface DataSummaryForAI {
    totalOS: number;
    percentualSLA: string;
    mediaDiasParado: string;
    porGrupo: Record<string, PerformanceMetric>;
    porAnalista: Record<string, PerformanceMetric>;
    porExecutor: Record<string, PerformanceMetric>;
}