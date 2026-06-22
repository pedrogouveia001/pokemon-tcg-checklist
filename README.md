# Pokémon TCG Checklist & Coleção

Uma aplicação web interativa (SPA) desenvolvida em Vanilla HTML, CSS e JavaScript para colecionadores e jogadores de Pokémon TCG. Permite gerenciar sua coleção pessoal de cartas da primeira geração (Base Set), acompanhar o progresso com estatísticas detalhadas e filtrar cartas de maneira rápida e responsiva.

## 🚀 Recursos Principais

- **📊 Dashboard de Estatísticas**:
  - Porcentagem total de conclusão da coleção.
  - Painel de contadores rápidos (Total de cartas, cartas colecionadas, faltantes e repetidas).
  - Gráfico de distribuição por tipo de Pokémon (Fogo, Água, Grama, Elétrico, etc.) e raridade.
- **🔍 Filtros e Busca em Tempo Real**:
  - Busca textual instantânea por nome ou número da carta.
  - Filtro por tipo elemental do Pokémon.
  - Filtro por status de posse (Todas, Apenas as que Tenho, Faltando, Repetidas).
- **💎 Gerenciamento de Quantidades**:
  - Clique rápido para marcar uma carta como obtida.
  - Controle de cartas repetidas com badges visuais.
  - Visualização de ilustrações oficiais das cartas Pokémon.
- **💾 Persistência de Dados**:
  - Salvamento automático do seu progresso no navegador através do `localStorage`. Você pode fechar a aba e voltar depois sem perder sua coleção.
- **📱 Design Responsivo**:
  - Visual moderno e otimizado tanto para computadores quanto para celulares.

## 🛠️ Tecnologias Utilizadas

- **HTML5**: Estrutura semântica da aplicação.
- **CSS3 (Vanilla)**: Design moderno, responsivo, efeitos de hover e transições suaves.
- **JavaScript (ES6+)**: Lógica da aplicação, filtros, manipulação do DOM e persistência local.
- **Lucide Icons**: Pacote de ícones vetoriais modernos.

## 📂 Estrutura do Projeto

```
pokemon-tcg-checklist/
├── index.html          # Estrutura principal e esqueleto do SPA
├── styles.css          # Estilos globais, temas e responsividade
├── app.js              # Lógica de controle, filtros e eventos
├── pokemonData.js      # Base de dados estática das cartas cadastrados
└── .gitignore          # Regras de exclusão do Git
```

## 💻 Como Executar

A aplicação roda diretamente no navegador, sem a necessidade de instalações ou compiladores.

1. Baixe ou clone o repositório.
2. Dê um duplo clique no arquivo `index.html` para abrir no seu navegador.
3. Se preferir rodar em um servidor web local rápido (Python):
   ```bash
   python -m http.server 8000
   ```
   Abra `http://localhost:8000` no seu navegador.

---
*Desenvolvido como um checklist ágil e limpo para colecionadores de cartas Pokémon.*
