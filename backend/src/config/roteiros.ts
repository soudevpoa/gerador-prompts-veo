export const ESTILO_CAMERA_PADRAO = "Shot on smartphone camera, 4k video quality, crisp focus, smooth natural handheld camera motion, professional cinematic color grading, authentic content creator aesthetic.";

export const roteirosMatriz: Record<string, string[]> = {
  // ==========================================
  // 🛍️ VERTENTES COMERCIAIS / UGC / E-COMMERCE
  // ==========================================
  ugc: [
    "Dynamic hook, influencer holding {produto} close to the camera, smiling excitedly, casual aesthetic",
    "Medium shot of the influencer demonstrating how {produto} works in a real-world everyday scenario",
    "Macro extreme close-up focusing on the unique premium texture and craftsmanship of {produto}",
    "Influencer pointing at the product features with an authentic, friendly and trustworthy facial expression"
  ],
  unboxing: [
    "Aesthetic top-down or close-up shot of an elegant, unopened box of {produto} sitting on a clean surface",
    "Influencer's hands gently cutting the seal or opening the premium packaging of {produto}",
    "Slow-motion reveal shot pulling {produto} out from the protective tissue paper inside the box",
    "Influencer looking at the product for the very first time, showing genuine surprise and delight"
  ],
  review: [
    "Influencer looking analytical yet welcoming, introducing {produto} directly to the camera",
    "Side-by-side comparison movement or close inspection of {produto}'s main physical features",
    "Macro shot detailing the specific technical or design elements mentioned during the evaluation",
    "Influencer demonstrating a specific high-performance feature of {produto}, looking impressed"
  ],
  tutorial: [
    "Step 1: Influencer smiling, introduces the initial setup or first phase of using {produto}",
    "Step 2: Close-up on hands showing exactly how to prepare or switch on {produto} correctly",
    "Step 3: Over-the-shoulder shot watching the influencer execute the core function of the product",
    "Step 4: Extreme macro shot focusing on the immediate visual effect or result of the operation"
  ],
  testemunho: [
    "Deep personal hook, influencer looking sincere and emotional, engaging directly with the camera",
    "Close-up tracking shot as the influencer shares their genuine past frustration before finding {produto}",
    "Influencer holding {produto} with care, looking relieved and deeply satisfied with the change",
    "Macro shot focusing on the subtle, high-quality material details that made the absolute difference"
  ],

  // ==========================================
  // 🎭 VERTENTES DARK / VISUALIZAÇÃO / HISTÓRIAS
  // ==========================================
  podcast: [
    "An influencer sitting with a professional microphone, gesturing naturally as if talking on a high-end podcast set, deeply engaged in the topic.",
    "Close-up of the creator confidently explaining a life-changing hack or mind-blowing fact about {tema}.",
    "The creator pointing or emphasizing a point directly to the camera with a casual, authentic podcast vibe.",
    "A wider shot of the creator finishing a powerful statement, looking relaxed and convincing on the podcast couch."
  ],
  curiosidades: [
    "A dynamic angle of the host pointing up or showing a shocking expression, preparing to reveal a secret about {tema}.",
    "Close-up details of rich visual elements being highlighted on screen with fast-paced macro camera movements to illustrate the fact.",
    "The host looking analytical, presenting an intriguing problem or historical mystery related to {tema}.",
    "A highly engaging final shot of the host asking a mind-blowing question while showcasing the environment to stimulate comments and shares."
  ],
  terror: [
    "The host looking seriously or mysteriously into the camera, surrounded by moody, dramatic cinematic shadows, setting a chilling tone.",
    "A slow, tense zoom into a dark, eerie environment or relevant object framed in a mysterious composition.",
    "The host making a subtle expression of suspense, building an intense psychological atmosphere while narrating the darkest part of {tema}.",
    "A chilling final framing of the creator looking deeply into the lens, leaving an unresolved question in the air."
  ],
  receitas: [
    "A gorgeous overhead shot framing the clean workspace tabletop. High aesthetic preparation stage.",
    "A dynamic extreme close-up shot capturing a decisive cooking action or liquid pouring smoothly.",
    "A beautiful macro cinematic panning shot focusing on the rich sensory details and vibrant textures.",
    "A mouth-watering commercial close-up showcasing the stunning finished recipe plate ready to be served."
  ],
};

export const falasMatriz: Record<string, string[]> = {
  // ==========================================
  // 🛍️ VERTENTES COMERCIAIS / UGC / E-COMMERCE
  // ==========================================
  ugc: [
    "Gente, eu precisava aparecer aqui para mostrar isso para vocês! Olha a qualidade desse(a) {produto}!",
    "Eu testei de várias formas no meu dia a dia e a praticidade dele(a) é simplesmente surreal.",
    "Olha bem de perto o acabamento e os detalhes. Dá para ver que é um produto feito para durar.",
    "Se você busca algo que realmente funcione, isso aqui é para você. Clica no link abaixo!"
  ],
  unboxing: [
    "Acabou de chegar uma caixinha muito especial por aqui e eu estava ansiosa para abrir junto com vocês!",
    "A embalagem já entrega tudo, super premium. Vamos ver o que tem dentro...",
    "Olha isso! Ele vem super bem embalado, dá para sentir o cuidado da marca em cada detalhe.",
    "Uau! Pessoalmente ele é ainda mais bonito do que eu imaginava. O design é impecável!"
  ],
  review: [
    "Hoje eu vim fazer uma avaliação sincera sobre o(a) {produto}. Será que realmente vale a pena?",
    "Analisando a estrutura dele(a), o primeiro ponto que me chamou a atenção foi o design.",
    "Olhando de perto os componentes, dá para perceber que a construção dele é super robusta.",
    "Colocando em prática, o desempenho cumpre exatamente o que promete. Recomendo muito!"
  ],
  tutorial: [
    "No vídeo de hoje eu vou te ensinar o passo a passo definitivo de como usar o seu {produto} do jeito certo.",
    "O primeiro passo é super simples: basta você fazer a regulagem inicial ou ligar o aparelho.",
    "Agora, o grande segredo é posicionar e usar o produto com movimentos suaves.",
    "Viu como é fácil? Se você quer facilidade assim no seu dia a dia, garante o seu no link!"
  ],
  testemunho: [
    "Eu preciso ser muito honesta com vocês. Antes de conhecer isso aqui, a minha rotina era uma bagunça.",
    "Eu já tinha tentado de tudo, gastei dinheiro com várias soluções que não funcionavam.",
    "Foi aí que eu resolvi dar uma chance para o(a) {produto}. E sério, minha vida mudou.",
    "A sensação de finalmente encontrar algo que cumpre o que promete não tem preço. Experimentem!"
  ],

  // ==========================================
  // 🎭 VERTENTES DARK / VISUALIZAÇÃO / HISTÓRIAS
  // ==========================================
  // No seu falasMatriz dentro do roteiros.ts:
podcast: [
  "Corta o papinho furado. A verdade nua e crua sobre {tema} é uma só, e quase ninguém aguenta ouvir...",
  "O maior erro que você comete nesse cenário é achar que o tempo resolve. Não resolve, só destrói.",
  "Se você não tiver estômago para encarar esse padrão agora, o preço que você vai pagar lá na frente vai ser bizarro.",
  "Para de se enganar. Assiste esse corte até o final se você realmente quer parar de empurrar isso com a barriga."
],
  curiosidades: [
    "Você sabia que existe um segredo que pouquíssimas pessoas conhecem sobre {tema}?",
    "O que quase ninguém percebe é o impacto oculto que isso causa no nosso dia a dia.",
    "A história acabou de provar algo bizarro que vai te deixar completamente chocado.",
    "Me diz aqui nos comentários se você já sabia disso ou se acabou de descobrir!"
  ],
  terror: [
    "O que aconteceu envolvendo {tema} assombra investigadores até os dias de hoje.",
    "Ninguém conseguiu explicar o que as testemunhas registraram na madrugada daquele dia.",
    "Relatos estritos dizem que o pior erro daqueles jovens foi ignorar os primeiros sinais de aviso.",
    "Se você ouvisse um sussurro sussurrando isso no escuro, o que você faria?"
  ],
  receitas: [
    "Essa é, sem dúvidas, a melhor receita de {tema} que você vai ver na sua vida toda. Olha o nível disso!",
    "O grande segredo que ninguém te conta para acertar a textura perfeita está exatamente nessa etapa aqui.",
    "Mexe com paciência até atingir esse ponto brilhante. O visual e o aroma que isso solta são bizarros.",
    "Faz o teste aí na sua casa, me conta o que achou e já salva esse corte para não perder os detalhes!"
  ],
};