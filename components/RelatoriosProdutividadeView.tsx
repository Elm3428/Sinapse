'use client';

import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Award,
  Users,
  Printer,
  Download,
  Filter,
  ArrowRightLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
  Search
} from 'lucide-react';
import {
  Collaborator,
  ServiceOrder,
  Product,
  WarehouseEntry,
  SupplyRequisitionRM,
  SupplyApplicationRecord,
  SupplyReturnRecord
} from '@/types';

interface RelatoriosProdutividadeViewProps {
  collaborators: Collaborator[];
  serviceOrders: ServiceOrder[];
  products: Product[];
  entries: WarehouseEntry[];
  requisitions: SupplyRequisitionRM[];
  applications: SupplyApplicationRecord[];
  returns: SupplyReturnRecord[];
}

export function RelatoriosProdutividadeView({
  collaborators,
  serviceOrders,
  products,
  entries,
  requisitions,
  applications,
  returns,
}: RelatoriosProdutividadeViewProps) {
  const [selectedProductId, setSelectedProductId] = useState<string>('todos');
  const [reportTab, setReportTab] = useState<'produtividade' | 'kardex'>('produtividade');
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Produtividade por Colaborador
  const collaboratorStats = collaborators.map((col) => {
    const ordersAssigned = serviceOrders.filter((o) => o.assignedMatricola === col.matricola);
    const ordersCompleted = ordersAssigned.filter((o) => o.status === 'concluido');
    const billedValue = ordersCompleted.reduce((acc, o) => acc + o.totalReal, 0);

    const rmsCount = requisitions.filter((r) => r.matricola === col.matricola).length;
    const itemsTaken = requisitions
      .filter((r) => r.matricola === col.matricola)
      .reduce((acc, r) => acc + r.items.reduce((sum, i) => sum + i.quantity, 0), 0);

    const itemsApplied = applications
      .filter((a) => a.matricola === col.matricola)
      .reduce((acc, a) => acc + a.items.reduce((sum, i) => sum + i.quantity, 0), 0);

    const itemsReturned = returns
      .filter((ret) => ret.matricola === col.matricola)
      .reduce((acc, ret) => acc + ret.items.reduce((sum, i) => sum + i.quantity, 0), 0);

    const custodyRemaining = col.custody.reduce((acc, c) => acc + c.quantity, 0);

    // Taxa de aproveitamento de sobras (itens devolvidos / sobras geradas)
    const accountabilityRate =
      itemsTaken > 0
        ? Math.min(100, (((itemsApplied + itemsReturned) / itemsTaken) * 100)).toFixed(1)
        : '100.0';

    return {
      collaborator: col,
      ordersAssignedCount: ordersAssigned.length,
      ordersCompletedCount: ordersCompleted.length,
      billedValue,
      rmsCount,
      itemsTaken,
      itemsApplied,
      itemsReturned,
      custodyRemaining,
      accountabilityRate,
    };
  });

  // Ordena por faturamento e ordens concluídas
  collaboratorStats.sort((a, b) => b.billedValue - a.billedValue || b.ordersCompletedCount - a.ordersCompletedCount);

  // 2. Timeline do Kardex (Rastreabilidade de Insumos)
  interface KardexMovement {
    id: string;
    date: string;
    type: 'ENTRADA' | 'REQUISICAO_RM' | 'APLICACAO_OS' | 'DEVOLUCAO';
    productName: string;
    sku: string;
    quantity: number;
    unit: string;
    referenceCode: string;
    entityName: string; // Fornecedor, Matrícula Técnico, ou OS
    notes?: string;
  }

  const kardexList: KardexMovement[] = [];

  // Entradas
  entries.forEach((e) => {
    e.items.forEach((it) => {
      kardexList.push({
        id: `k-ent-${e.id}-${it.productId}`,
        date: e.entryDate,
        type: 'ENTRADA',
        productName: it.productName,
        sku: it.sku,
        quantity: it.quantity,
        unit: it.unit,
        referenceCode: e.invoiceNumber,
        entityName: e.supplier,
        notes: e.notes,
      });
    });
  });

  // Requisições RM
  requisitions.forEach((r) => {
    r.items.forEach((it) => {
      kardexList.push({
        id: `k-rm-${r.id}-${it.productId}`,
        date: r.date,
        type: 'REQUISICAO_RM',
        productName: it.productName,
        sku: it.sku,
        quantity: it.quantity,
        unit: it.unit,
        referenceCode: r.rmNumber,
        entityName: `${r.matricola} (${r.technicianName})`,
        notes: r.notes || r.serviceOrderCode,
      });
    });
  });

  // Aplicações em OS
  applications.forEach((a) => {
    a.items.forEach((it) => {
      kardexList.push({
        id: `k-app-${a.id}-${it.productId}`,
        date: a.date,
        type: 'APLICACAO_OS',
        productName: it.productName,
        sku: it.sku,
        quantity: it.quantity,
        unit: it.unit,
        referenceCode: a.serviceOrderCode,
        entityName: `${a.matricola} ➔ ${a.clientName}`,
        notes: a.notes,
      });
    });
  });

  // Devoluções
  returns.forEach((ret) => {
    ret.items.forEach((it) => {
      kardexList.push({
        id: `k-ret-${ret.id}-${it.productId}`,
        date: ret.date,
        type: 'DEVOLUCAO',
        productName: it.productName,
        sku: it.sku,
        quantity: it.quantity,
        unit: it.unit,
        referenceCode: ret.returnCode,
        entityName: `${ret.matricola} (${ret.technicianName})`,
        notes: ret.notes,
      });
    });
  });

  // Ordena por data decrescente
  kardexList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Filtro de Produto no Kardex
  const filteredKardex = kardexList.filter((k) => {
    const matchesProduct =
      selectedProductId === 'todos' ||
      products.find((p) => p.id === selectedProductId)?.sku === k.sku;
    const matchesSearch =
      k.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.referenceCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.entityName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesProduct && matchesSearch;
  });

  const handleExportCSV = () => {
    const rows = [
      ['Data', 'Tipo Movimento', 'Insumo', 'SKU', 'Quantidade', 'Unidade', 'Referencia', 'Origem/Destino'],
      ...filteredKardex.map((k) => [
        new Date(k.date).toLocaleString('pt-BR'),
        k.type,
        k.productName,
        k.sku,
        k.quantity.toString(),
        k.unit,
        k.referenceCode,
        k.entityName,
      ]),
    ];
    const csvContent =
      'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(';')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `kardex_aniel_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header do Módulo de Produtividade */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Relatórios de Produtividade & Rastreabilidade em Tempo Real
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Métricas de desempenho técnico por matrícula e auditoria integral de movimentação de materiais (Kardex).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Imprimir Relatório</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Seleção de Aba: Produtividade Técnica vs Kardex de Insumos */}
      <div className="flex items-center bg-slate-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setReportTab('produtividade')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition-all ${
            reportTab === 'produtividade'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Award className="w-3.5 h-3.5 text-amber-600" />
          <span>Produtividade por Matrícula</span>
        </button>

        <button
          onClick={() => setReportTab('kardex')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition-all ${
            reportTab === 'kardex'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600" />
          <span>Rastreabilidade Integral (Kardex)</span>
        </button>
      </div>

      {/* 3. ABA 1: PRODUTIVIDADE TÉCNICA */}
      {reportTab === 'produtividade' && (
        <div className="space-y-6">
          {/* Tabela de Produtividade dos Técnicos */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Desempenho Operacional por Matrícula
                </h2>
                <p className="text-xs text-slate-500">
                  Acompanhamento de OS concluídas, receita gerada e conciliação de insumos.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-2.5 px-4">Classificação</th>
                    <th className="py-2.5 px-4">Colaborador / Cargo</th>
                    <th className="py-2.5 px-4 text-center">OS Atribuídas</th>
                    <th className="py-2.5 px-4 text-center">OS Concluídas</th>
                    <th className="py-2.5 px-4 text-right">Insumos Retirados</th>
                    <th className="py-2.5 px-4 text-right">Aplicados em OS</th>
                    <th className="py-2.5 px-4 text-right">Sobras Devolvidas</th>
                    <th className="py-2.5 px-4 text-right">Saldo em Custódia</th>
                    <th className="py-2.5 px-4 text-right">Faturamento Real</th>
                    <th className="py-2.5 px-4 text-right">Conformidade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {collaboratorStats.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400 font-sans text-xs">
                        <div className="flex flex-col items-center justify-center gap-1.5">
                          <Users className="w-8 h-8 text-slate-300" />
                          <p className="font-semibold text-slate-600">Nenhum colaborador cadastrado ainda.</p>
                          <p className="text-[11px] text-slate-400">Cadastre colaboradores no menu "Cadastros" para acompanhar o ranking de produtividade e faturamento.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    collaboratorStats.map((stat, idx) => (
                    <tr key={stat.collaborator.id} className="hover:bg-slate-50/70 transition-colors font-sans">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800 whitespace-nowrap">
                        #{idx + 1}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          {stat.collaborator.name}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          Matrícula: {stat.collaborator.matricola} · {stat.collaborator.role}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-medium text-slate-700">
                        {stat.ordersAssignedCount}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-emerald-700">
                        {stat.ordersCompletedCount}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-800">
                        {stat.itemsTaken} un
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-indigo-700 font-semibold">
                        {stat.itemsApplied} un
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-700 font-semibold">
                        {stat.itemsReturned} un
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {stat.custodyRemaining} un
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums whitespace-nowrap">
                        R$ {stat.billedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span className="font-mono font-bold text-xs text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                          {stat.accountabilityRate}%
                        </span>
                      </td>
                    </tr>
                  )))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. ABA 2: KARDEX & AUDITORIA DE PASCAGEM DE INSUMOS */}
      {reportTab === 'kardex' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white border border-slate-200 rounded-xl">
            <div className="flex items-center gap-3">
              <Filter className="w-4 h-4 text-slate-400" />
              <label className="text-xs font-semibold text-slate-700">Filtrar por Insumo:</label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="todos">Todos os Insumos ({products.length} itens)</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.sku}] {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Filtrar por código, OS ou técnico..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-2.5 px-4">Data / Hora</th>
                    <th className="py-2.5 px-4">Tipo Movimento</th>
                    <th className="py-2.5 px-4">Insumo</th>
                    <th className="py-2.5 px-4 text-right">Quantidade</th>
                    <th className="py-2.5 px-4">Documento / Ref</th>
                    <th className="py-2.5 px-4">Origem / Destino</th>
                    <th className="py-2.5 px-4">Observações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {filteredKardex.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 font-sans text-xs">
                        <div className="flex flex-col items-center justify-center gap-1.5">
                          <ArrowRightLeft className="w-8 h-8 text-slate-300" />
                          <p className="font-semibold text-slate-600">Nenhuma movimentação de estoque registrada no Kardex.</p>
                          <p className="text-[11px] text-slate-400">Entradas de nota fiscal, requisições RM, aplicações em OS e devoluções serão auditadas automaticamente aqui.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredKardex.map((k) => (
                    <tr key={k.id} className="hover:bg-slate-50/70 transition-colors font-sans">
                      <td className="py-3 px-4 text-slate-600 text-xs whitespace-nowrap font-mono">
                        {new Date(k.date).toLocaleString('pt-BR')}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            k.type === 'ENTRADA'
                              ? 'bg-emerald-50 text-emerald-800'
                              : k.type === 'REQUISICAO_RM'
                              ? 'bg-blue-50 text-blue-800'
                              : k.type === 'APLICACAO_OS'
                              ? 'bg-indigo-50 text-indigo-800'
                              : 'bg-teal-50 text-teal-800'
                          }`}
                        >
                          {k.type === 'ENTRADA'
                            ? '+ Entrada NF (Almox.)'
                            : k.type === 'REQUISICAO_RM'
                            ? '→ RM (Para Matrícula)'
                            : k.type === 'APLICACAO_OS'
                            ? '✓ Aplicação em OS'
                            : '↺ Devolução de Sobra'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{k.productName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">SKU: {k.sku}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums whitespace-nowrap">
                        {k.quantity} {k.unit}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-700 whitespace-nowrap">
                        {k.referenceCode}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-700">
                        {k.entityName}
                      </td>
                      <td className="py-3 px-4 max-w-xs text-slate-500 text-[11px] truncate">
                        {k.notes || '-'}
                      </td>
                    </tr>
                  )))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
