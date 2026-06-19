import React, { useState } from 'react';
import axios from 'axios';
import StoryboardView from '../views/StoryboardView';
import UploadForm from '../components/UploadForm';

const RemodelagemPage = () => {
    const [resultado, setResultado] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const handleRemodelar = async (formData: FormData) => {
        setLoading(true);
        setResultado(null);

        try {
            // 1. Buscamos a sessão do Supabase de forma assíncrona
            const { data } = await supabase.auth.getSession();
            const token = data.session?.access_token;

            // 2. Verificação de segurança: Se não tiver token, paramos aqui
            if (!token) {
                alert("Sua sessão expirou. Por favor, faça login novamente.");
                setLoading(false);
                return;
            }

            // 3. Chamada à API com o token na mão
            const res = await axios.post('http://localhost:3001/api/remodelar-conteudo', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                }
            });

            setResultado(res.data);
        } catch (error: any) {
            console.error("Erro na remodelagem:", error);
            alert("Falha ao processar remodelagem. Verifique a conexão com o servidor.");
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

            {/* Spinner de Carregamento Estilizado */}
            {loading && (
                <div className="flex flex-col justify-center items-center py-10">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-cyan-500"></div>
                    <p className="mt-4 text-cyan-500 font-semibold animate-pulse">A IA está processando seu conteúdo...</p>
                </div>
            )}

            {/* Resultados do Storyboard */}
            {resultado && (
                <section className="animate-in fade-in duration-700 mt-8">
                    <StoryboardView data={resultado} />
                </section>
            )}
        </div>
    );
};

export default RemodelagemPage;