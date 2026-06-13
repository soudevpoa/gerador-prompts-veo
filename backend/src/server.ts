import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import {
  gerarPrompts,
  gerarImagemInfluencerEstatica,
  deletarPromptHistorico
} from './config/controllers/promptController'; // 🔥 Import atualizado com o método DELETE
import { prisma } from './config/prisma';

const app = express();
const PORT = process.env.PORT || 3001;

// Configuração do Multer para ler o upload em memória temporária (máximo 25MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }
});

// 🔥 REFACTOR DA VALIDAÇÃO DO SUPABASE NO SERVER.TS
const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL;

const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;

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
// 🔐 MIDDLEWARE DE AUTENTICAÇÃO
// ==========================================
async function verificarAutenticacao(req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
    }

    const token = authHeader.split(' ')[1];

    // Chama o Supabase para validar se o token enviado pelo front é real e está ativo
    const { data: { user }, error } = await supabaseStorage.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Token inválido ou expirado.' });
    }

    // Injeta o ID do usuário dentro da requisição para as próximas rotas usarem!
    (req as any).userId = user.id;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Falha na autenticação.' });
  }
}

// ==========================================
// 🤖 ENDPOINTS DE GERAÇÃO COM INTELIGÊNCIA ARTIFICIAL (PROTEGIDOS!)
// ==========================================
app.post('/api/gerar-prompts', verificarAutenticacao, limitador, upload.single('imagem'), gerarPrompts);
app.post('/api/gerar-imagem-estatica', verificarAutenticacao, upload.single('imagem'), gerarImagemInfluencerEstatica);

// ==========================================
// 🎥 ENDPOINTS DO HISTÓRICO DE VÍDEOS UGC (SUPABASE - TOTALMENTE PROTEGIDOS)
// ==========================================

// 🔥 Atualizado: Agora busca apenas os vídeos gerados especificamente pelo usuário logado
// ==========================================
// 🎥 ENDPOINTS DO HISTÓRICO DE VÍDEOS UGC (SUPABASE - VERSÃO CORRIGIDA)
// ==========================================

app.get('/api/videos', verificarAutenticacao, async (req: any, res) => {
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

app.post('/api/videos', verificarAutenticacao, async (req: any, res) => {
  try {
    const userId = req.userId; // 🔥 Recupera o ID do usuário injetado pelo middleware
    const { produto, avatarSelecionado, ambiente, tipoVideo, duracao, resultados } = req.body;

    if (!produto || !resultados || resultados.length === 0) {
      return res.status(400).json({ error: 'Produto e os resultados gerados são obrigatórios.' });
    }

    const novoVideo = await prisma.videoHistory.create({
      data: {
        userId, // 🔒 Alimenta o campo obrigatório do seu schema do Prisma!
        produto,
        avatarDescricao: avatarSelecionado || 'fitness_woman',
        ambiente,
        tipoVideo,
        duracao,
        promptsGerados: resultados,
      },
    });

    res.status(201).json(novoVideo);
  } catch (error) {
    console.error('Erro ao salvar vídeo no histórico:', error);
    res.status(500).json({ error: 'Erro interno ao salvar no histórico.' });
  }
});
// Endpoint de deleção
app.delete('/api/videos/:id', verificarAutenticacao, deletarPromptHistorico);
// ==========================================
// 📚 ENDPOINTS DA BIBLIOTECA DE PROMPTS (SUPABASE)
// ==========================================
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

app.post('/api/prompts-com-imagem', upload.single('imagemPreview'), async (req: any, res) => {
  try {
    const { titulo, tipo, fragmento } = req.body;
    const file = req.file;

    if (!titulo || !tipo || !fragmento) {
      return res.status(400).json({ error: 'Título, Nicho e Estrutura de Prompts are required.' });
    }

    let urlImagemFinal = null;

    if (file) {
      try {
        console.log("🚀 Iniciando upload de imagem física para o Supabase Storage...");
        const nomeArquivoUnico = `${Date.now()}-${file.originalname}`;

        const { data: uploadData, error: uploadError } = await supabaseStorage
          .storage
          .from('prompt-previews')
          .upload(nomeArquivoUnico, file.buffer, {
            contentType: file.mimetype,
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabaseStorage
          .storage
          .from('prompt-previews')
          .getPublicUrl(nomeArquivoUnico);

        urlImagemFinal = publicUrlData.publicUrl;
        console.log(`✅ Imagem salva e pública em: ${urlImagemFinal}`);

      } catch (storageError) {
        console.error('❌ Erro no upload para o Supabase Storage:', storageError);
        return res.status(500).json({ error: 'Não foi possível salvar a imagem física na nuvem.' });
      }
    }

    console.log("💾 Salvando metadados e URL no banco de dados Prisma...");
    const estruturaObjeto = JSON.parse(fragmento);
    
    // 🔥 CORRIGIDO: Agora usa o nome correto da variável em português!
    estruturaObjeto.imagemRealUrl = urlImagemFinal; 

    const novoPrompt = await prisma.prompt.create({
      data: {
        titulo,
        tipo,
        fragmento: JSON.stringify(estruturaObjeto),
      },
    });

    res.status(201).json(novoPrompt);
  } catch (error) {
    console.error('❌ Erro completo ao salvar novo prompt com imagem:', error);
    res.status(500).json({ error: 'Erro interno ao salvar novo prompt na biblioteca.' });
  }
});

app.post('/api/prompts', async (req, res) => {
  try {
    const { titulo, tipo, fragmento } = req.body;

    if (!titulo || !tipo || !fragmento) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
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
// 🏷️ ENDPOINTS DE NICHOS/CATEGORIAS DINÂMICAS
// ==========================================
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

app.post('/api/niches', async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'O nome do nicho é obrigatório.' });
    }

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

// ==========================================
// 🔐 ENDPOINTS DE AUTENTICAÇÃO E USUÁRIO
// ==========================================
app.post('/api/auth/sync', async (req, res) => {
  try {
    const { id, email, name } = req.body;

    if (!id || !email) {
      return res.status(400).json({ error: 'ID e Email são obrigatórios para sincronização.' });
    }

    const usuario = await prisma.user.upsert({
      where: { id },
      update: { name },
      create: {
        id,
        email,
        name,
        credits: 10
      }
    });

    res.json(usuario);
  } catch (error) {
    console.error('Erro ao sincronizar usuário:', error);
    res.status(500).json({ error: 'Erro interno na sincronização do usuário.' });
  }
});

// ==========================================
// ⚙️ ENDPOINTS DE CONFIGURAÇÃO DO USUÁRIO
// ==========================================
app.get('/api/user/config', verificarAutenticacao, async (req: any, res) => {
  try {
    const userId = req.userId;

    const config = await prisma.userConfig.findUnique({
      where: { userId }
    });

    if (!config) {
      return res.json({ openaiKey: '', elevenKey: '', brandVoice: '' });
    }

    res.json(config);
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    res.status(500).json({ error: 'Erro ao carregar configurações.' });
  }
});

app.post('/api/user/config', verificarAutenticacao, async (req: any, res) => {
  try {
    const userId = req.userId;
    const { openaiKey, elevenKey, brandVoice } = req.body;

    const configAtualizada = await prisma.userConfig.upsert({
      where: { userId },
      update: { openaiKey, elevenKey, brandVoice },
      create: {
        userId,
        openaiKey,
        elevenKey,
        brandVoice
      }
    });

    res.json({ success: true, config: configAtualizada });
  } catch (error) {
    console.error('Erro ao salvar configurações:', error);
    res.status(500).json({ error: 'Erro ao salvar configurações.' });
  }
});

// ==========================================
// 🛡️ MIDDLEWARES DE ERRO E INICIALIZAÇÃO (SEMPRE NO FINAL)
// ==========================================
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ error: "A imagem é muito grande! O limite máximo permitido é de 25MB." });
      return;
    }
  }
  res.status(500).json({ error: "Ocorreu um erro interno no servidor." });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend com suporte a Visão computacional rodando na porta ${PORT}`);
});