import React, { useState } from 'react';
import axios from 'axios';
import { supabase } from '../config/supabase';

interface Cena {
    cena: number;
    tempo: string;
    promptTexto: string;
    locucaoTexto: string;
}

const RemodelagemPage = () => {
    const [transcricao, setTranscricao] = useState('');
    const [duracao, setDuracao] = useState('15s');
    const [tipoVideo, setTipoVideo] = useState('UGC Tradicional');
    const [resultado, setResultado] = useState<{ prompts: Cena[]; legendaCompleta?: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const [copiadoIdx, setCopiadoIdx] = useState<string | null>(null);

    const handleCopiar = (texto: string, id: string) => {
        navigator.clipboard.writeText(texto);
        setCopiadoIdx(id);
        setTimeout(() => setCopiadoIdx(null), 2000);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!transcricao.trim()) return alert("Por favor, digite ou cole uma transcrição.");

        setLoading(true);
        setResultado(null);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const res = await axios.post('http://localhost:3001/api/remodelar-conteudo', {
                transcricao,
                duracao,
                tipoVideo
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log("Resposta do Backend no Front-end:", res.data);
            
            if (res.data && res.data.prompts) {
                setResultado(res.data);
            }
        } catch (error) {
            console.error("Erro na requisição de remodelagem:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8 min-h-screen pb-20">
            <header>
                <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                    Remodelagem de Script para Veo
                </h1>
                <p className="text-gray-400">
                    Cole sua transcrição abaixo para reescrever um novo roteiro e falas segmentadas para copiar e colar.
                </p>
            </header>

            <form onSubmit={handleSubmit} className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700 space-y-4">
                <div className="flex flex-col space-y-2">
                    <textarea
                        value={transcricao}
                        onChange={(e) => setTranscricao(e.target.value)}
                        placeholder="Cole aqui a transcrição que você quer remodelar..."
                        className="w-full h-32 p-4 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 resize-none text-sm"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <select 
                        value={duracao}
                        onChange={(e) => setDuracao(e.target.value)}
                        className="p-3 bg-gray-900 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
                    >
                        <option value="15s">15s</option>
                        <option value="30s">30s</option>
                        <option value="60s">60s</option>
                    </select>

                    <select
                        value={tipoVideo}
                        onChange={(e) => setTipoVideo(e.target.value)}
                        className="p-3 bg-gray-900 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
                    >
                        <option value="UGC Tradicional">UGC Tradicional</option>
                        <option value="Corte de Podcast">Corte de Podcast</option>
                        <option value="Canal Dark / Faceless">Canal Dark / Faceless</option>
                    </select>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 disabled:opacity-50"
                >
                    {loading ? 'Processando...' : 'Remodelar Conteúdo'}
                </button>
            </form>

            {loading && (
                <div className="flex flex-col justify-center items-center py-10">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-cyan-500"></div>
                    <p className="mt-4 text-cyan-500 font-semibold animate-pulse">A IA está criando seu novo roteiro e falas...</p>
                </div>
            )}

            {resultado && (
                <section className="animate-in fade-in duration-700 space-y-6">
                    <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex justify-between items-center">
                        <div>
                            <span className="bg-emerald-500/10 text-emerald-400 text-xs font-semibold px-2.5 py-1 rounded-full">Pronto para o Veo</span>
                            <p className="text-gray-300 mt-2 text-sm">Use sua foto diretamente no software e copie os blocos de texto abaixo.</p>
                        </div>
                    </div>
                    
                    {/* Renderização Direta das Cenas Otimizada */}
                    <div className="space-y-4">
                        {resultado.prompts.map((item, index) => (
                            <div key={index} className="bg-gray-800/80 border border-gray-700 rounded-xl p-5 space-y-4">
                                <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                                    <span className="text-cyan-400 font-bold text-sm">Cena {item.cena} ({item.tempo})</span>
                                    <span className="text-xs text-gray-500">Prompt de Apoio: {item.promptTexto}</span>
                                </div>
                                
                                <div className="flex flex-col space-y-2">
                                    <label className="text-xs text-gray-400 font-medium">Texto para Locução / Áudio do Veo:</label>
                                    <div className="flex gap-2">
                                        <div className="flex-1 bg-gray-900 border border-gray-700 rounded-xl p-3 text-white text-sm select-all">
                                            {item.locucaoTexto}
                                        </div>
                                        <button
                                            onClick={() => handleCopiar(item.locucaoTexto, `fala-${index}`)}
                                            className={`px-4 rounded-xl font-medium text-xs transition-all ${
                                                copiadoIdx === `fala-${index}` 
                                                    ? 'bg-emerald-600 text-white' 
                                                    : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                                            }`}
                                        >
                                            {copiadoIdx === `fala-${index}` ? 'Copiado!' : 'Copiar'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {resultado.legendaCompleta && (
                        <div className="bg-gray-800/40 border border-gray-700 rounded-xl p-5 space-y-2">
                            <div className="flex justify-between items-center">
                                <h3 className="text-white font-semibold text-sm">Sugestão de Legenda Mestre</h3>
                                <button
                                    onClick={() => handleCopiar(resultado.legendaCompleta || '', 'legenda')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                        copiadoIdx === 'legenda' ? 'bg-emerald-600 text-white' : 'bg-cyan-600 text-white hover:bg-cyan-700'
                                    }`}
                                >
                                    {copiadoIdx === 'legenda' ? 'Copiado!' : 'Copiar Legenda'}
                                </button>
                            </div>
                            <p className="text-gray-400 text-xs whitespace-pre-wrap bg-gray-900/50 p-3 rounded-lg border border-gray-800">
                                {resultado.legendaCompleta}
                            </p>
                        </div>
                    )}
                </section>
            )}
        </div>
    );
};

export default RemodelagemPage;