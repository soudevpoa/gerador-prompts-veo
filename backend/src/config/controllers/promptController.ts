import { Request, Response } from 'express';
import OpenAI from 'openai';
import { roteirosMatriz, falasMatriz, ESTILO_CAMERA_PADRAO } from '../roteiros';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const remodelarConteudo = async (req: any, res: Response) => {
  console.log("🔍 Arquivo recebido pelo controller:", req.file);

  if (!req.file) {
    return res.status(400).json({ error: "Nenhum arquivo enviado!" });
  }

  try {
    const { transcricao } = req.body;
    const file = req.file;

    // 1. Passo: Obter descrição da imagem
    const descricaoVisual = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "Descreva esta imagem focando apenas em: iluminação, tipo de vestimenta, cenário, clima e estilo visual. Seja breve e técnico." },
        {
          role: "user",
          content: [
            { type: "text", text: "Descreva o estilo visual desta imagem." },
            { type: "image_url", image_url: { url: `data:${file.mimetype};base64,${file.buffer.toString('base64')}` } }
          ]
        }
      ]
    });

    const detalhesDaImagem = descricaoVisual.choices[0].message.content;

    // 2. Passo: Gerar o roteiro (Forçando JSON puro)
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      // 🔥 Aumentamos para 0.9 para dar mais criatividade e evitar repetição
      temperature: 0.9,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Você é um Diretor de Locução Profissional. 
      REGRAS: Nunca repita roteiros anteriores. Use a transcrição fornecida como BASE, mas reescreva com um ângulo totalmente novo, tom de voz diferente e estrutura única. 
      RETORNE APENAS JSON.`
        },
        {
          role: "user",
          content: `INPUT DATA:
      - Transcrição: ${transcricao}
      - Detalhes visuais da imagem: ${detalhesDaImagem}
      - Tarefa: Reescreva um roteiro viral e original baseado nesses dados.`
        }
      ]
    });

    // 3. Passo: Parse seguro com limpeza de lixo
    const rawContent = response.choices[0].message.content || "{}";
    const cleanContent = rawContent.replace(/```json/g, '').replace(/```/g, '');

    const resultado = JSON.parse(cleanContent);

    res.json(resultado);

  } catch (error) {
    console.error("Erro na remodelagem:", error);
    res.status(500).json({ error: "Falha ao processar remodelagem. Verifique o log do servidor." });
  }
};
export const gerarPrompts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { produto, avatarDescricao, ambiente, tipoVideo, duracao } = req.body;
    const file = req.file;

    const userId = (req as any).userId;

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
        ? `3. MODO RECEITAS: O cenário/fundo de todas as cenas deve ser obrigatoriamente um ambiente de cozinha moderna, estúdio culinário limho ou bancada de mármore iluminada e minimalista.`
        : `3. MODO FACELESS: Ignore completamente a variável de ambiente fixada no frontend. O cenário/fundo de cada cena deve ser criado de forma dinâmica e adaptativa, focado estritamente em ilustrar com fidelidade o tema central da história: "${produto}".`
      : `3. MODO AVATAR HUMANO: O cenário de fundo de todas as cenas deve ser mantido baseado no ambiente selecionado na interface: "${ambiente || 'a natural background'}"`;

    // 🔥 INSTRUÇÃO ADICIONAL PARA GERAR A RECEITA COPIÁVEL NA LEGENDA MESTRE
    const diretrizLegendaReceita = ehReceita
      ? `\n7. COMO O MODO ATUAL É RECEITAS: Você deve obrigatoriamente gerar uma receita culinária real e completa na propriedade final 'legendaCompleta' do JSON. Liste os ingredientes corretos em tópicos e o modo de preparo rápido de forma atraente usando emojis e hashtags virais para o usuário colocar na legenda do Reels/TikTok.`
      : `\n7. COMO O MODO É NARRATIVO/COMERCIAL: Escreva na propriedade final 'legendaCompleta' um texto curto e provocativo de alta conversão, acompanhado de hashtags estratégicas, feito para ser copiado e colado direto na legenda da postagem de vídeo.`;

    const systemPrompt = `
      You are a senior director and conversion copywriter for UGC, Reels, and Dark channel videos.
      Your objective is to create a unique adaptive script of exactly ${limiteCenas} balanced scenes.
      
      CRITICAL LANGUAGE RULE: 
      - Detect the language of the provided 'Transcrição base'.
      - All content (locucaoTexto, legendaCompleta, and speech within promptTexto) MUST be in the EXACT SAME LANGUAGE as the 'Transcrição base'.
      - Maintain the original language's cultural nuances and tone.

      INSTRUCTIONS:
      ${diretrizTipoVideo}

      WRITING, MARKETING & VARIABILITY INSTRUCTIONS:
      1. 🔥 NEVER REPEAT STRUCTURES: Ignore cliched hooks and create 100% ORIGINAL approaches every time.
      2. Use rich, natural, and colloquial vocabulary appropriate for the detected language.
      
      VISUAL & AUDIO CONSISTENCY FOR VEO 3.1:
      1. All scene descriptions, framing, and camera movements must be in ENGLISH.
      ${instrucaoAmbienteDinamica}
      4. 🔥 MANDATORY (SINGLE BLOCK WITH AUDIO): Mix the speech directly into 'promptTexto':
         - If using an avatar: ... and says "[SPEECH IN ORIGINAL LANGUAGE]".
         - If FACELESS: ... with voiceover narration saying "[SPEECH IN ORIGINAL LANGUAGE]".
      5. The narration/speech must remain 100% in the ORIGINAL LANGUAGE of the input.
      6. All physical descriptions or macro actions must be at the START of the 'promptTexto'.
      7. Add this exact signature to the end of each promptTexto: ", ${BlackoutCameraOuAssinatura}${ehFaceless ? AssinaturaAudioFaceless : ', clear spoken studio audio, natural voice inflection, perfect lip-sync'}".${diretrizLegendaReceita}
      
      The output must be OBLIGATORILY a valid JSON, without markdowns or explanations.
      ${contextoMarca}

      EXAMPLE JSON OUTPUT:
      {
        "prompts": [
          {
            "cena": 1,
            "tempo": "10s",
            "promptTexto": "A professional cinematic shot matching active guidelines. Context: [ACTION]. With voiceover narration saying \\"[SPEECH IN ORIGINAL LANGUAGE]\\", ${BlackoutCameraOuAssinatura}${ehFaceless ? AssinaturaAudioFaceless : ', clear spoken studio audio, natural voice inflection, perfect lip-sync'}",
            "locucaoTexto": "[SPEECH IN ORIGINAL LANGUAGE]"
          }
        ],
        "legendaCompleta": "[FULL CAPTION TEXT INCLUDING RECIPE/CONTENT, INGREDIENTS, PREP STEPS, AND VIRAL HASHTAGS IN THE ORIGINAL LANGUAGE]"
      }
    `;

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

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 1.1,
      presence_penalty: 0.8,
      frequency_penalty: 0.6,
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
    const userId = (req as any).userId; // Injetado pelo middleware de autenticação

    console.log(`🚀 Tentando deletar o prompt ID recebido (UUID String): "${id}" para o usuário: ${userId}`);

    // 1. Validação de segurança simples: Garante que o ID não veio vazio
    if (!id || typeof id !== 'string') {
      console.error(`❌ ID inválido ou vazio recebido no backend: ${id}`);
      res.status(400).json({ error: "O ID fornecido é inválido." });
      return;
    }

    // 2. Busca o registro usando o ID como String pura e o userId
    const registro = await prisma.videoHistory.findFirst({
      where: {
        id: id, // 🔒 Corrigido: Passando a string pura sem converter para Number!
        userId: userId
      }
    });

    if (!registro) {
      console.warn(`⚠️ Registro ID ${id} não encontrado para o usuário ${userId}`);
      res.status(404).json({ error: "Registro não encontrado ou você não tem permissão para deletá-lo." });
      return;
    }

    // 3. Executa a deleção de fato usando a string do ID
    await prisma.videoHistory.delete({
      where: {
        id: id // 🔒 Corrigido: Usando a string pura
      }
    });

    console.log(`✅ Registro UUID ${id} deletado com sucesso do Supabase!`);
    res.json({ sucesso: true, mensagem: "Histórico removido com sucesso!" });
  } catch (error) {
    console.error("❌ Erro fatal ao deletar do histórico no Prisma:", error);
    res.status(500).json({ error: "Erro interno ao tentar remover o registro." });
  }
};