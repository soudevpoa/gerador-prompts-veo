import React, { useState } from 'react';
import axios from 'axios';
import StoryboardView from '../views/StoryboardView';
import UploadForm from '../components/UploadForm';
// 🔥 Importação corrigida para o caminho correto do seu projeto
import { supabase } from '../config/supabase';

const RemodelagemPage = () => {
    const [resultado, setResultado] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const handleRemodelar = async (formData: FormData) => {
        setLoading(true);
        setResultado(null);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const res = await axios.post('http://localhost:3001/api/remodelar-conteudo', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                }
            });

            // 🔥 LOG CRUCIAL: O que o front está a receber exatamente?
            console.log("Resposta do Backend no Front-end:", res.data);

            // Se o backend retorna { "prompts": [...], ... }
            // Garantimos que o estado seja preenchido
            setResultado(res.data);

        } catch (error) {
            console.error("Erro:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8 min-h-screen">
            <header>
                <h1 className="text-3xl font-bold text-white">Remodelagem Inteligente</h1>
                <p className="text-gray-400">Transforme sua transcrição e imagem em um novo roteiro viral.</p>
            </header>

            <UploadForm onUpload={handleRemodelar} />

            {loading && (
                <div className="flex flex-col justify-center items-center py-10">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-cyan-500"></div>
                    <p className="mt-4 text-cyan-500 font-semibold animate-pulse">A IA está processando seu conteúdo...</p>
                </div>
            )}

            {resultado && (
                <section className="animate-in fade-in duration-700 mt-8">
                    <StoryboardView data={resultado} />
                </section>
            )}
        </div>
    );
};

export default RemodelagemPage;