import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.use(cors());

// Middleware para Webhook do Stripe (precisa do body bruto antes do express.json())
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const customerId = session.customer;
    const subscriptionId = session.subscription;
    const userEmail = session.customer_details.email;

    await prisma.usuario.update({
      where: { email: userEmail },
      data: {
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        status_assinatura: 'active'
      }
    });
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object;
    await prisma.usuario.update({
      where: { stripe_subscription_id: subscription.id },
      data: { status_assinatura: 'canceled' }
    });
  }

  res.json({ received: true });
});

app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// === MIDDLEWARES ===
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token não fornecido' });
  try {
    const decodificado = jwt.verify(token, JWT_SECRET);
    req.usuario_id = decodificado.id;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

const checkSubscription = async (req, res, next) => {
  const usuario = await prisma.usuario.findUnique({ where: { id: req.usuario_id } });
  if (usuario?.status_assinatura !== 'active') {
    return res.status(403).json({ error: 'Assinatura pendente ou inativa no servidor', needsPayment: true });
  }
  next();
};

// === ROTAS AUTENTICAÇÃO & CORE ===
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    const existente = await prisma.usuario.findUnique({ where: { email } });
    if (existente) return res.status(400).json({ error: 'Email já cadastrado' });

    const senha_hash = await bcrypt.hash(password, 10);
    const usuario = await prisma.usuario.create({
      data: { email, senha_hash, status_assinatura: 'inactive' }
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [{ price: 'price_1TH6z3KH8XvYCkZhonElPuR3', quantity: 1 }],
      mode: 'subscription',
      success_url: `${process.env.CLIENT_URL}/dashboard?checkout=success`,
      cancel_url: `${process.env.CLIENT_URL}/signup?checkout=cancel`,
    });

    res.json({ sessionUrl: session.url });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao iniciar cadastro/pagamento' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const usuario = await prisma.usuario.findUnique({ where: { email } });
    if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado' });

    const validSenha = await bcrypt.compare(password, usuario.senha_hash);
    if (!validSenha) return res.status(401).json({ error: 'Senha incorreta' });

    const token = jwt.sign({ id: usuario.id, status: usuario.status_assinatura }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, email: usuario.email, status: usuario.status_assinatura });
  } catch (error) {
    res.status(500).json({ error: 'Erro no login' });
  }
});

// === ROTAS DE MARKETPLACES ===
app.get('/api/marketplaces', authenticate, checkSubscription, async (req, res) => {
  try {
    let marketplaces = await prisma.marketplaceConfig.findMany({ where: { usuario_id: req.usuario_id } });
    const formatado = marketplaces.map(m => ({
      id: m.id, nome: m.nome, cor: m.cor_indicador,
      taxaComissao: Number(m.taxa_comissao), taxaFixa: Number(m.taxa_fixa), 
      taxaAds: Number(m.taxa_ads), unidadeAds: m.unidade_ads,
      taxaExtra: Number(m.taxa_extra), unidadeExtra: m.unidade_extra, 
      imposto: Number(m.imposto), unidadeImposto: m.unidade_imposto
    }));
    res.json(formatado);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar configurações' });
  }
});

app.post('/api/marketplaces', authenticate, checkSubscription, async (req, res) => {
  try {
    const configs = req.body;
    await prisma.marketplaceConfig.deleteMany({ where: { usuario_id: req.usuario_id } });
    await prisma.marketplaceConfig.createMany({
      data: configs.map(c => ({
        usuario_id: req.usuario_id, nome: c.nome, cor_indicador: c.cor,
        taxa_comissao: c.taxaComissao || 0, taxa_fixa: c.taxaFixa || 0,
        taxa_ads: c.taxaAds || 0, unidade_ads: c.unidadeAds,
        taxa_extra: c.taxaExtra || 0, unidade_extra: c.unidadeExtra,
        imposto: c.imposto || 0, unidade_imposto: c.unidadeImposto || '%'
      }))
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao salvar marketplaces' });
  }
});

// === ROTAS DE PRESETS ===
app.get('/api/presets', authenticate, checkSubscription, async (req, res) => {
  try {
    const presets = await prisma.modeloPreset.findMany({
      where: { usuario_id: req.usuario_id },
      include: { itens: true }
    });
    const formatado = presets.map(p => ({
      id: p.id,
      nome: p.nome_modelo,
      itens: p.itens.map(i => ({
        nome: i.nome_item,
        valor_padrao: Number(i.valor_padrao),
        categoria: i.categoria
      }))
    }));
    res.json(formatado);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar modelos' });
  }
});

app.post('/api/presets', authenticate, checkSubscription, async (req, res) => {
  try {
    const { id, nome, itens } = req.body;
    
    if (id) {
       // Se tem ID, é uma edição
       // Apaga itens antigos
       const presetExistente = await prisma.modeloPreset.findFirst({
          where: { id: parseInt(id), usuario_id: req.usuario_id }
       });
       
       if(!presetExistente) return res.status(404).json({error: 'Modelo não existe'});
       
       await prisma.modeloItem.deleteMany({ where: { modelo_id: parseInt(id) }});
       
       const atualizado = await prisma.modeloPreset.update({
          where: { id: parseInt(id) },
          data: {
              nome_modelo: nome,
              itens: {
                  create: itens.map(i => ({ 
                      nome_item: i.nome, 
                      valor_padrao: parseFloat(i.valor) || 0,
                      categoria: i.categoria || 'materia_prima'
                  }))
              }
          },
          include: { itens: true }
       });
       return res.json({ 
           id: atualizado.id, 
           nome: atualizado.nome_modelo, 
           itens: atualizado.itens.map(i => ({ nome: i.nome_item, valor_padrao: Number(i.valor_padrao), categoria: i.categoria })) 
       });
    }

    // Criar novo modelo
    const novo = await prisma.modeloPreset.create({
      data: {
        usuario_id: req.usuario_id,
        nome_modelo: nome,
        itens: {
          create: itens.map(i => ({ 
              nome_item: i.nome, 
              valor_padrao: parseFloat(i.valor) || 0,
              categoria: i.categoria || 'materia_prima'
          }))
        }
      },
      include: { itens: true }
    });
    res.json({ 
        id: novo.id, 
        nome: novo.nome_modelo, 
        itens: novo.itens.map(i => ({ nome: i.nome_item, valor_padrao: Number(i.valor_padrao), categoria: i.categoria })) 
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar ou atualizar modelo' });
  }
});

app.delete('/api/presets/:id', authenticate, checkSubscription, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    // Deleta os itens do modelo primeiro (garante exclusão se o cascade do banco falhar)
    await prisma.modeloItem.deleteMany({ where: { modelo_id: id } });
    
    // Agora deleta o modelo (vinculado ao usuario para segurança)
    await prisma.modeloPreset.deleteMany({
      where: { id, usuario_id: req.usuario_id }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar modelo' });
  }
});

// === ROTAS DE PRODUTOS ===
app.get('/api/produtos', authenticate, checkSubscription, async (req, res) => {
  try {
    const produtos = await prisma.produto.findMany({
      where: { usuario_id: req.usuario_id },
      include: { itens_custo: { orderBy: { ordem: 'asc' } } },
      orderBy: { atualizado_em: 'desc' }
    });
    const formatado = produtos.map(p => ({
      id: p.id,
      nome: p.nome,
      imposto: Number(p.imposto_padrao),
      itens: p.itens_custo.map(i => ({
        id: i.id,
        nome: i.nome,
        valor: Number(i.valor),
        unidade: i.unidade,
        categoria: i.categoria
      }))
    }));
    res.json(formatado);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
});

app.post('/api/produtos', authenticate, checkSubscription, async (req, res) => {
  try {
    const { id, nome, imposto, itens } = req.body;
    
    if (id) {
        // Atualizar produto existente
        // Apaga itens antigos
        await prisma.produtoItemCusto.deleteMany({ where: { produto_id: parseInt(id) } });

        const atualizado = await prisma.produto.update({
            where: { id: parseInt(id), usuario_id: req.usuario_id },
            data: {
                nome: nome || 'Produto sem nome',
                imposto_padrao: parseFloat(imposto) || 0,
                itens_custo: {
                    create: itens.map((i, index) => ({
                        nome: i.nome || '',
                        valor: parseFloat(i.valor) || 0,
                        unidade: i.unidade || 'R$',
                        categoria: i.categoria || 'materia_prima',
                        ordem: index
                    }))
                }
            }
        });
        return res.json({ success: true, id: atualizado.id });
    }

    const novo = await prisma.produto.create({
      data: {
        usuario_id: req.usuario_id,
        nome: nome || 'Produto sem nome',
        imposto_padrao: parseFloat(imposto) || 0,
        itens_custo: {
          create: itens.map((i, index) => ({
            nome: i.nome || '',
            valor: parseFloat(i.valor) || 0,
            unidade: i.unidade || 'R$',
            categoria: i.categoria || 'materia_prima',
            ordem: index
          }))
        }
      }
    });
    res.json({ success: true, id: novo.id });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao salvar produto' });
  }
});

app.delete('/api/produtos/:id', authenticate, checkSubscription, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    // Deleta os itens de custo primeiro
    await prisma.produtoItemCusto.deleteMany({ where: { produto_id: id } });
    
    // Deleta o produto
    await prisma.produto.deleteMany({
      where: { id, usuario_id: req.usuario_id }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar produto' });
  }
});

// === ROTAS DE DASHBOARD ===
app.get('/api/dashboard/stats', authenticate, checkSubscription, async (req, res) => {
  try {
    const produtos = await prisma.produto.findMany({ where: { usuario_id: req.usuario_id }, include: { itens_custo: true } });
    let totalCusto = 0; let maior = { nome: '', valor: 0 };
    const items = produtos.map(p => {
      let custo = 0;
      p.itens_custo.forEach(i => { if (Number(i.valor) > 0 && i.unidade === 'R$' && !i.nome.toUpperCase().includes('LUCRO')) custo += Number(i.valor); });
      totalCusto += custo;
      if (custo > maior.valor) maior = { nome: p.nome, valor: custo };
      const lucroObj = p.itens_custo.find(i => i.nome.toUpperCase().includes('LUCRO'));
      return { id: p.id, nome: p.nome, custo_base: custo, lucro_desejado: lucroObj ? Number(lucroObj.valor) : 0, unidade_lucro: lucroObj ? lucroObj.unidade : 'R$', data_criacao: p.criado_em };
    });
    res.json({ totalProdutos: items.length, custoMedio: items.length ? totalCusto / items.length : 0, maiorCusto: maior, ultimosProdutos: items.slice(0, 5) });
  } catch (error) {
    res.status(500).json({ error: 'Erro no dashboard' });
  }
});

export default app;
