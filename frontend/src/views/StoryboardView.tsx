import React from 'react';
import { Sparkles, Play, Clock, Copy } from 'lucide-react';

export default function StoryboardView({ data }: { data: any }) {
  if (!data || !data.roteiro) return <p className="text-white">Aguardando geração...</p>;

  return (
    <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 mt-6 shadow-xl">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <Sparkles className="text-cyan-500" /> Roteiro de Produção
      </h2>

      {/* Grid de Cenas (Roteiro VEO) */}
      <div className="space-y-4 mb-8">
        {data.roteiro.map((cena: any, i: number) => (
          <div key={i} className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
            <div className="flex justify-between items-center mb-2">
              <span className="text-cyan-400 text-xs font-mono font-bold flex items-center gap-2">
                <Clock className="w-3 h-3" /> {cena.tempo}
              </span>
              <button onClick={() => navigator.clipboard.writeText(cena.visual)} className="text-gray-500 hover:text-white">
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <p className="text-white text-sm mb-2">{cena.visual}</p>
            <p className="text-purple-400 text-xs font-mono italic">🎙️ {cena.audio}</p>
          </div>
        ))}
      </div>

      {/* Locução Completa com Comandos */}
      <div className="pt-6 border-t border-gray-800">
        <h3 className="text-white font-bold mb-3 flex items-center gap-2">
          <Play className="w-4 h-4 text-cyan-500" /> Locução Final (Copy/Paste)
        </h3>
        <button 
          onClick={() => navigator.clipboard.writeText(data.locucaoTexto)}
          className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-2 rounded-lg text-sm font-bold mb-3 transition"
        >
          Copiar Locução Completa
        </button>
        <div className="bg-gray-950 p-4 rounded-lg text-gray-300 text-sm font-mono whitespace-pre-line border border-gray-800">
          {data.locucaoTexto.split(/(\[.*?\])/).map((p: string, i: number) => 
            p.startsWith('[') ? <span key={i} className="text-cyan-400 font-bold">{p}</span> : p
          )}
        </div>
      </div>
    </div>
  );
}