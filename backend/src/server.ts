import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import { gerarPrompts } from './config/controllers/promptController';
import { gerarImagemInfluencerEstatica } from './config/controllers/promptController';

const app = express();
const PORT = process.env.PORT || 3001;

// Configuração do Multer para ler o upload em memória temporária (máximo 5MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // Limite de segurança de 5MB por foto
});

app.use(cors());
app.use(express.json());

const limitador = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { error: "Muitas solicitações vindas deste IP. Tente novamente mais tarde." }
});

// Adicionamos o middleware 'upload.single("imagem")' nesta rota
app.post('/api/gerar-prompts', limitador, upload.single('imagem'), gerarPrompts);
app.post('/api/gerar-imagem-estatica', upload.single('imagem'), gerarImagemInfluencerEstatica);

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

// Seu app.listen antigo continua aqui embaixo...
app.listen(PORT, () => {
  console.log(`🚀 Backend com suporte a Visão computacional rodando na porta ${PORT}`);
});

app.listen(PORT, () => {
  console.log(`🚀 Backend com suporte a Visão computacional rodando na porta ${PORT}`);
});