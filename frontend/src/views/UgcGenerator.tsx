import { useState, ChangeEvent } from 'react';
import { Video, Copy, Check, Sparkles, Loader2, Info, Upload, X, Bot, MapPin, Image } from 'lucide-react';

interface PromptCena {
  cena: number;
  tempo: string;
  promptTexto: string;
  locucaoTexto: string;
}

export default function UgcGenerator() {
  const [produto, setProduto] = useState('');
  const [duracao, setDuracao] = useState('Curto');
  const [tipoVideo, setTipoVideo] = useState('UGC');
  const [loading, setLoading] = useState(false);
  const [loadingImagem, setLoadingImagem] = useState(false);
  const [resultados, setResultados] = useState<PromptCena[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<{ id: number; type: 'prompt' | 'locucao' } | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const [avatarSelecionado, setAvatarSelecionado] = useState('fitness_woman');
  const [ambiente, setAmbiente] = useState('Modern bright gym studio');

  // Estado que armazena a string Base64 da imagem real gerada pelo Imagen 3
  const [promptImagemGerado, setPromptImagemGerado] = useState<string | null>(null);
  const [copiedPromptImagem, setCopiedPromptImagem] = useState(false);

  // Estados auxiliares de segurança para guardar os textos limpos se necessário
  const [promptTextoGerado, setPromptTextoGerado] = useState<string | null>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const avataresProntos = [
    { id: 'fitness_woman', nome: 'Erika', info: 'Charismatic Fitness Woman' },
    { id: 'skincare_girl', nome: 'Angélica', info: 'Skincare Influencer' },
    { id: 'mariana', nome: 'Mariana', info: 'Minimalist Fashion Girl' },
    { id: 'mikael', nome: 'Mikael', info: 'Tech & Gaming Guy' }
  ];

  const ambientesProntos = [
    { id: 'Modern bright gym studio', nome: 'Academia Moderna' },
    { id: 'Minimalist aesthetic apartment bedroom', nome: 'Quarto Minimalista' },
    { id: 'Sleek professional skincare studio', nome: 'Estúdio de Estética' },
    { id: 'Cyberpunk-style gaming room', nome: 'Quarto Gamer Neon' }
  ];

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removerImagem = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const getAvatarDescricaoTexto = () => {
    const avatarObj = avataresProntos.find(a => a.id === avatarSelecionado);
    return avatarObj ? avatarObj.info : 'A digital creator';
  };

  // PASSO 1: CRIA A FOTO DA MODELO COM O IMAGEN 3 (PREVENÇÃO DE ESTAMPAS)
  const handleGerarImagemBase = async () => {
    if (!produto) return alert('Por favor, digite o nome do produto antes.');
    setLoadingImagem(true);
    setPromptImagemGerado(null);
    setPromptTextoGerado(null);

    try {
      const token = localStorage.getItem('@veocreator:token');

      const formData = new FormData();
      formData.append('produto', produto);
      formData.append('avatarDescricao', getAvatarDescricaoTexto());
      formData.append('ambiente', ambiente);
      if (imageFile) formData.append('imagem', imageFile);

      const response = await fetch('http://localhost:3001/api/gerar-imagem-estatica', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });
      const data = await response.json();

      if (data.promptTextoPronto) {
        setPromptImagemGerado(data.promptTextoPronto);
        setPromptTextoGerado(data.promptTextoPronto);
      }

    } catch (err) {
      alert('Erro ao processar a imagem de referência.');
    } finally {
      setLoadingImagem(false);
    }
  };

  // 🔥 PASSO 2 CORRIGIDO E SINCRONIZADO COM O SUPABASE
  const handleGerarRoteiro = async () => {
    if (!produto) return alert('Por favor, preencha o campo principal primeiro.');

    setLoading(true);
    try {
      const token = localStorage.getItem('@veocreator:token');

      const formData = new FormData();
      formData.append('produto', produto);
      formData.append('avatarDescricao', getAvatarDescricaoTexto());
      formData.append('ambiente', ambiente);
      formData.append('tipoVideo', tipoVideo);
      formData.append('duracao', duracao);
      if (imageFile) formData.append('imagem', imageFile);

      const response = await fetch('http://localhost:3001/api/gerar-prompts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) throw new Error('Falha ao gerar roteiro na API');
      const data = await response.json();

      if (data.prompts && data.prompts.length > 0) {
        setResultados(data.prompts);

        const dadosParaSalvar = {
          produto: produto || "Sem Nome",
          avatarSelecionado: avatarSelecionado || "fitness_woman",
          ambiente: ambiente || "Casual background",
          tipoVideo: tipoVideo || "UGC",
          duracao: duracao || "Curto",
          resultados: data.prompts
        };

        console.log("📦 Enviando dados para o histórico:", dadosParaSalvar);

        try {
          const saveResponse = await fetch('http://localhost:3001/api/videos', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(dadosParaSalvar)
          });

          if (!saveResponse.ok) {
            const errorData = await saveResponse.json();
            console.error("❌ Erro retornado pelo servidor:", errorData);
          } else {
            console.log("🎥 Roteiro saved com sucesso no histórico do Supabase!");
          }
        } catch (err) {
          console.error("❌ Erro na conexão de salvamento:", err);
        }
      } else {
        alert('A API não retornou os prompts no formato esperado.');
      }

    } catch (error) {
      console.error("Erro ao gerar ou salvar roteiro:", error);
      alert('Não foi possível gerar o roteiro adaptativo.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, index: number, type: 'prompt' | 'locucao') => {
    navigator.clipboard.writeText(text);
    setCopiedIndex({ id: index, type });
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const copiarTodosOsPrompts = () => {
    if (resultados.length === 0) return;
    const blocoCompleto = resultados.map(r => `Cena ${r.cena} (${r.tempo}):\n${r.promptTexto}`).join('\n\n');
    navigator.clipboard.writeText(blocoCompleto);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-100 p-6">
      <header className="max-w-7xl mx-auto mb-8 border-b border-gray-800 pb-4 flex items-center gap-3">
        <Video className="w-8 h-8 text-cyan-400" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vídeo com Avatar</h1>
          <p className="text-xs text-gray-400">Gere mídias estáticas consistentes e roteiros com áudio integrado para o VEO 3.1</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Painel de Configurações - Esquerda */}
        <section className="lg:col-span-5 bg-[#111827] p-6 rounded-xl border border-gray-800 shadow-xl flex flex-col gap-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300 flex items-center gap-2">
              <Image className="w-4 h-4 text-cyan-400" /> 1. Produto / Imagem Real de Fábrica
            </label>

            {!imagePreview ? (
              <label className="border-2 border-dashed border-gray-700 hover:border-cyan-500 rounded-lg p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors bg-[#1f2937]/30 mb-3">
                <Upload className="w-5 h-5 text-gray-400" />
                <span className="text-xs text-gray-400 font-medium">Upload da Foto Real (Trancar Estampa)</span>
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
            ) : (
              <div className="relative border border-gray-700 rounded-lg p-2 bg-[#1f2937] flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <img src={imagePreview} alt="Preview" className="w-12 h-12 rounded object-cover border border-gray-600" />
                  <span className="text-xs text-gray-300 font-mono truncate max-w-[180px]">{imageFile?.name}</span>
                </div>
                <button onClick={removerImagem} className="text-gray-400 hover:text-red-400 p-1 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <input
              type="text"
              placeholder="Nome exato do produto (ex: Calça Legging Flare Preta)"
              value={produto}
              onChange={(e) => setProduto(e.target.value)}
              className="w-full bg-[#1f2937] border border-gray-700 rounded-lg p-3 text-sm focus:outline-none focus:border-cyan-500 transition-colors text-white placeholder:text-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300 flex items-center gap-2">
              <Bot className="w-4 h-4 text-purple-400" /> 2. Escolha o Influencer / Avatar Pronto
            </label>
            <div className="grid grid-cols-2 gap-2">
              {avataresProntos.map((avatar) => (
                <button
                  key={avatar.id}
                  type="button"
                  onClick={() => setAvatarSelecionado(avatar.id)}
                  className={`p-2.5 text-xs font-semibold rounded-lg border text-left cursor-pointer transition-all ${avatarSelecionado === avatar.id
                    ? 'border-purple-500 bg-purple-950/40 text-purple-400'
                    : 'border-gray-700 bg-[#1f2937] hover:border-gray-600 text-gray-400'
                    }`}
                >
                  <div className="font-bold">{avatar.nome}</div>
                  <div className="text-[10px] text-gray-500 font-normal truncate">{avatar.info}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" /> 3. Cenário / Ambiente do Vídeo
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ambientesProntos.map((amb) => (
                <button
                  key={amb.id}
                  type="button"
                  onClick={() => setAmbiente(amb.id)}
                  className={`p-2.5 text-xs font-semibold rounded-lg border text-left cursor-pointer transition-all ${ambiente === amb.id
                    ? 'border-emerald-500 bg-emerald-950/30 text-emerald-400'
                    : 'border-gray-700 bg-[#1f2937] hover:border-gray-600 text-gray-400'
                    }`}
                >
                  {amb.nome}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 border-t border-gray-800 pt-4">
            <div>
              <label className="block text-[11px] font-medium mb-1 text-gray-400">4. Duração</label>
              <select
                value={duracao}
                onChange={(e) => setDuracao(e.target.value)}
                className="w-full bg-[#1f2937] border border-gray-700 rounded-lg p-2 text-xs text-white cursor-pointer"
              >
                <option value="Curto">Curto (2 Cenas - 15s)</option>
                <option value="Médio">Médio (4 Cenas - 30s)</option>
                <option value="Longo">Longo (6 Cenas - 60s)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium mb-1 text-gray-400">5. Tipo de Vídeo</label>
              <select
                value={tipoVideo}
                onChange={(e) => setTipoVideo(e.target.value)}
                className="w-full bg-[#1f2937] border border-gray-700 rounded-lg p-2 text-xs text-white cursor-pointer"
              >
                {/* 🛍️ Apenas Modelos de Conversão Comercial / UGC Puro */}
                <option value="UGC">🎙️ UGC Tradicional</option>
                <option value="Unboxing">📦 Unboxing Premium</option>
                <option value="Review">📊 Avaliação (Review)</option>
                <option value="Tutorial">💡 Tutorial Passo a Passo</option>
                <option value="Testemunho">❤️ Testemunho Emocional</option>
              </select>
            </div>
          </div>

          {/* Passo 1 */}
          <button
            onClick={handleGerarImagemBase}
            disabled={loadingImagem || loading}
            className="w-full bg-[#1f2937] hover:bg-[#2d3748] text-cyan-400 font-medium p-2.5 rounded-lg flex items-center justify-center gap-2 border border-cyan-500/30 cursor-pointer text-xs disabled:opacity-40"
          >
            {loadingImagem ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Trancando características visuais...</>
            ) : (
              <><Image className="w-4 h-4" /> Passo 1: Criar Foto de Referência Fiel</>
            )}
          </button>

          {/* Passo 2 */}
          <button
            onClick={handleGerarRoteiro}
            disabled={loading || loadingImagem}
            className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-medium p-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer text-sm disabled:opacity-40"
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Gerando Cenas Únicas...</>
            ) : (
              <><Sparkles className="w-5 h-5" /> Passo 2: Gerar Roteiro Adaptativo VEO</>
            )}
          </button>
        </section>

        {/* Coluna Direita */}
        <section className="lg:col-span-7 flex flex-col gap-6">

          {/* PAINEL DE CÓPIA DO PROMPT DA MODELO ESTÁTICA */}
          {promptImagemGerado && (
            <div className="bg-[#111827] rounded-xl border border-emerald-500/30 p-5 shadow-xl flex flex-col gap-3 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                  <Check className="w-4 h-4" /> Prompt da Modelo Estática Criado!
                </h3>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(promptImagemGerado);
                    setCopiedPromptImagem(true);
                    setTimeout(() => setCopiedPromptImagem(false), 2000);
                  }}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-md border cursor-pointer transition-all ${copiedPromptImagem
                    ? 'bg-green-950 text-green-400 border-green-500'
                    : 'bg-[#1f2937] border-gray-700 text-emerald-400 hover:border-gray-600'
                    }`}
                >
                  {copiedPromptImagem ? 'Copiado!' : 'Copiar Comando'}
                </button>
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Este comando abaixo foi estruturado pelo Gemini usando IA de Visão para trancar a cor lisa e a textura do seu assunto. Cole ele no gerador de imagens de sua preferência (Midjourney, Recraft ou ChatGPT) para criar a foto perfeita antes de ir pro VEO:
              </p>
              <p className="bg-[#1f2937]/50 p-3 rounded-lg text-xs font-mono text-gray-300 border border-gray-800 break-words select-all">
                {promptImagemGerado}
              </p>
            </div>
          )}

          {/* OUTPUT DOS PROMPTS */}
          <div className="flex flex-col gap-4">
            {loading ? (
              <div className="border-2 border-dashed border-cyan-800/40 bg-[#111827]/50 rounded-xl flex flex-col items-center justify-center p-12 text-center text-gray-400 min-h-[300px]">
                <Loader2 className="w-12 h-12 mb-3 text-cyan-400 animate-spin" />
                <p className="text-sm font-medium text-cyan-400">Processando Roteiro Inédito com Áudio...</p>
              </div>
            ) : resultados.length === 0 ? (
              <div className="border-2 border-dashed border-gray-800 rounded-xl flex flex-col items-center justify-center p-12 text-center text-gray-500 min-h-[300px]">
                <Info className="w-12 h-12 mb-3 text-gray-600" />
                <p className="text-sm font-medium">Nenhum roteiro gerado ainda.</p>
                <p className="text-xs mt-1">Gere o prompt da modelo no Passo 1 (se quiser) e depois clique no Passo 2 para extrair os comandos.</p>
              </div>
            ) : (
              <>
                <div className="flex justify-end">
                  <button onClick={copiarTodosOsPrompts} className={`text-xs font-semibold px-4 py-2 rounded-lg border cursor-pointer transition-all ${copiedAll ? 'bg-green-950 border-green-500 text-green-400' : 'bg-[#1f2937] border-gray-700 text-cyan-400'}`}>
                    {copiedAll ? '✓ Todos Copiados!' : '📋 Copiar Todos os Prompts'}
                  </button>
                </div>

                {resultados.map((item, idx) => (
                  <div key={idx} className="bg-[#111827] rounded-xl border border-gray-800 p-5 shadow-lg flex flex-col gap-4 animate-fadeIn">

                    {/* CABEÇALHO DA CENA */}
                    <div className="flex justify-between items-center border-b border-gray-800/60 pb-2">
                      <span className="text-xs font-bold text-cyan-400 uppercase">Cena {item.cena} ({item.tempo})</span>
                    </div>

                    {/* 🎬 1. PROMPT VISUAL (VEO / FX) */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[11px] text-gray-400 font-medium">Comando Visual (Cole no Gerador de Vídeo)</span>
                        <button
                          onClick={() => copyToClipboard(item.promptTexto, idx, 'prompt')}
                          className="text-xs text-cyan-400 cursor-pointer hover:underline"
                        >
                          {copiedIndex?.id === idx && copiedIndex?.type === 'prompt' ? '✓ Copiado!' : 'Copiar Prompt'}
                        </button>
                      </div>
                      <p className="bg-[#1f2937] p-3 rounded-lg text-xs font-mono text-gray-300 break-words border border-gray-800 leading-relaxed">
                        {item.promptTexto}
                      </p>
                    </div>

                    {/* 🎙️ 2. TEXTO DA NARRAÇÃO / LOCUÇÃO (ELEVENLABS / VEO AUDIO) */}
                    {item.locucaoTexto && (
                      <div className="border-t border-gray-800/40 pt-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[11px] text-purple-400 font-medium">Texto da Narração / Voz do Script (Português)</span>
                          <button
                            onClick={() => copyToClipboard(item.locucaoTexto, idx, 'locucao')}
                            className="text-xs text-purple-400 cursor-pointer hover:underline"
                          >
                            {copiedIndex?.id === idx && copiedIndex?.type === 'locucao' ? '✓ Copiado!' : 'Copiar Áudio'}
                          </button>
                        </div>
                        <p className="bg-[#1a1b26]/40 p-3 rounded-lg text-xs font-medium text-gray-200 border border-purple-950/30 leading-relaxed italic">
                          "{item.locucaoTexto}"
                        </p>
                      </div>
                    )}

                  </div>
                ))}
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}