import {
  Collaborator,
  Product,
  RequisitionItem,
  ServiceOrder,
  SupplyApplicationRecord,
  SupplyRequisitionRM,
  SupplyReturnRecord,
} from '@/types';

/**
 * Regras puras de saldo e rastreabilidade do fluxo
 * RM → Custódia da matrícula → Aplicação na OS → Devolução ao Almoxarifado.
 *
 * Nada aqui lê ou grava o armazenamento: as funções recebem os dados e devolvem
 * resultados. Assim as mesmas regras servem ao StorageService (que valida e grava)
 * e às telas (que só exibem).
 */

export const QTY_EPSILON = 1e-6;

export const roundQty = (n: number): number => Math.round(n * 1e6) / 1e6;

/** Item de RM com controle próprio (RMs criadas depois da regra de vínculo). */
export function isTrackedItem(item: RequisitionItem): boolean {
  return typeof item.itemId === 'string' && item.itemId.length > 0;
}

export const rmItemApplied = (i: RequisitionItem): number => roundQty(i.appliedQuantity || 0);
export const rmItemReturned = (i: RequisitionItem): number => roundQty(i.returnedQuantity || 0);

/** Saldo restante do item = requisitado − aplicado − devolvido (sem truncar, para a auditoria enxergar negativos). */
export const rmItemRemaining = (i: RequisitionItem): number =>
  roundQty(i.quantity - rmItemApplied(i) - rmItemReturned(i));

/** Chave estável de uma origem: um item de RM ou o saldo legado de um produto. */
export const originKey = (rmId: string | undefined, rmItemId: string | undefined, productId: string): string =>
  rmId && rmItemId ? `${rmId}:${rmItemId}` : `legado:${productId}`;

export interface OriginBalance {
  key: string;
  origin: 'rm' | 'legado';
  rmId?: string;
  rmNumber?: string;
  rmItemId?: string;
  rmDate?: string;
  serviceOrderId?: string;
  serviceOrderCode?: string;
  productId: string;
  productName: string;
  sku: string;
  unit: string;
  requested: number;
  applied: number;
  returned: number;
  /** Saldo que ainda pode ser aplicado ou devolvido a partir desta origem. */
  remaining: number;
}

export interface OriginOptions {
  /** Quando informado, esconde itens de RMs vinculadas a outra OS. */
  serviceOrderId?: string;
  /** Inclui origens com saldo zero (para exibir histórico). */
  includeEmpty?: boolean;
}

/**
 * Origens de material de uma matrícula, com saldo por origem.
 *
 * - Cada item rastreado de RM vira uma origem, na ordem de retirada (mais antiga primeiro).
 * - O saldo efetivo de uma origem nunca passa do que a matrícula realmente tem em custódia.
 * - O que sobra na custódia, depois de cobrir os itens rastreados, é o "saldo legado":
 *   material que já estava na matrícula antes do controle por RM. Ele só pode ser
 *   movimentado de forma explícita (origem 'legado').
 */
export function getOriginBalances(
  collaborator: Collaborator | undefined,
  requisitions: SupplyRequisitionRM[],
  options: OriginOptions = {}
): OriginBalance[] {
  if (!collaborator) return [];

  const custodyLeft = new Map<string, number>();
  for (const c of collaborator.custody) {
    custodyLeft.set(c.productId, roundQty((custodyLeft.get(c.productId) || 0) + c.quantity));
  }

  const rms = requisitions
    .filter((r) => r.matricola === collaborator.matricola)
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date));

  const result: OriginBalance[] = [];

  for (const rm of rms) {
    for (const item of rm.items) {
      if (!isTrackedItem(item)) continue;
      const registered = Math.max(0, rmItemRemaining(item));
      const available = custodyLeft.get(item.productId) || 0;
      const effective = roundQty(Math.min(registered, available));
      custodyLeft.set(item.productId, roundQty(available - effective));

      if (options.serviceOrderId && rm.serviceOrderId && rm.serviceOrderId !== options.serviceOrderId) continue;
      if (effective <= QTY_EPSILON && !options.includeEmpty) continue;

      result.push({
        key: originKey(rm.id, item.itemId, item.productId),
        origin: 'rm',
        rmId: rm.id,
        rmNumber: rm.rmNumber,
        rmItemId: item.itemId,
        rmDate: rm.date,
        serviceOrderId: rm.serviceOrderId,
        serviceOrderCode: rm.serviceOrderCode,
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        unit: item.unit,
        requested: item.quantity,
        applied: rmItemApplied(item),
        returned: rmItemReturned(item),
        remaining: effective,
      });
    }
  }

  for (const c of collaborator.custody) {
    const left = custodyLeft.get(c.productId) || 0;
    if (left <= QTY_EPSILON && !options.includeEmpty) continue;
    if (result.some((r) => r.key === originKey(undefined, undefined, c.productId))) continue;
    result.push({
      key: originKey(undefined, undefined, c.productId),
      origin: 'legado',
      productId: c.productId,
      productName: c.productName,
      sku: c.sku,
      unit: c.unit,
      requested: left,
      applied: 0,
      returned: 0,
      remaining: left,
    });
  }

  return result;
}

/** Saldo por produto que a matrícula tem em custódia (soma de todas as origens). */
export function custodyQuantity(collaborator: Collaborator, productId: string): number {
  return roundQty(
    collaborator.custody.filter((c) => c.productId === productId).reduce((acc, c) => acc + c.quantity, 0)
  );
}

/** Próximo código sequencial no padrão PREFIXO-AAAA-NNN, sem repetir os já usados. */
export function nextSequentialCode(prefix: string, existing: string[], year: number, width = 3): string {
  const stem = `${prefix}-${year}-`;
  let max = 0;
  for (const code of existing) {
    if (code.startsWith(stem)) {
      const n = parseInt(code.slice(stem.length), 10);
      if (Number.isFinite(n) && n > max) max = n;
    }
  }
  return `${stem}${String(max + 1).padStart(width, '0')}`;
}

// ---------------------------------------------------------------------------
// Rastreabilidade
// ---------------------------------------------------------------------------

export type TraceEventType = 'retirada' | 'aplicacao' | 'devolucao';

export interface TraceEvent {
  type: TraceEventType;
  date: string;
  code: string; // número da RM, código da aplicação ou da devolução
  quantity: number;
  detail: string; // OS de destino ou condição da devolução
  recordId: string;
}

export interface ItemTrace {
  item: RequisitionItem;
  tracked: boolean;
  requested: number;
  applied: number;
  returned: number;
  remaining: number;
  events: TraceEvent[];
}

const CONDITION_LABEL: Record<string, string> = {
  perfeito: 'perfeito',
  revisao: 'em revisão',
  avariado: 'avariado',
};

/** Linha do tempo de cada item de uma RM: retirada, aplicações e devoluções ligadas a ele. */
export function buildRMTrace(
  rm: SupplyRequisitionRM,
  applications: SupplyApplicationRecord[],
  returns: SupplyReturnRecord[]
): ItemTrace[] {
  return rm.items.map((item) => {
    const tracked = isTrackedItem(item);
    const events: TraceEvent[] = [
      {
        type: 'retirada',
        date: rm.date,
        code: rm.rmNumber,
        quantity: item.quantity,
        detail: rm.serviceOrderCode ? `Retirada para ${rm.serviceOrderCode}` : 'Retirada sem OS vinculada',
        recordId: rm.id,
      },
    ];

    if (tracked) {
      for (const app of applications) {
        for (const line of app.items) {
          if (line.rmId === rm.id && line.rmItemId === item.itemId) {
            events.push({
              type: 'aplicacao',
              date: app.date,
              code: app.appCode,
              quantity: line.quantity,
              detail: `Aplicado em ${app.serviceOrderCode}`,
              recordId: app.id,
            });
          }
        }
      }
      for (const ret of returns) {
        for (const line of ret.items) {
          if (line.rmId === rm.id && line.rmItemId === item.itemId) {
            events.push({
              type: 'devolucao',
              date: ret.date,
              code: ret.returnCode,
              quantity: line.quantity,
              detail: `Devolvido ao Almoxarifado (${CONDITION_LABEL[line.condition] || line.condition})`,
              recordId: ret.id,
            });
          }
        }
      }
    }

    events.sort((a, b) => a.date.localeCompare(b.date));
    return {
      item,
      tracked,
      requested: item.quantity,
      applied: tracked ? rmItemApplied(item) : 0,
      returned: tracked ? rmItemReturned(item) : 0,
      remaining: tracked ? Math.max(0, rmItemRemaining(item)) : 0,
      events,
    };
  });
}

// ---------------------------------------------------------------------------
// Auditoria de integridade
// ---------------------------------------------------------------------------

export interface IntegrityIssue {
  severity: 'erro' | 'aviso';
  code: string;
  message: string;
  ref?: string;
}

export interface IntegrityReport {
  ok: boolean;
  issues: IntegrityIssue[];
  /** Registros anteriores ao controle por RM: preservados como estão, sem vínculo de origem. */
  legacy: { requisitions: number; applications: number; returns: number };
}

export interface IntegrityInput {
  collaborators: Collaborator[];
  products: Product[];
  requisitions: SupplyRequisitionRM[];
  applications: SupplyApplicationRecord[];
  returns: SupplyReturnRecord[];
  serviceOrders: ServiceOrder[];
}

/**
 * Confere o fluxo completo e aponta inconsistências. Não altera nenhum dado.
 * Erros indicam saldo ou vínculo que não fecha; avisos indicam algo a revisar.
 */
export function auditSupplyIntegrity(input: IntegrityInput): IntegrityReport {
  const { collaborators, products, requisitions, applications, returns, serviceOrders } = input;
  const issues: IntegrityIssue[] = [];
  const legacy = { requisitions: 0, applications: 0, returns: 0 };

  const sumLinked = (rm: SupplyRequisitionRM, item: RequisitionItem, kind: 'app' | 'ret'): number => {
    let total = 0;
    if (kind === 'app') {
      for (const a of applications) {
        for (const l of a.items) if (l.rmId === rm.id && l.rmItemId === item.itemId) total += l.quantity;
      }
    } else {
      for (const r of returns) {
        for (const l of r.items) if (l.rmId === rm.id && l.rmItemId === item.itemId) total += l.quantity;
      }
    }
    return roundQty(total);
  };

  for (const p of products) {
    if (p.currentStock < -QTY_EPSILON) {
      issues.push({
        severity: 'erro',
        code: 'ESTOQUE_NEGATIVO',
        message: `Estoque negativo no Almoxarifado para "${p.name}": ${p.currentStock} ${p.unit}.`,
        ref: p.id,
      });
    }
  }

  for (const rm of requisitions) {
    const trackedItems = rm.items.filter(isTrackedItem);
    if (trackedItems.length === 0) {
      legacy.requisitions += 1;
      continue;
    }
    for (const item of rm.items) {
      if (!isTrackedItem(item)) continue;
      const label = `${rm.rmNumber} · ${item.productName}`;
      if (rmItemRemaining(item) < -QTY_EPSILON) {
        issues.push({
          severity: 'erro',
          code: 'SALDO_NEGATIVO_RM',
          message: `Saldo negativo no item da RM (${label}): requisitado ${item.quantity}, aplicado ${rmItemApplied(item)}, devolvido ${rmItemReturned(item)}.`,
          ref: rm.id,
        });
      }
      const linkedApplied = sumLinked(rm, item, 'app');
      if (Math.abs(linkedApplied - rmItemApplied(item)) > QTY_EPSILON) {
        issues.push({
          severity: 'erro',
          code: 'APLICADO_DIVERGENTE',
          message: `Quantidade aplicada do item da RM (${label}) diverge dos registros de aplicação: item ${rmItemApplied(item)}, registros ${linkedApplied}.`,
          ref: rm.id,
        });
      }
      const linkedReturned = sumLinked(rm, item, 'ret');
      if (Math.abs(linkedReturned - rmItemReturned(item)) > QTY_EPSILON) {
        issues.push({
          severity: 'erro',
          code: 'DEVOLVIDO_DIVERGENTE',
          message: `Quantidade devolvida do item da RM (${label}) diverge dos registros de devolução: item ${rmItemReturned(item)}, registros ${linkedReturned}.`,
          ref: rm.id,
        });
      }
    }
  }

  for (const col of collaborators) {
    for (const c of col.custody) {
      if (c.quantity < -QTY_EPSILON) {
        issues.push({
          severity: 'erro',
          code: 'CUSTODIA_NEGATIVA',
          message: `Custódia negativa na matrícula ${col.matricola} para "${c.productName}": ${c.quantity} ${c.unit}.`,
          ref: col.matricola,
        });
      }
    }
    const rmsOfCol = requisitions.filter((r) => r.matricola === col.matricola);
    const trackedByProduct = new Map<string, number>();
    for (const rm of rmsOfCol) {
      for (const item of rm.items) {
        if (!isTrackedItem(item)) continue;
        trackedByProduct.set(
          item.productId,
          roundQty((trackedByProduct.get(item.productId) || 0) + Math.max(0, rmItemRemaining(item)))
        );
      }
    }
    for (const [productId, tracked] of trackedByProduct) {
      const inCustody = custodyQuantity(col, productId);
      if (inCustody + QTY_EPSILON < tracked) {
        const name = col.custody.find((c) => c.productId === productId)?.productName || productId;
        issues.push({
          severity: 'erro',
          code: 'CUSTODIA_MENOR_QUE_RM',
          message: `A custódia da matrícula ${col.matricola} para "${name}" (${inCustody}) é menor que a soma dos saldos das RMs (${tracked}).`,
          ref: col.matricola,
        });
      }
    }
  }

  const rmById = new Map(requisitions.map((r) => [r.id, r]));
  const orderById = new Map(serviceOrders.map((o) => [o.id, o]));

  for (const app of applications) {
    let hasLegacyLine = false;
    for (const line of app.items) {
      if (line.origin === 'legado') continue;
      if (!line.rmId || !line.rmItemId) {
        hasLegacyLine = true;
        continue;
      }
      const rm = rmById.get(line.rmId);
      const item = rm?.items.find((i) => i.itemId === line.rmItemId);
      if (!rm || !item) {
        issues.push({
          severity: 'erro',
          code: 'VINCULO_INEXISTENTE',
          message: `A aplicação ${app.appCode} aponta para uma RM ou item que não existe (${line.rmNumber || line.rmId}).`,
          ref: app.id,
        });
        continue;
      }
      if (rm.matricola !== app.matricola) {
        issues.push({
          severity: 'erro',
          code: 'MATRICULA_DIFERENTE',
          message: `A aplicação ${app.appCode} (matrícula ${app.matricola}) usa material da ${rm.rmNumber}, que pertence à matrícula ${rm.matricola}.`,
          ref: app.id,
        });
      }
      if (rm.serviceOrderId && rm.serviceOrderId !== app.serviceOrderId) {
        issues.push({
          severity: 'erro',
          code: 'OS_DIFERENTE_DA_RM',
          message: `A aplicação ${app.appCode} usa material da ${rm.rmNumber}, retirado para ${rm.serviceOrderCode}, mas foi lançada em ${app.serviceOrderCode}.`,
          ref: app.id,
        });
      }
    }
    if (hasLegacyLine) legacy.applications += 1;

    const order = orderById.get(app.serviceOrderId);
    if (!order) {
      issues.push({
        severity: 'aviso',
        code: 'OS_NAO_ENCONTRADA',
        message: `A OS ${app.serviceOrderCode} da aplicação ${app.appCode} não foi encontrada.`,
        ref: app.id,
      });
    }
  }

  for (const ret of returns) {
    let hasLegacyLine = false;
    for (const line of ret.items) {
      if (line.origin === 'legado') continue;
      if (!line.rmId || !line.rmItemId) {
        hasLegacyLine = true;
        continue;
      }
      const rm = rmById.get(line.rmId);
      const item = rm?.items.find((i) => i.itemId === line.rmItemId);
      if (!rm || !item) {
        issues.push({
          severity: 'erro',
          code: 'VINCULO_INEXISTENTE',
          message: `A devolução ${ret.returnCode} aponta para uma RM ou item que não existe (${line.rmNumber || line.rmId}).`,
          ref: ret.id,
        });
      } else if (rm.matricola !== ret.matricola) {
        issues.push({
          severity: 'erro',
          code: 'MATRICULA_DIFERENTE',
          message: `A devolução ${ret.returnCode} (matrícula ${ret.matricola}) devolve material da ${rm.rmNumber}, que pertence à matrícula ${rm.matricola}.`,
          ref: ret.id,
        });
      }
    }
    if (hasLegacyLine) legacy.returns += 1;
  }

  return { ok: issues.every((i) => i.severity !== 'erro'), issues, legacy };
}
