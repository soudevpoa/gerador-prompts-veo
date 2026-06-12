import { Request, Response } from 'express';
import OpenAI from 'openai';
import { roteirosMatriz, falasMatriz, ESTILO_CAMERA_PADRAO } from '../roteiros';
import { GoogleGenerativeAI } from '@google/generative-ai';
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const gerarPrompts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { produto, avatarDescricao, ambiente, tipoVideo, duracao } = req.body;
    const file = req.file;

    if (!produto || !tipoVideo || !duracao) {
      res.status(400).json({ error: "Campos essenciais (produto, tipoVideo, duracao) estão faltando." });
      return;
    }

    const tipoChave = tipoVideo.toLowerCase();
    const esqueletoVisual = roteirosMatriz[tipoChave];
    const esqueletoFalado = falasMatriz[tipoChave];

    if (!esqueletoVisual || !esqueletoFalado) {
      res.status(400).json({ error: "Tipo de vídeo inválido." });
      return;
    }

    // 🔥 NOVA LÓGICA DE CENAS DINÂMICAS PARA 60 SEGUNDOS
    let limiteCenas = 2;
    if (duracao === 'Médio') limiteCenas = 4;
    if (duracao === 'Longo') limiteCenas = 6; // <-- Adicionado para fechar 60s!

    // Ajusta o fatiamento dos esqueletos dinamicamente caso o array de referência seja menor
    const fatiasVisuais = Array(limiteCenas).fill(esqueletoVisual).flatMap(x => x).slice(0, limiteCenas).join("\n");
    const fatiasFaladas = Array(limiteCenas).fill(esqueletoFalado).flatMap(x => x).slice(0, limiteCenas).join("\n");

    let insightsDaImagem = "";

    if (file) {
      const base64Image = file.buffer.toString('base64');
      const visionResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this image. If it is a product from cute/coloring brands like 'Bobbie Goods' or stationary, explicitly describe it as 'cute, minimalist, kawaii, clean lines, aesthetic stationary pastel design'. Avoid literal translations of brand names that cause hallucinations. Keep it short in English."
              },
              {
                type: "image_url",
                image_url: { url: `data:${file.mimetype};base64,${base64Image}` }
              }
            ]
          }
        ]
      });
      insightsDaImagem = visionResponse.choices[0].message.content || "";
    }

    const systemPrompt = `
      Você é um diretor sênior e roteirista de alta conversão para vídeos UGC e Reels.
      Seu objetivo é criar um roteiro adaptativo único de exatamente ${limiteCenas} cenas balanceadas para cobrir o tempo solicitado.
      
      INSTRUÇÕES DE REESCRITA E VARIABILIDADE:
      1. Os esqueletos visuais e falados enviados servem APENAS como referência conceitual de ritmo. Crie abordagens inéditas a cada chamada, mudando ganchos e palavras.
      
      INSTRUÇÕES DE CONSISTÊNCIA VISUAL PARA O VEO 3.1:
      2. Toda a descrição de cena, enquadramentos e movimentos de câmera devem ser em INGLÊS.
      3. O avatar informado deve interagir diretamente com o produto em seu próprio corpo (vestindo ou segurando). PROIBIDO manequins, bonecos estáticos ou telas divididas.
      4. O cenário de fundo de todas as cenas deve ser estritamente baseado no ambiente indicado pelo usuário: "${ambiente || 'a natural background'}".
      5. Como o VEO 3.1 gera voz nativa, inclua o texto falado diretamente no promptTexto em inglês, escapado dentro de aspas duplas após um comando de fala do avatar. Ex: says "\\"[FALA VERBATIM EXCLUSIVA EM PORTUGUÊS]\\"".
      6. Proibido traduzir a fala do avatar para o inglês. Ela deve permanecer 100% em PORTUGUÊS DO BRASIL.
      7. Adicione esta assinatura exata ao fim de cada prompt visual: "${ESTILO_CAMERA_PADRAO}, clear spoken studio audio in Brazilian Portuguese, natural Brazilian voice inflection, perfect lip-sync".
      
      O retorno deve ser OBRIGATORIAMENTE um JSON válido no formato do exemplo abaixo, sem markdowns ou explicações.
      
      EXEMPLO DE RETORNO JSON:
      {
        "prompts": [
          {
            "cena": 1,
            "tempo": "10s",
            "promptTexto": "A virtual influencer described as [AVATAR]. Inside the [AMBIENTE]. She looks at the camera, holding the product, and says \\"[FALA EXCLUSIVA EM PORTUGUÊS]\\". ${ESTILO_CAMERA_PADRAO}, clear spoken studio audio in Brazilian Portuguese, natural Brazilian voice inflection, perfect lip-sync",
            "locucaoTexto": "[FALA EXCLUSIVA EM PORTUGUÊS]"
          }
        ]
      }
    `;

    const timestampAleatorio = new Date().getTime();
    const userPrompt = `
      [SESSÃO DE IDENTIFICAÇÃO ÚNICA DA REQUISIÇÃO: ${timestampAleatorio}]
      PRODUTO BASE: ${produto}
      AVATAR BASE: ${avatarDescricao || "A natural digital creator"}
      CENÁRIO/AMBIENTE REQUERIDO: ${ambiente || "Casual background"}
      INSIGHTS VISUAIS DA IMAGEM REAL: ${insightsDaImagem || "Nenhuma imagem anexada."}
      
      ESTRUTURA CONCEITUAL DE RITMO:
      Visões de referência: \n${fatiasVisuais}
      Falas de referência: \n${fatiasFaladas}
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 1.0,
      presence_penalty: 0.6,
      frequency_penalty: 0.4,
    });

    const stringResult = response.choices[0].message.content || '{}';
    res.json(JSON.parse(stringResult));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro interno ao processar roteiro adaptativo." });
  }
};

export const gerarImagemInfluencerEstatica = async (req: Request, res: Response): Promise<void> => {
  try {
    const { produto, avatarDescricao, ambiente } = req.body;
    const file = req.file;

    if (!produto || !avatarDescricao || !ambiente) {
      res.status(400).json({ error: "Dados incompletos para gerar o prompt da imagem base." });
      return;
    }

    let detalhesEstritosProduto = `holding a premium aesthetic ${produto}.`;

    if (file) {
      const base64Image = file.buffer.toString('base64');
      const visionResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this product. If it's stationary, a book, or art supplies like Bobbie Goods, describe it exactly as 'a cute minimalist pastel-colored coloring stationary product, clean lineart, aesthetic'. Avoid creating words that sound like anatomy or literal translations. Keep it to one clean sentence."
              },
              {
                type: "image_url",
                image_url: { url: `data:${file.mimetype};base64,${base64Image}` }
              }
            ]
          }
        ]
      });

      const textoExtraido = visionResponse.choices[0].message.content;
      if (textoExtraido) {
        detalhesEstritosProduto = `holding and showcasing ${textoExtraido.trim()}`;
      }
    }

    //// 🔥 PROMPT FOTOGRÁFICO ATUALIZADO COM PROPORÇÃO RETRATO 9:16 PARA TIKTOK/REELS
    const promptImagemDefinitivo = `A realistic high-quality commercial portrait photograph in vertical 9:16 aspect ratio for TikTok and Reels. Subject: ${avatarDescricao}. Action: The subject is interacting naturally, ${detalhesEstritosProduto}. Location/Background: Inside a ${ambiente}. Style: Authentic UGC content creator style, vertical framing, clean professional lighting, focused on product details, 8k resolution, photorealistic skin textures, looking straight into the camera, portrait mode, --ar 9:16`.trim();

    // Devolve o texto tratado perfeito para o front
    res.json({
      sucesso: true,
      promptTextoPronto: promptImagemDefinitivo
    });

  } catch (error) {
    console.error("Erro na rota de visão da OpenAI:", error);
    res.status(500).json({ error: "Erro ao processar a visão computacional do produto." });
  }
};