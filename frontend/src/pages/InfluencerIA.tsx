import { useState, ChangeEvent } from 'react';
import { Bot, MapPin, Search, ArrowRightCircle, Download, FileImage, RotateCcw, Upload, X } from 'lucide-react';

interface AvatarPronto {
  id: string;
  nome: string;
  descricao: string;
  imgUrl?: string; // Futuramente URL de miniatura
}

export default function InfluencerIA() {
  const [produtoNome, setProdutoNome] = useState('');
  const [avatarId, setAvatarId] = useState('fitness_woman');
  const [ambiente, setAmbiente] = useState('Modern bright gym studio');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Estados para gerenciar o upload de imagem
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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

  const handleGerarReferenciaEstatica = async () => {
    if (!produtoNome) return alert('Por favor, descreva o produto.');
    setLoading(true);
    setGeneratedImageUrl(null); // Limpa imagem anterior

    try {
      // Como estamos enviando arquivos junto com textos, usamos FormData
      const formData = new FormData();
      formData.append('produto_nome', produtoNome);
      formData.append('avatar_id', avatarId);
      formData.append('ambiente', ambiente);
      if (imageFile) {
        formData.append('produto_imagem', imageFile); // Binário da foto real do produto
      }

      const response = await fetch('http://localhost:3001/api/gerar-referencia-estatica', {
        method: 'POST',
        body: formData, // FormData contendo tudo
      });
      const data = await response.json();
      if (data.sucesso) setGeneratedImageUrl(data.imageUrl);
    } catch (err) {
      alert('Erro ao conectar com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = () => {
    if (!generatedImageUrl) return;
    const link = document.createElement('a');
    link.href = generatedImageUrl;
    link.download = `influencer-referencia-${avatarId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // MOCK de dados de avatares prontos
  const avataresProntos: AvatarPronto[] = [
    { id: 'fitness_woman', nome: 'Charismatic Fitness Woman', descricao: 'A charismatic fitness woman with dark curly hair and muscular build' },
    { id: 'skincare_girl', nome: 'Youthful Skincare Influencer', descricao: 'A young female influencer with clear glowing skin and long blonde hair' },
  ];

  const ambientesProntos = [
    "Modern bright gym studio",
    "Minimalist aesthetic apartment bedroom",
    "Sleek professional skincare studio with plant accents"
  ];

  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-100 p-6 flex flex-col gap-6">
      <header className="flex items-center gap-3 border-b border-gray-800 pb-4">
        <Bot className="w-8 h-8 text-cyan-400" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Menu Influencer IA (Referência Consistente)</h1>
          <p className="text-xs text-gray-400">Gere a foto de referência estática e consistente que o Veo 3.1 precisa para renderizar o produto e a modelo sem distorções</p>
        </div>
      </header>

      <main className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Painel de Configurações */}
        <section className="bg-[#111827] p-6 rounded-xl border border-gray-800 shadow-xl flex flex-col gap-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300 flex items-center gap-2"><Bot className="w-4 h-4" /> 1. Escolha o Produto / Upload</label>
            {!imagePreview ? (
              <label className="border-2 border-dashed border-gray-700 hover:border-cyan-500 rounded-lg p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors bg-[#1f2937]/30 mb-3">
                <Upload className="w-5 h-5 text-gray-400" />
                <span className="text-xs text-gray-400 font-medium">Upload Imagem Real Produto (Visão IA)</span>
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
              placeholder="Ex: Calça Legging Flare Preta Modeladora"
              value={produtoNome}
              onChange={(e) => setProdutoNome(e.target.value)}
              className="w-full bg-[#1f2937] border border-gray-700 rounded-lg p-3 text-sm focus:outline-none focus:border-cyan-500 transition-colors text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300 flex items-center gap-2"><MapPin className="w-4 h-4" /> 2. Escolha o Influencer / Avatar Pronto</label>
            <div className="grid grid-cols-2 gap-3">
              {avataresProntos.map((avatar) => (
                <button
                  key={avatar.id}
                  onClick={() => setAvatarId(avatar.id)}
                  className={`p-3 text-xs font-semibold rounded-lg border cursor-pointer transition-all ${
                    avatarId === avatar.id 
                      ? 'border-purple-500 bg-purple-950/40 text-purple-400' 
                      : 'border-gray-700 bg-[#1f2937] hover:border-gray-600 text-gray-400'
                  }`}
                >
                  {avatar.nome}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300 flex items-center gap-2"><Search className="w-4 h-4" /> 3. Escolha o Ambiente / Cenário</label>
            <div className="grid grid-cols-2 gap-2">
              {ambientesProntos.map((env) => (
                <button
                  key={env}
                  onClick={() => setAmbiente(env)}
                  className={`p-2.5 text-xs rounded-lg border text-left cursor-pointer transition-all ${
                    ambiente === env 
                      ? 'border-cyan-500 bg-cyan-950/30 text-cyan-400' 
                      : 'border-gray-700 bg-[#1f2937] hover:border-gray-600 text-gray-400'
                  }`}
                >
                  {env}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGerarReferenciaEstatica}
            disabled={loading}
            className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-medium p-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Orquestrando Imagem Consistente...
              </>
            ) : (
              <>
                <FileImage className="w-5 h-5" />
                Gerar Foto Referência Estática (IA Visão)
              </>
            )}
          </button>
        </section>

        {/* Output dos Resultados Consistentes */}
        <section className="bg-[#111827] rounded-xl border border-gray-800 p-6 shadow-xl flex flex-col gap-5">
          {!generatedImageUrl ? (
            <div className="h-full border-2 border-dashed border-gray-800 rounded-xl flex flex-col items-center justify-center p-12 text-center text-gray-500 min-h-[300px]">
              <FileImage className="w-12 h-12 mb-3 text-gray-700" />
              <p className="text-sm font-medium">Foto de Referência Consistente</p>
              <p className="text-xs max-w-xs mt-1">Configure o produto real, avatar e ambiente à esquerda para gerar a foto estática perfeita do produto no corpo da modelo.</p>
            </div>
          ) : (
            <>
              <img src={generatedImageUrl} alt="Influencer IA Consistente" className="w-full h-auto rounded-lg object-contain max-h-[500px] border border-gray-800" />
              
              <div className="grid grid-cols-2 gap-3 mt-auto">
                <button
                  onClick={downloadImage}
                  className="bg-[#1f2937] border border-gray-700 hover:border-gray-600 text-white font-medium p-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50 cursor-pointer"
                >
                  <Download className="w-5 h-5" />
                  Baixar Referência PNG
                </button>
                <a
                  href="/gerador-roteiros" // Rota que o backend de roteiros usa
                  className="bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 text-white font-medium p-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50 cursor-pointer"
                >
                  Gerar Roteiros Veo <ArrowRightCircle className="w-5 h-5" />
                </a>
              </div>
            </>
          )}
        </section>

      </main>
    </div>
  );
}