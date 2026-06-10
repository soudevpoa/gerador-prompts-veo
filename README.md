# VEO Creator - SaaS AI Generator v1.0 🚀

O **VEO Creator** é uma plataforma SaaS (Software as a Service) de alta performance projetada para revolucionar o ecossistema de criação de criativos digitais e influenciadores virtuais. O sistema utiliza uma engenharia avançada de Inteligência Artificial Híbrida para processar referências de produtos reais e gerar roteiros e diretrizes de vídeo UGC (User Generated Content) totalmente adaptativos para o **VEO 3.1**.

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React.js** (com TypeScript)
- **Vite** (Build tool ultra-rápida)
- **Tailwind CSS** (Estilização contemporânea em modo escuro)
- **React Router Dom** (Sistema de navegação modular entre telas)
- **Lucide React** (Pacote premium de ícones vetoriais)

### Backend
- **Node.js** com **Express**
- **TypeScript** (Garantia de tipagem estrita em tempo de execução)
- **OpenAI API** (Modelo `gpt-4o-mini` configurado com visão computacional avançada e alta temperatura adaptativa)

---

## 💎 Funcionalidades Principais Destravadas

### 1. Central de Navegação Modular (Sidebar UI)
- Arquitetura de rotas limpa substituindo views lineares por um ecossistema multipáginas escalável.
- Sidebar fixa com transições em tempo de execução sem recarregamento de página.

### 2. Gerador UGC com Visão Computacional Híbrida
- **Filtro Anti-Estampa Estrito:** O sistema lê imagens de produtos físicos (como calças, camisetas e moletons), extrai metadados estruturais sobre a textura e cor sólida e injeta um comando fotográfico cego em inglês (`plain solid color, absolute zero patterns`) para evitar alucinações de estampas ou xadrez no motor de renderização.
- **Roteiros Inéditos e Anti-Cache:** Algoritmo calibrado dinamicamente via *timestamps* e teto de temperatura para entregar variações narrativas (Ganchos, Retenção e CTA) 100% inéditas a cada geração.

### 3. Biblioteca de Prompts (Vault de Inteligência)
- Área exclusiva para gerenciar, pesquisar e armazenar fragmentos visuais e falados de alta conversão.
- Sistema reativo de busca instantânea rodando em tempo de execução.
- Persistência local (`localStorage`) integrada para blindar os dados contra recarregamentos de páginas.

---

## 📂 Arquitetura de Pastas do Projeto

```text
gerador-prompts-app/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── controllers/
│   │   │       └── promptController.ts  # Inteligência OpenAI & Visão Computacional
│   │   │   └── roteiros.ts              # Estruturas base de narrativas
│   │   └── server.ts                    # Inicialização do servidor Express e rotas API
│   ├── .env                             # Suas chaves secretas (OpenAI)
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Sidebar.tsx              # Menu de navegação premium escuro
│   │   ├── views/
│   │   │   ├── UgcGenerator.tsx         # Painel principal do gerador UGC
│   │   │   └── PromptLibrary.tsx        # Repositório de prompts ativos
│   │   ├── App.tsx                      # Configuração central das rotas SPA
│   │   └── main.tsx
│   └── package.json
│
└── .gitignore                           # Filtro estrito de arquivos para o Git