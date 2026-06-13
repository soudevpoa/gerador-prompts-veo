import { Link, useLocation } from 'react-router-dom';
// 🔥 Adicionado o Sparkles E o LogOut no import mestre
import { Video, Sparkles, Bookmark, Clock, Settings, LogOut } from 'lucide-react';

// 1. Atualizamos a interface para aceitar o usuário enviado pelo App.tsx
interface SidebarProps {
  onLogout: () => void;
  usuario: { name: string; email: string } | null; // 🔥 Nova prop injetada
}

export default function Sidebar({ onLogout, usuario }: SidebarProps) {
  const location = useLocation();

  const menus = [
  { name: 'Gerador UGC (E-com)', path: '/', icon: Video },
  { name: 'Gerador Dark (Faceless)', path: '/gerador-dark', icon: Sparkles }, // 🔥 Agora com o ícone importado!
  { name: 'Biblioteca de Prompts', path: '/biblioteca', icon: Bookmark },
  { name: 'Histórico', path: '/historico', icon: Clock },
  { name: 'Configurações', path: '/configuracoes', icon: Settings },
];

  // Pega a primeira letra do nome do usuário para fazer o avatar dinâmico
  const inicialNome = usuario?.name ? usuario.name.charAt(0).toUpperCase() : 'U';

  return (
    <aside className="w-64 bg-[#111827] border-r border-gray-800 flex flex-col justify-between h-screen sticky top-0 flex-shrink-0">
      <div className="p-6">
        {/* LOGO DO SAAS */}
        <div className="flex items-center gap-3 mb-8 border-b border-gray-800 pb-4">
          <div className="bg-gradient-to-tr from-cyan-500 to-purple-600 p-2 rounded-lg">
            <Video className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide">VEO Creator</h2>
            <span className="text-[10px] text-cyan-400 font-mono font-bold uppercase tracking-wider">SaaS v1.0</span>
          </div>
        </div>

        {/* LINKS DE NAVEGAÇÃO */}
        <nav className="flex flex-col gap-1.5">
          {menus.map((menu) => {
            const Icone = menu.icon;
            const isActive = location.pathname === menu.path;

            return (
              <Link
                key={menu.path}
                to={menu.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-950/60 to-purple-950/30 border border-cyan-500/30 text-cyan-400'
                    : 'text-gray-400 hover:bg-[#1f2937] hover:text-gray-200 border border-transparent'
                }`}
              >
                <Icone className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-gray-400'}`} />
                {menu.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* RODAPÉ: CARD DO USUÁRIO + BOTÃO DE LOGOUT */}
      <div className="p-4 border-t border-gray-800 space-y-3">
        
        {/* 🔥 CARD DINÂMICO DE USUÁRIO LOGADO */}
        {usuario && (
          <div className="flex items-center gap-3 px-3 py-2.5 bg-gray-950/40 border border-gray-800/40 rounded-xl select-none">
            {/* Letra Avatar estilizada com um degradê sutil */}
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600/20 to-purple-600/20 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold text-sm flex-shrink-0">
              {inicialNome}
            </div>
            {/* Nome e e-mail com trava de truncar para não estourar o layout se forem muito grandes */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-200 truncate">{usuario.name}</p>
              <p className="text-[10px] text-gray-500 truncate mt-0.5">{usuario.email}</p>
            </div>
          </div>
        )}

        {/* BOTÃO DE LOGOUT */}
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-gray-500 hover:text-red-400 rounded-xl hover:bg-red-950/20 transition-all cursor-pointer border border-transparent"
        >
          <LogOut className="w-4 h-4" />
          Sair da Conta
        </button>
      </div>
    </aside>
  );
}