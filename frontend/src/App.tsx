import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import UgcGenerator from './views/UgcGenerator';
import { PromptLibrary } from './views/PromptLibrary';
import VideoHistory from './views/VideoHistory'; // 🔥 1. Importa a nova tela de histórico que criamos

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#0b0f19] text-gray-100 flex overflow-hidden">
        
        {/* SIDEBAR FIXA COMPARTILHADA POR TODAS AS TELAS */}
        <Sidebar />

        {/* CONTEÚDO DINÂMICO QUE VALIDA A ROTA DA URL */}
        <div className="flex-1 overflow-y-auto h-screen custom-scrollbar">
          <Routes>
            {/* Rota Raiz leva para o Gerador UGC que já tínhamos montado */}
            <Route path="/" element={<UgcGenerator />} />
            
            {/* Nova Rota para a Biblioteca de Prompts */}
            <Route path="/biblioteca" element={<PromptLibrary />} />
            
            {/* 🔥 2. Substitui o fallback antigo pela nossa tela real conectada ao Supabase! */}
            <Route path="/historico" element={<VideoHistory />} />
            
            {/* Fallbacks amigáveis para as outras abas do roteador */}
            <Route path="/configuracoes" element={<div className="p-8 text-gray-400">Tela de Configurações em desenvolvimento...</div>} />
          </Routes>
        </div>

      </div>
    </Router>
  );
}