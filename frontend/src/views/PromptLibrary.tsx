import { useState } from 'react';
import { Bookmark, Plus, Search, Trash2, Edit } from 'lucide-react';

export default function PromptLibrary() {
  const [busca, setBusca] = useState('');

  // Mock provisório de prompts salvos para visualizarmos a tela linda
  const promptsSalvosExemplo = [
    { id: 1, titulo: 'Gancho Retenção Extrema', tipo: 'Visual', fragmento: 'Fast cuts, macro zoom on fabric texture...' },
    { id: 2, titulo: 'Corte de Quebra de Objeção', tipo: 'Falado', fragmento: 'says "Se você acha que toda legging rasga..."' },
  ];

  return (
    <div className="flex-1 p-6 max-w-6xl mx-auto w-full">
      <header className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-800 pb-5">
        <div className="flex items-center gap-3">
          <Bookmark className="w-8 h-8 text-purple-400" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Biblioteca de Prompts</h1>
            <p className="text-xs text-gray-400">Gerencie e injete suas fatias visuais e faladas de alta conversão diretamente no gerador</p>
          </div>
        </div>
        <button className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-medium px-4 py-2.5 rounded-lg text-sm shadow-lg transition-all cursor-pointer">
          <Plus className="w-4 h-4" /> Novo Prompt Ativo
        </button>
      </header>

      {/* BARRA DE PESQUISA */}
      <div className="mb-6 relative">
        <Search className="w-4 h-4 text-gray-500 absolute left-3 top-3.5" />
        <input
          type="text"
          placeholder="Buscar prompts por título ou fragmento de texto..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full bg-[#111827] border border-gray-800 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-purple-500 transition-colors text-white"
        />
      </div>

      {/* CARDS DE PROMPTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {promptsSalvosExemplo.map((prompt) => (
          <div key={prompt.id} className="bg-[#111827] border border-gray-800 rounded-xl p-5 shadow-md hover:border-purple-500/30 transition-all flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-white tracking-wide">{prompt.titulo}</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  prompt.tipo === 'Visual' ? 'bg-cyan-950/40 border-cyan-500/30 text-cyan-400' : 'bg-purple-950/40 border-purple-500/30 text-purple-400'
                }`}>
                  {prompt.tipo}
                </span>
              </div>
              <p className="text-xs font-mono text-gray-400 bg-[#1f2937]/40 p-3 rounded-lg border border-gray-800/60 line-clamp-2">
                {prompt.fragmento}
              </p>
            </div>
            
            <div className="flex justify-end gap-2 border-t border-gray-800/60 pt-3">
              <button className="p-1.5 text-gray-400 hover:text-purple-400 rounded transition-colors cursor-pointer" title="Editar">
                <Edit className="w-4 h-4" />
              </button>
              <button className="p-1.5 text-gray-400 hover:text-red-400 rounded transition-colors cursor-pointer" title="Excluir">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}