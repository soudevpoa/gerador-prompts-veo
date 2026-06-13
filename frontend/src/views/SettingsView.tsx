import React, { useState, useEffect } from 'react';
import { Key, MessageSquare, Save, Loader2 } from 'lucide-react';

export default function SettingsView() {
  const [loading, setLoading] = useState(false);
  const [loadingDados, setLoadingDados] = useState(true);
  
  // Estados para os campos das configurações
  const [openaiKey, setOpenaiKey] = useState('');
  const [elevenKey, setElevenKey] = useState('');
  const [brandVoice, setBrandVoice] = useState('');

  // 🔄 1. Carrega as configurações do banco assim que o usuário entra na tela
  useEffect(() => {
    async function carregarConfiguracoes() {
      try {
        const token = localStorage.getItem('@veocreator:token');
        
        const response = await fetch('http://localhost:3001/api/user/config', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) throw new Error('Erro ao buscar configurações');

        const dados = await response.json();
        
        // Se o banco retornou dados preenchidos, seta nos inputs
        setOpenaiKey(dados.openaiKey || '');
        setElevenKey(dados.elevenKey || '');
        setBrandVoice(dados.brandVoice || '');
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoadingDados(false);
      }
    }

    carregarConfiguracoes();
  }, []);

  // 💾 2. Dispara o salvamento real no banco de dados através do backend
  const handleSalvarConfiguracoes = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('@veocreator:token');

      const response = await fetch('http://localhost:3001/api/user/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // 🔥 Token que valida QUEM está salvando
        },
        body: JSON.stringify({
          openaiKey,
          elevenKey,
          brandVoice
        })
      });

      if (!response.ok) throw new Error('Erro ao salvar no servidor');

      alert('Configurações salvas com sucesso no seu perfil! 🚀🔥');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Ops, deu erro ao tentar salvar as configurações.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingDados) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-gray-400">
        <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-2" />
        <span className="text-xs">Buscando suas configurações Hype...</span>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto animate-fadeIn">
      {/* Cabeçalho */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-wide">Configurações do Sistema</h1>
        <p className="text-xs text-gray-400 mt-1">
          Gerencie suas chaves de API, limites de créditos e customize a inteligência de voz da sua marca.
        </p>
      </div>

      <form onSubmit={handleSalvarConfiguracoes} className="space-y-6">
        
        {/* Bloco 1: Chaves de API */}
        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-3 border-b border-gray-800 pb-4 mb-4">
            <div className="p-2 bg-cyan-500/10 rounded-xl text-cyan-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Chaves de API Privadas</h2>
              <p className="text-[11px] text-gray-400">Use suas próprias credenciais para não consumir seus créditos globais do SaaS.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-medium text-gray-400 mb-1">OpenAI API Key (GPT-4o / Vision)</label>
              <input 
                type="password"
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                placeholder="sk-proj-••••••••••••••••••••••••"
                className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors placeholder:text-gray-700"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-gray-400 mb-1">ElevenLabs API Key (Vozes Clones)</label>
              <input 
                type="password"
                value={elevenKey}
                onChange={(e) => setElevenKey(e.target.value)}
                placeholder="el-••••••••••••••••••••••••"
                className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors placeholder:text-gray-700"
              />
            </div>
          </div>
        </div>

        {/* Bloco 2: Brand Voice / Contexto Fixo */}
        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-3 border-b border-gray-800 pb-4 mb-4">
            <div className="p-2 bg-purple-500/10 rounded-xl text-purple-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Brand Voice & Contexto de Escrita</h2>
              <p className="text-[11px] text-gray-400">Injete regras fixas que a IA lerá de background em TODOS os roteiros criados.</p>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-gray-400 mb-1">Instruções de Personalidade da Marca</label>
            <textarea 
              rows={5}
              value={brandVoice}
              onChange={(e) => setBrandVoice(e.target.value)}
              placeholder="Exemplo: Minha marca vende tênis streetwear. Os roteiros devem focar em um público jovem de 18 a 25 anos..."
              className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-purple-500 transition-colors resize-none h-32 custom-scrollbar placeholder:text-gray-700"
            />
          </div>
        </div>

        {/* Botão de Ação Inferior */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
            ) : (
              <>💾 Salvar Configurações Hype</>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}