import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import UgcGenerator from './views/UgcGenerator';
import {PromptLibrary} from './views/PromptLibrary';

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
            
            {/* Fallbacks amigáveis para as outras abas do roteador */}
            <Route path="/historico" element={<div className="p-8 text-gray-400">Tela de Histórico em desenvolvimento...</div>} />
            <Route path="/configuracoes" element={<div className="p-8 text-gray-400">Tela de Configurações em desenvolvimento...</div>} />
          </Routes>
        </div>

      </div>
    </Router>
  );
}