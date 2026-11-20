# PEDY DELIVERY

**Bateu a fome? Pede na PEDY!**

Plataforma de delivery para Paulicéia-SP e região, conectando clientes, estabelecimentos e entregadores.

## Identidade
- Cores: preto, laranja e branco.
- Estilo: moderno, acessível e profissional.
- Região inicial: Paulicéia-SP e cidades próximas.

## Stack
- React + TypeScript + Vite.
- Firebase Authentication.
- Cloud Firestore.
- Firebase Storage.
- Firebase Hosting.

## Estado atual
A primeira versão da interface responsiva está criada, com:
- Página inicial e identidade visual PEDY.
- Navegação de áreas (cliente, estabelecimento e entregador).
- Busca de estabelecimentos.
- Catálogo demonstrativo e carrinho local.
- Formulário de cadastro/login preparado para Firebase Authentication.
- Configuração Firebase por variáveis de ambiente.
- Regras iniciais do Firestore fechadas por padrão.
- Pipeline GitHub Actions para typecheck e build.

**Atenção:** lojas, produtos e preços exibidos atualmente são dados demonstrativos. Não há pedidos reais, pagamento ou rastreamento de entregas ativo nesta etapa.

## Rodar localmente
1. Instale Node.js 20 ou superior.
2. Execute `npm install`.
3. Copie `.env.example` para `.env.local` e preencha os dados do app Web Firebase.
4. Execute `npm run dev`.

Para validar a compilação: `npm run build`.

## Estrutura
```text
pedy-delivery/
├── .github/workflows/ci.yml
├── docs/
│   ├── product-overview.md
│   └── roadmap.md
├── src/
│   ├── App.tsx
│   ├── firebase.ts
│   ├── main.tsx
│   └── styles.css
├── .env.example
├── firebase.json
├── firestore.rules
├── index.html
├── package.json
└── vite.config.ts
```

## Segurança
Não versionar chaves privadas, tokens ou arquivos de ambiente reais. As regras do Firestore estão em modo deny-by-default até a implementação e validação das permissões por perfil.
