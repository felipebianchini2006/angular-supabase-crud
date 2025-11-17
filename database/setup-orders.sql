-- ============================================
-- SCRIPT DE CONFIGURAÇÃO DE PEDIDOS
-- Projeto: Angular Supabase Dashboard
-- ============================================

-- 1. CRIAR TABELA DE PEDIDOS (ORDERS)
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cep TEXT NOT NULL,
  subtotal NUMERIC(10, 2) NOT NULL,
  shipping_cost NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CRIAR TABELA DE ITENS DO PEDIDO (ORDER_ITEMS)
-- ============================================
CREATE TABLE IF NOT EXISTS order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id BIGINT REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_price NUMERIC(10, 2) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  subtotal NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CRIAR ÍNDICES PARA MELHOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- 4. HABILITAR ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- 5. CRIAR POLÍTICAS DE SEGURANÇA PARA ORDERS
-- ============================================

-- Política para SELECT: usuário só vê seus próprios pedidos
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
CREATE POLICY "Users can view their own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

-- Política para INSERT: usuário só pode criar pedidos para si mesmo
DROP POLICY IF EXISTS "Users can create their own orders" ON orders;
CREATE POLICY "Users can create their own orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para UPDATE: usuário pode atualizar apenas seus pedidos
DROP POLICY IF EXISTS "Users can update their own orders" ON orders;
CREATE POLICY "Users can update their own orders" ON orders
  FOR UPDATE USING (auth.uid() = user_id);

-- Política para DELETE: usuário pode deletar apenas seus pedidos
DROP POLICY IF EXISTS "Users can delete their own orders" ON orders;
CREATE POLICY "Users can delete their own orders" ON orders
  FOR DELETE USING (auth.uid() = user_id);

-- 6. CRIAR POLÍTICAS DE SEGURANÇA PARA ORDER_ITEMS
-- ============================================

-- Política para SELECT: usuário vê itens dos seus pedidos
DROP POLICY IF EXISTS "Users can view items of their orders" ON order_items;
CREATE POLICY "Users can view items of their orders" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Política para INSERT: usuário pode adicionar itens aos seus pedidos
DROP POLICY IF EXISTS "Users can create items for their orders" ON order_items;
CREATE POLICY "Users can create items for their orders" ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Política para DELETE: usuário pode deletar itens dos seus pedidos
DROP POLICY IF EXISTS "Users can delete items from their orders" ON order_items;
CREATE POLICY "Users can delete items from their orders" ON order_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- 7. CRIAR FUNÇÃO PARA ATUALIZAR updated_at AUTOMATICAMENTE
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. CRIAR TRIGGER PARA ATUALIZAR updated_at
-- ============================================
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INSTRUÇÕES DE USO
-- ============================================
-- 1. Acesse o painel do Supabase: https://app.supabase.com
-- 2. Selecione seu projeto
-- 3. Vá em "SQL Editor" no menu lateral
-- 4. Cole e execute este script
-- 5. Verifique se as tabelas foram criadas em "Table Editor"
-- ============================================

-- ============================================
-- CONSULTAS ÚTEIS PARA TESTE
-- ============================================

-- Ver todos os pedidos
-- SELECT * FROM orders ORDER BY created_at DESC;

-- Ver todos os itens de pedidos
-- SELECT * FROM order_items ORDER BY created_at DESC;

-- Ver pedidos com seus itens (JOIN)
-- SELECT
--   o.id as order_id,
--   o.created_at,
--   o.total,
--   o.status,
--   oi.product_name,
--   oi.quantity,
--   oi.subtotal
-- FROM orders o
-- LEFT JOIN order_items oi ON o.id = oi.order_id
-- ORDER BY o.created_at DESC;
