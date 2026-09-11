import React, { useState } from 'react';
import { Tv, ShieldAlert, Video, Copy, Check, Sparkles } from 'lucide-react';

export const YoutubeReviewGenerator: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    productName: '',
    mainBenefit: '',
    targetPain: '',
    usageTime: '3 meses',
    avatarProfile: 'Mulher de 35 a 45 anos, estilo dona de casa real',
    homeSetting: 'Cozinha iluminada com xícara de café',
    antiScamAlert: true,
    ctaLocation: 'Primeiro comentário fixado',
  });

  const [generatedScript, setGeneratedScript] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('@veocreator:token');

      const response = await fetch('http://localhost:3001/api/prompts/youtube-review', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Falha ao comunicação com o servidor');
      }

      const data = await response.json();
      setGeneratedScript(data);
    } catch (err) {
      console.error('Erro ao gerar review:', err);
      alert('Não foi possível processar o roteiro. Verifique se o servidor backend está rodando.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="flex items-center gap-3 border-b border-gray-800 pb-4">
        <Tv className="w-8 h-8 text-red-500" />
        <div>
          <h1 className="text-2xl font-bold text-white">Gerador de Video Review YouTube (16:9)</h1>
          <p className="text-gray-400 text-sm">Crie roteiros longos e prompts de Veo 3 no estilo depoimento caseiro/UGC para encapsulados.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulário */}
        <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">Nome do Produto</label>
            <input
              type="text"
              required
              placeholder="Ex: Rosa Amazônica"
              value={formData.productName}
              onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">Dor / Problema Principal</label>
            <input
              type="text"
              required
              placeholder="Ex: Linhas de expressão e manchas na pele"
              value={formData.targetPain}
              onChange={(e) => setFormData({ ...formData, targetPain: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">Benefício Prometido</label>
            <input
              type="text"
              required
              placeholder="Ex: Rejuvenescimento e hidratação profunda"
              value={formData.mainBenefit}
              onChange={(e) => setFormData({ ...formData, mainBenefit: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">Tempo de Uso</label>
              <input
                type="text"
                value={formData.usageTime}
                onChange={(e) => setFormData({ ...formData, usageTime: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">Ambiente Caseiro</label>
              <input
                type="text"
                value={formData.homeSetting}
                onChange={(e) => setFormData({ ...formData, homeSetting: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">Perfil do Avatar (UGC)</label>
            <input
              type="text"
              value={formData.avatarProfile}
              onChange={(e) => setFormData({ ...formData, avatarProfile: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
            />
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer bg-red-950/30 border border-red-900/50 p-3 rounded-lg">
              <input
                type="checkbox"
                checked={formData.antiScamAlert}
                onChange={(e) => setFormData({ ...formData, antiScamAlert: e.target.checked })}
                className="rounded border-gray-700 text-red-600 focus:ring-red-500"
              />
              <span className="text-xs text-red-200 font-medium flex items-center gap-1">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                Incluir Alerta Anti-Golpe (OLX, ML, Shopee)
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition"
          >
            {loading ? <Sparkles className="w-5 h-5 animate-spin" /> : <Video className="w-5 h-5" />}
            {loading ? 'Gerando Roteiro 16:9...' : 'Gerar Review de 5 Minutos'}
          </button>
        </form>

        {/* Resultado */}
        <div className="lg:col-span-2 space-y-4">
          {generatedScript && generatedScript.blocks ? (
            generatedScript.blocks.map((block: any, idx: number) => (
              <div key={idx} className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
                <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-red-400">
                    Ato {idx + 1}: {block.title} ({block.timestamp})
                  </span>
                  <button
                    onClick={() => copyToClipboard(`${block.script}\n\n[PROMPT VEO 3]: ${block.veoPrompt}`, idx)}
                    className="text-gray-400 hover:text-white text-xs flex items-center gap-1 cursor-pointer"
                  >
                    {copiedIndex === idx ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    Copiar Bloco
                  </button>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase">Fala do Roteiro:</h4>
                  <p className="text-gray-200 text-sm italic mt-1 bg-gray-950 p-3 rounded-lg">{block.script}</p>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase">Prompt Veo 3 (Visual 16:9):</h4>
                  <code className="block text-xs text-green-400 bg-black p-3 rounded-lg mt-1 overflow-x-auto">
                    {block.veoPrompt}
                  </code>
                </div>
              </div>
            ))
          ) : (
            <div className="h-full border-2 border-dashed border-gray-800 rounded-xl flex items-center justify-center p-12 text-center text-gray-500">
              Preencha os dados ao lado para gerar a estrutura completa do vídeo review para o YouTube.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};