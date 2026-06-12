import React, { useEffect, useState, ChangeEvent } from 'react';
import { Copy, Check, Eye, X, Plus, Trash2, Loader2, Bookmark, Settings, Tag, Upload, Image as ImageIcon } from 'lucide-react';

interface PromptItem {
  id: string;
  titulo: string;
  tipo: string;
  fragmento: string; // Guardará a URL pública da imagem salva no Storage
  createdAt: string;
}

interface NicheItem {
  id: string;
  name: string;
}

export function PromptLibrary() {
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [niches, setNiches] = useState<NicheItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSave, setLoadingSave] = useState(false); // 🔥 Estado para loading no botão de salvar
  const [modalAberto, setModalAberto] = useState<PromptItem | null>(null);
  const [copiedType, setCopiedType] = useState<string | null>(null);

  // Estados do Modo de Gerenciamento
  const [modoGerente, setModoGerente] = useState(false);
  const [novoTitulo, setNovoTitulo] = useState('');
  const [novoTipo, setNovoTipo] = useState('');
  const [novoNichoInput, setNovoNichoInput] = useState('');
  
  // 🔥 ESTADOS PARA O UPLOAD DA IMAGEM FÍSICA
  const [imageFile, setImageFile] = useState<File | null>(null); // Arquivo físico para o backend
  const [imagePreview, setImagePreview] = useState<string | null>(null); // Base64 para exibir na tela

  // Campos detalhados para montar a estrutura do fragmento (JSON text)
  const [pImagem, setPImagem] = useState('');
  const [pVideo, setPVideo] = useState('');
  const [pFala, setPFala] = useState('');
// 🔥 Nova lógica para renderizar a imagem: Lê de dentro do JSON ou usa o fallback
  const obterImagemNicho = (prompt: PromptItem) => {
    try {
      // Tenta decodificar o JSON guardado na coluna fragmento
      const parsed = JSON.parse(prompt.fragmento);
      
      // Se achar a URL real do Supabase que injetamos no backend, exibe ela!
      if (parsed.imagemRealUrl && parsed.imagemRealUrl.startsWith('http')) {
        return parsed.imagemRealUrl;
      }
    } catch (e) {
      // Se não for um JSON (registros antigos), checa se a própria string é a URL
      if (prompt.fragmento && prompt.fragmento.startsWith('http')) {
        return prompt.fragmento;
      }
    }

    // Fallback estiloso para nichos genéricos se não houver imagem real salva
    const nichos: { [key: string]: string } = {
      'Academia': 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=600&auto=format&fit=crop',
      'Skincare': 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=600&auto=format&fit=crop',
      'Moda': 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=600&auto=format&fit=crop',
      'Tech': 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=600&auto=format&fit=crop',
    };
    return nichos[prompt.tipo] || 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=600&auto=format&fit=crop';
  };
  // 🔥 Captura a imagem selecionada e gera um preview Base64
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file); // Guarda o arquivo físico para enviar no FormData

      // Gera o preview em Base64 para exibir na tela na hora
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 🔥 Remove o preview temporário
  const removerImagemPreview = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  useEffect(() => {
    Promise.all([carregarBiblioteca(), carregarNichos()]).finally(() => setLoading(false));
  }, []);

  const carregarBiblioteca = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/prompts');
      if (!response.ok) throw new Error('Erro ao buscar biblioteca');
      const data = await response.json();
      setPrompts(data);
    } catch (error) {
      console.error('Erro ao carregar prompts:', error);
    }
  };

  const carregarNichos = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/niches');
      if (!response.ok) throw new Error('Erro ao buscar nichos');
      const data = await response.json();
      setNiches(data);
      if (data.length > 0) setNovoTipo(data[0].name);
    } catch (error) {
      console.error('Erro ao carregar nichos:', error);
    }
  };

  const handleCadastrarNicho = async () => {
    if (!novoNichoInput.trim()) return;

    try {
      const response = await fetch('http://localhost:3001/api/niches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: novoNichoInput })
      });

      const data = await response.json();

      if (response.ok) {
        setNovoNichoInput('');
        await carregarNichos();
        setNovoTipo(data.name);
        alert(`Nicho "${data.name}" adicionado com sucesso!`);
      } else {
        alert(data.error || 'Erro ao salvar nicho.');
      }
    } catch (error) {
      console.error('Erro ao cadastrar nicho:', error);
    }
  };

  // 🔥 OPERAÇÃO: CADASTRAR PROMPT USANDO FORMDATA (ROBUSTO COM ARQUIVO!)
  const handleCadastrarPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoTitulo || !pImagem || !novoTipo) return alert('Preencha o Título, o Nicho e o Prompt de Imagem!');
    if (!imageFile) return alert('Por favor, faça o upload da imagem de preview vertical (9:16) para o card!');

    setLoadingSave(true); // 🔥 Ativa o loading no botão

    // Monta a estrutura JSON text para salvar na coluna 'fragmento' (não mexa nisso se seu backend já está preparado)
    const estruturaTextualPrompts = JSON.stringify({
      promptImagem: pImagem,
      promptVideo: pVideo || "Video vertical no formato 9:16, ultra realista, alta nitidez.",
      fala: pFala || "Texto de fala de exemplo para o criador UGC."
    });

    // 🚀 CRIAÇÃO DO FORMDATA: Essencial para enviar arquivo e texto ao mesmo tempo!
    const formData = new FormData();
    formData.append('titulo', novoTitulo);
    formData.append('tipo', novoTipo);
    formData.append('fragmento', estruturaTextualPrompts); // Guardamos o texto JSON dos prompts aqui
    formData.append('imagemPreview', imageFile); // 🔥 Envia o arquivo físico real!

    try {
      // 🚀 Envia para a nova rota que suporta Multer e Storage
      const response = await fetch('http://localhost:3001/api/prompts-com-imagem', {
        method: 'POST',
        // 🔥 IMPORTANTE: Não defina headers de 'Content-Type' manualmente ao enviar FormData!
        body: formData 
      });

      if (response.ok) {
        // Limpa o form e o upload
        setNovoTitulo('');
        setPImagem('');
        setPVideo('');
        setPFala('');
        removerImagemPreview();
        await carregarBiblioteca(); // Atualiza o grid na hora com a imagem real!
        alert('🚀 Referência UGC cadastrada e imagem salva na nuvem com sucesso!');
        setModoGerente(false); // Fecha o painel
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Erro ao salvar o prompt com imagem no servidor.');
      }
    } catch (error) {
      console.error('❌ Erro completo ao cadastrar:', error);
      alert('Ocorreu um erro de conexão ao tentar salvar.');
    } finally {
      setLoadingSave(false); // 🔥 Desativa o loading
    }
  };

  const handleDeletarPrompt = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Deseja mesmo remover esse prompt da sua biblioteca?')) return;

    try {
      const response = await fetch(`http://localhost:3001/api/prompts/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setPrompts(prompts.filter(p => p.id !== id));
      } else {
        alert('Não foi possível deletar o prompt.');
      }
    } catch (error) {
      console.error('Erro ao deletar:', error);
    }
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  // Lógica de renderizar textos continua igual, lendo o JSON text da coluna 'fragmento'
  const renderizarTextosPrompt = (fragmento: string) => {
    try {
      // Se der sorte e a coluna tiver salvo o JSON text estruturado
      const parsed = JSON.parse(fragmento);
      return {
        imagem: parsed.promptImagem || fragmento,
        video: parsed.promptVideo || "Video vertical no formato 9:16, ultra realista...",
        fala: parsed.fala || "Texto de fala não definido."
      };
    } catch (e) {
      // Se a coluna tiver salvo apenas a URL da imagem ou texto puro
      return {
        imagem: fragmento.startsWith('http') ? "Prompt visual não gravado estruturado." : fragmento,
        video: `Video vertical no formato 9:16 focado no tema. Estilo influenciadora do TikTok.`,
        fala: "Quando você vê um produto desse nível, você não pensa duas vezes!"
      };
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-gray-400 bg-[#030712]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
        <span>Carregando feed de prompts de elite...</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen bg-[#030712]">
      {/* Header */}
      <div className="mb-8 border-b border-gray-800 pb-5 flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bookmark className="w-6 h-6 text-indigo-400" /> Biblioteca de Prompts Hype
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Inspire-se com os prompts de maior retenção. Clique para ver e copiar a estrutura.
          </p>
        </div>
        <button
          onClick={() => setModoGerente(!modoGerente)}
          className={`px-4 py-2 text-xs font-bold rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
            modoGerente 
              ? 'bg-amber-950 border-amber-600 text-amber-400' 
              : 'bg-[#111827] border-gray-800 text-gray-300 hover:border-gray-600'
          }`}
        >
          <Settings className={`w-4 h-4 ${modoGerente ? 'animate-spin' : ''}`} />
          {modoGerente ? 'Fechar Gerenciador' : 'Gerenciar Biblioteca'}
        </button>
      </div>

      {/* ======================================================= */}
      {/* 📥 PAINEL DE CONTROLE COM UPLOAD FÍSICO */}
      {/* ======================================================= */}
      {modoGerente && (
        <div className="mb-8 flex flex-col gap-6 animate-fadeIn">
          
          {/* BLOCO A: CADASTRAR NOVO NICHO DINÂMICO (Mantido igual) */}
          <div className="bg-[#111827] border border-emerald-500/20 p-4 rounded-2xl shadow-xl flex flex-col sm:flex-row items-end gap-3">
            <div className="flex-1 w-full">
              <label className="block text-[11px] font-bold mb-1 text-emerald-400 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" /> Criar Nova Categoria / Nicho no Banco
              </label>
              <input 
                type="text" 
                value={novoNichoInput}
                onChange={(e) => setNovoNichoInput(e.target.value)}
                placeholder="Ex: Pets, Maquiagem, Culinária..."
                className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              type="button"
              onClick={handleCadastrarNicho}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer w-full sm:w-auto h-[38px]"
            >
              + Adicionar Nicho
            </button>
          </div>

          {/* BLOCO B: FORMULÁRIO DE CADASTRO DO PROMPT TURBINADO COM UPLOAD */}
          <form onSubmit={handleCadastrarPrompt} className="bg-[#111827] border border-indigo-500/20 p-5 rounded-2xl shadow-xl grid grid-cols-1 md:grid-cols-12 gap-5">
            
            {/* Lado Esquerdo: Área de Upload e Preview da Imagem */}
            <div className="md:col-span-4 flex flex-col gap-3">
              <label className="block text-sm font-bold text-indigo-400 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" /> 1. Imagem de Preview (9:16 Vertical)
              </label>
              
              {!imagePreview ? (
                /* Botão Grande de Upload */
                <label className="border-2 border-dashed border-gray-700 hover:border-indigo-500 rounded-2xl aspect-[9/16] flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors bg-[#0f172a] hover:bg-[#111827] group">
                  <Upload className="w-8 h-8 text-gray-500 group-hover:text-indigo-400" />
                  <span className="text-xs text-gray-500 font-medium text-center px-4 group-hover:text-gray-300">
                    Upload do Preview Real<br/>(Formato Tênis Vertical)
                  </span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} className="hidden" />
                </label>
              ) : (
                /* Preview temporário com lixeira para remover */
                <div className="relative rounded-2xl aspect-[9/16] overflow-hidden border border-gray-800 group bg-gray-950">
                  <img src={imagePreview} alt="Preview Upload" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                  <button 
                    type="button"
                    onClick={removerImagemPreview}
                    className="absolute top-3 right-3 p-2 bg-red-950/80 hover:bg-red-600 border border-red-500 text-red-200 hover:text-white rounded-xl transition-all cursor-pointer shadow-lg z-10 opacity-0 group-hover:opacity-100"
                    title="Remover e escolher outra"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 text-center">
                    <span className="text-[10px] text-gray-400 font-mono">{imageFile?.name}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Lado Direito: Inputs Textuais do Prompt */}
            <div className="md:col-span-8 flex flex-col gap-4">
              <h3 className="text-sm font-bold text-indigo-400 flex items-center gap-2 border-b border-gray-800 pb-2">
                <Plus className="w-4 h-4" /> 2. Metadados e Roteiros de Referência
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-medium mb-1 text-gray-400">Título do Card (Ex: Fitness Girl Cadeira)</label>
                  <input 
                    type="text" 
                    value={novoTitulo} 
                    onChange={(e) => setNovoTitulo(e.target.value)}
                    placeholder="Nome estiloso da referência"
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium mb-1 text-gray-400">Nicho / Categoria (Do Banco)</label>
                  <select 
                    value={novoTipo} 
                    onChange={(e) => setNovoTipo(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 capitalize"
                  >
                    {niches.length === 0 ? (
                      <option value="">Nenhum nicho cadastrado</option>
                    ) : (
                      niches.map(n => (
                        <option key={n.id} value={n.name}>{n.name}</option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium mb-1 text-gray-400">📷 Prompt de Imagem Base (Cole o comando completo)</label>
                <textarea 
                  value={pImagem} 
                  onChange={(e) => setPImagem(e.target.value)}
                  placeholder="Paste the full image prompt here..."
                  rows={2}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2.5 text-xs font-mono text-gray-300 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium mb-1 text-gray-400">🎥 Prompt de Vídeo (Instruções de Movimento VEO)</label>
                <textarea 
                  value={pVideo} 
                  onChange={(e) => setPVideo(e.target.value)}
                  placeholder="Paste the movement instructions here..."
                  rows={2}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2.5 text-xs font-mono text-gray-300 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium mb-1 text-gray-400">💬 Fala do Avatar (Script Nativo PT-BR)</label>
                <input 
                  type="text" 
                  value={pFala} 
                  onChange={(e) => setPFala(e.target.value)}
                  placeholder="O que o influencer diz no áudio..."
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="text-right mt-3 pt-3 border-t border-gray-800">
                <button 
                  type="submit" 
                  disabled={loadingSave}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-2 justify-center ml-auto disabled:bg-gray-700 disabled:cursor-not-allowed"
                >
                  {loadingSave ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando na Nuvem...</> : '🚀 Salvar Referência Completa'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Grid de Cards Dinâmico */}
      {prompts.length === 0 ? (
        <div className="text-center py-16 bg-[#111827]/30 rounded-xl border border-gray-800">
          <p className="text-gray-400 text-sm">Sua biblioteca de prompts está vazia.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {prompts.map((prompt) => (
            <div 
              key={prompt.id}
              className="group bg-[#111827] border border-gray-800/80 rounded-2xl overflow-hidden shadow-xl hover:border-indigo-500/50 transition-all duration-300 flex flex-col justify-between relative"
            >
              <div className="relative aspect-[9/16] overflow-hidden bg-gray-950">
                {/* 🔥 PRIORIZA A IMAGEM SALVA NO STORAGE OU FALLBACK */}
                <img 
                  src={obterImagemNicho(prompt)} 
                  alt={prompt.titulo}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                />
                <span className="absolute top-3 left-3 px-2.5 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-[10px] font-bold text-indigo-300 tracking-wider uppercase">
                  {prompt.tipo}
                </span>

                {modoGerente && (
                  <button
                    onClick={(e) => handleDeletarPrompt(prompt.id, e)}
                    className="absolute top-3 right-3 p-2 bg-red-950/80 hover:bg-red-600 border border-red-500 text-red-200 hover:text-white rounded-xl transition-all cursor-pointer shadow-lg z-10 animate-fadeIn"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="p-4 bg-gradient-to-t from-[#0f172a] via-[#111827] to-[#111827]/90 border-t border-gray-800">
                <h3 className="font-bold text-sm text-gray-100 truncate capitalize">{prompt.titulo}</h3>
                <p className="text-[10px] text-gray-500 font-mono mt-1">#{prompt.tipo.toLowerCase()} #ugccreator #veopro</p>
                
                <button
                  onClick={() => setModalAberto(prompt)}
                  className="w-full mt-3 py-2 bg-[#1f2937] hover:bg-indigo-600 border border-gray-700 hover:border-indigo-500 text-gray-200 hover:text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" /> Ver prompt
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL DETALHADO (Mantido igual) */}
      {modalAberto && (() => {
        const textos = renderizarTextosPrompt(modalAberto.fragmento);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="bg-[#111827] border border-gray-800 w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl grid grid-cols-1 md:grid-cols-12 max-h-[90vh] md:max-h-[80vh]">
              
              <div className="md:col-span-5 bg-black relative hidden md:block">
                <img 
                  src={obterImagemNicho(modalAberto)} 
                  alt="Preview" 
                  className="w-full h-full object-cover opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent p-5 flex flex-col justify-end">
                  <span className="px-2 py-0.5 w-max bg-indigo-500 text-white rounded font-bold text-[9px] uppercase tracking-wider mb-1.5">
                    {modalAberto.tipo}
                  </span>
                  <h2 className="text-lg font-bold text-white capitalize">{modalAberto.titulo}</h2>
                </div>
              </div>

              <div className="md:col-span-7 p-6 flex flex-col justify-between overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-4">
                  <div>
                    <h2 className="text-md font-bold text-white md:hidden capitalize">{modalAberto.titulo}</h2>
                    <span className="text-xs text-indigo-400 font-medium">Pronto para Referência</span>
                  </div>
                  <button onClick={() => setModalAberto(null)} className="p-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4 flex-1 pr-1">
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[11px] font-bold text-gray-300 uppercase tracking-wider">📷 Prompt Imagem:</span>
                      <button onClick={() => handleCopy(textos.imagem, 'imagem')} className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold">
                        {copiedType === 'imagem' ? <><Check className="w-3 h-3" /> Copiado!</> : <><Copy className="w-3 h-3" /> Copiar prompt</>}
                      </button>
                    </div>
                    <p className="bg-gray-950 p-3 rounded-xl text-xs font-mono text-gray-300 border border-gray-800 leading-relaxed max-h-24 overflow-y-auto custom-scrollbar select-all">
                      {textos.imagem}
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[11px] font-bold text-gray-300 uppercase tracking-wider">🎥 Prompt Vídeo (VEO):</span>
                      <button onClick={() => handleCopy(textos.video, 'video')} className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold">
                        {copiedType === 'video' ? <><Check className="w-3 h-3" /> Copiado!</> : <><Copy className="w-3 h-3" /> Copiar prompt</>}
                      </button>
                    </div>
                    <p className="bg-gray-950 p-3 rounded-xl text-xs font-mono text-gray-300 border border-gray-800 leading-relaxed max-h-24 overflow-y-auto custom-scrollbar select-all">
                      {textos.video}
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">💬 Fala do Avatar:</span>
                      <button onClick={() => handleCopy(textos.fala, 'fala')} className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold">
                        {copiedType === 'fala' ? <><Check className="w-3 h-3" /> Copiado!</> : <><Copy className="w-3 h-3" /> Copiar texto</>}
                      </button>
                    </div>
                    <p className="bg-emerald-950/20 p-3 rounded-xl text-xs text-gray-300 border border-emerald-900/30 leading-relaxed italic">
                      "{textos.fala}"
                    </p>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-gray-800 text-right">
                  <button onClick={() => setModalAberto(null)} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white font-medium text-xs rounded-xl transition-colors cursor-pointer">
                    Fechar Visualização
                  </button>
                </div>
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
}