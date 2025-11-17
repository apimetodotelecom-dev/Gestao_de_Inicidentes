import { ServiceOrder, ProcessedData, Metric, AnalysisByExecutor, LogisticsData } from '../types';

// Novas regras de negócio para atribuição de analistas
const REGRAS_CONFIG = {
  regras: {
    RESPONSAVEL_TECNICO: {
      "ADRIANO_D": "Simone Pimenta",
      "ALEX_V": "Pedro Moreira",
      "DIVALDO_M": "Sandra Nascimento",
      "GABRIEL_C": "Tamires Merces",
      "GUSTAVO_FE": "Ana Carolina",
      "JULIMAR": "Nadja ou Marilia",
      "MARCELA_FE": "Ana Carolina",
      "MARIAL1687": "Pedro Moreira",
      "ROBSON_GIA": "Simone Pimenta",
      "THIAGO_L": "Pedro Moreira",
      "VAGNER": "Marilia Rosane",
      "VANESSA_PV": "Kelly Sanches",
      "WILSON": "Pedro Moreira",
      "DIEGO_V": "Nadja ou Marilia"
    },
  },
  regras_especiais_nomeparc: [
    { condicao: "NOMEPARC.startswith('NEC')", analista: "Valmeire Alves" },
    { condicao: "'PABX OI' in NOMEPARC.upper()", analista: "Jackson Henrique" },
    { condicao: "'OI - MG' in NOMEPARC.upper()", analista: "Tamires Merces" },
  ],
  regras_especiais_grupo_economico: [
    { condicao: "'MINISTERIO PUBLICO -BH' in GRUPO_ECONOMICO.upper()", analista: "Layanne Soares" },
    { condicao: "'ALGAR' in GRUPO_ECONOMICO.upper()", analista: "Pedro Moreira" },
  ],
  regras_especiais_projeto_financeiro: [
    { condicao: "PROJETO_FINANCEIRO.startswith('OI - UC4X')", analista: "Valmeire Alves" },
    { condicao: "'SEST' in PROJETO_FINANCEIRO", analista: "Tamires Merces" },
  ],
};


const calculateBusinessDays = (startDate: Date, endDate: Date): number => {
  let count = 0;
  const curDate = new Date(startDate.getTime());
  
  if (curDate > endDate) return 0;

  while (curDate <= endDate) {
    const dayOfWeek = curDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    curDate.setDate(curDate.getDate() + 1);
  }
  return count > 0 ? count -1 : 0;
};

const parseDate = (dateStr: any): Date | null => {
    if (!dateStr) return null;
    if (typeof dateStr === 'number') {
        // Handle Excel's serial date format
        return new Date(Date.UTC(1899, 11, 30 + dateStr));
    }
    if (typeof dateStr === 'string') {
        // Handle "dd/mm/yyyy hh:mm:ss" or "dd-mm-yyyy"
        const parts = dateStr.split(/[\/\-\s:]/);
        if (parts.length >= 3) {
            // Check if year is 2 or 4 digits
            const year = parts[2].length === 4 ? parts[2] : `20${parts[2]}`;
            // new Date(year, monthIndex, day)
            return new Date(Number(year), Number(parts[1]) - 1, Number(parts[0]));
        }
    }
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
};

// Helper para avaliar as condições das regras de forma segura
const evaluateCondition = (condition: string, os: ServiceOrder): boolean => {
    try {
        // Match: FIELD.startswith('VALUE') -> ex: "NOMEPARC.startswith('NEC')"
        const startsWithMatch = condition.match(/(\w+)\.startswith\('([^']*)'\)/);
        if (startsWithMatch) {
            const [_, key, value] = startsWithMatch;
            const osValue = (os[key as keyof ServiceOrder] as string) || '';
            return osValue.startsWith(value);
        }

        // Match: 'VALUE' in FIELD.upper() -> ex: "'PABX OI' in NOMEPARC.upper()"
        const inUpperMatch = condition.match(/'([^']*)' in (\w+)\.upper\(\)/);
        if (inUpperMatch) {
            const [_, value, key] = inUpperMatch;
            const osValue = (os[key as keyof ServiceOrder] as string) || '';
            return osValue.toUpperCase().includes(value);
        }

        return false;
    } catch (e) {
        console.error(`Error evaluating condition "${condition}":`, e);
        return false;
    }
};


const atribuirAnalistaResponsavel = (os: ServiceOrder): string => {
    let analista = "Não Definido";
    const rt = os.RESPONSAVEL_TECNICO || "";

    // Regra 1: Padrão por RESPONSAVEL_TECNICO
    if (rt && REGRAS_CONFIG.regras.RESPONSAVEL_TECNICO[rt as keyof typeof REGRAS_CONFIG.regras.RESPONSAVEL_TECNICO]) {
        analista = REGRAS_CONFIG.regras.RESPONSAVEL_TECNICO[rt as keyof typeof REGRAS_CONFIG.regras.RESPONSAVEL_TECNICO];
    }
    
    // Regras Especiais (sobrescrevem a padrão, a última que corresponder vence)
    for (const regra of REGRAS_CONFIG.regras_especiais_nomeparc) {
        if (evaluateCondition(regra.condicao, os)) {
            analista = regra.analista;
        }
    }
     for (const regra of REGRAS_CONFIG.regras_especiais_grupo_economico) {
        if (evaluateCondition(regra.condicao, os)) {
            analista = regra.analista;
        }
    }
    for (const regra of REGRAS_CONFIG.regras_especiais_projeto_financeiro) {
        if (evaluateCondition(regra.condicao, os)) {
            analista = regra.analista;
        }
    }

    return analista;
};

const analyzeLogistics = (allOrders: ServiceOrder[], today: Date): LogisticsData => {
    const grupos_logistica = ["LOG SAS BH", "LOG SAS SP", "STAGING", "LOGÍSTICA", "LOGISTICA", "LOG-EXPEDIÇÃO", "LOG-ARMAZÉM", "LOG-TRANSPORTE", "LOGISTICA OPERACIONAL"];
    const allItems = allOrders.filter(os => os.NOMEGRUPO && grupos_logistica.includes(os.NOMEGRUPO.toUpperCase()));

    const totalItems = allItems.length;
    const itemsDentroSLA = allItems.filter(os => os.Status_SLA === 'Dentro do SLA').length;
    const itemsForaSLA = totalItems - itemsDentroSLA;
    const agendamentosVencidosItems = allItems.filter(os => {
        const agendamentoDate = parseDate(os.AGENDAMENTO);
        return os.STATUS_DA_OS === 'AGENDADO' && agendamentoDate && agendamentoDate < today;
    });
    const slaEstouradoItems = allItems.filter(os => os.Status_SLA === 'Fora do SLA');
    const itensSuspeitos = allItems.filter(os => os.DIAS_PARADO > 2);
    
    const mediaDiasParado = totalItems > 0 ? allItems.reduce((acc, os) => acc + os.DIAS_PARADO, 0) / totalItems : 0;

    const analysisByExecutor: AnalysisByExecutor[] = allItems.reduce((acc, os) => {
        const executorName = os.EXECUTANTE || 'Não atribuído';
        let executor = acc.find(e => e.EXECUTANTE === executorName);
        if (!executor) {
            executor = { EXECUTANTE: executorName, QTD_OS: 0, DIAS_PARADO_TOTAL: 0, DIAS_MAXIMO: 0 };
            acc.push(executor);
        }
        executor.QTD_OS++;
        executor.DIAS_PARADO_TOTAL += os.DIAS_PARADO;
        if (os.DIAS_PARADO > executor.DIAS_MAXIMO) {
            executor.DIAS_MAXIMO = os.DIAS_PARADO;
        }
        return acc;
    }, [] as any[]).map(e => ({
        EXECUTANTE: e.EXECUTANTE,
        QTD_OS: e.QTD_OS,
        DIAS_MEDIO: e.QTD_OS > 0 ? parseFloat((e.DIAS_PARADO_TOTAL / e.QTD_OS).toFixed(1)) : 0,
        DIAS_MAXIMO: e.DIAS_MAXIMO,
    })).sort((a, b) => b.DIAS_MEDIO - a.DIAS_MEDIO);


    return {
        totalItems,
        itemsDentroSLA,
        itemsForaSLA,
        agendamentosVencidos: agendamentosVencidosItems.length,
        mediaDiasParado,
        allItems,
        agendamentosVencidosItems,
        slaEstouradoItems,
        itensSuspeitos,
        analysisByExecutor
    };
};

export const processDataFile = (data: any[]): ProcessedData => {
    const today = new Date();
    const allOrdersRaw: ServiceOrder[] = data.map(row => {
        const entradaSubOS = parseDate(row.ENTRADA_SubOS);
        const diasParado = entradaSubOS ? calculateBusinessDays(entradaSubOS, today) : 0;
        
        const prazoStr = String(row.PRAZO_dd_hr_min_seg || '');
        const statusSla = prazoStr.match(/FORA|OVERDUE|VENCIDO|EXPIRADO/i)
            ? 'Fora do SLA'
            : 'Dentro do SLA';

        const serviceOrder: ServiceOrder = {
            NUMOS: row.NUMOS || 'N/A',
            NOMEGRUPO: row.NOMEGRUPO,
            EXECUTANTE: row.EXECUTANTE,
            STATUS_DA_OS: row.STATUS_DA_OS,
            DHCHAMADA: row.DHCHAMADA,
            ENTRADA_SubOS: row.ENTRADA_SubOS,
            AGENDAMENTO: row.AGENDAMENTO,
            DEFEITO: row.DEFEITO,
            SOLUCAO: row.SOLUCAO,
            PRAZO_dd_hr_min_seg: prazoStr,
            DIAS_PARADO: diasParado,
            Status_SLA: statusSla,
            // Campos para atribuição
            RESPONSAVEL_TECNICO: row.RESPONSAVEL_TECNICO,
            NOMEPARC: row.NOMEPARC,
            GRUPO_ECONOMICO: row.GRUPO_ECONOMICO,
            PROJETO_FINANCEIRO: row.PROJETO_FINANCEIRO,
            ANALISTA_RESPONSAVEL: '' // Será preenchido
        };
        serviceOrder.ANALISTA_RESPONSAVEL = atribuirAnalistaResponsavel(serviceOrder);
        return serviceOrder;
    });

    // --- FILTRAGEM ---
    const equipes_filtro = ['CO', 'PRESTADORES SERVICOS', 'FIELD', 'MANUTENCAO ADM', 'SER MANUTENCAO CAMPO'];
    const analistas_excluir = ['Layanne Soares', 'Jackson Henrique', 'Sandra Nascimento'];
    const allOrders = allOrdersRaw.filter(os => 
        os.NOMEGRUPO && equipes_filtro.includes(os.NOMEGRUPO) && !analistas_excluir.includes(os.ANALISTA_RESPONSAVEL)
    );

    // --- CÁLCULO DE OFENSORES ---
    const pendentesAgendamento = allOrders.filter(os =>
        os.STATUS_DA_OS?.match(/PENDENTE|PENDENTE DE AGENDAMENTO/i) && os.DIAS_PARADO > 0
    );
     const pendentesAgendamentoSegmentado = allOrders.filter(os =>
        os.STATUS_DA_OS?.match(/PENDENTE DE AGENDAMENTO/i) && os.DIAS_PARADO > 0
    );
     const pendentesInternas = allOrders.filter(os =>
        os.STATUS_DA_OS?.match(/^PENDENTE$/i) && os.DIAS_PARADO > 0
    );
    const grupos_campo = ['PRESTADORES SERVICOS', 'SER MANUTENCAO CAMPO', 'FIELD'];
    const atrasoCampo = allOrders.filter(os => 
        os.NOMEGRUPO && grupos_campo.includes(os.NOMEGRUPO) &&
        os.DIAS_PARADO >= 3 &&
        !os.STATUS_DA_OS?.match(/AGENDADO|PENDENTE DE AGENDAMENTO/i)
    );

    const agendadasVencidas = allOrders.filter(os => {
        const agendamentoDate = parseDate(os.AGENDAMENTO);
        return os.STATUS_DA_OS === 'AGENDADO' && agendamentoDate && agendamentoDate < today;
    });

    const statusEncerradosIncorretos = allOrders.filter(os => 
        os.STATUS_DA_OS?.match(/RESOLVIDO|FECHADO|ENCERRADO|CONCLUÍDO|CONCLUIDO|FINALIZADO/i)
    );

    // --- CÁLCULO DE MÉTRICAS GERAIS ---
    const totalOS = allOrders.length;
    const mediaDiasParado = totalOS > 0 ? allOrders.reduce((acc, os) => acc + os.DIAS_PARADO, 0) / totalOS : 0;

    const metrics: Metric[] = [
        { title: "Total OS Filtradas", value: totalOS, colorClass: totalOS > 115 ? "red" : totalOS > 99 ? "yellow" : "green" },
        { title: "OS Pendentes (>0 dias)", value: pendentesAgendamento.length, colorClass: pendentesAgendamento.length > 10 ? "red" : "green" },
        { title: "Agendadas Vencidas", value: agendadasVencidas.length, colorClass: agendadasVencidas.length > 10 ? "red" : "green" },
        { title: "Status Incorretos", value: statusEncerradosIncorretos.length, colorClass: statusEncerradosIncorretos.length > 0 ? "red" : "green" },
        { title: "Dias Parado (Média)", value: mediaDiasParado.toFixed(1), colorClass: mediaDiasParado > 3 ? "red" : "green" },
    ];

    // --- AGRUPAMENTOS PARA GRÁFICOS ---
    const createDistribution = (key: keyof ServiceOrder) => {
        const counts = allOrders.reduce((acc, os) => {
            const itemKey = String(os[key] || 'Não definido');
            acc[itemKey] = (acc[itemKey] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    };

    const slaDistribution = createDistribution('Status_SLA');
    const statusDistribution = createDistribution('STATUS_DA_OS');
    const analystDistribution = createDistribution('ANALISTA_RESPONSAVEL').sort((a,b) => b.value - a.value);

    const analysisByExecutor: AnalysisByExecutor[] = allOrders.reduce((acc, os) => {
        const executorName = os.EXECUTANTE || 'Não atribuído';
        let executor = acc.find(e => e.EXECUTANTE === executorName);
        if (!executor) {
            executor = { EXECUTANTE: executorName, QTD_OS: 0, DIAS_PARADO_TOTAL: 0, DIAS_MAXIMO: 0 };
            acc.push(executor);
        }
        executor.QTD_OS++;
        executor.DIAS_PARADO_TOTAL += os.DIAS_PARADO;
        executor.DIAS_MAXIMO = Math.max(executor.DIAS_MAXIMO, os.DIAS_PARADO);
        return acc;
    }, [] as any[]).map(e => ({
        EXECUTANTE: e.EXECUTANTE,
        QTD_OS: e.QTD_OS,
        DIAS_MEDIO: e.QTD_OS > 0 ? parseFloat((e.DIAS_PARADO_TOTAL / e.QTD_OS).toFixed(1)) : 0,
        DIAS_MAXIMO: e.DIAS_MAXIMO,
    })).sort((a, b) => b.DIAS_MEDIO - a.DIAS_MEDIO);
    
    const slaByGroup = allOrders.reduce((acc, os) => {
        const groupName = os.NOMEGRUPO || 'Não definido';
        let group = acc.find(g => g.name === groupName);
        if (!group) {
            group = { name: groupName, 'Dentro do SLA': 0, 'Fora do SLA': 0, total: 0 };
            acc.push(group);
        }
        group[os.Status_SLA]++;
        group.total++;
        return acc;
    }, [] as any[]).sort((a,b) => b.total - a.total);
    
    const logisticsData = analyzeLogistics(allOrdersRaw, today);

    return {
        allOrders,
        metrics,
        offenders: { pendentesAgendamento, agendadasVencidas, statusEncerradosIncorretos, pendentesAgendamentoSegmentado, pendentesInternas, atrasoCampo },
        analysisByExecutor,
        analystDistribution,
        slaByGroup,
        statusDistribution,
        slaDistribution,
        logisticsData
    };
};