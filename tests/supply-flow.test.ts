/**
 * Testes do fluxo RM → Custódia da matrícula → Aplicação na OS → Devolução ao Almoxarifado.
 * Rodam direto contra o StorageService, com um localStorage em memória.
 *
 * Execução: bun tests/supply-flow.test.ts   (ou: npm run test:supply)
 */
import assert from 'node:assert/strict';
import { StorageService as S } from '../lib/storage';
import { auditSupplyIntegrity, rmItemRemaining } from '../lib/supplyTrace';
import {
  Collaborator,
  Product,
  RequisitionItem,
  ServiceOrder,
  SupplyApplicationRecord,
  SupplyRequisitionRM,
  SupplyReturnRecord,
} from '../types';

// ---------------------------------------------------------------------------
// localStorage em memória (com opção de falhar numa chave, para testar o desfazer)
// ---------------------------------------------------------------------------
const mem = new Map<string, string>();
let failOnKeyPart: string | null = null;
const shim = {
  getItem: (k: string) => (mem.has(k) ? (mem.get(k) as string) : null),
  setItem: (k: string, v: string) => {
    if (failOnKeyPart && k.includes(failOnKeyPart)) throw new Error('cota excedida (simulada)');
    mem.set(k, String(v));
  },
  removeItem: (k: string) => void mem.delete(k),
};
const g = globalThis as unknown as Record<string, unknown>;
g.window = globalThis;
g.localStorage = shim;

// ---------------------------------------------------------------------------
// Fábricas de dados
// ---------------------------------------------------------------------------
const prod = (id: string, stock: number, cost = 10): Product => ({
  id,
  sku: `SKU-${id}`,
  name: `Produto ${id}`,
  category: 'Teste',
  unit: 'UN',
  currentStock: stock,
  minStock: 0,
  unitCost: cost,
  unitPrice: cost * 2,
  createdAt: '2026-01-01T00:00:00Z',
});

const collab = (matricola: string, custody: Collaborator['custody'] = []): Collaborator => ({
  id: `col-${matricola}`,
  matricola,
  name: `Técnico ${matricola}`,
  role: 'Técnico',
  department: 'Campo',
  phone: '',
  email: '',
  active: true,
  custody,
  createdAt: '2026-01-01T00:00:00Z',
});

const order = (id: string, status: ServiceOrder['status'] = 'em_execucao'): ServiceOrder => ({
  id,
  code: `OS-${id.toUpperCase()}`,
  clientId: 'cli-1',
  clientName: `Cliente ${id}`,
  clientPhone: '',
  clientAddress: '',
  title: `Serviço ${id}`,
  description: '',
  scheduledDate: '2026-11-15',
  assignedMatricola: 'MAT-1',
  assignedTechnicianName: 'Técnico MAT-1',
  status,
  laborCost: 100,
  estimatedSupplies: [],
  appliedSupplies: [],
  totalEstimated: 0,
  totalReal: 100,
  createdAt: '2026-11-01T00:00:00Z',
});

let seq = 0;
const uid = (p: string) => `${p}-${++seq}`;
// Cada lançamento usa uma data distinta (>15s entre si) para não cair na trava de duplicidade
let clock = Date.parse('2026-11-15T10:00:00Z');
const tick = () => new Date((clock += 60_000)).toISOString();

const rmItems = (...pairs: Array<[string, number]>): RequisitionItem[] =>
  pairs.map(([productId, quantity]) => ({
    productId,
    productName: `Produto ${productId}`,
    sku: `SKU-${productId}`,
    unit: 'UN',
    quantity,
  }));

const newRM = (
  matricola: string,
  items: RequisitionItem[],
  osId?: string,
  extra: Partial<SupplyRequisitionRM> = {}
): SupplyRequisitionRM => ({
  id: uid('rm'),
  rmNumber: `RM-2026-${String(900 + seq).padStart(3, '0')}`,
  date: tick(),
  matricola,
  technicianName: '',
  serviceOrderId: osId,
  items,
  dispensedBy: 'Almoxarife',
  status: 'retirado',
  ...extra,
});

/** Monta a linha de aplicação/devolução apontando para a origem (item de RM) informada. */
const fromRM = (rm: SupplyRequisitionRM, productId: string, quantity: number) => {
  const saved = S.getRequisitionsRM().find((r) => r.id === rm.id)!;
  const item = saved.items.find((i) => i.productId === productId)!;
  return {
    productId,
    productName: item.productName,
    sku: item.sku,
    unit: item.unit,
    quantity,
    origin: 'rm' as const,
    rmId: saved.id,
    rmItemId: item.itemId,
  };
};

const legacyLine = (productId: string, quantity: number) => ({
  productId,
  productName: `Produto ${productId}`,
  sku: `SKU-${productId}`,
  unit: 'UN',
  quantity,
  origin: 'legado' as const,
});

const newApp = (
  matricola: string,
  osId: string,
  items: SupplyApplicationRecord['items'],
  extra: Partial<SupplyApplicationRecord> = {}
): SupplyApplicationRecord => ({
  id: uid('app'),
  appCode: 'APL-2026-001',
  date: tick(),
  matricola,
  technicianName: '',
  serviceOrderId: osId,
  serviceOrderCode: '',
  clientName: '',
  items,
  ...extra,
});

const newRet = (
  matricola: string,
  items: SupplyReturnRecord['items'],
  extra: Partial<SupplyReturnRecord> = {}
): SupplyReturnRecord => ({
  id: uid('ret'),
  returnCode: 'DEV-2026-001',
  date: tick(),
  matricola,
  technicianName: '',
  items,
  receivedBy: 'Almoxarife',
  ...extra,
});

const stockOf = (id: string) => S.getProducts().find((p) => p.id === id)!.currentStock;
const custodyOf = (mat: string, id: string) =>
  S.getCollaborators()
    .find((c) => c.matricola === mat)!
    .custody.filter((c) => c.productId === id)
    .reduce((a, c) => a + c.quantity, 0);
const itemOf = (rm: SupplyRequisitionRM, productId: string) =>
  S.getRequisitionsRM()
    .find((r) => r.id === rm.id)!
    .items.find((i) => i.productId === productId)!;
const snapshotAll = () => JSON.stringify([...mem.entries()].sort());

function reset(opts: { products?: Product[]; collaborators?: Collaborator[]; orders?: ServiceOrder[] } = {}) {
  mem.clear();
  failOnKeyPart = null;
  S.clearDatabase();
  for (const p of opts.products ?? [prod('A', 100), prod('B', 50)]) S.saveProduct(p);
  for (const c of opts.collaborators ?? [collab('MAT-1'), collab('MAT-2')]) S.saveCollaborator(c);
  for (const o of opts.orders ?? [order('os1'), order('os2')]) S.saveServiceOrder(o);
}

// ---------------------------------------------------------------------------
// Runner mínimo
// ---------------------------------------------------------------------------
const tests: Array<[string, () => void]> = [];
const test = (name: string, fn: () => void) => void tests.push([name, fn]);

// ===========================================================================
// RM
// ===========================================================================
test('RM: cria itens com controle próprio, baixa o estoque e abastece a custódia', () => {
  reset();
  const rm = newRM('MAT-1', rmItems(['A', 10], ['B', 4]), 'os1');
  const r = S.processRequisitionRM(rm);
  assert.equal(r.success, true, r.message);
  assert.equal(stockOf('A'), 90);
  assert.equal(stockOf('B'), 46);
  assert.equal(custodyOf('MAT-1', 'A'), 10);
  const a = itemOf(rm, 'A');
  assert.ok(a.itemId, 'item deve ter identificador');
  assert.equal(a.quantity, 10);
  assert.equal(a.appliedQuantity, 0);
  assert.equal(a.returnedQuantity, 0);
  assert.equal(rmItemRemaining(a), 10);
});

test('RM: saldo insuficiente é rejeitado e o estoque nunca fica negativo', () => {
  reset();
  const before = snapshotAll();
  const r = S.processRequisitionRM(newRM('MAT-1', rmItems(['A', 101])));
  assert.equal(r.success, false);
  assert.match(r.message || '', /Saldo insuficiente/);
  assert.equal(snapshotAll(), before, 'nada pode ter sido gravado');
});

test('RM: matrícula inexistente é rejeitada sem tirar material do estoque', () => {
  reset();
  const r = S.processRequisitionRM(newRM('MAT-999', rmItems(['A', 5])));
  assert.equal(r.success, false);
  assert.equal(stockOf('A'), 100);
});

test('RM: reenvio da mesma requisição não movimenta duas vezes', () => {
  reset();
  const rm = newRM('MAT-1', rmItems(['A', 10]));
  assert.equal(S.processRequisitionRM(rm).success, true);
  const again = S.processRequisitionRM(rm);
  assert.equal(again.success, false);
  assert.equal(stockOf('A'), 90);
  assert.equal(custodyOf('MAT-1', 'A'), 10);
});

test('RM: OS concluída ou cancelada não recebe requisição', () => {
  reset({ orders: [order('os1', 'concluido'), order('os2', 'cancelado')] });
  assert.equal(S.processRequisitionRM(newRM('MAT-1', rmItems(['A', 1]), 'os1')).success, false);
  assert.equal(S.processRequisitionRM(newRM('MAT-1', rmItems(['A', 1]), 'os2')).success, false);
  assert.equal(stockOf('A'), 100);
});

test('RM: linhas repetidas do mesmo produto são somadas e validadas juntas', () => {
  reset();
  const ok = S.processRequisitionRM(newRM('MAT-1', rmItems(['A', 30], ['A', 20])));
  assert.equal(ok.success, true);
  assert.equal(stockOf('A'), 50);
  const bad = S.processRequisitionRM(newRM('MAT-1', rmItems(['A', 30], ['A', 30])));
  assert.equal(bad.success, false, 'soma 60 > estoque 50');
  assert.equal(stockOf('A'), 50);
});

test('RM: número repetido recebe um novo número sequencial', () => {
  reset();
  const a = newRM('MAT-1', rmItems(['A', 1]), undefined, { rmNumber: 'RM-2026-007' });
  const b = newRM('MAT-1', rmItems(['A', 1]), undefined, { rmNumber: 'RM-2026-007' });
  S.processRequisitionRM(a);
  S.processRequisitionRM(b);
  const numbers = S.getRequisitionsRM().map((r) => r.rmNumber);
  assert.equal(new Set(numbers).size, 2);
});

// ===========================================================================
// Aplicação
// ===========================================================================
test('Aplicação: baixa item da RM, custódia e registra consumo na OS, tudo vinculado', () => {
  reset();
  const rm = newRM('MAT-1', rmItems(['A', 10]), 'os1');
  S.processRequisitionRM(rm);
  const app = newApp('MAT-1', 'os1', [fromRM(rm, 'A', 4)], { responsibleName: 'Ana (supervisora)', notes: 'campo' });
  const r = S.processSupplyApplication(app);
  assert.equal(r.success, true, r.message);

  const item = itemOf(rm, 'A');
  assert.equal(item.appliedQuantity, 4);
  assert.equal(rmItemRemaining(item), 6);
  assert.equal(custodyOf('MAT-1', 'A'), 6);

  const os = S.getServiceOrders().find((o) => o.id === 'os1')!;
  assert.equal(os.appliedSupplies.length, 1);
  assert.equal(os.appliedSupplies[0].quantity, 4);
  assert.equal(os.appliedSupplies[0].rmId, rm.id);
  assert.equal(os.appliedSupplies[0].rmItemId, item.itemId);
  assert.equal(os.appliedSupplies[0].rmNumber, S.getRequisitionsRM().find((x) => x.id === rm.id)!.rmNumber);
  assert.equal(os.totalReal, 100 + 4 * 10);

  const saved = S.getApplications().find((a) => a.id === app.id)!;
  assert.equal(saved.matricola, 'MAT-1');
  assert.equal(saved.serviceOrderCode, 'OS-OS1');
  assert.equal(saved.responsibleName, 'Ana (supervisora)');
  assert.equal(saved.items[0].rmId, rm.id);
  assert.equal(saved.items[0].rmNumber, os.appliedSupplies[0].rmNumber);
  assert.equal(saved.items[0].productId, 'A');
  assert.ok(Date.parse(saved.date) > 0);
});

test('Aplicação: responsável padrão é o próprio técnico', () => {
  reset();
  const rm = newRM('MAT-1', rmItems(['A', 5]));
  S.processRequisitionRM(rm);
  S.processSupplyApplication(newApp('MAT-1', 'os1', [fromRM(rm, 'A', 1)]));
  assert.equal(S.getApplications()[0].responsibleName, 'Técnico MAT-1');
});

test('Aplicação: nunca passa do saldo restante do item da RM', () => {
  reset();
  const rm = newRM('MAT-1', rmItems(['A', 10]));
  S.processRequisitionRM(rm);
  assert.equal(S.processSupplyApplication(newApp('MAT-1', 'os1', [fromRM(rm, 'A', 7)])).success, true);
  const before = snapshotAll();
  const r = S.processSupplyApplication(newApp('MAT-1', 'os1', [fromRM(rm, 'A', 4)]));
  assert.equal(r.success, false);
  assert.match(r.message || '', /restante 3/);
  assert.equal(snapshotAll(), before);
  assert.equal(S.processSupplyApplication(newApp('MAT-1', 'os1', [fromRM(rm, 'A', 3)])).success, true);
  assert.equal(rmItemRemaining(itemOf(rm, 'A')), 0);
});

test('Aplicação: duas linhas do mesmo item somam e são validadas contra o saldo', () => {
  reset();
  const rm = newRM('MAT-1', rmItems(['A', 5]));
  S.processRequisitionRM(rm);
  const r = S.processSupplyApplication(newApp('MAT-1', 'os1', [fromRM(rm, 'A', 3), fromRM(rm, 'A', 3)]));
  assert.equal(r.success, false, '3 + 3 > 5');
  assert.equal(itemOf(rm, 'A').appliedQuantity, 0);
});

test('Aplicação: o mesmo produto em várias RMs mantém histórico e saldo separados', () => {
  reset();
  const rm1 = newRM('MAT-1', rmItems(['A', 10]), 'os1');
  const rm2 = newRM('MAT-1', rmItems(['A', 6]));
  S.processRequisitionRM(rm1);
  S.processRequisitionRM(rm2);
  assert.equal(custodyOf('MAT-1', 'A'), 16);

  const origins = S.getOriginBalances('MAT-1').filter((o) => o.productId === 'A');
  assert.equal(origins.length, 2);
  assert.deepEqual(origins.map((o) => o.remaining).sort((a, b) => a - b), [6, 10]);

  // aplica 5 só da RM-2 (sem OS): a RM-1 não pode ser tocada
  assert.equal(S.processSupplyApplication(newApp('MAT-1', 'os2', [fromRM(rm2, 'A', 5)])).success, true);
  assert.equal(itemOf(rm1, 'A').appliedQuantity, 0);
  assert.equal(itemOf(rm2, 'A').appliedQuantity, 5);
  assert.equal(custodyOf('MAT-1', 'A'), 11);

  // histórico por item: cada RM só enxerga os próprios eventos
  const t1 = S.getRMTrace(rm1.id)[0].events.map((e) => e.type);
  const t2 = S.getRMTrace(rm2.id)[0].events.map((e) => e.type);
  assert.deepEqual(t1, ['retirada']);
  assert.deepEqual(t2, ['retirada', 'aplicacao']);
});

test('Aplicação: material de RM vinculada a uma OS não pode ir para outra OS', () => {
  reset();
  const rm = newRM('MAT-1', rmItems(['A', 10]), 'os1');
  S.processRequisitionRM(rm);
  const r = S.processSupplyApplication(newApp('MAT-1', 'os2', [fromRM(rm, 'A', 2)]));
  assert.equal(r.success, false);
  assert.match(r.message || '', /não pode ser aplicado/);
  assert.equal(S.getOriginBalances('MAT-1', 'os2').length, 0, 'a origem nem aparece para a OS-2');
  assert.equal(S.getOriginBalances('MAT-1', 'os1').length, 1);
});

test('Aplicação: RM sem OS vinculada vale para qualquer OS aberta', () => {
  reset();
  const rm = newRM('MAT-1', rmItems(['A', 10]));
  S.processRequisitionRM(rm);
  assert.equal(S.processSupplyApplication(newApp('MAT-1', 'os2', [fromRM(rm, 'A', 2)])).success, true);
});

test('Aplicação: sem vínculo válido é rejeitada (sem RM, RM falsa, RM de outra matrícula)', () => {
  reset();
  const rm = newRM('MAT-1', rmItems(['A', 10]));
  S.processRequisitionRM(rm);
  const base = fromRM(rm, 'A', 1);
  const before = snapshotAll();

  const semRM = { ...base, rmId: undefined, rmItemId: undefined, origin: undefined };
  assert.match(S.processSupplyApplication(newApp('MAT-1', 'os1', [semRM])).message || '', /sem vínculo/);

  const falsa = { ...base, rmId: 'rm-inexistente' };
  assert.match(S.processSupplyApplication(newApp('MAT-1', 'os1', [falsa])).message || '', /não encontrada/);

  const outraMat = S.processSupplyApplication(newApp('MAT-2', 'os1', [base]));
  assert.equal(outraMat.success, false);
  assert.match(outraMat.message || '', /pertence à matrícula MAT-1/);

  const itemFalso = { ...base, rmItemId: 'item-falso' };
  assert.match(S.processSupplyApplication(newApp('MAT-1', 'os1', [itemFalso])).message || '', /não encontrado/);

  const produtoTrocado = { ...base, productId: 'B' };
  assert.match(S.processSupplyApplication(newApp('MAT-1', 'os1', [produtoTrocado])).message || '', /não corresponde/);

  assert.equal(snapshotAll(), before, 'nenhuma tentativa pode ter gravado algo');
});

test('Aplicação: quantidade zero, negativa ou inválida é rejeitada', () => {
  reset();
  const rm = newRM('MAT-1', rmItems(['A', 10]));
  S.processRequisitionRM(rm);
  for (const q of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.equal(S.processSupplyApplication(newApp('MAT-1', 'os1', [fromRM(rm, 'A', q)])).success, false, `q=${q}`);
  }
  assert.equal(itemOf(rm, 'A').appliedQuantity, 0);
});

test('Aplicação: OS inexistente, concluída ou cancelada é rejeitada', () => {
  reset({ orders: [order('os1'), order('os2', 'concluido'), order('os3', 'cancelado')] });
  const rm = newRM('MAT-1', rmItems(['A', 10]));
  S.processRequisitionRM(rm);
  for (const os of ['os-fantasma', 'os2', 'os3']) {
    assert.equal(S.processSupplyApplication(newApp('MAT-1', os, [fromRM(rm, 'A', 1)])).success, false, os);
  }
  assert.equal(custodyOf('MAT-1', 'A'), 10);
});

test('Aplicação: duplicidade (mesmo id ou duplo clique) não baixa duas vezes', () => {
  reset();
  const rm = newRM('MAT-1', rmItems(['A', 10]));
  S.processRequisitionRM(rm);
  const app = newApp('MAT-1', 'os1', [fromRM(rm, 'A', 2)]);
  assert.equal(S.processSupplyApplication(app).success, true);

  const mesmoId = S.processSupplyApplication(app);
  assert.equal(mesmoId.success, false);
  assert.match(mesmoId.message || '', /já foi registrada/);

  const duploClique = S.processSupplyApplication({ ...app, id: uid('app') });
  assert.equal(duploClique.success, false);
  assert.match(duploClique.message || '', /idêntica/);

  assert.equal(itemOf(rm, 'A').appliedQuantity, 2);
  assert.equal(custodyOf('MAT-1', 'A'), 8);
  assert.equal(S.getApplications().length, 1);
  assert.equal(S.getServiceOrders().find((o) => o.id === 'os1')!.appliedSupplies.length, 1);
});

test('Aplicação: código repetido recebe novo número sequencial', () => {
  reset();
  const rm = newRM('MAT-1', rmItems(['A', 10]));
  S.processRequisitionRM(rm);
  S.processSupplyApplication(newApp('MAT-1', 'os1', [fromRM(rm, 'A', 1)], { appCode: 'APL-2026-005' }));
  S.processSupplyApplication(newApp('MAT-1', 'os1', [fromRM(rm, 'A', 2)], { appCode: 'APL-2026-005' }));
  const codes = S.getApplications().map((a) => a.appCode);
  assert.equal(new Set(codes).size, 2);
});

test('Aplicação: falha de gravação no meio desfaz tudo (nenhum saldo muda)', () => {
  reset();
  const rm = newRM('MAT-1', rmItems(['A', 10]), 'os1');
  S.processRequisitionRM(rm);
  const before = snapshotAll();
  failOnKeyPart = 'applications'; // a última chave gravada falha depois das outras já terem sido escritas
  const r = S.processSupplyApplication(newApp('MAT-1', 'os1', [fromRM(rm, 'A', 3)]));
  failOnKeyPart = null;
  assert.equal(r.success, false);
  assert.match(r.message || '', /Nenhum saldo foi alterado/);
  assert.equal(snapshotAll(), before, 'RM, custódia e OS devem ter voltado ao que eram');
});

// ===========================================================================
// Devolução
// ===========================================================================
test('Devolução: preserva a RM de origem, baixa item e custódia e volta ao estoque', () => {
  reset();
  const rm = newRM('MAT-1', rmItems(['A', 10]), 'os1');
  S.processRequisitionRM(rm);
  S.processSupplyApplication(newApp('MAT-1', 'os1', [fromRM(rm, 'A', 4)]));
  const ret = newRet('MAT-1', [{ ...fromRM(rm, 'A', 3), condition: 'perfeito' }]);
  const r = S.processSupplyReturn(ret);
  assert.equal(r.success, true, r.message);

  const item = itemOf(rm, 'A');
  assert.equal(item.returnedQuantity, 3);
  assert.equal(rmItemRemaining(item), 3, '10 − 4 aplicados − 3 devolvidos');
  assert.equal(custodyOf('MAT-1', 'A'), 3);
  assert.equal(stockOf('A'), 90 + 3);

  const saved = S.getReturns().find((x) => x.id === ret.id)!;
  assert.equal(saved.items[0].rmId, rm.id);
  assert.equal(saved.items[0].rmItemId, item.itemId);
  assert.ok(saved.items[0].rmNumber);
});

test('Devolução: avariado sai da custódia mas não volta ao estoque', () => {
  reset();
  const rm = newRM('MAT-1', rmItems(['A', 10]));
  S.processRequisitionRM(rm);
  S.processSupplyReturn(newRet('MAT-1', [{ ...fromRM(rm, 'A', 2), condition: 'avariado' }]));
  assert.equal(stockOf('A'), 90);
  assert.equal(custodyOf('MAT-1', 'A'), 8);
  assert.equal(itemOf(rm, 'A').returnedQuantity, 2);
});

test('Devolução: não devolve mais do que o saldo restante do item (descontando o aplicado)', () => {
  reset();
  const rm = newRM('MAT-1', rmItems(['A', 10]));
  S.processRequisitionRM(rm);
  S.processSupplyApplication(newApp('MAT-1', 'os1', [fromRM(rm, 'A', 8)]));
  const before = snapshotAll();
  const r = S.processSupplyReturn(newRet('MAT-1', [{ ...fromRM(rm, 'A', 3), condition: 'perfeito' }]));
  assert.equal(r.success, false);
  assert.match(r.message || '', /restante 2/);
  assert.equal(snapshotAll(), before);
});

test('Devolução: exige vínculo, condição válida e não duplica', () => {
  reset();
  const rm = newRM('MAT-1', rmItems(['A', 10]));
  S.processRequisitionRM(rm);
  const semVinculo = { ...fromRM(rm, 'A', 1), rmId: undefined, rmItemId: undefined, origin: undefined, condition: 'perfeito' as const };
  assert.equal(S.processSupplyReturn(newRet('MAT-1', [semVinculo])).success, false);
  const semCondicao = { ...fromRM(rm, 'A', 1) } as SupplyReturnRecord['items'][number];
  assert.equal(S.processSupplyReturn(newRet('MAT-1', [semCondicao])).success, false);

  const ret = newRet('MAT-1', [{ ...fromRM(rm, 'A', 2), condition: 'perfeito' }]);
  assert.equal(S.processSupplyReturn(ret).success, true);
  assert.equal(S.processSupplyReturn(ret).success, false, 'mesmo id');
  assert.equal(S.processSupplyReturn({ ...ret, id: uid('ret') }).success, false, 'duplo clique');
  assert.equal(itemOf(rm, 'A').returnedQuantity, 2);
  assert.equal(stockOf('A'), 92);
});

test('Devolução: falha de gravação desfaz tudo', () => {
  reset();
  const rm = newRM('MAT-1', rmItems(['A', 10]));
  S.processRequisitionRM(rm);
  const before = snapshotAll();
  failOnKeyPart = 'returns';
  const r = S.processSupplyReturn(newRet('MAT-1', [{ ...fromRM(rm, 'A', 2), condition: 'perfeito' }]));
  failOnKeyPart = null;
  assert.equal(r.success, false);
  assert.equal(snapshotAll(), before);
});

test('Item totalmente aplicado/devolvido zera o saldo e sai das origens', () => {
  reset();
  const rm = newRM('MAT-1', rmItems(['A', 10]));
  S.processRequisitionRM(rm);
  S.processSupplyApplication(newApp('MAT-1', 'os1', [fromRM(rm, 'A', 6)]));
  S.processSupplyReturn(newRet('MAT-1', [{ ...fromRM(rm, 'A', 4), condition: 'perfeito' }]));
  assert.equal(rmItemRemaining(itemOf(rm, 'A')), 0);
  assert.equal(S.getOriginBalances('MAT-1').length, 0);
  assert.equal(custodyOf('MAT-1', 'A'), 0);
  assert.equal(S.processSupplyApplication(newApp('MAT-1', 'os1', [fromRM(rm, 'A', 1)])).success, false);
});

// ===========================================================================
// Compatibilidade com dados atuais (anteriores ao controle por RM)
// ===========================================================================
function seedLegacy() {
  reset({
    collaborators: [
      collab('MAT-1', [
        { productId: 'A', productName: 'Produto A', sku: 'SKU-A', unit: 'UN', quantity: 5, lastUpdated: '2026-11-01T00:00:00Z' },
      ]),
      collab('MAT-2'),
    ],
  });
  // RM, aplicação e devolução no formato antigo (sem itemId nem vínculos)
  const legacyRM: SupplyRequisitionRM = {
    id: 'rm-old',
    rmNumber: 'RM-2026-001',
    date: '2026-11-01T09:00:00Z',
    matricola: 'MAT-1',
    technicianName: 'Técnico MAT-1',
    serviceOrderId: 'os1',
    serviceOrderCode: 'OS-OS1',
    items: rmItems(['A', 5]),
    dispensedBy: 'Almoxarife',
    status: 'retirado',
  };
  const legacyApp: SupplyApplicationRecord = {
    id: 'app-old',
    appCode: 'APL-2026-001',
    date: '2026-11-02T09:00:00Z',
    matricola: 'MAT-1',
    technicianName: 'Técnico MAT-1',
    serviceOrderId: 'os1',
    serviceOrderCode: 'OS-OS1',
    clientName: 'Cliente os1',
    items: rmItems(['A', 2]),
  };
  const legacyRet: SupplyReturnRecord = {
    id: 'ret-old',
    returnCode: 'DEV-2026-001',
    date: '2026-11-03T09:00:00Z',
    matricola: 'MAT-1',
    technicianName: 'Técnico MAT-1',
    items: [{ ...rmItems(['A', 1])[0], condition: 'perfeito' }],
    receivedBy: 'Almoxarife',
  };
  mem.set('aniel_requisitions_v2', JSON.stringify([legacyRM]));
  mem.set('aniel_applications_v2', JSON.stringify([legacyApp]));
  mem.set('aniel_returns_v2', JSON.stringify([legacyRet]));
  return { legacyRM, legacyApp, legacyRet };
}

test('Legado: custódia antiga aparece como "saldo legado" e pode ser aplicada explicitamente', () => {
  seedLegacy();
  const origins = S.getOriginBalances('MAT-1');
  assert.equal(origins.length, 1);
  assert.equal(origins[0].origin, 'legado');
  assert.equal(origins[0].remaining, 5);

  const r = S.processSupplyApplication(newApp('MAT-1', 'os1', [legacyLine('A', 2)]));
  assert.equal(r.success, true, r.message);
  assert.equal(custodyOf('MAT-1', 'A'), 3);
  assert.equal(S.getApplications()[0].items[0].origin, 'legado');
});

test('Legado: registros históricos não são alterados em nenhuma movimentação', () => {
  const { legacyRM, legacyApp, legacyRet } = seedLegacy();
  const rm = newRM('MAT-1', rmItems(['A', 4]));
  S.processRequisitionRM(rm);
  S.processSupplyApplication(newApp('MAT-1', 'os1', [fromRM(rm, 'A', 1)]));
  S.processSupplyApplication(newApp('MAT-1', 'os1', [legacyLine('A', 1)]));
  S.processSupplyReturn(newRet('MAT-1', [{ ...fromRM(rm, 'A', 1), condition: 'perfeito' }]));

  assert.deepEqual(S.getRequisitionsRM().find((r) => r.id === 'rm-old'), legacyRM);
  assert.deepEqual(S.getApplications().find((a) => a.id === 'app-old'), legacyApp);
  assert.deepEqual(S.getReturns().find((r) => r.id === 'ret-old'), legacyRet);
});

test('Legado + RM nova: o saldo legado é só o que sobra depois de cobrir os itens de RM', () => {
  seedLegacy(); // custódia antiga de A = 5
  const rm = newRM('MAT-1', rmItems(['A', 4]));
  S.processRequisitionRM(rm); // custódia 9 = 5 legado + 4 da RM
  const origins = S.getOriginBalances('MAT-1');
  assert.equal(origins.find((o) => o.origin === 'legado')!.remaining, 5);
  assert.equal(origins.find((o) => o.origin === 'rm')!.remaining, 4);

  // pedir 6 do legado (custódia total 9 cobriria, mas o legado só tem 5)
  const r = S.processSupplyApplication(newApp('MAT-1', 'os1', [legacyLine('A', 6)]));
  assert.equal(r.success, false);
  assert.match(r.message || '', /anterior ao controle por RM/);
  assert.equal(itemOf(rm, 'A').appliedQuantity, 0, 'o item da RM não pode ser consumido por engano');
});

test('Legado: item de RM antiga (sem itemId) não vira origem nem é alterado', () => {
  seedLegacy();
  const old = S.getRequisitionsRM()[0];
  const line = { productId: 'A', productName: 'Produto A', sku: 'SKU-A', unit: 'UN', quantity: 1, origin: 'rm' as const, rmId: old.id, rmItemId: 'qualquer' };
  assert.equal(S.processSupplyApplication(newApp('MAT-1', 'os1', [line])).success, false);
});

// ===========================================================================
// Auditoria e fluxo completo
// ===========================================================================
test('Auditoria: fluxo saudável não tem erros e conta os registros legados', () => {
  seedLegacy();
  const rm = newRM('MAT-1', rmItems(['B', 5]), 'os1');
  S.processRequisitionRM(rm);
  S.processSupplyApplication(newApp('MAT-1', 'os1', [fromRM(rm, 'B', 2)]));
  S.processSupplyReturn(newRet('MAT-1', [{ ...fromRM(rm, 'B', 1), condition: 'perfeito' }]));
  const report = S.auditSupplyIntegrity();
  assert.equal(report.ok, true, JSON.stringify(report.issues));
  assert.deepEqual(report.legacy, { requisitions: 1, applications: 1, returns: 1 });
});

test('Auditoria: detecta saldo negativo, divergência e custódia menor que as RMs', () => {
  reset();
  const rm = newRM('MAT-1', rmItems(['A', 10]));
  S.processRequisitionRM(rm);
  S.processSupplyApplication(newApp('MAT-1', 'os1', [fromRM(rm, 'A', 4)]));

  // 1) corrompe a custódia: zerada, embora a RM ainda tenha 6 a aplicar
  const cols = S.getCollaborators();
  cols.find((c) => c.matricola === 'MAT-1')!.custody = [];
  mem.set('aniel_collaborators_v2', JSON.stringify(cols));
  assert.ok(S.auditSupplyIntegrity().issues.some((i) => i.code === 'CUSTODIA_MENOR_QUE_RM'));

  // 2) corrompe o item da RM: aplicado maior que o requisitado e diferente dos registros
  const rms = S.getRequisitionsRM();
  rms[0].items[0].appliedQuantity = 12;
  mem.set('aniel_requisitions_v2', JSON.stringify(rms));
  const codes = S.auditSupplyIntegrity().issues.map((i) => i.code);
  assert.ok(codes.includes('SALDO_NEGATIVO_RM'));
  assert.ok(codes.includes('APLICADO_DIVERGENTE'));
  assert.equal(S.auditSupplyIntegrity().ok, false);
});

test('Fluxo completo: RM → custódia → aplicação → devolução, com conservação do material', () => {
  reset();
  const initial = 100;
  const rm1 = newRM('MAT-1', rmItems(['A', 30]), 'os1');
  const rm2 = newRM('MAT-1', rmItems(['A', 20]));
  assert.equal(S.processRequisitionRM(rm1).success, true);
  assert.equal(S.processRequisitionRM(rm2).success, true);
  assert.equal(S.processSupplyApplication(newApp('MAT-1', 'os1', [fromRM(rm1, 'A', 12)])).success, true);
  assert.equal(S.processSupplyApplication(newApp('MAT-1', 'os2', [fromRM(rm2, 'A', 5)])).success, true);
  assert.equal(S.processSupplyReturn(newRet('MAT-1', [{ ...fromRM(rm1, 'A', 8), condition: 'perfeito' }])).success, true);
  assert.equal(S.processSupplyReturn(newRet('MAT-1', [{ ...fromRM(rm2, 'A', 2), condition: 'avariado' }])).success, true);

  // Todo material está em exatamente um lugar: estoque + custódia + aplicado nas OS + avariado
  const inStock = stockOf('A');
  const inCustody = custodyOf('MAT-1', 'A');
  const applied = S.getServiceOrders().flatMap((o) => o.appliedSupplies).filter((s) => s.productId === 'A').reduce((a, s) => a + s.quantity, 0);
  const damaged = S.getReturns().flatMap((r) => r.items).filter((i) => i.condition === 'avariado').reduce((a, i) => a + i.quantity, 0);
  assert.equal(inStock + inCustody + applied + damaged, initial);
  assert.equal(inStock, 100 - 50 + 8);
  assert.equal(applied, 17);
  assert.equal(inCustody, 50 - 17 - 8 - 2);

  // Trilha por item de RM
  const trace1 = S.getRMTrace(rm1.id)[0];
  assert.deepEqual(trace1.events.map((e) => `${e.type}:${e.quantity}`), ['retirada:30', 'aplicacao:12', 'devolucao:8']);
  assert.equal(trace1.remaining, 10);
  const trace2 = S.getRMTrace(rm2.id)[0];
  assert.deepEqual(trace2.events.map((e) => `${e.type}:${e.quantity}`), ['retirada:20', 'aplicacao:5', 'devolucao:2']);
  assert.equal(trace2.remaining, 13);

  // O que sobra de cada RM bate com o que a matrícula tem em mãos
  const origins = S.getOriginBalances('MAT-1');
  assert.equal(origins.reduce((a, o) => a + o.remaining, 0), inCustody);

  const report = auditSupplyIntegrity({
    collaborators: S.getCollaborators(),
    products: S.getProducts(),
    requisitions: S.getRequisitionsRM(),
    applications: S.getApplications(),
    returns: S.getReturns(),
    serviceOrders: S.getServiceOrders(),
  });
  assert.equal(report.ok, true, JSON.stringify(report.issues));
});

// ---------------------------------------------------------------------------
let failed = 0;
for (const [name, fn] of tests) {
  try {
    fn();
    console.log(`  ok   ${name}`);
  } catch (err) {
    failed += 1;
    console.log(`  FALHA ${name}\n        ${(err as Error).message.split('\n').join('\n        ')}`);
  }
}
console.log(`\n${tests.length - failed}/${tests.length} testes passaram.`);
if (failed > 0) process.exit(1);
