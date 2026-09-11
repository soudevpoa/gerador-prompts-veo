import { Request, Response } from 'express';
import OpenAI from 'openai';
import { roteirosMatriz, falasMatriz, ESTILO_CAMERA_PADRAO } from '../roteiros';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });


export const generateYoutubeReview = async (req: Request, res: Response) => {
  try {
    const { productName, targetPain, mainBenefit, usageTime, avatarProfile, homeSetting, antiScamAlert, ctaLocation } = req.body;

    const baseVeoPrompt = `16:9 widescreen format, 4K resolution, authentic UGC video aesthetic shot on smartphone front camera. Subject: ${avatarProfile}, wearing casual home clothes, natural facial expressions. Setting: ${homeSetting}. Handheld camera movement with subtle natural shake, warm interior lighting.`;

    const rawBlocks = [
      {
        title: "Hook & Quebra de Padrão",
        timestamp: "0:00 - 1:00",
        script: `Se você está pensando em comprar o ${productName} para tratar ${targetPain}, para tudo o que você está fazendo e assiste esse vídeo até o final. Eu preciso te dar um aviso muito sério que pode te evitar de jogar dinheiro fora.`,
        action: "Person looking directly into camera with a concerned, serious tone, bringing camera slightly closer."
      },
      {
        title: "História Pessoal & A Dor",
        timestamp: "1:00 - 2:00",
        script: `Eu passei muito tempo sofrendo com ${targetPain}. Nada do que eu tentava funcionava de verdade, até que eu decidi testar o ${productName} por ${usageTime}.`,
        action: "Person sitting comfortably, talking expressively with natural hand gestures, sincere emotional expression."
      },
      {
        title: "Resultados e Experiência",
        timestamp: "2:00 - 3:00",
        script: `Depois de ${usageTime} usando direitinho todos os dias, a diferença em relação a ${mainBenefit} foi incrível. Valeu muito a pena para mim.`,
        action: "Person smiling, showing a small bottle or container casually to the camera, relaxed and happy demeanour."
      },
      antiScamAlert ? {
        title: "Alerta Anti-Golpe (Mercado Livre/Shopee/OLX)",
        timestamp: "3:00 - 4:00",
        script: `Mas atenção: CUIDADO onde vai comprar! NÃO compre o ${productName} no Mercado Livre, Shopee ou OLX. Tem muita falsificação nesses lugares. O original só é vendido no site oficial do fabricante.`,
        action: "Person gesturing warning with hands, serious expression, pointing finger towards the camera for emphasis."
      } : null,
      {
        title: "Call To Action (CTA)",
        timestamp: "4:00 - 5:00",
        script: `Para te ajudar, deixei o link do site oficial seguro bem no ${ctaLocation || 'primeiro comentário fixado'}. Deixe seu like no vídeo e inscreva-se no canal!`,
        action: "Person smiling warmly, pointing downwards indicating the comments section below."
      }
    ].filter(Boolean);

    // Monta o prompt do Veo 3 com a narração entre aspas acoplada ao prompt visual
    const blocks = rawBlocks.map((b: any) => ({
      title: b.title,
      timestamp: b.timestamp,
      script: b.script,
      veoPrompt: `${baseVeoPrompt} ${b.action} Dialogue in Portuguese: "${b.script}"`
    }));

    return res.json({ blocks });
  } catch (error) {
    console.error('Erro no controller de Youtube Review:', error);
    return res.status(500).json({ error: 'Erro interno ao processar o roteiro.' });
  }
};

export const remodelarConteudo = async (req: Request, res: Response) => {
  try {
    const { transcricao, duracao, tipoVideo } = req.body;

    if (!transcricao) {
      return res.status(400).json({ error: "Por favor, forneça a transcrição para remodelagem." });
    }

    // Geração focada puramente em texto estruturado
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.85,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Você é um Diretor de Locução e Copywriter Profissional especialista em retenção de vídeos virais para Reels e TikTok.
          Sua tarefa é receber uma transcrição e reescrevê-la com um ângulo totalmente novo, dinâmico e focado em alta conversão.
          
          REGRAS CRUTIAIS:
          1. O usuário utilizará uma foto própria estática como imagem base diretamente no gerador de vídeo. Portanto, NÃO gaste palavras descrevendo roupas, cenários ou iluminação.
          2. No campo 'promptTexto', escreva apenas um breve direcionamento conceitual ou ação em inglês alinhada ao texto daquela cena.
          3. No campo 'locucaoTexto', gere os blocos de falas limpas e magnéticas em português, perfeitas para serem copiadas e coladas diretamente na voz do Veo.
          
          Retorne estritamente o seguinte formato JSON:
          {
            "prompts": [
              { "cena": 1, "tempo": "0-3s", "promptTexto": "Short english prompt action guidance", "locucaoTexto": "Texto da fala adaptada da cena aqui" }
            ],
            "legendaCompleta": "Texto de legenda com hashtags estratégicas para a postagem"
          }`
        },
        {
          role: "user",
          content: `INPUT DATA:
          - Transcrição original: "${transcricao}"
          - Duração estimada: ${duracao || '15s'}
          - Estilo de vídeo focado: ${tipoVideo || 'Geral'}
          
          Tarefa: Forneça o novo roteiro focado em texto e na sequência de falas limpas para cópia.`
        }
      ]
    });

    const rawContent = response.choices[0].message.content || "{}";
    const cleanContent = rawContent.replace(/```json/g, '').replace(/```/g, '');
    const resultado = JSON.parse(cleanContent);

    res.json(resultado);

  } catch (error) {
    console.error("Erro na remodelagem simplificada:", error);
    res.status(500).json({ error: "Falha ao processar a remodelagem do roteiro." });
  }
};
export const gerarPrompts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { produto, avatarDescricao, ambiente, tipoVideo, duracao } = req.body;
    const file = req.file;
    const userId = (req as any).userId;

    if (!produto || !tipoVideo || !duracao) {
      res.status(400).json({ error: "Campos essenciais faltando." });
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
    if (duracao === 'Longo') limiteCenas = 6;

    const fatiasVisuais = Array(limiteCenas).fill(esqueletoVisual).flatMap(x => x).slice(0, limiteCenas).join("\n");
    const fatiasFaladas = Array(limiteCenas).fill(esqueletoFalado).flatMap(x => x).slice(0, limiteCenas).join("\n");

    const fatiasVisuaisTratadas = fatiasVisuais
      .replace(/{produto}/g, produto)
      .replace(/{tema}/g, produto);

    const fatiasFaladasTratadas = fatiasFaladas
      .replace(/{produto}/g, produto)
      .replace(/{tema}/g, produto);

    let userConfig = null;
    if (userId) {
      userConfig = await prisma.userConfig.findUnique({ where: { userId } });
    }

    const apiKeyFinal = userConfig?.openaiKey || process.env.OPENAI_API_KEY;

    if (!apiKeyFinal) {
      res.status(400).json({ error: "Nenhuma chave de API da OpenAI encontrada no sistema." });
      return;
    }

    const openai = new OpenAI({ apiKey: apiKeyFinal });

    const contextoMarca = userConfig?.brandVoice
      ? `\n\n[REGRAS EXCLUSIVAS DA MARCA DO USUÁRIO - SIGA À RISCA]:\n${userConfig.brandVoice}`
      : '';

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

    // 🧠 DETECÇÃO INTELIGENTE DO MODO SEM ROSTO (FACELESS) VS COM ROSTO VS RECEITAS
    const ehEntretenimento = ['podcast', 'curiosidades', 'terror'].includes(tipoChave);
    const ehFaceless = avatarDescricao.toLowerCase() === 'faceless';
    const ehPodcast = tipoChave === 'podcast';
    const ehReceita = tipoChave === 'receitas';

    let diretrizTipoVideo = "";
    let BlackoutCameraOuAssinatura = "";
    const AssinaturaAudioFaceless = ", clear spoken studio audio in Brazilian Portuguese, natural Brazilian voice inflection, clean background voiceover narration";

    // 🛠️ Árvore de decisões corrigida estruturalmente:
    if (ehFaceless) {
      if (ehReceita) {
        diretrizTipoVideo = `MODO RECEITAS SENSORIAIS (FOOD PORN): O usuário NÃO quer avatares ou pessoas na tela. Cada cena deve descrever planos macro cinemáticos, close-ups extremos e tomadas em primeira pessoa do preparo da comida (overhead table shots, close-up on hands mixing ingredients, steam rising from a pan, liquid syrup pouring smoothly). O foco deve estar totalmente na beleza dos ingredientes vivos, texturas apetitosas e ações reais da receita sobre o tema: "${produto}". PROIBIDO usar termos ou comandos relacionados a rostos ou movimentos labiais.
          
          🔥 REGRA DO CTA DA ÚLTIMA CENA: Obrigatoriamente, a última cena do roteiro (seja a cena 2, 4 ou 6 dependendo da duração) DEVE finalizar o vídeo mostrando o prato pronto maravilhoso sendo servido ou cortado, e a narração em português DEVE conter um CTA seco e direto chamando o espectador para ler a receita completa e os ingredientes que estão na legenda do post, incentivando ele a salvar o vídeo.`;

        BlackoutCameraOuAssinatura = "bright commercial food photography style, vibrant colors, clean marble tabletop background, studio soft lighting, mouth-watering food styling, ultra-detailed 8k resolution, smooth slow-motion cuts";
      } else if (ehPodcast) {
        diretrizTipoVideo = `MODO FACELESS - ESTÚDIO DE PODCAST: O usuário NÃO quer pessoas ou avatares na tela. Cada cena deve descrever planos de detalhe cinemáticos de um estúdio de podcast profissional de alta produção (close-up B-roll on a high-end studio microphone, headphones resting on a table). Foque na atmosfera de gravação do tema: "${produto}".`;
        BlackoutCameraOuAssinatura = "cinematic atmospheric lighting, ultra-detailed textures, moody composition, high-end film production quality, 8k resolution, raw photography style";
      } else {
        diretrizTipoVideo = `MODO FACELESS (SEM ROSTO / CANAL DARK PURO): O usuário NÃO quer pessoas ou avatares na tela. PROIBIDO incluir qualquer personagem humano, influencer virtual ou comandos de fala corporal. Cada cena deve descrever um plano cinemático abstrato, conceitual ou tom sombrio focado puramente na atmosfera do assunto central: "${produto}".`;
        BlackoutCameraOuAssinatura = "cinematic atmospheric lighting, ultra-detailed textures, moody composition, high-end film production quality, 8k resolution, raw photography style";
      }
    } else if (ehPodcast) {
      diretrizTipoVideo = `MODO CORTE DE PODCAST VIRAL (RETENÇÃO BRUTAL): O avatar deve ser descrito sentado de lado em pose 3/4 de perfil, vestindo fones de estúdio e falando em um microfone Shure SM7B. O tom em português deve ser visceral, seco e impactante sobre o tema: "${produto}". Foque em prender o espectador pelo choque nos primeiros 3 segundos.`;
      BlackoutCameraOuAssinatura = `${ESTILO_CAMERA_PADRAO}, professional studio setting background, soft multi-point podcast lighting, depth of field`;
    } else if (ehEntretenimento) {
      diretrizTipoVideo = `FOCO EM ENTRETENIMENTO COM AVATAR: O contexto principal fornecido é um TEMA/ASSUNTO. O avatar deve agir como um apresentador misterioso ou curioso.`;
      BlackoutCameraOuAssinatura = `${ESTILO_CAMERA_PADRAO}`;
    } else {
      diretrizTipoVideo = `FOCO EM E-COMMERCE/UGC COM AVATAR: O contexto principal fornecido é um PRODUTO comercial. Foque em destacar benefícios práticos e demonstração do item na mão do avatar de forma amigável.`;
      BlackoutCameraOuAssinatura = `${ESTILO_CAMERA_PADRAO}`;
    }

    // ⚡ INSTRUÇÃO DE AMBIENTE DINÂMICA
    const instrucaoAmbienteDinamica = ehFaceless
      ? ehReceita
        ? `3. MODO RECEITAS: O cenário/fundo de todas as cenas deve ser obrigatoriamente um ambiente de cozinha moderna, estúdio culinário limpo ou bancada de mármore iluminada e minimalista.`
        : `3. MODO FACELESS: Ignore completamente a variável de ambiente fixada no frontend. O cenário/fundo de cada cena deve ser criado de forma dinâmica e adaptativa, focado estritamente em ilustrar com fidelidade o tema central da história: "${produto}".`
      : `3. MODO AVATAR HUMANO: O cenário de fundo de todas as cenas deve ser mantido baseado no ambiente selecionado na interface: "${ambiente || 'a natural background'}"`;

    // 🔥 INSTRUÇÃO ADICIONAL PARA GERAR A RECEITA COPIÁVEL NA LEGENDA MESTRE
    const diretrizLegendaReceita = ehReceita
      ? `\n7. COMO O MODO ATUAL É RECEITAS: Você deve obrigatoriamente gerar uma receita culinária real e completa na propriedade final 'legendaCompleta' do JSON. Liste os ingredientes corretos em tópicos e o modo de preparo rápido de forma atraente usando emojis e hashtags virais para o usuário colocar na legenda do Reels/TikTok.`
      : `\n7. COMO O MODO É NARRATIVO/COMERCIAL: Escreva na propriedade final 'legendaCompleta' um texto curto e provocativo de alta conversão, acompanhado de hashtags estratégicas, feito para ser copiado e colado direto na legenda da postagem de vídeo.`;

    // ⚡ Otimização do Call da API
    const timestampAleatorio = new Date().getTime();
    
    const userPrompt = `
        [SESSÃO DE IDENTIFICAÇÃO ÚNICA DA REQUISIÇÃO: ${timestampAleatorio}]
        
        LANGUAGE INSTRUCTION: Detect the language of the provided 'CONTEXTO BASE' and 'INSIGHTS VISUAIS'. 
        You MUST generate the entire JSON response (prompts, locucaoTexto, legendaCompleta) in that SAME detected language.
        
        CONTEXTO BASE (PRODUTO OU TEMA): ${produto}
        AVATAR BASE: ${ehFaceless ? "No Avatar / Pure Faceless Video" : avatarDescricao}
        CENÁRIO/AMBIENTE REQUERIDO: ${ambiente || "Casual background"}
        INSIGHTS VISUAIS DA IMAGEM REAL: ${insightsDaImagem || "Nenhuma imagem anexada."}
        
        ESTRUTURA CONCEITUAL DE RITMO (TRATADA E DINÂMICA):
        Visões de referência: \n${fatiasVisuaisTratadas}
        Falas de referência: \n${fatiasFaladasTratadas}
      `;

    const systemPrompt = `
      You are a senior director and conversion copywriter for UGC, Reels, and Dark channel videos.
      Your task is to generate a JSON response strictly following this schema:
      {
        "prompts": [{ "cena": number, "tempo": string, "promptTexto": string, "locucaoTexto": string }],
        "legendaCompleta": string
      }

      CRITICAL RULES:
      1. LANGUAGE: Detect the language of the 'Transcrição base' / 'Contexto'. Output EVERYTHING in that detected language.
      2. CONSISTENCY: All 'promptTexto' fields must have English camera/visual descriptions. Narration/speech must match the detected language.
      3. VARIABILITY: DO NOT REUSE THE EXACT TEMPLATES from the Rhythm reference. Create highly original, dynamic, and high-conversion scripts based on the product.
      4. VEO 3.1 COMPATIBILITY: Include the signature: ", ${BlackoutCameraOuAssinatura}${ehFaceless ? AssinaturaAudioFaceless : ', clear spoken studio audio, natural voice inflection, perfect lip-sync'}".
      5. FORMAT: No markdown, no explanations, strictly valid JSON.
      
      [DIRETRIZES DINÂMICAS DO USUÁRIO]:
      ${diretrizTipoVideo}
      ${instrucaoAmbienteDinamica}
      ${diretrizLegendaReceita}
      
      CRITICAL FOR IMAGE: If "INSIGHTS VISUAIS DA IMAGEM REAL" are provided, your 'promptTexto' MUST rigorously incorporate those visual details so the generated video matches the uploaded model image perfectly.
    `;
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      presence_penalty: 0.2,
      frequency_penalty: 0.2,
    });

    const stringResult = response.choices[0].message.content || '{}';
    res.json(JSON.parse(stringResult));

  } catch (error) {
    console.error("Erro crítico no gerarPrompts:", error);
    res.status(500).json({ error: "Erro interno ao processar o roteiro." });
  }
};

export const gerarImagemInfluencerEstatica = async (req: Request, res: Response): Promise<void> => {
  try {
    const { produto, avatarDescricao, ambiente } = req.body;
    const file = req.file;
    const userId = (req as any).userId;

    if (!produto || !avatarDescricao || !ambiente) {
      res.status(400).json({ error: "Dados incompletos para gerar o prompt da imagem base." });
      return;
    }

    if (avatarDescricao.toLowerCase() === 'faceless') {
      res.status(400).json({ error: "O Passo 1 se aplica apenas para gerar fotos de avatares/influencers humanos. Para o modo Sem Rosto (Faceless), pule diretamente para o Passo 2." });
      return;
    }

    let apiKeyFinal = process.env.OPENAI_API_KEY;
    if (userId) {
      const userConfig = await prisma.userConfig.findUnique({ where: { userId } });
      if (userConfig?.openaiKey) apiKeyFinal = userConfig.openaiKey;
    }

    const openai = new OpenAI({ apiKey: apiKeyFinal });

    let detalhesEstritosProduto = `holding a premium aesthetic ${produto}`;

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
                text: "Describe only the main product/object in this image in one short, clean English sentence. Focus on its appearance, color, shape, and texture. Do not include apologies or refuse the prompt. Just describe the physical object."
              },
              {
                type: "image_url",
                image_url: { url: `data:${file.mimetype};base64,${base64Image}` }
              }
            ]
          }
        ]
      });

      const textoExtraido = visionResponse.choices[0].message.content || "";
      
      // TRAVA DE SEGURANÇA: Verifica se a IA retornou uma recusa (unable, sorry, cannot, etc.)
      const textoLower = textoExtraido.toLowerCase();
      const recusaIA = textoLower.includes("unable") || textoLower.includes("sorry") || textoLower.includes("cannot");

      if (textoExtraido && !recusaIA) {
        detalhesEstritosProduto = `holding and showcasing ${textoExtraido.trim()}`;
      } else {
        // Se a IA recusar, usamos o fallback seguro com o nome do produto
        detalhesEstritosProduto = `holding a premium aesthetic ${produto}`;
      }
    }

    const promptImagemDefinitivo = `A realistic high-quality commercial portrait photograph in vertical 9:16 aspect ratio for TikTok and Reels. Subject: ${avatarDescricao}. Action: The subject is interacting naturally, ${detalhesEstritosProduto}. Location/Background: Inside a ${ambiente}. Style: Authentic UGC content creator style, vertical framing, clean professional lighting, focused on product details, 8k resolution, photorealistic skin textures, looking straight into the camera, portrait mode, --ar 9:16`.trim();

    res.json({
      sucesso: true,
      promptTextoPronto: promptImagemDefinitivo
    });

  } catch (error) {
    console.error("Erro na rota de visão da OpenAI:", error);
    res.status(500).json({ error: "Erro ao processar a visão computacional do product." });
  }
};

export const deletarPromptHistorico = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    console.log(`🚀 Tentando deletar o prompt ID recebido (UUID String): "${id}" para o usuário: ${userId}`);

    if (!id || typeof id !== 'string') {
      console.error(`❌ ID inválido ou vazio recebido no backend: ${id}`);
      res.status(400).json({ error: "O ID fornecido é inválido." });
      return;
    }

    const registro = await prisma.videoHistory.findFirst({
      where: {
        id: id,
        userId: userId
      }
    });

    if (!registro) {
      console.warn(`⚠️ Registro ID ${id} não encontrado para o usuário ${userId}`);
      res.status(404).json({ error: "Registro não encontrado ou você não tem permissão para deletá-lo." });
      return;
    }

    await prisma.videoHistory.delete({
      where: {
        id: id
      }
    });

    console.log(`✅ Registro UUID ${id} deletado com sucesso do Supabase!`);
    res.json({ sucesso: true, mensagem: "Histórico removido com sucesso!" });
  } catch (error) {
    console.error("❌ Erro fatal ao deletar do histórico no Prisma:", error);
    res.status(500).json({ error: "Erro interno ao tentar remover o registro." });
  }
};