import { useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth'
import type { User } from 'firebase/auth'
import type { FormEvent } from 'react'
import { auth, isFirebaseConfigured } from './firebase'
import { ArrowRight, Bike, ChevronDown, Clock3, MapPin, Menu, Minus, Plus, Search, ShoppingBag, Store, UserRound, X } from 'lucide-react'

type Role = 'cliente' | 'loja' | 'entregador'
type Product = { id: number; name: string; description: string; price: number; category: string; emoji: string }
type Shop = { id: number; name: string; category: string; time: string; fee: string; rating: string; emoji: string; products: Product[] }

const shops: Shop[] = [
  { id: 1, name: 'PEDY Burger', category: 'Hambúrgueres', time: '25–40 min', fee: 'Entrega a calcular', rating: 'Novo', emoji: '🍔', products: [
    { id: 11, name: 'Smash clássico', description: 'Pão brioche, carne smash, queijo e molho da casa.', price: 24.9, category: 'Mais pedidos', emoji: '🍔' },
    { id: 12, name: 'Duplo cheddar', description: 'Dois smash burgers, cheddar cremoso e cebola.', price: 32.9, category: 'Mais pedidos', emoji: '🍔' },
    { id: 13, name: 'Batata crocante', description: 'Porção individual de batatas fritas.', price: 14.9, category: 'Acompanhamentos', emoji: '🍟' },
  ]},
  { id: 2, name: 'Cantinho da Pizza', category: 'Pizzas', time: '35–50 min', fee: 'Entrega a calcular', rating: 'Novo', emoji: '🍕', products: [
    { id: 21, name: 'Pizza muçarela', description: 'Molho artesanal, muçarela e orégano.', price: 39.9, category: 'Pizzas', emoji: '🍕' },
    { id: 22, name: 'Pizza calabresa', description: 'Calabresa fatiada, cebola e muçarela.', price: 44.9, category: 'Pizzas', emoji: '🍕' },
  ]},
  { id: 3, name: 'Açaí da Praça', category: 'Açaí e sobremesas', time: '20–35 min', fee: 'Entrega a calcular', rating: 'Novo', emoji: '🫐', products: [
    { id: 31, name: 'Açaí 300 ml', description: 'Açaí cremoso com acompanhamentos à escolha.', price: 18.9, category: 'Açaí', emoji: '🫐' },
    { id: 32, name: 'Açaí 500 ml', description: 'Açaí cremoso para matar a fome.', price: 26.9, category: 'Açaí', emoji: '🫐' },
  ]},
]

const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function App() {
  const [role, setRole] = useState<Role>('cliente')
  const [query, setQuery] = useState('')
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null)
  const [cart, setCart] = useState<Record<number, number>>({})
  const [cartOpen, setCartOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    if (!auth) return
    return onAuthStateChanged(auth, setUser)
  }, [])

  const allProducts = shops.flatMap(shop => shop.products)
  const cartItems = allProducts.filter(product => cart[product.id])
  const cartCount = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0)
  const cartTotal = cartItems.reduce((sum, product) => sum + product.price * cart[product.id], 0)
  const filteredShops = useMemo(() => shops.filter(shop =>
    (shop.name + ' ' + shop.category + ' ' + shop.products.map(p => p.name).join(' ')).toLowerCase().includes(query.toLowerCase())
  ), [query])

  const changeQuantity = (id: number, delta: number) => setCart(current => {
    const next = { ...current, [id]: Math.max(0, (current[id] ?? 0) + delta) }
    if (!next[id]) delete next[id]
    return next
  })

  const submitAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAuthError('')
    if (!auth) { setAuthError('O Firebase ainda não foi configurado. Aguarde a conexão do projeto.'); return }
    try {
      if (authMode === 'signup') await createUserWithEmailAndPassword(auth, email, password)
      else await signInWithEmailAndPassword(auth, email, password)
      setAuthOpen(false)
    } catch {
      setAuthError('Não foi possível entrar. Confira o e-mail e a senha e tente novamente.')
    }
  }

  return <div className="app-shell">
    <header className="topbar">
      <a className="brand" href="#" aria-label="PEDY DELIVERY início"><span className="brand-mark">P</span><span>PEDY<span className="brand-light"> DELIVERY</span></span></a>
      <div className="location"><MapPin size={17}/><span><small>Você está em</small><strong>Paulicéia, SP</strong></span><ChevronDown size={15}/></div>
      <nav className="desktop-nav"><a href="#lojas">Explorar</a><a href="#como-funciona">Como funciona</a></nav>
      <div className="header-actions">
        {user ? <button className="login-button" onClick={() => auth && signOut(auth)}>{user.email?.split('@')[0]} · Sair</button> : <button className="login-button" onClick={() => setAuthOpen(true)}>Entrar</button>}
        <button className="cart-button" onClick={() => setCartOpen(true)}><ShoppingBag size={18}/><span className="cart-label">Sacola</span>{cartCount > 0 && <b>{cartCount}</b>}</button>
      </div>
    </header>

    <main>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow"><span className="pulse"/> DELIVERY LOCAL, DO SEU JEITO</span>
          <h1>Bateu a fome?<br/><em>Pede na PEDY!</em></h1>
          <p>Seu pedido favorito, pertinho de você. Descubra sabores de Paulicéia e região.</p>
          <a className="hero-cta" href="#lojas">Ver estabelecimentos <ArrowRight size={18}/></a>
          <div className="hero-note"><span>🧡</span> Valorizando quem é daqui.</div>
        </div>
        <div className="hero-art" aria-label="Ilustração de lanche e entrega">
          <div className="art-circle"/><div className="art-spark spark-one">✦</div><div className="art-spark spark-two">✳</div>
          <div className="food-emoji">🍔</div><div className="art-tag"><Bike size={17}/> A fome não espera!</div>
        </div>
      </section>

      <section className="role-strip" aria-label="Área da plataforma">
        <span className="role-caption">ACESSE SUA ÁREA</span>
        <div className="role-options">
          <button className={role === 'cliente' ? 'role-option active' : 'role-option'} onClick={() => setRole('cliente')}><UserRound size={17}/> Cliente</button>
          <button className={role === 'loja' ? 'role-option active' : 'role-option'} onClick={() => setRole('loja')}><Store size={17}/> Estabelecimento</button>
          <button className={role === 'entregador' ? 'role-option active' : 'role-option'} onClick={() => setRole('entregador')}><Bike size={17}/> Entregador</button>
        </div>
        {role !== 'cliente' && <button className="role-hint" onClick={() => { setAuthMode('signup'); setAuthOpen(true) }}>Quero me cadastrar <ArrowRight size={14}/></button>}
      </section>

      <section className="discovery" id="lojas">
        <div className="section-heading"><div><span className="eyebrow orange">ESCOLHA O QUE VAI PEDIR</span><h2>Tem coisa boa <em>por aqui.</em></h2></div><span className="results-count">{filteredShops.length} estabelecimentos</span></div>
        <label className="search-box"><Search size={19}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Busque por loja ou tipo de comida..."/>{query && <button onClick={() => setQuery('')} aria-label="Limpar busca"><X size={16}/></button>}</label>
        <div className="shop-grid">
          {filteredShops.map(shop => <button className="shop-card" key={shop.id} onClick={() => setSelectedShop(shop)}>
            <div className={'shop-art shop-art-' + shop.id}><span>{shop.emoji}</span><small>{shop.rating}</small></div>
            <div className="shop-info"><div><h3>{shop.name}</h3><p>{shop.category}</p></div><ArrowRight size={18}/></div>
            <div className="shop-meta"><span><Clock3 size={14}/>{shop.time}</span><span>{shop.fee}</span></div>
          </button>)}
          {filteredShops.length === 0 && <div className="empty-state">Não encontramos lojas com esse termo. Tente outra busca.</div>}
        </div>
        <p className="demo-note">Prévia de catálogo demonstrativo — estabelecimentos, preços e disponibilidade ainda não representam lojas ativas.</p>
      </section>

      <section className="how-section" id="como-funciona">
        <span className="eyebrow orange">É FÁCIL PEDIR</span><h2>Seu pedido em <em>3 passos.</em></h2>
        <div className="steps"><div><b>01</b><h3>Escolha</h3><p>Encontre sua loja e seus pratos favoritos.</p></div><div><b>02</b><h3>Peça</h3><p>Monte sua sacola e confirme seu pedido.</p></div><div><b>03</b><h3>Receba</h3><p>Acompanhe a entrega até chegar à sua porta.</p></div></div>
      </section>
    </main>

    <footer><a className="brand footer-brand" href="#"><span className="brand-mark">P</span><span>PEDY<span className="brand-light"> DELIVERY</span></span></a><p>Bateu a fome? Pede na PEDY!</p><small>© {new Date().getFullYear()} PEDY DELIVERY · Paulicéia-SP e região</small></footer>

    {selectedShop && <div className="overlay" onMouseDown={e => { if (e.target === e.currentTarget) setSelectedShop(null) }}><section className="side-panel"><div className="panel-head"><div><span className="eyebrow orange">CARDÁPIO</span><h2>{selectedShop.name}</h2><p>{selectedShop.category} · {selectedShop.time}</p></div><button className="icon-button" onClick={() => setSelectedShop(null)} aria-label="Fechar"><X/></button></div>{selectedShop.products.map(product => <div className="product-row" key={product.id}><div className="product-emoji">{product.emoji}</div><div className="product-detail"><h3>{product.name}</h3><p>{product.description}</p><strong>{money(product.price)}</strong></div><button className="add-button" onClick={() => changeQuantity(product.id, 1)}><Plus size={17}/></button></div>)}<button className="primary-wide" onClick={() => { setSelectedShop(null); setCartOpen(true) }}>Ver sacola ({cartCount}) <ArrowRight size={17}/></button></section></div>}

    {cartOpen && <div className="overlay" onMouseDown={e => { if (e.target === e.currentTarget) setCartOpen(false) }}><section className="side-panel"><div className="panel-head"><div><span className="eyebrow orange">SEU PEDIDO</span><h2>Sua sacola</h2><p>{cartCount} {cartCount === 1 ? 'item' : 'itens'}</p></div><button className="icon-button" onClick={() => setCartOpen(false)} aria-label="Fechar"><X/></button></div>{cartItems.length ? <>{cartItems.map(product => <div className="cart-row" key={product.id}><span className="product-emoji">{product.emoji}</span><div className="product-detail"><h3>{product.name}</h3><strong>{money(product.price * cart[product.id])}</strong></div><div className="quantity"><button onClick={() => changeQuantity(product.id, -1)} aria-label="Diminuir"><Minus size={14}/></button><b>{cart[product.id]}</b><button onClick={() => changeQuantity(product.id, 1)} aria-label="Aumentar"><Plus size={14}/></button></div></div>)}<div className="cart-total"><span>Subtotal</span><strong>{money(cartTotal)}</strong></div><p className="demo-note">A finalização de pedidos será ativada após configurar lojas, endereços, taxas e Firebase.</p><button className="primary-wide" onClick={() => { setCartOpen(false); setAuthOpen(true) }}>Continuar <ArrowRight size={17}/></button></> : <div className="cart-empty"><ShoppingBag size={35}/><h3>Sua sacola está vazia</h3><p>Escolha uma loja e adicione seus favoritos.</p><button className="primary-wide" onClick={() => setCartOpen(false)}>Explorar lojas</button></div>}</section></div>}

    {authOpen && <div className="overlay" onMouseDown={e => { if (e.target === e.currentTarget) setAuthOpen(false) }}><section className="auth-panel"><button className="icon-button close-auth" onClick={() => setAuthOpen(false)} aria-label="Fechar"><X/></button><span className="brand-mark auth-mark">P</span><span className="eyebrow orange">BEM-VINDO À PEDY</span><h2>{authMode === 'signup' ? 'Crie sua conta.' : 'Que bom ter você de volta.'}</h2><p>Entre para continuar sua experiência.</p><div className="auth-tabs"><button className={authMode === 'signup' ? 'selected' : ''} onClick={() => setAuthMode('signup')}>Criar conta</button><button className={authMode === 'login' ? 'selected' : ''} onClick={() => setAuthMode('login')}>Entrar</button></div><form onSubmit={submitAuth}><label>E-mail<input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="voce@email.com"/></label><label>Senha<input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo de 6 caracteres"/></label>{authError && <p className="auth-error">{authError}</p>}<button className="primary-wide" type="submit">{authMode === 'signup' ? 'Criar minha conta' : 'Entrar'} <ArrowRight size={17}/></button></form>{!isFirebaseConfigured && <small className="config-warning">Autenticação aguardando configuração das credenciais do Firebase.</small>}</section></div>}
    <button className="mobile-menu" aria-label="Menu"><Menu/></button>
  </div>
}
