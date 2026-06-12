import React, { useEffect, useState } from 'react';

interface VideoHistoryItem {
    id: string;
    produto: string;
    avatarDescricao: string;
    ambiente: string;
    tipoVideo: string;
    duracao: string;
    promptsGerados: any;
    createdAt: string;
}

export default function VideoHistory() {
    const [historico, setHistorico] = useState<VideoHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [videoAberto, setVideoAberto] = useState<string | null>(null);

    // Carrega o histórico vindo do backend/Supabase
    useEffect(() => {
        const carregarHistorico = async () => {
            try {
                const response = await fetch('http://localhost:3001/api/videos');
                if (!response.ok) throw new Error('Erro ao buscar histórico');
                const data = await response.json();
                setHistorico(data);
            } catch (error) {
                console.error('Erro ao carregar histórico:', error);
            } finally {
                setLoading(false);
            }
        };

        carregarHistorico();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen text-slate-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mr-3"></div>
                <span>Carregando histórico do Supabase...</span>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    🎥 Histórico de Geração UGC
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                    Veja e recupere todos os roteiros e prompts gerados pela IA salvos na nuvem.
                </p>
            </div>

            {historico.length === 0 ? (
                <div className="text-center py-12 bg-slate-900/50 rounded-xl border border-slate-800">
                    <p className="text-slate-400">Nenhum roteiro gerado encontrado no histórico.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {historico.map((item) => (
                        <div
                            key={item.id}
                            className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-indigo-500/50 transition-all"
                        >
                            <div className="flex flex-wrap justify-between items-start gap-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-white capitalize">{item.produto}</h3>
                                    <div className="flex flex-wrap gap-2 mt-2 text-xs">
                                        <span className="px-2 py-1 bg-slate-800 text-slate-300 rounded">👤 {item.avatarDescricao}</span>
                                        <span className="px-2 py-1 bg-slate-800 text-slate-300 rounded">🌆 {item.ambiente}</span>
                                        <span className="px-2 py-1 bg-indigo-950 text-indigo-400 rounded font-medium">{item.tipoVideo}</span>
                                        <span className="px-2 py-1 bg-emerald-950 text-emerald-400 rounded font-medium">⏱️ {item.duracao}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs text-slate-500">
                                        {new Date(item.createdAt).toLocaleDateString('pt-BR', {
                                            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                        })}
                                    </span>
                                    <button
                                        onClick={() => setVideoAberto(videoAberto === item.id ? null : item.id)}
                                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-lg transition-colors"
                                    >
                                        {videoAberto === item.id ? 'Fechar Roteiro' : 'Ver Prompts'}
                                    </button>
                                </div>
                            </div>

                            {/* Acordeão para expandir as cenas/prompts */}
                            {/* Acordeão para expandir as cenas/prompts - CORRIGIDO */}
                            {videoAberto === item.id && (
                                <div className="mt-5 pt-4 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
                                    {Array.isArray(item.promptsGerados) ? (
                                        item.promptsGerados.map((cena: any, index: number) => (
                                            <div key={index} className="bg-slate-950 border border-slate-800/80 rounded-xl p-4">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                                                        Cena {cena.cena || index + 1} {/* 🔥 Ajustado para ler 'cena' */}
                                                    </span>
                                                    <span className="text-[10px] text-slate-500 font-mono bg-slate-900 px-2 py-0.5 rounded">
                                                        ⏱️ {cena.tempo || 'N/A'} {/* 🔥 Ajustado para ler 'tempo' */}
                                                    </span>
                                                </div>

                                                <div className="mb-3">
                                                    <span className="text-[10px] text-indigo-400 uppercase font-bold block mb-1">Prompt Visual (VEO):</span>
                                                    <p className="text-sm text-slate-300 bg-slate-900/60 p-3 rounded-lg border border-slate-800/50 font-mono leading-relaxed break-words">
                                                        {cena.promptTexto || 'Sem prompt visual.'} {/* 🔥 Ajustado para ler 'promptTexto' */}
                                                    </p>
                                                </div>

                                                {cena.locucaoTexto && (
                                                    <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800/30">
                                                        <span className="text-[10px] text-emerald-400 uppercase font-bold block mb-1">Fala do Avatar (Áudio Nativo):</span>
                                                        <p className="text-xs text-slate-400 italic">"{cena.locucaoTexto}"</p> {/* 🔥 Ajustado para ler 'locucaoTexto' */}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-xs text-slate-500 col-span-2">Estrutura de prompts inválida no banco.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}