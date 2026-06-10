import { Link, useLocation } from 'react-router-dom';
// 🔥 Trocamos 'BookBookmark' por 'Bookmark' e 'Gear' por 'Settings' para garantir compatibilidade total
import { Video, Bookmark, Clock, Settings, LogOut } from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();

  const menus = [
    { name: 'Gerador UGC', path: '/', icon: Video },
    { name: 'Biblioteca de Prompts', path: '/biblioteca', icon: Bookmark }, // 🔥 Atualizado aqui
    { name: 'Histórico', path: '/historico', icon: Clock },
    { name: 'Configurações', path: '/configuracoes', icon: Settings }, // 🔥 Atualizado aqui
  ];

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

      {/* BOTÃO DE LOGOUT */}
      <div className="p-4 border-t border-gray-800">
        <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-gray-500 hover:text-red-400 rounded-xl hover:bg-red-950/20 transition-all cursor-pointer">
          <LogOut className="w-4 h-4" />
          Sair da Conta
        </button>
      </div>
    </aside>
  );
}