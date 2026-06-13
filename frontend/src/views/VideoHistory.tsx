import React, { useEffect, useState } from 'react';
// 🔥 Importamos os ícones necessários para dar o feedback visual premium
import { Trash2, Loader2, Film, Calendar, User, Sliders } from 'lucide-react';

interface VideoHistoryItem {
    id: String; // Alterado para number para bater com o ID autoincrement do Prisma
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
    const [videoAberto, setVideoAberto] = useState<number | null>(null); // Tipagem ajustada para number
    const [deletingId, setDeletingId] = useState<number | null>(null); // Feedback visual de exclusão

    // Carrega o histórico vindo do backend/Supabase
    useEffect(() => {
        const carregarHistorico = async () => {
            try {
                const token = localStorage.getItem('@veocreator:token') || localStorage.getItem('supabase.auth.token');

                if (!token) {
                    console.error("Token de autenticação não encontrado no localStorage!");
                    setLoading(false); // Evita travar a tela em loading
                    return;
                }

                const response = await fetch('http://localhost:3001/api/videos', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.status === 401) {
                    console.error("Erro 401: Token inválido ou expirado.");
                    setLoading(false);
                    return;
                }

                if (!response.ok) throw new Error('Erro ao carregar o histórico.');

                const dados = await response.json();
                setHistorico(dados); // 🔥 CORRIGIDO: Agora usa o setHistorico correto!
            } catch (error) {
                console.error('Erro no front ao carregar histórico:', error);
            } finally {
                setLoading(false); // 🔥 CORRIGIDO: Mata o loading infinito independente de dar certo ou errado!
            }
        };

        carregarHistorico();
    }, []);

    // 🔥 NOVA FUNÇÃO: Dispara a exclusão segura no backend e limpa a tela instantaneamente
    const handleDeletarRegistro = async (id: number) => {
        if (!confirm("Tem certeza que deseja apagar esse roteiro do seu histórico?")) return;

        setDeletingId(id);
        try {
            const token = localStorage.getItem('@veocreator:token') || localStorage.getItem('supabase.auth.token');
            const response = await fetch(`http://localhost:3001/api/videos/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                // Remove do estado na hora sem precisar dar F5 na página
                setHistorico(prev => prev.filter(item => item.id !== id));
                if (videoAberto === id) setVideoAberto(null);
            } else {
                alert("Não foi possível remover este registro.");
            }
        } catch (err) {
            console.error("Erro ao deletar item:", err);
            alert("Erro ao conectar ao servidor.");
        } finally {
            setDeletingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#0b0f19] text-slate-400 gap-3">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                <span className="text-sm font-medium">Carregando histórico do Supabase...</span>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto min-h-screen bg-[#0b0f19]">
            <div className="mb-6 border-b border-slate-850 pb-4">
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Film className="w-6 h-6 text-purple-400" /> Histórico de Geração UGC & Dark
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                    Veja, gerencie e delete os roteiros e prompts gerados pela IA salvos na nuvem.
                </p>
            </div>

            {historico.length === 0 ? (
                <div className="text-center py-12 bg-slate-900/40 rounded-xl border border-slate-800">
                    <p className="text-slate-400 text-sm">Nenhum roteiro gerado encontrado no seu histórico.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {historico.map((item) => (
                        <div
                            key={item.id}
                            className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-indigo-500/30 transition-all shadow-md"
                        >
                            <div className="flex flex-wrap justify-between items-start gap-4">
                                <div className="space-y-1">
                                    <h3 className="text-base font-bold text-gray-200 capitalize leading-snug">{item.produto}</h3>
                                    <div className="flex flex-wrap gap-1.5 mt-2 text-[11px]">
                                        <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded flex items-center gap-1">👤 {item.avatarDescricao}</span>
                                        <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded flex items-center gap-1">🌆 {item.ambiente || 'Ambientação'}</span>
                                        <span className="px-2 py-0.5 bg-purple-950/60 text-purple-400 border border-purple-900/30 rounded font-medium uppercase tracking-wider">{item.tipoVideo}</span>
                                        <span className="px-2 py-0.5 bg-emerald-950/60 text-emerald-400 border border-emerald-900/30 rounded font-medium">⏱️ {item.duracao}</span>
                                    </div>
                                </div>
                                
                                {/* 🛠️ SEÇÃO DOS BOTÕES DA DIREITA CONTROLANDO A DELEÇÃO */}
                                <div className="flex items-center gap-3 ml-auto">
                                    <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {new Date(item.createdAt).toLocaleDateString('pt-BR', {
                                            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                                        })}
                                    </span>
                                    
                                    <button
                                        onClick={() => setVideoAberto(videoAberto === item.id ? null : item.id)}
                                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer shadow-sm"
                                    >
                                        {videoAberto === item.id ? 'Fechar Roteiro' : 'Ver Prompts'}
                                    </button>

                                    {/* 🔥 BOTÃO DE LIXEIRA ACOPLADO E SEGURO */}
                                    <button
                                        onClick={() => handleDeletarRegistro(item.id)}
                                        disabled={deletingId === item.id}
                                        className="p-2 bg-slate-800 hover:bg-red-950/40 border border-slate-700 hover:border-red-900/60 text-slate-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
                                        title="Excluir do Histórico"
                                    >
                                        {deletingId === item.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                                        ) : (
                                            <Trash2 className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Acordeão expandindo as cenas do Google VEO */}
                            {videoAberto === item.id && (
                                <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
                                    {Array.isArray(item.promptsGerados) ? (
                                        item.promptsGerados.map((cena: any, index: number) => (
                                            <div key={index} className="bg-slate-950 border border-slate-800/60 rounded-xl p-4 flex flex-col gap-3">
                                                <div className="flex justify-between items-center border-b border-slate-900 pb-1.5">
                                                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                                                        Cena {cena.cena || index + 1}
                                                    </span>
                                                    <span className="text-[10px] text-slate-500 font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800/30">
                                                        ⏱️ {cena.tempo || 'N/A'}
                                                    </span>
                                                </div>

                                                <div>
                                                    <span className="text-[10px] text-indigo-400 uppercase font-bold block mb-1 tracking-wide">Prompt Visual (VEO):</span>
                                                    <p className="text-xs text-slate-300 bg-slate-900/80 p-3 rounded-lg border border-slate-800/40 font-mono leading-relaxed break-words select-all">
                                                        {cena.promptTexto || 'Sem prompt visual.'}
                                                    </p>
                                                </div>

                                                {cena.locucaoTexto && (
                                                    <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800/30 mt-auto">
                                                        <span className="text-[10px] text-emerald-400 uppercase font-bold block mb-1 tracking-wide">Fala/Narração (Áudio Nativo):</span>
                                                        <p className="text-xs text-slate-400 italic">"{cena.locucaoTexto}"</p>
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