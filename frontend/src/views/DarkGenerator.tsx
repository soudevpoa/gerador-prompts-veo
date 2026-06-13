import { useState } from 'react';
import { Sparkles, Copy, Check, Loader2, Info, Film, Radio, Skull, FileText } from 'lucide-react';

interface PromptCena {
  cena: number;
  tempo: string;
  promptTexto: string;
  locucaoTexto: string;
}

export default function DarkGenerator() {
  const [tema, setTema] = useState('');
  const [duracao, setDuracao] = useState('Curto');
  const [tipoVideo, setTipoVideo] = useState('terror');
  const [loading, setLoading] = useState(false);
  const [resultados, setResultados] = useState<PromptCena[]>([]);
  const [legendaCompleta, setLegendaCompleta] = useState<string | null>(null); // 🔥 Estado para a legenda culinária/dark
  const [copiedIndex, setCopiedIndex] = useState<{ id: number; type: 'prompt' } | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedLegenda, setCopiedLegenda] = useState(false);

  const getAvatarParametro = () => {
    return tipoVideo === 'podcast' ? 'Mikael' : 'faceless';
  };

  const handleGerarRoteiroDark = async () => {
    if (!tema) return alert('Por favor, preencha o tema central do vídeo primeiro.');

    setLoading(true);
    setResultados([]);
    setLegendaCompleta(null);
    try {
      const token = localStorage.getItem('@veocreator:token');

      const formData = new FormData();
      formData.append('produto', tema);
      formData.append('avatarDescricao', getAvatarParametro());
      formData.append('ambiente', '');
      formData.append('tipoVideo', tipoVideo);
      formData.append('duracao', duracao);

      const response = await fetch('http://localhost:3001/api/gerar-prompts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) throw new Error('Falha ao gerar roteiro na API.');
      const data = await response.json();

      if (data.prompts && data.prompts.length > 0) {
        setResultados(data.prompts);
        if (data.legendaCompleta) setLegendaCompleta(data.legendaCompleta); // 🔥 Salva a receita/legenda vinda da API

        const dadosParaSalvar = {
          produto: tema,
          avatarSelecionado: getAvatarParametro(),
          ambiente: "Dynamic Atmosphere",
          tipoVideo: tipoVideo.toUpperCase(),
          duracao: duracao,
          resultados: data.prompts
        };

        try {
          await fetch('http://localhost:3001/api/videos', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(dadosParaSalvar)
          });
        } catch (err) {
          console.error("❌ Erro ao salvar histórico:", err);
        }
      }

    } catch (error) {
      console.error("Erro ao gerar roteiro dark:", error);
      alert('Não foi possível gerar a narrativa dark adaptativa.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-100 p-6">
      <header className="max-w-7xl mx-auto mb-8 border-b border-gray-800 pb-4 flex items-center gap-3">
        <Sparkles className="w-8 h-8 text-purple-400" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gerador Dark & Faceless</h1>
          <p className="text-xs text-gray-400">Crie narrativas de alto impacto, mistérios e cortes virais sem precisar aparecer</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* ESQUERDA */}
        <section className="lg:col-span-5 bg-[#111827] p-6 rounded-xl border border-gray-800 shadow-xl flex flex-col gap-6 h-fit">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300 flex items-center gap-2">
              <Film className="w-4 h-4 text-purple-400" /> 1. Tema Central / Assunto da História
            </label>
            <textarea
              value={tema}
              onChange={(e) => setTema(e.target.value)}
              placeholder="Ex: Como fazer o brigadeiro gourmet de panela perfeito, O mistério do voo MH370..."
              rows={4}
              className="w-full bg-[#1f2937] border border-gray-700 rounded-lg p-3 text-sm focus:outline-none focus:border-purple-500 transition-colors text-white placeholder:text-gray-600 resize-none leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-gray-800 pt-4">
            <div>
              <label className="block text-[11px] font-medium mb-1 text-gray-400">2. Duração Estimada</label>
              <select
                value={duracao}
                onChange={(e) => setDuracao(e.target.value)}
                className="w-full bg-[#1f2937] border border-gray-700 rounded-lg p-2 text-xs text-white"
              >
                <option value="Curto">Curto (2 Cenas - 15s)</option>
                <option value="Médio">Médio (4 Cenas - 30s)</option>
                <option value="Longo">Longo (6 Cenas - 60s)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-[11px] font-medium mb-1 text-gray-400">3. Tipo de Narrativa</label>
              <select 
                value={tipoVideo} 
                onChange={(e) => setTipoVideo(e.target.value)} 
                className="w-full bg-[#1f2937] border border-gray-700 rounded-lg p-2 text-xs text-white"
              >
                <option value="terror">👁️ Casos Reais & Terror Dark</option>
                <option value="curiosidades">🧠 Fatos Ocultos & Curiosidades</option>
                <option value="podcast">🎧 Corte de Podcast (Com Host de Perfil)</option>
                <option value="receitas">🥞 Culinária & Receitas Rápidas</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleGerarRoteiroDark}
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium p-3 rounded-lg flex items-center justify-center gap-2 transition-all text-sm cursor-pointer disabled:opacity-40"
          >
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Compilando Estruturas...</> : <><Radio className="w-5 h-5" /> Compilar Script Unificado Mestre</>}
          </button>
        </section>

        {/* DIREITA */}
        <section className="lg:col-span-7 flex flex-col gap-6">
          {loading ? (
            <div className="border-2 border-dashed border-purple-800/40 bg-[#111827]/50 rounded-xl flex flex-col items-center justify-center p-12 text-center text-gray-400 min-h-[350px]">
              <Loader2 className="w-12 h-12 mb-3 text-purple-400 animate-spin" />
              <p className="text-sm font-medium text-purple-400">Modelando Tom Sensorial e Texturas...</p>
            </div>
          ) : resultados.length === 0 ? (
            <div className="border-2 border-dashed border-gray-800 rounded-xl flex flex-col items-center justify-center p-12 text-center text-gray-500 min-h-[350px]">
              <Skull className="w-12 h-12 mb-3 text-gray-700" />
              <p className="text-sm font-medium">Nenhum script compilado por enquanto.</p>
            </div>
          ) : (
            <>
              {/* 🔥 PAINEL EXCLUSIVO DA LEGENDA / RECEITA COMPLETA DO POST */}
              {legendaCompleta && (
                <div className="bg-[#111827] border border-purple-500/30 rounded-xl p-5 shadow-lg flex flex-col gap-3 animate-fadeIn">
                  <div className="flex justify-between items-center border-b border-gray-800/60 pb-2">
                    <h3 className="text-xs font-bold text-purple-400 flex items-center gap-2 uppercase tracking-wider">
                      <FileText className="w-4 h-4" /> Texto da Legenda / Receita do Post
                    </h3>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(legendaCompleta);
                        setCopiedLegenda(true);
                        setTimeout(() => setCopiedLegenda(false), 2000);
                      }}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-md border cursor-pointer transition-all ${copiedLegenda ? 'bg-green-950 text-green-400 border-green-500' : 'bg-[#1f2937] border-gray-700 text-purple-400 hover:border-gray-600'}`}
                    >
                      {copiedLegenda ? '✓ Copiado!' : 'Copiar Legenda'}
                    </button>
                  </div>
                  <p className="bg-[#1a1b26]/60 p-4 rounded-lg text-xs text-gray-200 border border-purple-950/20 whitespace-pre-line leading-relaxed font-sans">
                    {legendaCompleta}
                  </p>
                </div>
              )}

              {/* BOTOES DE CONTROLE VISUAL */}
              <div className="flex justify-end border-t border-gray-800/40 pt-2">
                <button 
                  onClick={() => {
                    const blocoCompleto = resultados.map(r => `Cena ${r.cena} (${r.tempo}):\n${r.promptTexto}`).join('\n\n');
                    navigator.clipboard.writeText(blocoCompleto);
                    setCopiedAll(true);
                    setTimeout(() => setCopiedAll(false), 2000);
                  }} 
                  className={`text-xs font-semibold px-4 py-2 rounded-lg border cursor-pointer transition-all ${copiedAll ? 'bg-green-950 border-green-500 text-green-400' : 'bg-[#1f2937] border-gray-700 text-purple-400 hover:border-purple-500/40'}`}
                >
                  {copiedAll ? '✓ Todos os Prompts Copiados!' : '📋 Copiar Todos os Prompts de Vídeo'}
                </button>
              </div>

              {/* PROMPTS INDIVIDUAIS DE CENA PRO VEO */}
              {resultados.map((item, idx) => (
                <div key={idx} className="bg-[#111827] rounded-xl border border-gray-800 p-5 shadow-lg flex flex-col gap-3 animate-fadeIn">
                  <div className="flex justify-between items-center border-b border-gray-800/60 pb-2">
                    <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Comando de Vídeo - Cena {item.cena} ({item.tempo})</span>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(item.promptTexto);
                        setCopiedIndex({ id: idx, type: 'prompt' });
                        setTimeout(() => setCopiedIndex(null), 2000);
                      }} 
                      className="text-xs text-cyan-400 cursor-pointer hover:underline font-semibold"
                    >
                      {copiedIndex?.id === idx ? '✓ Copiado!' : 'Copiar Bloco'}
                    </button>
                  </div>
                  <p className="bg-[#1f2937] p-3 rounded-lg text-xs font-mono text-gray-300 break-words border border-gray-800 leading-relaxed">
                    {item.promptTexto}
                  </p>
                </div>
              ))}
            </>
          )}
        </section>
      </main>
    </div>
  );
}