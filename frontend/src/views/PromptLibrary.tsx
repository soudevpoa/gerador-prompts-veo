import React, { useState, useEffect } from 'react';
import { Bookmark, Plus, Search, Trash2 } from 'lucide-react';

interface PromptItem {
  id: string;
  titulo: string;
  tipo: string;
  fragmento: string;
}

export function PromptLibrary() {
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');

  // Campos do formulário
  const [titulo, setTitulo] = useState('');
  const [tipo, setTipo] = useState('Texto');
  const [fragmento, setFragmento] = useState('');

  const API_URL = 'http://localhost:3001/api/prompts';

  // 🟢 1. BUSCAR PROMPTS DO BANCO DE DADOS
  useEffect(() => {
    carregarPrompts();
  }, []);

  const carregarPrompts = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('Erro ao buscar dados do servidor');
      const data = await response.json();
      setPrompts(data);
    } catch (error) {
      console.error('Erro na biblioteca:', error);
      alert('Não foi possível carregar os prompts da nuvem.');
    } finally {
      setLoading(false);
    }
  };

  // 🔵 2. ADICIONAR UM NOVO PROMPT NO SUPABASE
  const handleAdicionarPrompt = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!titulo.trim() || !fragmento.trim()) {
      alert('Preencha todos os campos!');
      return;
    }

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo, tipo, fragmento }),
      });

      if (!response.ok) throw new Error('Erro ao salvar no servidor');

      const novoPrompt = await response.json();
      setPrompts([novoPrompt, ...prompts]);

      setTitulo('');
      setFragmento('');
    } catch (error) {
      console.error('Erro ao adicionar:', error);
      alert('Erro ao salvar o prompt no banco de dados.');
    }
  };

  // 🔴 3. REMOVER UM PROMPT DO BANCO DE DADOS
  const handleDeletarPrompt = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este prompt?')) return;

    try {
      const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Erro ao deletar no servidor');
      setPrompts(prompts.filter((p) => p.id !== id));
    } catch (error) {
      console.error('Erro ao deletar:', error);
      alert('Não foi possível remover o prompt do banco de dados.');
    }
  };

  // 🔍 Filtro de busca em tempo real na tela
  const promptsFiltrados = prompts.filter(p =>
    p.titulo.toLowerCase().includes(busca.toLowerCase()) ||
    p.fragmento.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center gap-3 border-b pb-4">
        <Bookmark className="w-8 h-8 text-indigo-600" />
        <h1 className="text-2xl font-bold text-gray-800">Biblioteca de Prompts</h1>
      </div>

      {/* FORMULÁRIO DE CADASTRO */}
      {/* FORMULÁRIO DE CADASTRO AJUSTADO PARA MODO ESCURO */}
      <form onSubmit={handleAdicionarPrompt} className="bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-800 space-y-4">
        <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
          <Plus className="w-5 h-5 text-green-500" /> Novo Prompt
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Título do Prompt (ex: Criar Redação, Tradutor...)"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="md:col-span-2 p-2.5 border border-slate-700 rounded-lg bg-slate-800 text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="p-2.5 border border-slate-700 rounded-lg bg-slate-800 text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="Texto" className="bg-slate-800">Texto / Copy</option>
            <option value="Imagem" className="bg-slate-800">Imagem / Midjourney</option>
            <option value="Vídeo" className="bg-slate-800">Vídeo / Veo</option>
            <option value="Código" className="bg-slate-800">Código / Dev</option>
          </select>
        </div>
        <textarea
          placeholder="Cole aqui o esqueleto do seu prompt profissional..."
          value={fragmento}
          onChange={(e) => setFragmento(e.target.value)}
          rows={4}
          className="w-full p-2.5 border border-slate-700 rounded-lg bg-slate-800 text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"
        />
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Salvar na Nuvem
        </button>
      </form>

      {/* BARRA DE BUSCA */}
      <div className="relative">
        <Search className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Buscar prompt salvo..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none"
        />
      </div>

      {/* LISTAGEM DOS PROMPTS */}
      {loading ? (
        <div className="text-center text-gray-500 py-12 animate-pulse">Carregando seus prompts do Supabase...</div>
      ) : promptsFiltrados.length === 0 ? (
        <div className="text-center text-gray-400 py-12 border-2 border-dashed rounded-xl bg-gray-50">
          Nenhum prompt encontrado na nuvem.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {promptsFiltrados.map((prompt) => (
            <div key={prompt.id} className="bg-slate-900 p-5 rounded-xl shadow-sm border border-slate-800 flex flex-col justify-between group relative">
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-4">
                  <h3 className="font-bold text-slate-200 text-lg">{prompt.titulo}</h3>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-950 text-indigo-400 rounded-full border border-indigo-900">
                    {prompt.tipo}
                  </span>
                </div>
                <p className="text-slate-300 text-sm font-mono whitespace-pre-wrap bg-slate-800 p-3 rounded-lg border border-slate-700 max-h-48 overflow-y-auto">
                  {prompt.fragmento}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t flex justify-end">
                <button
                  onClick={() => handleDeletarPrompt(prompt.id)}
                  className="text-red-500 hover:text-red-700 p-1.5 rounded-md hover:bg-red-50 transition-colors"
                  title="Excluir do banco"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}