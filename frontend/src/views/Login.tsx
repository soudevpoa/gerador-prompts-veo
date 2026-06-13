import React, { useState } from 'react';
import { supabase } from '../config/supabase';
import { KeyRound, Mail, Sparkles, Loader2, User } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (token: string) => void;
}

export function Login({ onLoginSuccess }: LoginProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Campos do formulário
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return alert('Preencha todos os campos obrigatórios!');
    
    setLoading(true);

    try {
      if (isRegister) {
        // 🚀 1. CADASTRO NO SUPABASE AUTH
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: name } }
        });

        if (error) throw error;
        if (data.user) {
          // 🚀 2. SINCRONIZA COM O NOSSO PRISMA BACKEND
          await fetch('http://localhost:3001/api/auth/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: data.user.id,
              email: data.user.email,
              name: name || data.user.email?.split('@')[0]
            })
          });

          alert('Conta criada com sucesso! Efetuando login...');
          // Auto-login após o cadastro
          const session = data.session;
          if (session) onLoginSuccess(session.access_token);
        }
      } else {
        // 🚀 3. LOGIN NO SUPABASE AUTH
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;
        
        if (data.session) {
          // Sincroniza no login também por segurança
          await fetch('http://localhost:3001/api/auth/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: data.user.id,
              email: data.user.email,
              name: data.user.user_metadata?.display_name || data.user.email?.split('@')[0]
            })
          });

          onLoginSuccess(data.session.access_token);
        }
      }
    } catch (error: any) {
      console.error('Erro na autenticação:', error);
      alert(error.message || 'Ocorreu um erro ao tentar autenticar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Detalhes de luz de fundo estilo SaaS moderno */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-[#111827] border border-gray-800 p-8 rounded-2xl shadow-2xl relative z-10 animate-fadeIn">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl mb-3 text-indigo-400">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">VEO Creator Pro</h1>
          <p className="text-xs text-gray-400 mt-1">
            {isRegister ? 'Crie sua conta de criador e ganhe 10 créditos grátis' : 'Entre na plataforma para gerenciar seus clones UGC'}
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleAuth} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-[11px] font-medium text-gray-400 mb-1">Seu Nome Completo</label>
              <div className="relative">
                <User className="absolute left-3 top-3.5 w-4 h-4 text-gray-500" />
                <input 
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jonathan Cavalcanti"
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 pl-10 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-medium text-gray-400 mb-1">E-mail Profissional</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 w-4 h-4 text-gray-500" />
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seuemail@exemplo.com"
                className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 pl-10 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-gray-400 mb-1">Senha de Segurança</label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-3.5 w-4 h-4 text-gray-500" />
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 pl-10 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg disabled:cursor-not-allowed"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Processando...</>
            ) : (
              isRegister ? 'Criar Minha Conta Grátis' : 'Acessar Painel Hype'
            )}
          </button>
        </form>

        {/* Switcher Cadastro / Login */}
        <div className="mt-6 text-center border-t border-gray-800/60 pt-4">
          <p className="text-xs text-gray-400">
            {isRegister ? 'Já possui uma conta?' : 'Ainda não tem acesso?'}
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setEmail('');
                setPassword('');
                setName('');
              }}
              className="text-indigo-400 hover:text-indigo-300 font-bold ml-1 transition-colors cursor-pointer"
            >
              {isRegister ? 'Fazer Login' : 'Cadastre-se agora'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}