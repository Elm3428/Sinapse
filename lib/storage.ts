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
  WarehouseEntryItem,
  CustodyItem
} from '@/types';
import {
  QTY_EPSILON,
  roundQty,
  isTrackedItem,
  originKey,
  custodyQuantity,
  nextSequentialCode,
  buildRMTrace,
  auditSupplyIntegrity,
  getOriginBalances as computeOriginBalances,
  OriginBalance,
  ItemTrace,
  IntegrityReport
} from './supplyTrace';
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

// ---------------------------------------------------------------------------
// Regras de movimentação de insumos (RM → custódia → aplicação → devolução)
// ---------------------------------------------------------------------------

type KeyedWrite = [key: string, value: unknown];

/**
 * Grava várias chaves como uma única operação: se alguma gravação falhar
 * (por exemplo, cota do navegador cheia), todas voltam ao valor anterior.
 */
function commitAll(entries: KeyedWrite[]): { ok: boolean; error?: string } {
  if (typeof window === 'undefined') return { ok: false, error: 'Armazenamento indisponível neste ambiente.' };
  let snapshot: Array<[string, string | null]> = [];
  try {
    snapshot = entries.map(([key]) => [key, localStorage.getItem(key)] as [string, string | null]);
    for (const [key, value] of entries) localStorage.setItem(key, JSON.stringify(value));
    return { ok: true };
  } catch (err) {
    for (const [key, raw] of snapshot) {
      try {
        if (raw === null) localStorage.removeItem(key);
        else localStorage.setItem(key, raw);
      } catch {
        // melhor esforço: nada mais a fazer se o restauro também falhar
      }
    }
    return { ok: false, error: err instanceof Error ? err.message : 'Falha ao gravar no armazenamento.' };
  }
}

const OS_CLOSED: ServiceOrder['status'][] = ['concluido', 'cancelado'];
const RETURN_CONDITIONS: ReturnItem['condition'][] = ['perfeito', 'revisao', 'avariado'];
// Janela em que um lançamento idêntico é tratado como duplo clique / reenvio
const DUPLICATE_WINDOW_MS = 15_000;

function toIsoDate(value: string | undefined): string {
  const t = value ? Date.parse(value) : NaN;
  return Number.isFinite(t) ? new Date(t).toISOString() : new Date().toISOString();
}

function resolveProduct(products: Product[], ref: { productId?: string; sku?: string }): Product | undefined {
  return products.find((p) => p.id === ref.productId) || (ref.sku ? products.find((p) => p.sku === ref.sku) : undefined);
}

function uniqueCode(prefix: string, wanted: string | undefined, used: string[], year: number): string {
  if (wanted && !used.includes(wanted)) return wanted;
  return nextSequentialCode(prefix, used, year);
}

/** Retira `qty` da custódia, consumindo as linhas do produto em ordem. */
function consumeCustody(custody: CustodyItem[], productId: string, qty: number, nowIso: string): CustodyItem[] {
  let left = qty;
  const next = custody.map((c) => {
    if (c.productId !== productId || left <= QTY_EPSILON) return c;
    const take = Math.min(c.quantity, left);
    left = roundQty(left - take);
    return { ...c, quantity: roundQty(c.quantity - take), lastUpdated: nowIso };
  });
  return next.filter((c) => c.quantity > QTY_EPSILON);
}

type OriginLine = ApplicationItem & { condition?: ReturnItem['condition'] };

interface ResolvedLine {
  key: string;
  origin: 'rm' | 'legado';
  rmId?: string;
  rmNumber?: string;
  rmItemId?: string;
  productId: string;
  productName: string;
  sku: string;
  unit: string;
  quantity: number;
  condition?: ReturnItem['condition'];
}

/**
 * Valida cada linha contra a origem informada (item de RM ou saldo legado) e soma
 * linhas repetidas. Devolve as linhas já normalizadas ou a primeira mensagem de erro.
 * Os dados de produto e de RM vêm do armazenamento, nunca do que a tela enviou.
 */
function resolveOriginLines(
  lines: OriginLine[],
  collaborator: Collaborator,
  requisitions: SupplyRequisitionRM[],
  opts: { order?: ServiceOrder; requireCondition: boolean }
): { error?: string; lines: ResolvedLine[] } {
  if (!Array.isArray(lines) || lines.length === 0) return { error: 'Informe ao menos um item.', lines: [] };

  const balances = computeOriginBalances(collaborator, requisitions);
  const byKey = new Map(balances.map((b) => [b.key, b]));
  const merged = new Map<string, ResolvedLine>();

  for (const line of lines) {
    const qty = Number(line.quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      return { error: `Quantidade inválida para "${line.productName}". Informe um valor maior que zero.`, lines: [] };
    }
    let condition: ReturnItem['condition'] | undefined;
    if (opts.requireCondition) {
      condition = line.condition;
      if (!condition || !RETURN_CONDITIONS.includes(condition)) {
        return { error: `Informe a condição de "${line.productName}" (perfeito, revisão ou avariado).`, lines: [] };
      }
    }

    let resolved: ResolvedLine;
    if (line.origin === 'legado') {
      const inCustody = collaborator.custody.find((c) => c.productId === line.productId);
      if (!inCustody) {
        return { error: `"${line.productName}" não está na custódia da matrícula ${collaborator.matricola}.`, lines: [] };
      }
      resolved = {
        key: originKey(undefined, undefined, inCustody.productId),
        origin: 'legado',
        productId: inCustody.productId,
        productName: inCustody.productName,
        sku: inCustody.sku,
        unit: inCustody.unit,
        quantity: 0,
      };
    } else {
      if (!line.rmId || !line.rmItemId) {
        return {
          error: `O item "${line.productName}" está sem vínculo com a RM de origem. Selecione a RM de onde o material veio.`,
          lines: [],
        };
      }
      const rm = requisitions.find((r) => r.id === line.rmId);
      if (!rm) return { error: `RM de origem do item "${line.productName}" não encontrada.`, lines: [] };
      if (rm.matricola !== collaborator.matricola) {
        return {
          error: `A ${rm.rmNumber} pertence à matrícula ${rm.matricola} e não pode ser usada pela matrícula ${collaborator.matricola}.`,
          lines: [],
        };
      }
      const item = rm.items.find((i) => isTrackedItem(i) && i.itemId === line.rmItemId);
      if (!item) return { error: `Item "${line.productName}" não encontrado na ${rm.rmNumber}.`, lines: [] };
      if (line.productId && line.productId !== item.productId) {
        return { error: `O produto informado não corresponde ao item da ${rm.rmNumber}.`, lines: [] };
      }
      if (opts.order && rm.serviceOrderId && rm.serviceOrderId !== opts.order.id) {
        return {
          error: `O material da ${rm.rmNumber} foi retirado para ${rm.serviceOrderCode || rm.serviceOrderId} e não pode ser aplicado em ${opts.order.code}.`,
          lines: [],
        };
      }
      resolved = {
        key: originKey(rm.id, item.itemId, item.productId),
        origin: 'rm',
        rmId: rm.id,
        rmNumber: rm.rmNumber,
        rmItemId: item.itemId,
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        unit: item.unit,
        quantity: 0,
      };
    }

    const mergeKey = `${resolved.key}#${condition || ''}`;
    const existing = merged.get(mergeKey);
    if (existing) existing.quantity = roundQty(existing.quantity + qty);
    else merged.set(mergeKey, { ...resolved, quantity: roundQty(qty), condition });
  }

  const resolvedLines = Array.from(merged.values());

  // Saldo por origem (somando linhas da mesma origem com condições diferentes)
  const perOrigin = new Map<string, number>();
  for (const r of resolvedLines) perOrigin.set(r.key, roundQty((perOrigin.get(r.key) || 0) + r.quantity));
  for (const [key, total] of perOrigin) {
    const ref = resolvedLines.find((r) => r.key === key)!;
    const available = byKey.get(key)?.remaining || 0;
    if (total > available + QTY_EPSILON) {
      const where = ref.origin === 'rm' ? `na ${ref.rmNumber}` : 'no saldo anterior ao controle por RM';
      return {
        error: `Saldo insuficiente ${where} para "${ref.productName}": restante ${available} ${ref.unit}, informado ${total} ${ref.unit}.`,
        lines: [],
      };
    }
  }

  // Trava final: a soma por produto nunca passa da custódia da matrícula
  const perProduct = new Map<string, number>();
  for (const r of resolvedLines) perProduct.set(r.productId, roundQty((perProduct.get(r.productId) || 0) + r.quantity));
  for (const [productId, total] of perProduct) {
    const inCustody = custodyQuantity(collaborator, productId);
    if (total > inCustody + QTY_EPSILON) {
      const ref = resolvedLines.find((r) => r.productId === productId)!;
      return {
        error: `Saldo insuficiente na matrícula ${collaborator.matricola} para "${ref.productName}". Em custódia: ${inCustody} ${ref.unit}.`,
        lines: [],
      };
    }
  }

  return { lines: resolvedLines };
}

/** Assinatura de um lançamento, usada para barrar reenvio idêntico em sequência. */
function linesSignature(lines: Array<{ key: string; quantity: number; condition?: string }>): string {
  return lines
    .map((l) => `${l.key}=${l.quantity}${l.condition ? `:${l.condition}` : ''}`)
    .sort()
    .join('|');
}

function recordLinesSignature(items: Array<ApplicationItem | ReturnItem>): string {
  return linesSignature(
    items.map((i) => ({
      key: originKey(i.rmId, i.rmItemId, i.productId),
      quantity: roundQty(i.quantity),
      condition: (i as ReturnItem).condition,
    }))
  );
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

  // 2. Requisição RM: Sai do Almoxarifado e entra na matrícula do colaborador.
  // Cada item da RM passa a ter controle próprio (requisitado, aplicado, devolvido).
  processRequisitionRM(rm: SupplyRequisitionRM): {
    requisitions: SupplyRequisitionRM[];
    products: Product[];
    collaborators: Collaborator[];
    success: boolean;
    message?: string;
  } {
    const products = this.getProducts();
    const collaborators = this.getCollaborators();
    const requisitions = this.getRequisitionsRM();
    const serviceOrders = this.getServiceOrders();
    const fail = (message: string) => ({ requisitions, products, collaborators, success: false, message });

    if (!rm || !rm.id) return fail('Requisição inválida: identificador ausente.');
    if (requisitions.some((r) => r.id === rm.id)) {
      return fail(`A requisição ${rm.rmNumber} já foi registrada. Nada foi movimentado novamente.`);
    }

    const collaborator = collaborators.find((c) => c.matricola === rm.matricola);
    if (!collaborator) return fail(`Colaborador com matrícula ${rm.matricola} não encontrado.`);

    let order: ServiceOrder | undefined;
    if (rm.serviceOrderId || rm.serviceOrderCode) {
      order = serviceOrders.find((o) =>
        rm.serviceOrderId ? o.id === rm.serviceOrderId : o.code === rm.serviceOrderCode
      );
      if (!order) return fail('A Ordem de Serviço vinculada à requisição não foi encontrada.');
      if (OS_CLOSED.includes(order.status)) {
        return fail(`A ${order.code} está ${order.status === 'concluido' ? 'concluída' : 'cancelada'} e não pode receber requisição de material.`);
      }
    }

    if (!Array.isArray(rm.items) || rm.items.length === 0) return fail('A requisição precisa de ao menos um insumo.');

    // Normaliza os itens: dados do produto vêm do cadastro e linhas repetidas são somadas
    const wanted = new Map<string, { product: Product; quantity: number }>();
    for (const item of rm.items) {
      const qty = Number(item.quantity);
      if (!Number.isFinite(qty) || qty <= 0) {
        return fail(`Quantidade inválida para "${item.productName}". Informe um valor maior que zero.`);
      }
      const product = resolveProduct(products, item);
      if (!product) return fail(`Insumo "${item.productName}" não encontrado no Almoxarifado.`);
      const current = wanted.get(product.id);
      wanted.set(product.id, { product, quantity: roundQty((current?.quantity || 0) + qty) });
    }

    for (const { product, quantity } of wanted.values()) {
      if (product.currentStock + QTY_EPSILON < quantity) {
        return fail(
          `Saldo insuficiente no Almoxarifado para "${product.name}". Disponível: ${product.currentStock} ${product.unit}, Solicitado: ${quantity} ${product.unit}.`
        );
      }
    }

    const nowIso = new Date().toISOString();
    const date = toIsoDate(rm.date);
    const year = new Date(date).getFullYear();

    // 1) Deduz do Almoxarifado (já validado: nunca fica negativo)
    const updatedProducts = products.map((p) => {
      const w = wanted.get(p.id);
      return w ? { ...p, currentStock: roundQty(p.currentStock - w.quantity) } : p;
    });

    // 2) Entra na matrícula do colaborador
    const updatedCollaborators = collaborators.map((col) => {
      if (col.matricola !== collaborator.matricola) return col;
      const custody = col.custody.map((c) => ({ ...c }));
      for (const { product, quantity } of wanted.values()) {
        const current = custody.find((c) => c.productId === product.id);
        if (current) {
          current.quantity = roundQty(current.quantity + quantity);
          current.lastUpdated = nowIso;
        } else {
          custody.push({
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            unit: product.unit,
            quantity,
            lastUpdated: nowIso,
          });
        }
      }
      return { ...col, custody };
    });

    // 3) Grava a RM com o controle por item
    const items: RequisitionItem[] = Array.from(wanted.values()).map(({ product, quantity }, index) => ({
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      unit: product.unit,
      quantity,
      itemId: `${rm.id}-it${index + 1}`,
      appliedQuantity: 0,
      returnedQuantity: 0,
    }));
    const record: SupplyRequisitionRM = {
      ...rm,
      rmNumber: uniqueCode('RM', rm.rmNumber, requisitions.map((r) => r.rmNumber), year),
      date,
      technicianName: collaborator.name,
      serviceOrderId: order?.id,
      serviceOrderCode: order?.code,
      items,
      status: rm.status || 'retirado',
    };
    const updatedRequisitions = [record, ...requisitions];

    const saved = commitAll([
      [KEYS.PRODUCTS, updatedProducts],
      [KEYS.COLLABORATORS, updatedCollaborators],
      [KEYS.REQUISITIONS, updatedRequisitions],
    ]);
    if (!saved.ok) return fail(`Não foi possível gravar a requisição. Nenhum saldo foi alterado. (${saved.error})`);

    return {
      requisitions: updatedRequisitions,
      products: updatedProducts,
      collaborators: updatedCollaborators,
      success: true,
    };
  },

  getApplications(): SupplyApplicationRecord[] {
    return safeGet<SupplyApplicationRecord[]>(KEYS.APPLICATIONS, INITIAL_APPLICATIONS);
  },

  // 3. Aplicação de Insumos: baixa o item da RM de origem, baixa a custódia da matrícula
  // e registra o consumo na OS, tudo em uma única gravação.
  processSupplyApplication(app: SupplyApplicationRecord): {
    applications: SupplyApplicationRecord[];
    collaborators: Collaborator[];
    serviceOrders: ServiceOrder[];
    requisitions: SupplyRequisitionRM[];
    success: boolean;
    message?: string;
  } {
    const collaborators = this.getCollaborators();
    const serviceOrders = this.getServiceOrders();
    const products = this.getProducts();
    const requisitions = this.getRequisitionsRM();
    const applications = this.getApplications();
    const fail = (message: string) => ({ applications, collaborators, serviceOrders, requisitions, success: false, message });

    if (!app || !app.id) return fail('Aplicação inválida: identificador ausente.');
    if (applications.some((a) => a.id === app.id)) {
      return fail('Esta aplicação já foi registrada. Nada foi movimentado novamente.');
    }

    const technician = collaborators.find((c) => c.matricola === app.matricola);
    if (!technician) return fail(`Colaborador com matrícula ${app.matricola} não encontrado.`);

    const order = serviceOrders.find((o) => o.id === app.serviceOrderId);
    if (!order) return fail('Ordem de Serviço não encontrada. Selecione uma OS válida.');
    if (OS_CLOSED.includes(order.status)) {
      return fail(`A ${order.code} está ${order.status === 'concluido' ? 'concluída' : 'cancelada'} e não aceita novas aplicações.`);
    }

    const checked = resolveOriginLines(app.items as OriginLine[], technician, requisitions, {
      order,
      requireCondition: false,
    });
    if (checked.error) return fail(checked.error);
    const lines = checked.lines;

    const date = toIsoDate(app.date);
    const signature = linesSignature(lines);
    const duplicated = applications.some(
      (a) =>
        a.matricola === technician.matricola &&
        a.serviceOrderId === order.id &&
        Math.abs(Date.parse(a.date) - Date.parse(date)) < DUPLICATE_WINDOW_MS &&
        recordLinesSignature(a.items) === signature
    );
    if (duplicated) {
      return fail('Aplicação idêntica registrada há instantes. Para evitar lançamento em duplicidade, nada foi movimentado.');
    }

    const nowIso = new Date().toISOString();
    const year = new Date(date).getFullYear();
    const appCode = uniqueCode('APL', app.appCode, applications.map((a) => a.appCode), year);

    // 1) Baixa o saldo do item da RM de origem
    const updatedRequisitions = requisitions.map((rm) => {
      const touched = lines.filter((l) => l.rmId === rm.id);
      if (touched.length === 0) return rm;
      return {
        ...rm,
        items: rm.items.map((item) => {
          const line = touched.find((l) => l.rmItemId === item.itemId);
          return line ? { ...item, appliedQuantity: roundQty((item.appliedQuantity || 0) + line.quantity) } : item;
        }),
      };
    });

    // 2) Baixa a custódia da matrícula
    const qtyByProduct = new Map<string, number>();
    for (const l of lines) qtyByProduct.set(l.productId, roundQty((qtyByProduct.get(l.productId) || 0) + l.quantity));
    const updatedCollaborators = collaborators.map((col) => {
      if (col.matricola !== technician.matricola) return col;
      let custody = col.custody;
      for (const [productId, qty] of qtyByProduct) custody = consumeCustody(custody, productId, qty, nowIso);
      return { ...col, custody };
    });

    // 3) Registra o consumo na OS, com o vínculo da RM de origem
    const newApplied = lines.map((l, index) => ({
      id: `${app.id}-${index + 1}`,
      productId: l.productId,
      productName: l.productName,
      sku: l.sku,
      unit: l.unit,
      quantity: l.quantity,
      appliedDate: date,
      matricola: technician.matricola,
      technicianName: technician.name,
      unitCost: resolveProduct(products, l)?.unitCost || 0,
      notes: app.notes,
      rmId: l.rmId,
      rmNumber: l.rmNumber,
      rmItemId: l.rmItemId,
      applicationId: app.id,
      applicationCode: appCode,
    }));
    const appliedSupplies = [...order.appliedSupplies, ...newApplied];
    const suppliesCost = appliedSupplies.reduce((acc, curr) => acc + curr.quantity * curr.unitCost, 0);
    const updatedOrders = serviceOrders.map((o) =>
      o.id === order.id
        ? {
            ...o,
            appliedSupplies,
            totalReal: o.laborCost + suppliesCost,
            status: o.status === 'aprovado' || o.status === 'orcamento' ? ('em_execucao' as const) : o.status,
          }
        : o
    );

    // 4) Histórico da aplicação: RM de origem, produto, matrícula, OS, quantidade, data e responsável
    const record: SupplyApplicationRecord = {
      id: app.id,
      appCode,
      date,
      matricola: technician.matricola,
      technicianName: technician.name,
      serviceOrderId: order.id,
      serviceOrderCode: order.code,
      clientName: order.clientName,
      items: lines.map((l) => ({
        productId: l.productId,
        productName: l.productName,
        sku: l.sku,
        unit: l.unit,
        quantity: l.quantity,
        origin: l.origin,
        rmId: l.rmId,
        rmNumber: l.rmNumber,
        rmItemId: l.rmItemId,
      })),
      responsibleName: (app.responsibleName || '').trim() || technician.name,
      notes: app.notes,
    };
    const updatedApplications = [record, ...applications];

    const saved = commitAll([
      [KEYS.REQUISITIONS, updatedRequisitions],
      [KEYS.COLLABORATORS, updatedCollaborators],
      [KEYS.SERVICE_ORDERS, updatedOrders],
      [KEYS.APPLICATIONS, updatedApplications],
    ]);
    if (!saved.ok) return fail(`Não foi possível gravar a aplicação. Nenhum saldo foi alterado. (${saved.error})`);

    return {
      applications: updatedApplications,
      collaborators: updatedCollaborators,
      serviceOrders: updatedOrders,
      requisitions: updatedRequisitions,
      success: true,
    };
  },

  getReturns(): SupplyReturnRecord[] {
    return safeGet<SupplyReturnRecord[]>(KEYS.RETURNS, []);
  },

  // 4. Devolução de Insumos: devolve a sobra de uma RM específica ao almoxarifado,
  // baixando o saldo do item da RM e a custódia da matrícula.
  processSupplyReturn(ret: SupplyReturnRecord): {
    returns: SupplyReturnRecord[];
    collaborators: Collaborator[];
    products: Product[];
    requisitions: SupplyRequisitionRM[];
    success: boolean;
    message?: string;
  } {
    const collaborators = this.getCollaborators();
    const products = this.getProducts();
    const requisitions = this.getRequisitionsRM();
    const serviceOrders = this.getServiceOrders();
    const returns = this.getReturns();
    const fail = (message: string) => ({ returns, collaborators, products, requisitions, success: false, message });

    if (!ret || !ret.id) return fail('Devolução inválida: identificador ausente.');
    if (returns.some((r) => r.id === ret.id)) {
      return fail('Esta devolução já foi registrada. Nada foi movimentado novamente.');
    }

    const technician = collaborators.find((c) => c.matricola === ret.matricola);
    if (!technician) return fail(`Colaborador com matrícula ${ret.matricola} não encontrado.`);

    let order: ServiceOrder | undefined;
    if (ret.serviceOrderId) {
      order = serviceOrders.find((o) => o.id === ret.serviceOrderId);
      if (!order) return fail('A Ordem de Serviço informada na devolução não foi encontrada.');
    }

    const checked = resolveOriginLines(ret.items as OriginLine[], technician, requisitions, { requireCondition: true });
    if (checked.error) return fail(checked.error);
    const lines = checked.lines;

    const date = toIsoDate(ret.date);
    const signature = linesSignature(lines);
    const duplicated = returns.some(
      (r) =>
        r.matricola === technician.matricola &&
        Math.abs(Date.parse(r.date) - Date.parse(date)) < DUPLICATE_WINDOW_MS &&
        recordLinesSignature(r.items) === signature
    );
    if (duplicated) {
      return fail('Devolução idêntica registrada há instantes. Para evitar lançamento em duplicidade, nada foi movimentado.');
    }

    const nowIso = new Date().toISOString();
    const year = new Date(date).getFullYear();
    const returnCode = uniqueCode('DEV', ret.returnCode, returns.map((r) => r.returnCode), year);

    // 1) Baixa o saldo do item da RM de origem
    const updatedRequisitions = requisitions.map((rm) => {
      const touched = lines.filter((l) => l.rmId === rm.id);
      if (touched.length === 0) return rm;
      return {
        ...rm,
        items: rm.items.map((item) => {
          const qty = touched
            .filter((l) => l.rmItemId === item.itemId)
            .reduce((acc, l) => roundQty(acc + l.quantity), 0);
          return qty > 0 ? { ...item, returnedQuantity: roundQty((item.returnedQuantity || 0) + qty) } : item;
        }),
      };
    });

    // 2) Sai da custódia da matrícula
    const qtyByProduct = new Map<string, number>();
    for (const l of lines) qtyByProduct.set(l.productId, roundQty((qtyByProduct.get(l.productId) || 0) + l.quantity));
    const updatedCollaborators = collaborators.map((col) => {
      if (col.matricola !== technician.matricola) return col;
      let custody = col.custody;
      for (const [productId, qty] of qtyByProduct) custody = consumeCustody(custody, productId, qty, nowIso);
      return { ...col, custody };
    });

    // 3) Volta ao estoque do Almoxarifado, exceto o que chegou avariado
    const backToStock = new Map<string, number>();
    for (const l of lines) {
      if (l.condition !== 'avariado') {
        backToStock.set(l.productId, roundQty((backToStock.get(l.productId) || 0) + l.quantity));
      }
    }
    const updatedProducts = products.map((p) => {
      const qty = backToStock.get(p.id);
      return qty ? { ...p, currentStock: roundQty(p.currentStock + qty) } : p;
    });

    // 4) Histórico da devolução, preservando a RM de origem de cada item
    const record: SupplyReturnRecord = {
      id: ret.id,
      returnCode,
      date,
      matricola: technician.matricola,
      technicianName: technician.name,
      serviceOrderId: order?.id,
      serviceOrderCode: order?.code,
      items: lines.map((l) => ({
        productId: l.productId,
        productName: l.productName,
        sku: l.sku,
        unit: l.unit,
        quantity: l.quantity,
        condition: l.condition as ReturnItem['condition'],
        origin: l.origin,
        rmId: l.rmId,
        rmNumber: l.rmNumber,
        rmItemId: l.rmItemId,
      })),
      receivedBy: ret.receivedBy,
      notes: ret.notes,
    };
    const updatedReturns = [record, ...returns];

    const saved = commitAll([
      [KEYS.REQUISITIONS, updatedRequisitions],
      [KEYS.COLLABORATORS, updatedCollaborators],
      [KEYS.PRODUCTS, updatedProducts],
      [KEYS.RETURNS, updatedReturns],
    ]);
    if (!saved.ok) return fail(`Não foi possível gravar a devolução. Nenhum saldo foi alterado. (${saved.error})`);

    return {
      returns: updatedReturns,
      collaborators: updatedCollaborators,
      products: updatedProducts,
      requisitions: updatedRequisitions,
      success: true,
    };
  },

  // Origens (itens de RM e saldo legado) de uma matrícula, com saldo por origem
  getOriginBalances(matricola: string, serviceOrderId?: string): OriginBalance[] {
    const collaborator = this.getCollaborators().find((c) => c.matricola === matricola);
    return computeOriginBalances(collaborator, this.getRequisitionsRM(), { serviceOrderId });
  },

  // Linha do tempo de cada item de uma RM: retirada, aplicações e devoluções
  getRMTrace(rmId: string): ItemTrace[] {
    const rm = this.getRequisitionsRM().find((r) => r.id === rmId);
    return rm ? buildRMTrace(rm, this.getApplications(), this.getReturns()) : [];
  },

  // Confere o fluxo completo e aponta inconsistências, sem alterar dados
  auditSupplyIntegrity(): IntegrityReport {
    return auditSupplyIntegrity({
      collaborators: this.getCollaborators(),
      products: this.getProducts(),
      requisitions: this.getRequisitionsRM(),
      applications: this.getApplications(),
      returns: this.getReturns(),
      serviceOrders: this.getServiceOrders(),
    });
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
