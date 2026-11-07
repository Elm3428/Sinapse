import {
  Client,
  Collaborator,
  Product,
  Vehicle,
  WarehouseEntry,
  ServiceOrder,
  SupplyRequisitionRM,
  SupplyApplicationRecord,
  SupplyReturnRecord,
  SupabaseConfig,
  RequisitionItem,
  ApplicationItem,
  ReturnItem,
  WarehouseEntryItem
} from '@/types';
import {
  INITIAL_CLIENTS,
  INITIAL_COLLABORATORS,
  INITIAL_PRODUCTS,
  INITIAL_VEHICLES,
  INITIAL_SERVICE_ORDERS,
  INITIAL_WAREHOUSE_ENTRIES,
  INITIAL_REQUISITIONS_RM,
  INITIAL_APPLICATIONS,
  INITIAL_RETURNS,
  INITIAL_SUPABASE_CONFIG
} from './mockData';

const KEYS = {
  CLIENTS: 'aniel_clients_v2',
  COLLABORATORS: 'aniel_collaborators_v2',
  PRODUCTS: 'aniel_products_v2',
  VEHICLES: 'aniel_vehicles_v2',
  SERVICE_ORDERS: 'aniel_service_orders_v2',
  ENTRIES: 'aniel_entries_v2',
  REQUISITIONS: 'aniel_requisitions_v2',
  APPLICATIONS: 'aniel_applications_v2',
  RETURNS: 'aniel_returns_v2',
  SUPABASE: 'aniel_supabase_cfg_v2',
  INITIALIZED: 'aniel_app_initialized_v2'
};

function safeGet<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (err) {
    console.error(`Erro ao carregar chave ${key}:`, err);
    return defaultValue;
  }
}

function safeSet<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Erro ao salvar chave ${key}:`, err);
  }
}

export const StorageService = {
  // Garante que o app inicie 100% zerado e limpo para o usuário testar com seus próprios dados
  ensureCleanStartup(): void {
    if (typeof window === 'undefined') return;
    try {
      const isInit = localStorage.getItem(KEYS.INITIALIZED);
      if (!isInit) {
        this.clearDatabase();
        localStorage.setItem(KEYS.INITIALIZED, 'true');
        // Limpa chaves legadas de versões anteriores caso existam no navegador
        [
          'aniel_clients_v1',
          'aniel_collaborators_v1',
          'aniel_products_v1',
          'aniel_vehicles_v1',
          'aniel_service_orders_v1',
          'aniel_entries_v1',
          'aniel_requisitions_v1',
          'aniel_applications_v1',
          'aniel_returns_v1',
          'aniel_supabase_cfg_v1'
        ].forEach(k => localStorage.removeItem(k));
      }
    } catch (e) {
      console.warn('Erro ao inicializar banco limpo:', e);
    }
  },

  // Inicialização e Leitura (padrão zerado: [])
  getClients(): Client[] {
    return safeGet<Client[]>(KEYS.CLIENTS, []);
  },
  saveClient(client: Client): Client[] {
    const clients = this.getClients();
    const index = clients.findIndex(c => c.id === client.id);
    let updated: Client[];
    if (index >= 0) {
      updated = [...clients];
      updated[index] = client;
    } else {
      updated = [client, ...clients];
    }
    safeSet(KEYS.CLIENTS, updated);
    return updated;
  },
  deleteClient(id: string): Client[] {
    const clients = this.getClients().filter(c => c.id !== id);
    safeSet(KEYS.CLIENTS, clients);
    return clients;
  },

  getCollaborators(): Collaborator[] {
    return safeGet<Collaborator[]>(KEYS.COLLABORATORS, []);
  },
  saveCollaborator(col: Collaborator): Collaborator[] {
    const cols = this.getCollaborators();
    const index = cols.findIndex(c => c.id === col.id || c.matricola === col.matricola);
    let updated: Collaborator[];
    if (index >= 0) {
      updated = [...cols];
      updated[index] = col;
    } else {
      updated = [col, ...cols];
    }
    safeSet(KEYS.COLLABORATORS, updated);
    return updated;
  },
  deleteCollaborator(id: string): Collaborator[] {
    const cols = this.getCollaborators().filter(c => c.id !== id);
    safeSet(KEYS.COLLABORATORS, cols);
    return cols;
  },

  getProducts(): Product[] {
    return safeGet<Product[]>(KEYS.PRODUCTS, []);
  },
  saveProduct(prod: Product): Product[] {
    const products = this.getProducts();
    const index = products.findIndex(p => p.id === prod.id || p.sku === prod.sku);
    let updated: Product[];
    if (index >= 0) {
      updated = [...products];
      updated[index] = prod;
    } else {
      updated = [prod, ...products];
    }
    safeSet(KEYS.PRODUCTS, updated);
    return updated;
  },
  deleteProduct(id: string): Product[] {
    const prods = this.getProducts().filter(p => p.id !== id);
    safeSet(KEYS.PRODUCTS, prods);
    return prods;
  },

  getVehicles(): Vehicle[] {
    return safeGet<Vehicle[]>(KEYS.VEHICLES, []);
  },
  saveVehicle(veh: Vehicle): Vehicle[] {
    const vehs = this.getVehicles();
    const index = vehs.findIndex(v => v.id === veh.id || v.plate === veh.plate);
    let updated: Vehicle[];
    if (index >= 0) {
      updated = [...vehs];
      updated[index] = veh;
    } else {
      updated = [veh, ...vehs];
    }
    safeSet(KEYS.VEHICLES, updated);
    return updated;
  },
  deleteVehicle(id: string): Vehicle[] {
    const vehs = this.getVehicles().filter(v => v.id !== id);
    safeSet(KEYS.VEHICLES, vehs);
    return vehs;
  },

  getServiceOrders(): ServiceOrder[] {
    return safeGet<ServiceOrder[]>(KEYS.SERVICE_ORDERS, []);
  },
  saveServiceOrder(order: ServiceOrder): ServiceOrder[] {
    const orders = this.getServiceOrders();
    const index = orders.findIndex(o => o.id === order.id);
    let updated: ServiceOrder[];
    if (index >= 0) {
      updated = [...orders];
      updated[index] = order;
    } else {
      updated = [order, ...orders];
    }
    safeSet(KEYS.SERVICE_ORDERS, updated);
    return updated;
  },
  deleteServiceOrder(id: string): ServiceOrder[] {
    const orders = this.getServiceOrders().filter(o => o.id !== id);
    safeSet(KEYS.SERVICE_ORDERS, orders);
    return orders;
  },

  getWarehouseEntries(): WarehouseEntry[] {
    return safeGet<WarehouseEntry[]>(KEYS.ENTRIES, []);
  },

  // 1. Entrada de Insumos no Almoxarifado (+estoque no Almoxarifado)
  addWarehouseEntry(entry: WarehouseEntry): { entries: WarehouseEntry[]; products: Product[] } {
    const entries = [entry, ...this.getWarehouseEntries()];
    safeSet(KEYS.ENTRIES, entries);

    // Incrementa estoque no almoxarifado para cada item
    const products = this.getProducts();
    const updatedProducts = products.map(prod => {
      const match = entry.items.find(i => i.productId === prod.id || i.sku === prod.sku);
      if (match) {
        return {
          ...prod,
          currentStock: prod.currentStock + match.quantity,
          unitCost: match.unitCost > 0 ? match.unitCost : prod.unitCost
        };
      }
      return prod;
    });
    safeSet(KEYS.PRODUCTS, updatedProducts);

    return { entries, products: updatedProducts };
  },

  getRequisitionsRM(): SupplyRequisitionRM[] {
    return safeGet<SupplyRequisitionRM[]>(KEYS.REQUISITIONS, []);
  },

  // 2. Requisição RM: Sai do Almoxarifado e entra na matrícula do colaborador
  processRequisitionRM(rm: SupplyRequisitionRM): {
    requisitions: SupplyRequisitionRM[];
    products: Product[];
    collaborators: Collaborator[];
    success: boolean;
    message?: string;
  } {
    const products = this.getProducts();
    const collaborators = this.getCollaborators();

    // Validação de saldo no almoxarifado
    for (const item of rm.items) {
      const prod = products.find(p => p.id === item.productId || p.sku === item.sku);
      if (!prod) {
        return {
          requisitions: this.getRequisitionsRM(),
          products,
          collaborators,
          success: false,
          message: `Insumo "${item.productName}" não encontrado no Almoxarifado.`
        };
      }
      if (prod.currentStock < item.quantity) {
        return {
          requisitions: this.getRequisitionsRM(),
          products,
          collaborators,
          success: false,
          message: `Saldo insuficiente no Almoxarifado para "${prod.name}". Disponível: ${prod.currentStock} ${prod.unit}, Solicitado: ${item.quantity} ${prod.unit}.`
        };
      }
    }

    // 1) Deduz do Almoxarifado
    const updatedProducts = products.map(prod => {
      const item = rm.items.find(i => i.productId === prod.id || i.sku === prod.sku);
      if (item) {
        return {
          ...prod,
          currentStock: Math.max(0, prod.currentStock - item.quantity)
        };
      }
      return prod;
    });
    safeSet(KEYS.PRODUCTS, updatedProducts);

    // 2) Entra na matrícula do colaborador
    const updatedCollaborators = collaborators.map(col => {
      if (col.matricola === rm.matricola) {
        const custodyMap = new Map(col.custody.map(c => [c.productId, { ...c }]));
        for (const item of rm.items) {
          const current = custodyMap.get(item.productId);
          if (current) {
            current.quantity += item.quantity;
            current.lastUpdated = new Date().toISOString();
          } else {
            custodyMap.set(item.productId, {
              productId: item.productId,
              productName: item.productName,
              sku: item.sku,
              unit: item.unit,
              quantity: item.quantity,
              lastUpdated: new Date().toISOString()
            });
          }
        }
        return {
          ...col,
          custody: Array.from(custodyMap.values())
        };
      }
      return col;
    });
    safeSet(KEYS.COLLABORATORS, updatedCollaborators);

    // 3) Grava o registro da RM
    const requisitions = [rm, ...this.getRequisitionsRM()];
    safeSet(KEYS.REQUISITIONS, requisitions);

    return {
      requisitions,
      products: updatedProducts,
      collaborators: updatedCollaborators,
      success: true
    };
  },

  getApplications(): SupplyApplicationRecord[] {
    return safeGet<SupplyApplicationRecord[]>(KEYS.APPLICATIONS, INITIAL_APPLICATIONS);
  },

  // 3. Aplicação de Insumos: Sai da matrícula do colaborador e aplica no Serviço
  processSupplyApplication(app: SupplyApplicationRecord): {
    applications: SupplyApplicationRecord[];
    collaborators: Collaborator[];
    serviceOrders: ServiceOrder[];
    success: boolean;
    message?: string;
  } {
    const collaborators = this.getCollaborators();
    const serviceOrders = this.getServiceOrders();
    const products = this.getProducts();

    const technician = collaborators.find(c => c.matricola === app.matricola);
    if (!technician) {
      return {
        applications: this.getApplications(),
        collaborators,
        serviceOrders,
        success: false,
        message: `Colaborador com matrícula ${app.matricola} não encontrado.`
      };
    }

    // Valida se o colaborador possui os itens em custódia
    for (const item of app.items) {
      const inCustody = technician.custody.find(c => c.productId === item.productId || c.sku === item.sku);
      if (!inCustody || inCustody.quantity < item.quantity) {
        return {
          applications: this.getApplications(),
          collaborators,
          serviceOrders,
          success: false,
          message: `Saldo insuficiente na matrícula ${app.matricola} para o item "${item.productName}". Em custódia: ${inCustody?.quantity || 0} ${item.unit}.`
        };
      }
    }

    // 1) Sai da matrícula do colaborador
    const updatedCollaborators = collaborators.map(col => {
      if (col.matricola === app.matricola) {
        const updatedCustody = col.custody
          .map(c => {
            const appliedItem = app.items.find(i => i.productId === c.productId || i.sku === c.sku);
            if (appliedItem) {
              return {
                ...c,
                quantity: c.quantity - appliedItem.quantity,
                lastUpdated: new Date().toISOString()
              };
            }
            return c;
          })
          .filter(c => c.quantity > 0.0001); // Limpa itens zerados

        return {
          ...col,
          custody: updatedCustody
        };
      }
      return col;
    });
    safeSet(KEYS.COLLABORATORS, updatedCollaborators);

    // 2) Aplica no Serviço (atualiza appliedSupplies e totalReal da OS)
    const updatedOrders = serviceOrders.map(order => {
      if (order.id === app.serviceOrderId || order.code === app.serviceOrderCode) {
        const newAppliedList = [...order.appliedSupplies];
        for (const item of app.items) {
          const productRef = products.find(p => p.id === item.productId || p.sku === item.sku);
          newAppliedList.push({
            id: `app-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            productId: item.productId,
            productName: item.productName,
            sku: item.sku,
            unit: item.unit,
            quantity: item.quantity,
            appliedDate: app.date,
            matricola: app.matricola,
            technicianName: app.technicianName,
            unitCost: productRef?.unitCost || 0,
            notes: app.notes
          });
        }

        const suppliesCost = newAppliedList.reduce((acc, curr) => acc + (curr.quantity * curr.unitCost), 0);
        const totalReal = order.laborCost + suppliesCost;

        return {
          ...order,
          appliedSupplies: newAppliedList,
          totalReal,
          status: order.status === 'aprovado' || order.status === 'orcamento' ? 'em_execucao' : order.status
        };
      }
      return order;
    });
    safeSet(KEYS.SERVICE_ORDERS, updatedOrders);

    // 3) Registra o histórico da aplicação
    const applications = [app, ...this.getApplications()];
    safeSet(KEYS.APPLICATIONS, applications);

    return {
      applications,
      collaborators: updatedCollaborators,
      serviceOrders: updatedOrders,
      success: true
    };
  },

  getReturns(): SupplyReturnRecord[] {
    return safeGet<SupplyReturnRecord[]>(KEYS.RETURNS, []);
  },

  // 4. Devolução de Insumos: Devolve a sobra não utilizada do colaborador de volta ao almoxarifado
  processSupplyReturn(ret: SupplyReturnRecord): {
    returns: SupplyReturnRecord[];
    collaborators: Collaborator[];
    products: Product[];
    success: boolean;
    message?: string;
  } {
    const collaborators = this.getCollaborators();
    const products = this.getProducts();

    const technician = collaborators.find(c => c.matricola === ret.matricola);
    if (!technician) {
      return {
        returns: this.getReturns(),
        collaborators,
        products,
        success: false,
        message: `Colaborador com matrícula ${ret.matricola} não encontrado.`
      };
    }

    // Valida se o colaborador tem essa quantidade para devolver
    for (const item of ret.items) {
      const inCustody = technician.custody.find(c => c.productId === item.productId || c.sku === item.sku);
      if (!inCustody || inCustody.quantity < item.quantity) {
        return {
          returns: this.getReturns(),
          collaborators,
          products,
          success: false,
          message: `Colaborador não possui saldo suficiente em custódia para devolver "${item.productName}". Em custódia: ${inCustody?.quantity || 0} ${item.unit}.`
        };
      }
    }

    // 1) Sai da matrícula do colaborador
    const updatedCollaborators = collaborators.map(col => {
      if (col.matricola === ret.matricola) {
        const updatedCustody = col.custody
          .map(c => {
            const returnedItem = ret.items.find(i => i.productId === c.productId || i.sku === c.sku);
            if (returnedItem) {
              return {
                ...c,
                quantity: c.quantity - returnedItem.quantity,
                lastUpdated: new Date().toISOString()
              };
            }
            return c;
          })
          .filter(c => c.quantity > 0.0001);

        return {
          ...col,
          custody: updatedCustody
        };
      }
      return col;
    });
    safeSet(KEYS.COLLABORATORS, updatedCollaborators);

    // 2) Retorna ao estoque central do Almoxarifado (se estiver perfeito ou em revisão aceita)
    const updatedProducts = products.map(prod => {
      const returnedItem = ret.items.find(i => i.productId === prod.id || i.sku === prod.sku);
      if (returnedItem && returnedItem.condition !== 'avariado') {
        return {
          ...prod,
          currentStock: prod.currentStock + returnedItem.quantity
        };
      }
      return prod;
    });
    safeSet(KEYS.PRODUCTS, updatedProducts);

    // 3) Grava o registro da devolução
    const returns = [ret, ...this.getReturns()];
    safeSet(KEYS.RETURNS, returns);

    return {
      returns,
      collaborators: updatedCollaborators,
      products: updatedProducts,
      success: true
    };
  },

  // Configuração Supabase
  getSupabaseConfig(): SupabaseConfig {
    return safeGet<SupabaseConfig>(KEYS.SUPABASE, {
      url: '',
      anonKey: '',
      dbName: 'aniel',
      isConnected: false,
      autoSync: true,
    });
  },
  saveSupabaseConfig(config: SupabaseConfig): SupabaseConfig {
    safeSet(KEYS.SUPABASE, config);
    return config;
  },

  // Zerar completamente o banco de dados para testes limpos
  clearDatabase(): void {
    safeSet(KEYS.CLIENTS, []);
    safeSet(KEYS.COLLABORATORS, []);
    safeSet(KEYS.PRODUCTS, []);
    safeSet(KEYS.VEHICLES, []);
    safeSet(KEYS.SERVICE_ORDERS, []);
    safeSet(KEYS.ENTRIES, []);
    safeSet(KEYS.REQUISITIONS, []);
    safeSet(KEYS.APPLICATIONS, []);
    safeSet(KEYS.RETURNS, []);
    safeSet(KEYS.SUPABASE, {
      url: '',
      anonKey: '',
      dbName: 'aniel',
      isConnected: false,
      autoSync: true,
    });
  },

  // Carregar dados de demonstração (caso o usuário queira consultar exemplos)
  loadDemoData(): void {
    safeSet(KEYS.CLIENTS, INITIAL_CLIENTS);
    safeSet(KEYS.COLLABORATORS, INITIAL_COLLABORATORS);
    safeSet(KEYS.PRODUCTS, INITIAL_PRODUCTS);
    safeSet(KEYS.VEHICLES, INITIAL_VEHICLES);
    safeSet(KEYS.SERVICE_ORDERS, INITIAL_SERVICE_ORDERS);
    safeSet(KEYS.ENTRIES, INITIAL_WAREHOUSE_ENTRIES);
    safeSet(KEYS.REQUISITIONS, INITIAL_REQUISITIONS_RM);
    safeSet(KEYS.APPLICATIONS, INITIAL_APPLICATIONS);
    safeSet(KEYS.RETURNS, INITIAL_RETURNS);
    safeSet(KEYS.SUPABASE, INITIAL_SUPABASE_CONFIG);
  },

  resetToInitialData(): void {
    this.clearDatabase();
  },

  exportDatabaseJson(): string {
    return JSON.stringify({
      clients: this.getClients(),
      collaborators: this.getCollaborators(),
      products: this.getProducts(),
      vehicles: this.getVehicles(),
      serviceOrders: this.getServiceOrders(),
      warehouseEntries: this.getWarehouseEntries(),
      requisitionsRM: this.getRequisitionsRM(),
      applications: this.getApplications(),
      returns: this.getReturns(),
      supabaseConfig: this.getSupabaseConfig(),
      exportedAt: new Date().toISOString()
    }, null, 2);
  },

  // Gerador de SQL para o banco de dados Supabase "aniel"
  generateSupabaseSQL(): string {
    return `-- =====================================================================
-- SCHEMA OFICIAL SUPABASE - BANCO DE DADOS: aniel
-- Sistema Integrado de Gestão de Serviços, Almoxarifado e Insumos
-- =====================================================================

-- 1. Habilitar UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela de Clientes
CREATE TABLE IF NOT EXISTS public.clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    documento VARCHAR(30) NOT NULL UNIQUE,
    email VARCHAR(150),
    telefone VARCHAR(50),
    endereco TEXT,
    cidade VARCHAR(100),
    estado VARCHAR(2),
    segmento VARCHAR(100),
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabela de Veículos
CREATE TABLE IF NOT EXISTS public.veiculos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    placa VARCHAR(10) NOT NULL UNIQUE,
    marca VARCHAR(50) NOT NULL,
    modelo VARCHAR(100) NOT NULL,
    ano INT,
    km_atual INT DEFAULT 0,
    matricola_responsavel VARCHAR(50),
    status VARCHAR(30) DEFAULT 'disponivel',
    tipo_combustivel VARCHAR(30),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabela de Colaboradores (com Matrícula)
CREATE TABLE IF NOT EXISTS public.colaboradores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matricola VARCHAR(50) NOT NULL UNIQUE,
    nome VARCHAR(255) NOT NULL,
    cargo VARCHAR(100) NOT NULL,
    departamento VARCHAR(100),
    telefone VARCHAR(50),
    email VARCHAR(150),
    veiculo_id VARCHAR(50),
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Tabela de Produtos e Insumos (Almoxarifado Central)
CREATE TABLE IF NOT EXISTS public.produtos_insumos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku VARCHAR(50) NOT NULL UNIQUE,
    nome VARCHAR(255) NOT NULL,
    categoria VARCHAR(100),
    unidade VARCHAR(10) NOT NULL,
    estoque_almoxarifado NUMERIC(12, 2) DEFAULT 0 NOT NULL,
    estoque_minimo NUMERIC(12, 2) DEFAULT 0 NOT NULL,
    custo_unitario NUMERIC(12, 2) DEFAULT 0 NOT NULL,
    preco_venda NUMERIC(12, 2) DEFAULT 0 NOT NULL,
    localizacao VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Tabela de Custódia de Insumos por Matrícula
CREATE TABLE IF NOT EXISTS public.custodia_colaborador (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matricola VARCHAR(50) REFERENCES public.colaboradores(matricola) ON DELETE CASCADE,
    produto_id UUID REFERENCES public.produtos_insumos(id) ON DELETE RESTRICT,
    quantidade NUMERIC(12, 2) NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(matricola, produto_id)
);

-- 7. Tabela de Entradas de Insumos (Almoxarifado)
CREATE TABLE IF NOT EXISTS public.entradas_almoxarifado (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_entrada VARCHAR(50) NOT NULL UNIQUE,
    nota_fiscal VARCHAR(100) NOT NULL,
    fornecedor VARCHAR(255) NOT NULL,
    valor_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
    recebido_por_matricola VARCHAR(50),
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Tabela de Ordens de Serviço e Orçamentos
CREATE TABLE IF NOT EXISTS public.ordens_servico (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(50) NOT NULL UNIQUE,
    cliente_id UUID REFERENCES public.clientes(id),
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    data_agendada DATE,
    hora_agendada TIME,
    matricola_responsavel VARCHAR(50) REFERENCES public.colaboradores(matricola),
    placa_veiculo VARCHAR(10),
    status VARCHAR(30) DEFAULT 'orcamento',
    valor_mao_de_obra NUMERIC(12, 2) DEFAULT 0,
    total_estimado NUMERIC(12, 2) DEFAULT 0,
    total_real NUMERIC(12, 2) DEFAULT 0,
    data_conclusao TIMESTAMP WITH TIME ZONE,
    observacoes_conclusao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Tabela de Requisições RM (Almoxarifado -> Matrícula)
CREATE TABLE IF NOT EXISTS public.requisicoes_rm (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_rm VARCHAR(50) NOT NULL UNIQUE,
    matricola VARCHAR(50) REFERENCES public.colaboradores(matricola),
    ordem_servico_id UUID REFERENCES public.ordens_servico(id),
    dispensado_por VARCHAR(100),
    status VARCHAR(30) DEFAULT 'retirado',
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Tabela de Aplicação de Insumos (Matrícula -> Serviço)
CREATE TABLE IF NOT EXISTS public.aplicacoes_servico (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_aplicacao VARCHAR(50) NOT NULL UNIQUE,
    matricola VARCHAR(50) REFERENCES public.colaboradores(matricola),
    ordem_servico_id UUID REFERENCES public.ordens_servico(id),
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. Tabela de Devoluções de Sobras (Matrícula -> Almoxarifado)
CREATE TABLE IF NOT EXISTS public.devolucoes_almoxarifado (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_devolucao VARCHAR(50) NOT NULL UNIQUE,
    matricola VARCHAR(50) REFERENCES public.colaboradores(matricola),
    ordem_servico_id UUID REFERENCES public.ordens_servico(id),
    recebido_por VARCHAR(100),
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. Row Level Security (RLS) habilitada para o projeto aniel
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colaboradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos_insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordens_servico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requisicoes_rm ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aplicacoes_servico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devolucoes_almoxarifado ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso público para demonstração/desenvolvimento
CREATE POLICY "Permitir leitura geral clientes" ON public.clientes FOR SELECT USING (true);
CREATE POLICY "Permitir insercao clientes" ON public.clientes FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualizacao clientes" ON public.clientes FOR UPDATE USING (true);

CREATE POLICY "Permitir leitura insumos" ON public.produtos_insumos FOR SELECT USING (true);
CREATE POLICY "Permitir leitura colaboradores" ON public.colaboradores FOR SELECT USING (true);
CREATE POLICY "Permitir leitura ordens_servico" ON public.ordens_servico FOR SELECT USING (true);
`;
  }
};
