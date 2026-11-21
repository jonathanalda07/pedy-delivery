# PEDY DELIVERY

**Bateu a fome? Pede na PEDY!**

Plataforma de delivery para Paulicéia-SP e região, conectando clientes, estabelecimentos e entregadores.

## Identidade visual
- Cores principais: vermelho e branco.
- Interface responsiva para celular e computador.
- Região inicial: Paulicéia-SP e cidades próximas.

## Tecnologias
- React + TypeScript + Vite.
- Firebase Authentication.
- Cloud Firestore (pedidos, perfis e mensagens em tempo real).
- Firebase Hosting.

## O que já está implementado
- Página inicial com busca e catálogo em tempo real no Firestore; não há lojas ou produtos de demonstração.
- Sacola que limita cada pedido a uma loja por vez.
- Checkout com endereço, referência, pagamento e observações.
- Cadastro e login de clientes por e-mail e senha.
- Criação de pedidos no Firestore.
- Painel de pedidos por perfil: cliente, loja, entregador e administrador.
- Atualização do fluxo: recebido → aceito → preparando → pronto → em entrega → entregue.
- Ofertas de entrega disponíveis para entregadores.
- Chat em tempo real vinculado ao pedido.
- Regras iniciais do Firestore com controle de acesso por perfil.

## O que ainda exige configuração
- Ativar o provedor E-mail/Senha em Firebase Authentication.
- Criar o banco Cloud Firestore.
- Configurar as variáveis do Firebase no GitHub Actions.
- Publicar as regras de `firestore.rules` no projeto Firebase.
- Criar documentos de lojas ativos na coleção `shops`, incluindo o array `products` com o cardápio.
- Atribuir os perfis de administrador, comerciante e entregador pelo Firebase Console.
- Cadastrar os estabelecimentos, produtos, preços e horários reais na coleção `shops`.
- Definir taxa de entrega, integração de pagamento, notificações push e rastreamento GPS.

**Importante:** o catálogo consulta em tempo real somente lojas com `active: true` e exibe os produtos cadastrados no array `products` de cada documento. Sem Firebase configurado, o catálogo fica vazio; nenhum estabelecimento ou produto fictício é exibido. O Firestore só aceitará pedidos para uma loja ativa existente na coleção `shops`. Não há cobrança de pagamento dentro do app; o método escolhido é registrado no pedido.

## Configuração do Firebase

1. No Firebase Console, abra o projeto `pedy-delivery`.
2. Em Authentication → Sign-in method, habilite **E-mail/senha**.
3. Crie o banco em Firestore Database.
4. Copie `.env.example` para `.env.local` e preencha os dados do app Web.
5. Publique o conteúdo de `firestore.rules` no Firestore → Regras. Não use regras abertas.
6. No GitHub, em Settings → Secrets and variables → Actions → New repository secret, configure os secrets `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID` e `FIREBASE_SERVICE_ACCOUNT_PEDY_DELIVERY`.

### Primeiro administrador e perfis

O cadastro público cria somente perfil `cliente`. Para proteger a plataforma, os papéis privilegiados não podem ser escolhidos pelo próprio usuário.

1. Crie sua conta de administrador pelo app.
2. No Firestore, abra `users/{UID_DA_CONTA}` e altere `role` para `admin`.
3. Para cada comerciante, crie a conta pelo app e atualize o documento `users/{UID}` para `role: loja` e `shopId: ID_DA_LOJA`.
4. Crie `shops/{ID_DA_LOJA}` com pelo menos `name`, `ownerId` (UID do comerciante) e `active: true`.
5. Para cada entregador, crie a conta pelo app e altere `role` para `entregador`.

O documento de cada loja deve ficar em `shops/{ID_REAL_DA_LOJA}` e conter, no mínimo, `name` (nome real do estabelecimento), `ownerId` (UID do comerciante) e `active: true`. O campo `products` deve ser um array com os produtos reais do cardápio; cada produto precisa ter `name` e `price` maior que zero. Podem ser incluídos também `description`, `category` e `emoji`. Não crie documentos de lojas ou produtos de exemplo em produção.

O ID do documento da loja deve ser exatamente o mesmo valor de `shopId` no perfil do comerciante. Ao editar o documento no Firestore, o catálogo do aplicativo recebe a atualização automaticamente. O cadastro inicial de perfis e lojas é feito pelo Firebase Console.

## Rodar localmente

1. Instale Node.js 20 ou superior.
2. Execute `npm install`.
3. Configure `.env.local`.
4. Execute `npm run dev`.
5. Para validar: `npm run build`.

## Estrutura
```text
pedy-delivery/
├── .github/workflows/
├── docs/
├── src/
│   ├── App.tsx
│   ├── firebase.ts
│   ├── main.tsx
│   └── styles.css
├── .env.example
├── firebase.json
├── firestore.rules
└── package.json
```

## Segurança
- Nunca versionar `.env.local`, chaves privadas ou tokens.
- Não permitir que usuários escolham ou alterem seu próprio papel.
- As regras do Firestore validam a propriedade da loja, do pedido e da conversa.
- Não configurar `allow read, write: if true`.
