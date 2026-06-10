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
    // Recebe as variáveis clássicas do front ou os novos dados mapeados do menu de avatares
    const { 
      produto, 
      avatarDescricao, // Descrição textual do avatar (pode vir direto do ID selecionado)
      ambiente,        // O cenário escolhido no menu (Ex: Modern gym)
      tipoVideo, 
      duracao 
    } = req.body;
    const file = req.file; // Arquivo enviado caso o usuário faça upload direto na tela de roteiros

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

    let limiteCenas = 2;
    if (duracao === 'Médio') limiteCenas = 4;

    const fatiasVisuais = esqueletoVisual.slice(0, limiteCenas).join("\n");
    const fatiasFaladas = esqueletoFalado.slice(0, limiteCenas).join("\n");

    let insightsDaImagem = "";

    // Se houver uma imagem real enviada na requisição, extrai as texturas/cores com Visão computacional
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
                text: "Analyze this image and extract details of color, textures, style or physical design. Keep it in English, short and direct." 
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

    // Engenharia de Prompt atualizada com foco em consistência visual absoluta para o VEO 3.1
    const systemPrompt = `
      Você é um diretor sênior e roteirista de alta conversão para vídeos UGC e Reels.
      Seu objetivo é criar um roteiro adaptativo único de exatamente ${limiteCenas} cenas.
      
      INSTRUÇÕES DE REESCRITA E VARIABILIDADE:
      1. Os esqueletos visuais e falados enviados servem APENAS como referência conceitual de ritmo. Crie abordagens inéditas a cada chamada, mudando ganchos e palavras.
      
      INSTRUÇÕES DE CONSISTÊNCIA VISUAL PARA O VEO 3.1:
      2. Toda a descrição de cena, enquadramentos e movimentos de câmera devem ser em INGLÊS.
      3. O avatar informado deve interagir diretamente com o produto em seu próprio corpo (vestindo ou segurando). PROIBIDO manequins, bonecos estáticos ou telas divididas (splitscreen).
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
            "tempo": "8s",
            "promptTexto": "A virtual influencer described as [AVATAR]. Inside the [AMBIENTE]. She looks at the camera, dynamic movement, holding the product, and says \\"[FALA EXCLUSIVA EM PORTUGUÊS]\\". ${ESTILO_CAMERA_PADRAO}, clear spoken studio audio in Brazilian Portuguese, natural Brazilian voice inflection, perfect lip-sync",
            "locucaoTexto": "[FALA EXCLUSIVA EM PORTUGUÊS]"
          }
        ]
      }
    `;

    // 🔥 GERADOR DE VARIABILIDADE ALEATÓRIA TEMPORAL
    const timestampAleatorio = new Date().getTime();

    const userPrompt = `
      [SESSÃO DE IDENTIFICAÇÃO ÚNICA DA REQUISIÇÃO: ${timestampAleatorio}]
      Atenção Diretor: Cada segundo conta, crie algo novo baseado nos dados abaixo!
      
      PRODUTO BASE: ${produto}
      AVATAR BASE: ${avatarDescricao || "A natural digital creator"}
      CENÁRIO/AMBIENTE REQUERIDO: ${ambiente || "Casual background"}
      INSIGHTS VISUAIS DA IMAGEM REAL (SE HOUVER): ${insightsDaImagem || "Nenhuma imagem anexada."}
      
      ESTRUTURA CONCEITUAL DE RITMO (NÃO COPIAR AS PALAVRAS, APENAS O RITMO):
      Visões de referência: \n${fatiasVisuais}
      Falas de referência: \n${fatiasFaladas}
    `;

    // Chamada oficial da OpenAI com parâmetros ajustados
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 1.0, // <-- Subimos para 1.0! Máximo de criatividade e aleatoriedade sem quebrar o JSON
      presence_penalty: 0.6, // <-- Penaliza a IA se ela começar a repetir palavras das chamadas anteriores
      frequency_penalty: 0.4, // <-- Evita que ela use os mesmos jargões seguidamente
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

    let detalhesEstritosProduto = `a premium solid-colored ${produto} with clean seams and plain texture.`;

    // 👁️ REQUISIÇÃO DE VISÃO BLINDADA VIA OPENAI (FIM DOS ERROS 404 DO GOOGLE)
    if (file) {
      const base64Image = file.buffer.toString('base64');
      
      const visionResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini", // O mesmo motor que já está voando na sua outra rota
        messages: [
          {
            role: "user",
            content: [
              { 
                type: "text", 
                text: "Analyze this clothing product image. Describe its exact solid color, fabric type (matte, glossy, smooth), shape, and design details. CRITICAL: If it is a solid color, explicitly state 'plain solid color, absolute zero patterns, no plaid, no prints' to prevent image generators from hallucinating fake patterns. Keep it brief in one English sentence." 
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
        detalhesEstritosProduto = textoExtraido.trim();
        console.log("👁️ OpenAI Visão - Insights de textura extraídos com sucesso!");
      }
    }

    // Monta o comando fotográfico definitivo impecável
    const promptImagemDefinitivo = `A realistic premium commercial full-body studio photograph. Subject: ${avatarDescricao}. Action: The subject is standing naturally, wearing and showcasing the exact clothing item: ${detalhesEstritosProduto}. Location/Background: Inside a ${ambiente}. Style: Photorealistic, cinematic soft studio lighting, high texture detail, 8k resolution, authentic UGC content creator style, look straight into the camera.`.trim();

    // Devolve o texto tratado perfeito para a caixinha verde do front
    res.json({
      sucesso: true,
      promptTextoPronto: promptImagemDefinitivo
    });

  } catch (error) {
    console.error("Erro na rota de visão da OpenAI:", error);
    res.status(500).json({ error: "Erro ao processar a visão computacional do produto." });
  }
}