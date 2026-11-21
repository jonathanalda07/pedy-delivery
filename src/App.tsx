import { useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, type User } from 'firebase/auth'
import { addDoc, collection, doc, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where, type DocumentData } from 'firebase/firestore'
import type { FormEvent } from 'react'
import { auth, db, isFirebaseConfigured } from './firebase'
import { ArrowLeft, ArrowRight, Bike, Clock3, LogOut, MapPin, MessageCircle, Minus, Plus, Search, Send, ShieldCheck, ShoppingBag, Store, UserRound, Wallet, X } from 'lucide-react'

type Role = 'cliente' | 'loja' | 'entregador' | 'admin'
type Product = { id: number; name: string; description: string; price: number; category: string; emoji: string; shopId: string }
type Shop = { id: string; name: string; category: string; time: string; rating: string; emoji: string; products: Product[] }
type Profile = { role: Role; name?: string; shopId?: string; phone?: string; email?: string }
type Order = { id: string; customerId: string; customerName?: string; shopId: string; shopName: string; items: { name: string; price: number; quantity: number }[]; subtotal: number; total: number; address: string; reference?: string; payment: string; note?: string; status: string; courierId?: string | null; createdAt?: { toMillis?: () => number } }
type ChatMessage = { id: string; senderId: string; senderName?: string; text: string; createdAt?: { toMillis?: () => number } }

const shops: Shop[] = [
  { id: 'pedy-burger', name: 'PEDY Burger', category: 'Hambúrgueres', time: '25–40 min', rating: 'Novo', emoji: '🍔', products: [
    { id: 11, name: 'Smash clássico', description: 'Pão brioche, carne smash, queijo e molho da casa.', price: 24.9, category: 'Mais pedidos', emoji: '🍔', shopId: 'pedy-burger' },
    { id: 12, name: 'Duplo cheddar', description: 'Dois smash burgers, cheddar cremoso e cebola.', price: 32.9, category: 'Mais pedidos', emoji: '🍔', shopId: 'pedy-burger' },
    { id: 13, name: 'Batata crocante', description: 'Porção individual de batatas fritas.', price: 14.9, category: 'Acompanhamentos', emoji: '🍟', shopId: 'pedy-burger' },
  ]},
  { id: 'cantinho-pizza', name: 'Cantinho da Pizza', category: 'Pizzas', time: '35–50 min', rating: 'Novo', emoji: '🍕', products: [
    { id: 21, name: 'Pizza muçarela', description: 'Molho artesanal, muçarela e orégano.', price: 39.9, category: 'Pizzas', emoji: '🍕', shopId: 'cantinho-pizza' },
    { id: 22, name: 'Pizza calabresa', description: 'Calabresa fatiada, cebola e muçarela.', price: 44.9, category: 'Pizzas', emoji: '🍕', shopId: 'cantinho-pizza' },
  ]},
  { id: 'acai-praca', name: 'Açaí da Praça', category: 'Açaí e sobremesas', time: '20–35 min', rating: 'Novo', emoji: '🫐', products: [
    { id: 31, name: 'Açaí 300 ml', description: 'Açaí cremoso com acompanhamentos à escolha.', price: 18.9, category: 'Açaí', emoji: '🫐', shopId: 'acai-praca' },
    { id: 32, name: 'Açaí 500 ml', description: 'Açaí cremoso para matar a fome.', price: 26.9, category: 'Açaí', emoji: '🫐', shopId: 'acai-praca' },
  ]},
]
const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const statusLabels: Record<string, string> = { recebido: 'Recebido', aceito: 'Aceito pela loja', preparando: 'Em preparação', pronto: 'Pronto para retirada', em_entrega: 'Saiu para entrega', entregue: 'Entregue', cancelado: 'Cancelado' }

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [availableOrders, setAvailableOrders] = useState<Order[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [queryText, setQueryText] = useState('')
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null)
  const [cart, setCart] = useState<Record<number, number>>({})
  const [cartOpen, setCartOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [authError, setAuthError] = useState('')
  const [page, setPage] = useState<'inicio' | 'painel' | 'chat'>('inicio')
  const [address, setAddress] = useState('')
  const [reference, setReference] = useState('')
  const [payment, setPayment] = useState('pix')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [draft, setDraft] = useState('')

  useEffect(() => {
    if (!auth) return
    let stopProfile = () => {}
    const stopAuth = onAuthStateChanged(auth, nextUser => {
      stopProfile()
      setUser(nextUser)
      setProfile(null)
      if (!nextUser || !db) return
      const profileRef = doc(db, 'users', nextUser.uid)
      stopProfile = onSnapshot(profileRef, snapshot => {
        if (snapshot.exists()) setProfile(snapshot.data() as Profile)
        else {
          void setDoc(profileRef, { role: 'cliente', name: nextUser.displayName || nextUser.email?.split('@')[0] || 'Cliente', email: nextUser.email || '' })
            .catch(() => setNotice('Não foi possível criar seu perfil. Verifique as regras do Firestore.'))
        }
      })
    })
    return () => { stopProfile(); stopAuth() }
  }, [])

  useEffect(() => {
    if (!user || !db || !profile) { setOrders([]); setAvailableOrders([]); return }
    let q
    if (profile.role === 'admin') q = query(collection(db, 'orders'))
    else if (profile.role === 'loja' && profile.shopId) q = query(collection(db, 'orders'), where('shopId', '==', profile.shopId))
    else if (profile.role === 'entregador') q = query(collection(db, 'orders'), where('courierId', '==', user.uid))
    else q = query(collection(db, 'orders'), where('customerId', '==', user.uid))
    const stopOrders = onSnapshot(q, snap => setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order)).sort((a,b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0))), error => setNotice('Erro ao carregar pedidos: ' + error.message))
    let stopAvailable = () => {}
    if (profile.role === 'entregador') {
      const availableQuery = query(collection(db, 'orders'), where('status', '==', 'pronto'))
      stopAvailable = onSnapshot(availableQuery, snap => setAvailableOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order)).filter(o => !o.courierId)), error => setNotice('Erro ao buscar entregas disponíveis: ' + error.message))
    }
    return () => { stopOrders(); stopAvailable() }
  }, [user, profile?.role, profile?.shopId])

  useEffect(() => {
    if (!selectedOrder || !db || !user) { setMessages([]); return }
    const messagesQuery = query(collection(db, 'orders', selectedOrder.id, 'messages'))
    return onSnapshot(messagesQuery, snap => setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage)).sort((a,b) => (a.createdAt?.toMillis?.() ?? 0) - (b.createdAt?.toMillis?.() ?? 0))), error => setNotice('Não foi possível abrir o chat: ' + error.message))
  }, [selectedOrder?.id, user?.uid])

  const allProducts = shops.flatMap(shop => shop.products)
  const cartItems = allProducts.filter(product => cart[product.id])
  const cartCount = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0)
  const cartTotal = cartItems.reduce((sum, product) => sum + product.price * cart[product.id], 0)
  const cartShop = cartItems[0] ? shops.find(s => s.id === cartItems[0].shopId) : null
  const filteredShops = useMemo(() => shops.filter(shop => (shop.name + ' ' + shop.category + ' ' + shop.products.map(p => p.name).join(' ')).toLowerCase().includes(queryText.toLowerCase())), [queryText])

  const changeQuantity = (product: Product, delta: number) => {
    if (delta > 0 && cartItems.some(item => item.shopId !== product.shopId)) { setNotice('Cada pedido deve ser feito em uma loja por vez. Finalize ou esvazie a sacola atual.'); return }
    setCart(current => { const next = { ...current, [product.id]: Math.max(0, (current[product.id] ?? 0) + delta) }; if (!next[product.id]) delete next[product.id]; return next })
    setNotice('')
  }

  const submitAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setAuthError('')
    if (!auth || !db) { setAuthError('O Firebase ainda não está configurado.'); return }
    setBusy(true)
    try {
      if (authMode === 'signup') {
        const result = await createUserWithEmailAndPassword(auth, email, password)
        await setDoc(doc(db, 'users', result.user.uid), { role: 'cliente', name: name.trim() || email.split('@')[0], email })
      } else await signInWithEmailAndPassword(auth, email, password)
      setAuthOpen(false); setNotice('Acesso realizado com sucesso.')
    } catch (error) { setAuthError(error instanceof Error ? error.message : 'Não foi possível entrar. Confira seus dados.') }
    finally { setBusy(false) }
  }

  const placeOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user || !db || !profile || profile.role !== 'cliente') { setNotice('Entre em uma conta de cliente para concluir o pedido.'); setAuthOpen(true); return }
    if (!cartItems.length || !cartShop) return
    setBusy(true); setNotice('')
    try {
      await addDoc(collection(db, 'orders'), {
        customerId: user.uid, customerName: profile.name || user.email || 'Cliente', shopId: cartShop.id, shopName: cartShop.name,
        items: cartItems.map(p => ({ productId: p.id, name: p.name, price: p.price, quantity: cart[p.id] })),
        subtotal: cartTotal, total: cartTotal, address: address.trim(), reference: reference.trim(), payment, note: note.trim(),
        status: 'recebido', courierId: null, createdAt: serverTimestamp(),
      })
      setCart({}); setCheckoutOpen(false); setCartOpen(false); setAddress(''); setReference(''); setNote(''); setPage('painel')
      setNotice('Pedido enviado! Acompanhe a atualização nesta tela.')
    } catch (error) { setNotice('Não foi possível enviar o pedido. Verifique sua conexão e as regras do Firestore. ' + (error instanceof Error ? error.message : '')) }
    finally { setBusy(false) }
  }

  const advanceOrder = async (order: Order, nextStatus: string) => {
    if (!db || !user) return
    try {
      const patch: DocumentData = { status: nextStatus }
      if (nextStatus === 'em_entrega') patch.courierId = user.uid
      await updateDoc(doc(db, 'orders', order.id), patch)
      setNotice('Pedido atualizado.')
    } catch (error) { setNotice('Não foi possível atualizar o pedido. Confira as permissões do seu perfil. ' + (error instanceof Error ? error.message : '')) }
  }

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!db || !user || !profile || !selectedOrder || !draft.trim()) return
    try {
      await addDoc(collection(db, 'orders', selectedOrder.id, 'messages'), { senderId: user.uid, senderName: profile.name || user.email || 'Usuário', senderRole: profile.role, text: draft.trim(), createdAt: serverTimestamp() })
      setDraft('')
    } catch (error) { setNotice('Não foi possível enviar a mensagem. ' + (error instanceof Error ? error.message : '')) }
  }

  const renderOrder = (order: Order) => <article className="order-card" key={order.id}>
    <div className="order-top"><div><span className="eyebrow red">PEDIDO #{order.id.slice(-6).toUpperCase()}</span><h3>{order.shopName}</h3><small>{order.customerName || 'Cliente'} · {order.address}</small></div><span className="status-pill">{statusLabels[order.status] || order.status}</span></div>
    <div className="order-items">{order.items?.map((item,i) => <span key={i}>{item.quantity}× {item.name}</span>)}</div>
    <div className="order-bottom"><strong>{money(order.total || order.subtotal || 0)}</strong><div className="order-actions">
      <button className="secondary-button" onClick={() => { setSelectedOrder(order); setPage('chat') }}><MessageCircle size={15}/> Chat</button>
      {profile?.role === 'loja' && order.status === 'recebido' && <button className="small-primary" onClick={() => advanceOrder(order,'aceito')}>Aceitar</button>}
      {profile?.role === 'loja' && order.status === 'aceito' && <button className="small-primary" onClick={() => advanceOrder(order,'preparando')}>Preparar</button>}
      {profile?.role === 'loja' && order.status === 'preparando' && <button className="small-primary" onClick={() => advanceOrder(order,'pronto')}>Pronto</button>}
      {profile?.role === 'entregador' && order.status === 'em_entrega' && <button className="small-primary" onClick={() => advanceOrder(order,'entregue')}>Confirmar entrega</button>}
      {profile?.role === 'admin' && <select aria-label="Alterar status" value={order.status} onChange={e => advanceOrder(order,e.target.value)}><option value="recebido">Recebido</option><option value="aceito">Aceito</option><option value="preparando">Preparando</option><option value="pronto">Pronto</option><option value="em_entrega">Em entrega</option><option value="entregue">Entregue</option><option value="cancelado">Cancelado</option></select>}
    </div></div>
  </article>

  return <div className="app-shell">
    <header className="topbar">
      <a className="brand" href="#" onClick={() => setPage('inicio')}><span className="brand-mark">P</span><span>PEDY<span className="brand-light"> DELIVERY</span></span></a>
      <div className="location"><MapPin size={17}/><span><small>Região inicial</small><strong>Paulicéia e região</strong></span></div>
      <nav className="desktop-nav"><button onClick={() => setPage('inicio')}>Início</button>{user && <button onClick={() => setPage('painel')}>Meus pedidos</button>}</nav>
      <div className="header-actions">{user ? <button className="login-button" onClick={() => signOut(auth!)}><LogOut size={15}/> Sair</button> : <button className="login-button" onClick={() => setAuthOpen(true)}>Entrar</button>}<button className="cart-button" onClick={() => setCartOpen(true)}><ShoppingBag size={18}/><span>Sacola</span>{cartCount > 0 && <b>{cartCount}</b>}</button></div>
    </header>

    {page === 'inicio' && <main>
      <section className="hero"><div className="hero-copy"><span className="eyebrow"><span className="pulse"/> DELIVERY LOCAL, DO SEU JEITO</span><h1>Bateu a fome?<br/><em>Pede na PEDY!</em></h1><p>Seu pedido favorito, pertinho de você. Descubra sabores de Paulicéia e região.</p><a className="hero-cta" href="#lojas">Ver estabelecimentos <ArrowRight size={18}/></a><div className="hero-note">❤️ Valorizando quem é daqui.</div></div><div className="hero-art"><div className="art-circle"/><div className="food-emoji">🍔</div><div className="art-tag"><Bike size={17}/> A fome não espera!</div></div></section>
      <section className="discovery" id="lojas"><div className="section-heading"><div><span className="eyebrow red">ESCOLHA O QUE VAI PEDIR</span><h2>Tem coisa boa <em>por aqui.</em></h2></div><span className="results-count">{filteredShops.length} estabelecimentos</span></div><label className="search-box"><Search size={19}/><input value={queryText} onChange={e => setQueryText(e.target.value)} placeholder="Busque por loja ou tipo de comida..."/></label><div className="shop-grid">{filteredShops.map(shop => <button className="shop-card" key={shop.id} onClick={() => setSelectedShop(shop)}><div className={'shop-art shop-art-' + (shop.id === 'pedy-burger' ? 1 : shop.id === 'cantinho-pizza' ? 2 : 3)}><span>{shop.emoji}</span><small>{shop.rating}</small></div><div className="shop-info"><div><h3>{shop.name}</h3><p>{shop.category}</p></div><ArrowRight size={18}/></div><div className="shop-meta"><span><Clock3 size={14}/>{shop.time}</span><span>Taxa a calcular</span></div></button>)}{filteredShops.length === 0 && <div className="empty-state">Não encontramos lojas com esse termo.</div>}</div><p className="demo-note">Catálogo de demonstração. Para receber pedidos reais, cada loja precisa ser cadastrada e ativada no Firebase.</p></section>
      <section className="how-section"><span className="eyebrow red">É FÁCIL PEDIR</span><h2>Seu pedido em <em>3 passos.</em></h2><div className="steps"><div><b>01</b><h3>Escolha</h3><p>Encontre sua loja e seus pratos favoritos.</p></div><div><b>02</b><h3>Peça</h3><p>Monte sua sacola e confirme seu pedido.</p></div><div><b>03</b><h3>Receba</h3><p>Acompanhe a entrega até chegar à sua porta.</p></div></div></section>
    </main>}

    {page === 'painel' && <main className="dashboard"><div className="dashboard-heading"><span className="eyebrow red">ÁREA DO {profile?.role === 'admin' ? 'ADMINISTRADOR' : profile?.role === 'loja' ? 'ESTABELECIMENTO' : profile?.role === 'entregador' ? 'ENTREGADOR' : 'CLIENTE'}</span><h1>{profile?.role === 'admin' ? 'Painel administrativo' : profile?.role === 'loja' ? 'Painel da loja' : profile?.role === 'entregador' ? 'Painel do entregador' : 'Meus pedidos'}</h1><p>{profile?.name || user?.email || 'Acompanhe seus pedidos e atualizações.'}</p></div>
      {!user && <div className="empty-state"><p>Entre na sua conta para acessar esta área.</p><button className="primary-wide" onClick={() => setAuthOpen(true)}>Entrar</button></div>}
      {user && !profile && <p>Carregando seu perfil...</p>}
      {user && profile?.role === 'admin' && <div className="metric-grid"><div className="metric-card"><Store/><strong>Admin</strong><span>Controle da plataforma</span></div><div className="metric-card"><ShoppingBag/><strong>{orders.length}</strong><span>Pedidos carregados</span></div><div className="metric-card"><Wallet/><strong>{money(orders.reduce((s,o)=>s+(o.total||0),0))}</strong><span>Volume dos pedidos</span></div></div>}
      {user && profile?.role === 'loja' && !profile.shopId && <div className="notice-card">Seu perfil ainda não está vinculado a uma loja. O administrador precisa preencher o campo <b>shopId</b> no seu cadastro do Firestore.</div>}
      {user && profile?.role === 'entregador' && <section className="orders-section"><h2>Entregas disponíveis</h2>{availableOrders.map(order => <article className="order-card" key={order.id}><div className="order-top"><div><span className="eyebrow red">RETIRADA DISPONÍVEL</span><h3>{order.shopName}</h3><small>Destino: {order.address}</small></div><strong>{money(order.total)}</strong></div><button className="primary-wide" onClick={() => advanceOrder(order,'em_entrega')}>Aceitar entrega</button></article>)}</section>}
      {user && <section className="orders-section"><h2>{profile?.role === 'entregador' ? 'Minhas entregas' : profile?.role === 'loja' ? 'Pedidos da loja' : profile?.role === 'admin' ? 'Todos os pedidos' : 'Histórico de pedidos'}</h2>{orders.length ? orders.map(renderOrder) : <div className="empty-state">Nenhum pedido encontrado por enquanto.</div>}</section>}
      {user && profile?.role === 'admin' && <div className="notice-card"><ShieldCheck/> Para habilitar comerciantes e entregadores, o administrador deve atribuir os campos <b>role</b> e <b>shopId</b> aos perfis no Firebase. O cliente não pode elevar o próprio acesso.</div>}
    </main>}

    {page === 'chat' && <main className="dashboard"><button className="back-button" onClick={() => setPage('painel')}><ArrowLeft size={16}/> Voltar aos pedidos</button><div className="dashboard-heading"><span className="eyebrow red">CHAT DO PEDY</span><h1>Pedido #{selectedOrder?.id.slice(-6).toUpperCase()}</h1><p>{selectedOrder?.shopName} · conversa vinculada ao pedido</p></div>{selectedOrder && <section className="chat-window"><div className="chat-messages">{messages.map(message => <div className={message.senderId === user?.uid ? 'chat-message mine' : 'chat-message'} key={message.id}><small>{message.senderName || 'Participante'}</small><p>{message.text}</p></div>)}{!messages.length && <p className="empty-state">Ainda não há mensagens. Envie a primeira!</p>}</div><form className="chat-form" onSubmit={sendMessage}><input value={draft} onChange={e => setDraft(e.target.value)} placeholder="Digite sua mensagem..." required/><button className="primary-button" disabled={!draft.trim()}><Send size={17}/></button></form></section>}</main>}

    <footer><a className="brand footer-brand" href="#"><span className="brand-mark">P</span><span>PEDY<span className="brand-light"> DELIVERY</span></span></a><p>Bateu a fome? Pede na PEDY!</p><small>© {new Date().getFullYear()} PEDY DELIVERY · Paulicéia-SP e região</small></footer>

    {selectedShop && <div className="overlay" onMouseDown={e => { if (e.target === e.currentTarget) setSelectedShop(null) }}><section className="side-panel"><div className="panel-head"><div><span className="eyebrow red">CARDÁPIO</span><h2>{selectedShop.name}</h2><p>{selectedShop.category} · {selectedShop.time}</p></div><button className="icon-button" onClick={() => setSelectedShop(null)}><X/></button></div>{selectedShop.products.map(product => <div className="product-row" key={product.id}><div className="product-emoji">{product.emoji}</div><div className="product-detail"><h3>{product.name}</h3><p>{product.description}</p><strong>{money(product.price)}</strong></div><button className="add-button" onClick={() => changeQuantity(product,1)}><Plus size={17}/></button></div>)}<button className="primary-wide" onClick={() => { setSelectedShop(null); setCartOpen(true) }}>Ver sacola ({cartCount}) <ArrowRight size={17}/></button></section></div>}

    {cartOpen && <div className="overlay" onMouseDown={e => { if (e.target === e.currentTarget) setCartOpen(false) }}><section className="side-panel"><div className="panel-head"><div><span className="eyebrow red">SEU PEDIDO</span><h2>Sua sacola</h2><p>{cartCount} {cartCount === 1 ? 'item' : 'itens'}</p></div><button className="icon-button" onClick={() => setCartOpen(false)}><X/></button></div>{cartItems.length ? <>{cartItems.map(product => <div className="cart-row" key={product.id}><span className="product-emoji">{product.emoji}</span><div className="product-detail"><h3>{product.name}</h3><strong>{money(product.price * cart[product.id])}</strong></div><div className="quantity"><button onClick={() => changeQuantity(product,-1)}><Minus size={14}/></button><b>{cart[product.id]}</b><button onClick={() => changeQuantity(product,1)}><Plus size={14}/></button></div></div>)}<div className="cart-total"><span>Subtotal</span><strong>{money(cartTotal)}</strong></div><p className="demo-note">A taxa de entrega será definida pela loja ou pela operação local.</p><button className="primary-wide" onClick={() => { setCartOpen(false); setCheckoutOpen(true) }}>Ir para entrega e pagamento <ArrowRight size={17}/></button></> : <div className="cart-empty"><ShoppingBag size={35}/><h3>Sua sacola está vazia</h3><p>Escolha uma loja e adicione seus favoritos.</p><button className="primary-wide" onClick={() => setCartOpen(false)}>Explorar lojas</button></div>}</section></div>}

    {checkoutOpen && <div className="overlay"><section className="side-panel"><div className="panel-head"><div><span className="eyebrow red">FINALIZAR PEDIDO</span><h2>Entrega e pagamento</h2><p>{cartShop?.name} · {money(cartTotal)}</p></div><button className="icon-button" onClick={() => setCheckoutOpen(false)}><X/></button></div><form className="checkout-form" onSubmit={placeOrder}><label>Endereço completo<input required value={address} onChange={e => setAddress(e.target.value)} placeholder="Rua, número e bairro"/></label><label>Ponto de referência<input value={reference} onChange={e => setReference(e.target.value)} placeholder="Ex.: perto da praça"/></label><label>Forma de pagamento<select value={payment} onChange={e => setPayment(e.target.value)}><option value="pix">Pix</option><option value="dinheiro">Dinheiro</option><option value="cartao">Cartão na entrega</option></select></label><label>Observações<textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Alguma orientação para a loja ou entregador?"/></label><div className="cart-total"><span>Total dos produtos</span><strong>{money(cartTotal)}</strong></div><p className="demo-note">O valor exibido não inclui taxa de entrega. O pedido só será gravado quando a loja estiver cadastrada e as regras do Firestore estiverem ativas.</p><button className="primary-wide" disabled={busy || !user}>{busy ? 'Enviando...' : 'Confirmar pedido'} <ArrowRight size={17}/></button>{!user && <button type="button" className="secondary-button" onClick={() => setAuthOpen(true)}>Entrar ou criar conta</button>}</form></section></div>}

    {authOpen && <div className="overlay" onMouseDown={e => { if (e.target === e.currentTarget) setAuthOpen(false) }}><section className="auth-panel"><button className="icon-button close-auth" onClick={() => setAuthOpen(false)}><X/></button><span className="brand-mark auth-mark">P</span><span className="eyebrow red">BEM-VINDO À PEDY</span><h2>{authMode === 'signup' ? 'Crie sua conta.' : 'Que bom ter você de volta.'}</h2><p>Cadastro inicial para clientes. Perfis de loja e entregador são liberados pelo administrador.</p><div className="auth-tabs"><button className={authMode === 'signup' ? 'selected' : ''} onClick={() => setAuthMode('signup')}>Criar conta</button><button className={authMode === 'login' ? 'selected' : ''} onClick={() => setAuthMode('login')}>Entrar</button></div><form onSubmit={submitAuth}>{authMode === 'signup' && <label>Seu nome<input required value={name} onChange={e => setName(e.target.value)} placeholder="Como podemos te chamar?"/></label>}<label>E-mail<input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="voce@email.com"/></label><label>Senha<input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo de 6 caracteres"/></label>{authError && <p className="auth-error">{authError}</p>}<button className="primary-wide" disabled={busy}>{busy ? 'Aguarde...' : authMode === 'signup' ? 'Criar minha conta' : 'Entrar'} <ArrowRight size={17}/></button></form>{!isFirebaseConfigured && <small className="config-warning">Autenticação aguardando as credenciais do Firebase.</small>}</section></div>}
    {notice && <div className="toast" role="status">{notice}<button onClick={() => setNotice('')}><X size={15}/></button></div>}
    <nav className="mobile-nav"><button onClick={() => setPage('inicio')}><Store size={18}/>Início</button><button onClick={() => setPage('painel')}><ShoppingBag size={18}/>Pedidos</button><button onClick={() => setCartOpen(true)}><Wallet size={18}/>Sacola</button><button onClick={() => user ? signOut(auth!) : setAuthOpen(true)}>{user ? <LogOut size={18}/> : <UserRound size={18}/ >}{user ? 'Sair' : 'Conta'}</button></nav>
  </div>
}
