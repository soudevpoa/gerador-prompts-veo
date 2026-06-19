import React from 'react';
import { Sparkles, Play, Clock, Copy } from 'lucide-react';

export default function StoryboardView({ data }: { data: any }) {
  console.log("Dados recebidos no StoryboardView:", data);

  if (!data) return <p className="text-white p-4">Nenhum dado recebido.</p>;

  // Extração de dados com fallback para os dois formatos possíveis
  const roteiro = data?.roteiro || null;
  const scriptTexto = data?.script || null;

  return (
    <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 mt-6 shadow-xl">
      <div className="flex items-center gap-3 mb-6">
        <Sparkles className="text-cyan-500 w-6 h-6" />
        <h2 className="text-xl font-bold text-white">Roteiro Remodelado</h2>
      </div>

      {/* Renderização Condicional baseada no formato do dado */}
      {roteiro ? (
        <>
          <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800 mb-6">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Prompt Visual</h3>
            <p className="text-gray-300 text-sm italic">"{data.promptVisual}"</p>
          </div>

          <div className="space-y-4">
            {roteiro.map((cena: any, index: number) => (
              <div key={index} className="bg-[#1f2937] p-5 rounded-xl border border-gray-700 hover:border-cyan-500/50 transition-all">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-cyan-400 font-mono text-xs font-bold flex items-center gap-2">
                    <Clock className="w-3 h-3" /> {cena.tempo || `Cena ${index + 1}`}
                  </span>
                </div>
                <p className="text-white text-sm font-medium mb-2">{cena.visual || cena}</p>
                {cena.audio && (
                  <p className="text-purple-400 text-xs font-mono bg-purple-950/30 p-2 rounded">
                    🎙️ {cena.audio}
                  </p>
                )}
              </div>
            ))}
          </div>
        </>
      ) : scriptTexto && typeof scriptTexto === 'object' ? (
        /* Renderiza campos dinâmicos caso o backend envie um objeto */
        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 text-gray-300 leading-relaxed">
          {Object.entries(scriptTexto).map(([key, value]) => (
            <div key={key} className="mb-4">
              <h4 className="text-cyan-500 font-bold uppercase text-xs tracking-widest">{key}:</h4>
              <p className="text-white mt-1">{String(value)}</p>
            </div>
          ))}
        </div>
      ) : scriptTexto ? (
        /* Renderiza como texto simples se for uma string */
        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 text-gray-300">
          <p className="whitespace-pre-line">{String(scriptTexto)}</p>
        </div>
      ) : (
        <p className="text-gray-500 italic">Formato de dados não reconhecido pelo Storyboard.</p>
      )}

      {/* Seção da Locução (se existir) */}
      {data.locucaoTexto && (
        <div className="mt-8 pt-6 border-t border-gray-800">
          <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
            <Play className="w-4 h-4 text-cyan-500" /> Locução Completa
          </h3>
          <div className="bg-gray-900 p-4 rounded-lg text-gray-300 text-sm border border-gray-800 leading-relaxed font-sans">
            {data.locucaoTexto.split(/(\[.*?\])/).map((part: string, i: number) =>
              part.startsWith('[') ? (
                <span key={i} className="text-cyan-400 font-bold italic bg-cyan-950/30 px-1 rounded border border-cyan-900/50 mx-0.5">
                  {part}
                </span>
              ) : (
                <span key={i}>{part}</span>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}