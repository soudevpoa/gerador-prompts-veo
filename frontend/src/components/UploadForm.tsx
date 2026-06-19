import React, { useState } from 'react';
import { Upload } from 'lucide-react';

interface UploadFormProps {
  onUpload: (formData: FormData) => void;
}

export default function UploadForm({ onUpload }: UploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [transcricao, setTranscricao] = useState('');
  const [duracao, setDuracao] = useState('15s');
  const [estilo, setEstilo] = useState('UGC Tradicional');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !transcricao) return alert("Preencha os campos!");

    const formData = new FormData();
    formData.append('file', file);
    formData.append('transcricao', transcricao);
    formData.append('duracao', duracao);
    formData.append('estilo', estilo);

    onUpload(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[#181f2b] p-6 rounded-2xl border border-gray-800 space-y-4">
      <div className="border-2 border-dashed border-gray-700 rounded-xl p-8 text-center hover:border-cyan-500 transition-colors">
        <input 
          type="file" 
          onChange={(e) => setFile(e.target.files?.[0] || null)} 
          className="hidden" 
          id="file-upload" 
        />
        <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
          <Upload className="w-8 h-8 text-cyan-500 mb-2" />
          <span className="text-gray-400 text-sm">
            {file ? file.name : "Clique para enviar a foto de referência"}
          </span>
        </label>
      </div>

      <textarea 
        placeholder="Transcrição original..."
        className="w-full bg-[#111827] border border-gray-700 rounded-lg p-3 text-gray-200 outline-none focus:border-cyan-500"
        rows={3}
        value={transcricao}
        onChange={(e) => setTranscricao(e.target.value)}
      />

      <div className="grid grid-cols-2 gap-4">
        <select value={duracao} onChange={(e) => setDuracao(e.target.value)} className="bg-[#111827] border border-gray-700 rounded-lg p-2 text-gray-400">
          <option value="15s">15s</option>
          <option value="30s">30s</option>
          <option value="60s">60s</option>
        </select>
        <select value={estilo} onChange={(e) => setEstilo(e.target.value)} className="bg-[#111827] border border-gray-700 rounded-lg p-2 text-gray-400">
          <option>UGC Tradicional</option>
          <option>Dark/Faceless</option>
          <option>Cinematográfico</option>
        </select>
      </div>

      <button type="submit" className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 py-3 rounded-lg font-bold text-white hover:opacity-90 transition-all">
        Remodelar Conteúdo
      </button>
    </form>
  );
}