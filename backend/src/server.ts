import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
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