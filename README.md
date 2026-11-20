# PEDY DELIVERY

**Bateu a fome? Pede na PEDY!**

Plataforma de delivery para Paulicéia-SP e região, conectando clientes, estabelecimentos e entregadores.

## Identidade
- Cores: preto, laranja e branco.
- Estilo: moderno, acessível e profissional.
- Região inicial: Paulicéia-SP e cidades próximas.

## Áreas da plataforma
- **Clientes:** cadastro, autenticação, endereços, lojas, produtos, carrinho, pedidos e acompanhamento.
- **Estabelecimentos:** perfil da loja, catálogo, disponibilidade, preços e gestão de pedidos.
- **Entregadores:** cadastro, disponibilidade, ofertas de entrega e atualização de etapas.
- **Administração:** gestão operacional, usuários, lojas, pedidos e atendimento.

## Stack
- Aplicação web responsiva em TypeScript.
- Firebase Authentication para identidade e sessões.
- Cloud Firestore para dados.
- Firebase Storage para imagens e documentos.
- Regras de segurança do Firebase para autorização por perfil.

Não versionar credenciais, tokens ou segredos de ambiente.

## Estrutura inicial
```text
pedy-delivery/
├── docs/
│   └── product-overview.md
├── .gitignore
└── README.md
```

## Desenvolvimento
A implementação será incremental. Antes da produção, configurar projeto Firebase, provedores de autenticação, regras do Firestore e Storage, variáveis de ambiente e testes dos fluxos críticos.

## Status
Fundação e especificação inicial do produto.
