import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import {
  gerarPrompts,
  gerarImagemInfluencerEstatica,
  deletarPromptHistorico,
  remodelarConteudo
} from './config/controllers/promptController';
import { prisma } from './config/prisma';

const app = express();
const PORT = process.env.PORT || 3001;

// Configuração do Multer (em memória para o GPT-4o Vision processar)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }
});

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const supabaseStorage = createClient(supabaseUrl, supabaseKey);

// Middlewares Globais
app.use(cors({
  origin: '*', // Ajuste se necessário para 'http://localhost:5173'
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

const limitador = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { error: "Muitas solicitações. Tente novamente mais tarde." }
});

// ==========================================
// 🔐 MIDDLEWARE DE AUTENTICAÇÃO
// ==========================================
async function verificarAutenticacao(req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
    }
    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabaseStorage.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Token inválido ou expirado.' });
    }
    (req as any).userId = user.id;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Falha na autenticação.' });
  }
}

// ==========================================
// 🤖 ENDPOINTS DE GERAÇÃO (IA)
// ==========================================
app.post('/api/gerar-prompts', verificarAutenticacao, limitador, upload.single('imagem'), gerarPrompts);
app.post('/api/gerar-imagem-estatica', verificarAutenticacao, upload.single('imagem'), gerarImagemInfluencerEstatica);
app.post('/api/remodelar-conteudo', verificarAutenticacao, remodelarConteudo);

// ==========================================
// 🎥 ENDPOINTS DO HISTÓRICO E BIBLIOTECA
// ==========================================
app.get('/api/videos', verificarAutenticacao, async (req: any, res) => {
  try {
    const historico = await prisma.videoHistory.findMany({ where: { userId: req.userId }, orderBy: { createdAt: 'desc' } });
    res.json(historico);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar histórico.' });
  }
});

app.post('/api/videos', verificarAutenticacao, async (req: any, res) => {
  try {
    const { produto, avatarSelecionado, ambiente, tipoVideo, duracao, resultados } = req.body;
    const novoVideo = await prisma.videoHistory.create({
      data: { userId: req.userId, produto, avatarDescricao: avatarSelecionado, ambiente, tipoVideo, duracao, promptsGerados: resultados }
    });
    res.status(201).json(novoVideo);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao salvar histórico.' });
  }
});

app.delete('/api/videos/:id', verificarAutenticacao, deletarPromptHistorico);

// ==========================================
// 📚 ENDPOINTS DE PROMPTS E NICHOS (OBVIADOS POR BREVIDADE, MANTENHA OS SEUS)
// ==========================================
// (Seus outros endpoints de Prompts, Nichos, Auth e Config seguem aqui normalmente)

app.listen(PORT, () => {
  console.log(`🚀 Backend rodando na porta ${PORT}`);
});