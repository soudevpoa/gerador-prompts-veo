import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js'; //  Substitua por essa oficial!
import { gerarPrompts } from './config/controllers/promptController';
import { gerarImagemInfluencerEstatica } from './config/controllers/promptController';
import { prisma } from './config/prisma';

const app = express();
const PORT = process.env.PORT || 3001;

// Configuração do Multer para ler o upload em memória temporária (máximo 25MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }
});

// 🔥 REFACTOR DA VALIDAÇÃO DO SUPABASE NO SERVER.TS

// 1. Tenta pegar a URL de qualquer variação comum
const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL;

// 2. Tenta pegar a chave de qualquer variação comum
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;

// 3. Validação amigável para te dizer exatamente o que está salvo no seu .env
if (!supabaseUrl || !supabaseKey) {
  console.log("⚠️ [Aviso .env] Nomes exatos não detectados. Verifique seu arquivo .env na raiz do backend.");
  console.log("👉 Chaves atualmente lidas pelo Node:", Object.keys(process.env).filter(k => k.includes('SUPABASE')));
} else {
  console.log("✅ [Supabase] URL e Chaves de segurança injetadas com sucesso!");
}

const supabaseStorage = createClient(
  supabaseUrl || 'https://placeholder-url.supabase.co',
  supabaseKey || 'placeholder-key'
);
app.use(cors());
app.use(express.json());

const limitador = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { error: "Muitas solicitações vindas deste IP. Tente novamente mais tarde." }
});

// ==========================================
// 🤖 ENDPOINTS DE GERAÇÃO COM INTELIGÊNCIA ARTIFICIAL
// ==========================================
app.post('/api/gerar-prompts', limitador, upload.single('imagem'), gerarPrompts);
app.post('/api/gerar-imagem-estatica', upload.single('imagem'), gerarImagemInfluencerEstatica);


// ==========================================
// 🎥 ENDPOINTS DO HISTÓRICO DE VÍDEOS UGC (SUPABASE)
// ==========================================

// 🟢 1. BUSCAR TODO O HISTÓRICO (GET)
app.get('/api/videos', async (req, res) => {
  try {
    const historico = await prisma.videoHistory.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(historico);
  } catch (error) {
    console.error('Erro ao buscar histórico no Supabase:', error);
    res.status(500).json({ error: 'Erro interno ao carregar o histórico de vídeos.' });
  }
});

// 🔵 2. SALVAR UM NOVO VÍDEO NO HISTÓRICO (POST)
app.post('/api/videos', async (req, res) => {
  try {
    // O Frontend envia "resultados"
    const { produto, avatarSelecionado, ambiente, tipoVideo, duracao, resultados } = req.body;

    if (!produto || !resultados || resultados.length === 0) {
      return res.status(400).json({ error: 'Produto e os resultados gerados são obrigatórios.' });
    }

    // Mapeamos os nomes para casar 100% com o seu schema do Prisma
    const novoVideo = await prisma.videoHistory.create({
      data: {
        produto,
        avatarDescricao: avatarSelecionado || 'fitness_woman',
        ambiente,
        tipoVideo,
        duracao,
        promptsGerados: resultados, // 🔥 Alterado de 'resultados' para 'promptsGerados' para bater com seu model!
      },
    });

    res.status(201).json(novoVideo);
  } catch (error) {
    console.error('Erro ao salvar vídeo no histórico:', error);
    res.status(500).json({ error: 'Erro interno ao salvar no histórico.' });
  }
});

// ==========================================
// 📚 ENDPOINTS DA BIBLIOTECA DE PROMPTS (SUPABASE)
// ==========================================

// 🟢 LISTAR TODOS OS PROMPTS (GET)
app.get('/api/prompts', async (req, res) => {
  try {
    const prompts = await prisma.prompt.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(prompts);
  } catch (error) {
    console.error('Erro ao buscar prompts no Supabase:', error);
    res.status(500).json({ error: 'Erro interno ao buscar os prompts da biblioteca.' });
  }
});

// 🔵 2. CRIAR UM NOVO PROMPT COM UPLOAD DE IMAGEM (POST - NOVA ROTA!)
app.post('/api/prompts-com-imagem', upload.single('imagemPreview'), async (req, res) => {
  try {
    // 1. Captura os dados textuais do corpo da requisição (vem como string do FormData)
    const { titulo, tipo, fragmento } = req.body;
    const file = req.file; // Captura o arquivo físico lido pelo Multer

    if (!titulo || !tipo || !fragmento) {
      return res.status(400).json({ error: 'Título, Nicho e Estrutura de Prompts são obrigatórios.' });
    }

    let urlImagemFinal = null;

    // 2. LÓGICA DE UPLOAD PARA O SUPABASE STORAGE
    if (file) {
      try {
        console.log("🚀 Iniciando upload de imagem física para o Supabase Storage...");
        // Define um nome único para o arquivo (uuid + nome original) para evitar substituições malucas
        const nomeArquivoUnico = `${Date.now()}-${file.originalname}`;

        // Faz o upload para o Bucket 'prompt-previews' (Crie este bucket no Supabase!)
        const { data: uploadData, error: uploadError } = await supabaseStorage
          .storage // 🔥 Adicionado o ponto de entrada do Storage oficial!
          .from('prompt-previews')
          .upload(nomeArquivoUnico, file.buffer, {
            contentType: file.mimetype,
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        // Gera a URL pública do arquivo que acabamos de salvar na nuvem
        const { data: publicUrlData } = supabaseStorage
          .storage // 🔥 Adicionado aqui também!
          .from('prompt-previews')
          .getPublicUrl(nomeArquivoUnico);

        urlImagemFinal = publicUrlData.publicUrl;
        console.log(`✅ Imagem salva e pública em: ${urlImagemFinal}`);

      } catch (storageError) {
        console.error('❌ Erro no upload para o Supabase Storage:', storageError);
        // Opcional: Se der erro no storage, você pode decidir se para tudo ou salva sem imagem. 
        // Vamos parar para garantir a integridade visual.
        return res.status(500).json({ error: 'Não foi possível salvar a imagem física na nuvem.' });
      }
    }

    // 3. SALVAR NO BANCO DE DADOS (POSTGRESQL VIA PRISMA)
    console.log("💾 Salvando metadados e URL no banco de dados Prisma...");

    // 解析 ou reconstrói o objeto para incluir a URL da imagem real dentro dele
    const estruturaObjeto = JSON.parse(fragmento);
    estruturaObjeto.imagemRealUrl = urlImagemFinal; // Injeta a URL pública do Supabase Storage aqui dentro!

    const novoPrompt = await prisma.prompt.create({
      data: {
        titulo,
        tipo,
        fragmento: JSON.stringify(estruturaObjeto), // 🔥 Salva o JSON completo atualizado!
      },
    });

    res.status(201).json(novoPrompt);
  } catch (error) {
    console.error('❌ Erro completo ao salvar novo prompt com imagem:', error);
    res.status(500).json({ error: 'Erro interno ao salvar novo prompt na biblioteca.' });
  }
});

// 🔵 CRIAR UM NOVO PROMPT (POST)
app.post('/api/prompts', async (req, res) => {
  try {
    const { titulo, tipo, fragmento } = req.body;

    if (!titulo || !tipo || !fragmento) {
      return res.status(400).json({ error: 'Todos os campos (titulo, tipo, fragmento) são obrigatórios.' });
    }

    const novoPrompt = await prisma.prompt.create({
      data: { titulo, tipo, fragmento },
    });

    res.status(201).json(novoPrompt);
  } catch (error) {
    console.error('Erro ao salvar prompt no Supabase:', error);
    res.status(500).json({ error: 'Erro interno ao salvar novo prompt.' });
  }
});

// 🔴 REMOVER UM PROMPT (DELETE)
app.delete('/api/prompts/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.prompt.delete({
      where: { id },
    });

    res.json({ message: 'Prompt removido com sucesso do banco de dados.' });
  } catch (error) {
    console.error('Erro ao deletar prompt no Supabase:', error);
    res.status(500).json({ error: 'Erro interno ao remover o prompt.' });
  }
});


// ==========================================
// 🛡️ MIDDLEWARES DE ERRO E INICIALIZAÇÃO (SEMPRE NO FINAL)
// ==========================================

// Middleware para capturar erros de upload e não derrubar o servidor
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ error: "A imagem é muito grande! O limite máximo permitido é de 25MB." });
      return;
    }
  }
  res.status(500).json({ error: "Ocorreu um erro interno no servidor." });
});

// Inicialização do servidor de fato
app.listen(PORT, () => {
  console.log(`🚀 Backend com suporte a Visão computacional rodando na porta ${PORT}`);
});

// ==========================================
// 🏷️ ENDPOINTS DE NICHOS/CATEGORIAS DINÂMICAS
// ==========================================

// 🟢 LISTAR TODOS OS NICHOS (GET)
app.get('/api/niches', async (req, res) => {
  try {
    const niches = await prisma.niche.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(niches);
  } catch (error) {
    console.error('Erro ao buscar nichos:', error);
    res.status(500).json({ error: 'Erro interno ao buscar categorias.' });
  }
});


// 🔵 CADASTRAR UM NOVO NICHO (POST) - CORRIGIDO
app.post('/api/niches', async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'O nome do nicho é obrigatório.' });
    }

    // 🔥 Corrigido: Nome junto sem espaço para o TypeScript não reclamar!
    const nomeFormatado = name.trim().charAt(0).toUpperCase() + name.trim().slice(1);

    const novoNicho = await prisma.niche.create({
      data: { name: nomeFormatado },
    });

    res.status(201).json(novoNicho);
  } catch (error) {
    console.error('Erro ao salvar nicho:', error);
    if ((error as any).code === 'P2002') {
      return res.status(400).json({ error: 'Este nicho já está cadastrado!' });
    }
    res.status(500).json({ error: 'Erro interno ao salvar novo nicho.' });
  }
});