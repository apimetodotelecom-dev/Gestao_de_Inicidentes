import { GoogleGenAI } from "@google/genai";
import { DataSummaryForAI, PerformanceMetric, ProcessedData, ServiceOrder } from '../types';

// Helper function to calculate metrics for a given subset of orders
const calculatePerformanceMetrics = (orders: ServiceOrder[]): PerformanceMetric => {
    const totalOS = orders.length;
    if (totalOS === 0) {
        return { totalOS: 0, percentualSLA: 'N/A', mediaDiasParado: '0.0' };
    }
    const dentroSLA = orders.filter(os => os.Status_SLA === 'Dentro do SLA').length;
    const percentualSLA = ((dentroSLA / totalOS) * 100).toFixed(1) + '%';
    const mediaDiasParado = (orders.reduce((acc, os) => acc + os.DIAS_PARADO, 0) / totalOS).toFixed(1);

    return { totalOS, percentualSLA, mediaDiasParado };
};

// Helper function to group data and calculate metrics
const groupAndCalculate = (
    orders: ServiceOrder[],
    key: keyof ServiceOrder
): Record<string, PerformanceMetric> => {
    const grouped: Record<string, ServiceOrder[]> = orders.reduce((acc, os) => {
        const groupKey = (os[key] as string) || 'Não Definido';
        if (!acc[groupKey]) {
            acc[groupKey] = [];
        }
        acc[groupKey].push(os);
        return acc;
    }, {});

    const results: Record<string, PerformanceMetric> = {};
    for (const groupKey in grouped) {
        results[groupKey] = calculatePerformanceMetrics(grouped[groupKey]);
    }
    return results;
};


const createDataSummary = (data: ProcessedData): DataSummaryForAI => {
    const generalMetrics = calculatePerformanceMetrics(data.allOrders);

    const porGrupo = groupAndCalculate(data.allOrders, 'NOMEGRUPO');
    const porAnalista = groupAndCalculate(data.allOrders, 'ANALISTA_RESPONSAVEL');
    const porExecutor = groupAndCalculate(data.allOrders, 'EXECUTANTE');

    return {
        totalOS: generalMetrics.totalOS,
        percentualSLA: generalMetrics.percentualSLA,
        mediaDiasParado: generalMetrics.mediaDiasParado,
        porGrupo,
        porAnalista,
        porExecutor
    };
};

const formatMetricsForPrompt = (title: string, data: Record<string, PerformanceMetric>): string => {
    const entries = Object.entries(data)
        .sort(([, a], [, b]) => b.totalOS - a.totalOS) // Sort by total OS
        .slice(0, 15); // Limit to top 15 to avoid huge prompts

    if (entries.length === 0) {
        return `- ${title}: Nenhum dado disponível.`;
    }
    
    // Usando formatação simples para garantir legibilidade
     const rows = entries.map(([name, metrics]) => 
        `- ${name} | OS: ${metrics.totalOS} | SLA: ${metrics.percentualSLA} | Média Dias: ${metrics.mediaDiasParado}`
    ).join('\n      ');
    
    return `${title}:\n      ${rows}`;
};


const createPrompt = (dataSummary: DataSummaryForAI, question: string): string => {
  return `
    Você é um assistente especialista em análise de dados de Ordens de Serviço (OS) e performance de equipes.
    Sua tarefa é analisar o resumo de dados do backlog e responder à pergunta do usuário.

    **Contexto Importante:**
    - **Analista Responsável:** É o analista de operação que supervisiona a OS. As regras de negócio definem quem é o analista.
    - **Executor:** É o técnico ou equipe técnica que efetivamente realiza o trabalho da OS.
    - **Dias Parado:** Medido em dias úteis. Um valor alto indica lentidão.
    - **% Dentro SLA:** A porcentagem de OS que estão cumprindo o prazo. Um valor acima de 70% é bom.

    **Resumo de Dados do Backlog:**
    - **Geral:**
      - Total de OS: ${dataSummary.totalOS}
      - % Dentro SLA (Geral): ${dataSummary.percentualSLA}
      - Média Dias Parado (Geral): ${dataSummary.mediaDiasParado}

    - **Performance por Analista Responsável:**
      ${formatMetricsForPrompt('Analista', dataSummary.porAnalista)}
    
    - **Performance por Executor:**
      ${formatMetricsForPrompt('Executor', dataSummary.porExecutor)}

    - **Performance por Grupo:**
      ${formatMetricsForPrompt('Grupo', dataSummary.porGrupo)}

    **Pergunta do Usuário:**
    "${question}"

    **Sua Análise (responda em português do Brasil, usando bullet points e uma linguagem direta e objetiva):**
  `;
}


export const getAiAnalysis = async (processedData: ProcessedData, question: string): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("A chave da API do Gemini não foi configurada.");
    }
    
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const dataSummary = createDataSummary(processedData);
        const prompt = createPrompt(dataSummary, question);

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return response.text;
    } catch (error) {
        console.error("Erro ao chamar a API Gemini:", error);
        if (error instanceof Error && error.message.includes('API key not valid')) {
            return "Erro: A chave da API fornecida não é válida. Verifique suas credenciais.";
        }
        return "Desculpe, não foi possível obter a análise da IA neste momento. Tente novamente mais tarde.";
    }
};