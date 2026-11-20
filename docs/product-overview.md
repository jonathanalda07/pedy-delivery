# PEDY DELIVERY — visão do produto

## Proposta
Conectar moradores de Paulicéia-SP e região a estabelecimentos locais, com operação de entrega organizada e acompanhamento de pedidos.

**Slogan:** Bateu a fome? Pede na PEDY!

## Perfis e capacidades

### Cliente
- Criar conta e entrar com segurança.
- Gerenciar dados e endereços.
- Descobrir estabelecimentos e consultar produtos.
- Montar carrinho, confirmar pedido e acompanhar status.

### Estabelecimento
- Manter perfil, horários e área de atendimento.
- Criar e atualizar produtos, preços e disponibilidade.
- Aceitar, preparar e concluir pedidos.

### Entregador
- Manter cadastro e disponibilidade.
- Visualizar entregas atribuídas.
- Atualizar coleta e entrega.

### Administração
- Aprovar estabelecimentos e entregadores.
- Acompanhar usuários, lojas, pedidos e indicadores.
- Resolver ocorrências operacionais.

## Regras de produto a definir
- Cidades atendidas, bairros e limites de entrega.
- Taxas, comissão, repasses e meios de pagamento.
- Processo de aprovação de lojas e entregadores.
- Política de cancelamento, reembolso e suporte.
- Requisitos legais, fiscais e de privacidade.

## Arquitetura inicial
- React + TypeScript + Vite para a aplicação web.
- Firebase Authentication para autenticação.
- Cloud Firestore para dados transacionais e perfis.
- Firebase Storage para imagens.
- Firebase Hosting para publicação.

## Segurança
A autorização deve ser aplicada no servidor pelas regras do Firestore e Storage, não apenas pela interface. O acesso a dados de pedidos deve respeitar cliente, loja, entregador atribuído e administração. Credenciais privadas nunca entram no Git.

## Etapas
1. Fundação web e identidade visual.
2. Configuração do Firebase e autenticação.
3. Perfis e aprovação dos três tipos de conta.
4. Lojas, catálogo e carrinho.
5. Pedidos, atribuição e acompanhamento.
6. Painel administrativo, testes e publicação.
