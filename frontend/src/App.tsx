import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import UgcGenerator from './views/UgcGenerator';
import { PromptLibrary } from './views/PromptLibrary';
import VideoHistory from './views/VideoHistory';
import { Login } from './views/Login';
import SettingsView from './views/SettingsView';
import { supabase } from './config/supabase';
import DarkGenerator from './views/DarkGenerator';

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  // 🔥 NOVO ESTADO: Armazena o Nome e E-mail capturados do Supabase Auth
  const [usuarioLogado, setUsuarioLogado] = useState<{ name: string; email: string } | null>(null);


  // 🔄 1. Recupera a sessão salva no navegador ao carregar o app
  useEffect(() => {
    async function checarSessao() {
      const tokenSalvo = localStorage.getItem('@veocreator:token');
      if (tokenSalvo) {
        setToken(tokenSalvo);

        try {
          // 📡 Busca os metadados do usuário ativo direto do Supabase
          const { data: { user } } = await supabase.auth.getUser(tokenSalvo);
          if (user) {
            setUsuarioLogado({
              name: user.user_metadata?.display_name || user.user_metadata?.name || 'Criador UGC',
              email: user.email || ''
            });
          }
        } catch (err) {
          console.error("Erro ao recuperar dados do usuário:", err);
        }
      }
      setLoadingSession(false);
    }

    checarSessao(); // ✅ Chamada idêntica e corrigida!
  }, []);

  // 🔑 2. Função disparada ao logar com sucesso
  const handleLoginSuccess = async (novoToken: string) => {
    localStorage.setItem('@veocreator:token', novoToken);
    setToken(novoToken);

    try {
      // 📡 Busca imediatamente os dados pós-login para renderizar na Sidebar sem delay
      const { data: { user } } = await supabase.auth.getUser(novoToken);
      if (user) {
        setUsuarioLogado({
          name: user.user_metadata?.display_name || user.user_metadata?.name || 'Criador UGC',
          email: user.email || ''
        });
      }
    } catch (err) {
      console.error("Erro ao sincronizar dados pós-login:", err);
    }
  };

  // 🚪 3. Função para deslogar
  const handleLogout = () => {
    localStorage.removeItem('@veocreator:token');
    setToken(null);
    setUsuarioLogado(null); // 🔥 Limpa o estado para não vazar dados na próxima sessão
  };

  // Tela de carregamento enquanto o app lê o localStorage
  if (loadingSession) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex flex-col items-center justify-center text-gray-400">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2" />
        <span className="text-xs">Checando credenciais...</span>
      </div>
    );
  }

  // 🔐 CONDICIONAL DE OURO: Se não estiver logado, barra as rotas e exibe APENAS a tela de login
  if (!token) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // 🔓 Se estiver logado, renderiza a sua estrutura original de rotas perfeitamente!
  return (
    <Router>
      <div className="min-h-screen bg-[#0b0f19] text-gray-100 flex overflow-hidden">

        {/* 🔥 PASSAMOS O ESTADO 'usuarioLogado' COMO PROP ADICIONAL PARA A SIDEBAR */}
        <Sidebar onLogout={handleLogout} usuario={usuarioLogado} />

        {/* CONTEÚDO DINÂMICO QUE VALIDA A ROTA DA URL */}
        <div className="flex-1 overflow-y-auto h-screen custom-scrollbar">
          <Routes>
            <Route path="/" element={<UgcGenerator />} />
            <Route path="/gerador-dark" element={<DarkGenerator />} />
            {/* Rota Raiz leva para o Gerador UGC que já tínhamos montado */}
            <Route path="/" element={<UgcGenerator />} />

            {/* Nova Rota para a Biblioteca de Prompts */}
            <Route path="/biblioteca" element={<PromptLibrary />} />

            {/* Histórico real conectado ao Supabase! */}
            <Route path="/historico" element={<VideoHistory />} />

            {/* Tela de Configurações */}
            <Route path="/configuracoes" element={<SettingsView />} />

            {/* Rota de segurança caso o cara digite uma URL maluca, manda pra raiz */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>

      </div>
    </Router>
  );
}