'use client';

import React from 'react';
import {
  FileSpreadsheet,
  ArrowRightLeft,
  PackageCheck,
  Undo2,
  AlertTriangle,
  Clock,
  Truck,
  TrendingUp,
  CheckCircle2,
  Calendar,
  ArrowUpRight,
  Plus,
  Users
} from 'lucide-react';
import {
  Client,
  Collaborator,
  Product,
  ServiceOrder,
  Vehicle,
  SupplyRequisitionRM,
  WarehouseEntry,
  SupplyApplicationRecord,
  SupplyReturnRecord
} from '@/types';
import { ActiveSection } from './Sidebar';

interface DashboardViewProps {
  clients: Client[];
  collaborators: Collaborator[];
  products: Product[];
  vehicles: Vehicle[];
  serviceOrders: ServiceOrder[];
  entries: WarehouseEntry[];
  requisitions: SupplyRequisitionRM[];
  applications: SupplyApplicationRecord[];
  returns: SupplyReturnRecord[];
  onNavigate: (section: ActiveSection) => void;
  onOpenNewOrderModal: () => void;
}

export function DashboardView({
  clients,
  collaborators,
  products,
  vehicles,
  serviceOrders,
  entries,
  requisitions,
  applications,
  returns,
  onNavigate,
  onOpenNewOrderModal,
}: DashboardViewProps) {
  // Cálculos de Indicadores
  const activeOrders = serviceOrders.filter(
    (o) => o.status === 'em_execucao' || o.status === 'aprovado'
  );
  const budgetOrders = serviceOrders.filter((o) => o.status === 'orcamento');
  const completedOrders = serviceOrders.filter((o) => o.status === 'concluido');

  // Valor total em almoxarifado
  const warehouseTotalValue = products.reduce(
    (acc, p) => acc + p.currentStock * p.unitCost,
    0
  );

  // Insumos em custódia nas matrículas
  let totalItemsInCustody = 0;
  let totalCustodyValue = 0;
  collaborators.forEach((col) => {
    col.custody.forEach((item) => {
      totalItemsInCustody += item.quantity;
      const prodRef = products.find((p) => p.id === item.productId || p.sku === item.sku);
      if (prodRef) {
        totalCustodyValue += item.quantity * prodRef.unitCost;
      }
    });
  });

  // Produtos abaixo do estoque mínimo
  const lowStockProducts = products.filter((p) => p.currentStock <= p.minStock);

  // Valor faturado em serviços concluídos
  const totalBilled = completedOrders.reduce((acc, o) => acc + o.totalReal, 0);

  // Total de itens movimentados
  const totalEntriesQty = entries.reduce(
    (acc, e) => acc + e.items.reduce((sum, i) => sum + i.quantity, 0),
    0
  );
  const totalRMQty = requisitions.reduce(
    (acc, r) => acc + r.items.reduce((sum, i) => sum + i.quantity, 0),
    0
  );
  const totalAppliedQty = applications.reduce(
    (acc, a) => acc + a.items.reduce((sum, i) => sum + i.quantity, 0),
    0
  );
  const totalReturnedQty = returns.reduce(
    (acc, ret) => acc + ret.items.reduce((sum, i) => sum + i.quantity, 0),
    0
  );

  // Taxa de devolução/reaproveitamento de sobras
  const returnRate =
    totalRMQty > 0 ? ((totalReturnedQty / totalRMQty) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      {/* 1. Header do Dashboard com Ações Rápidas */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Painel Operacional & Indicadores de Gestão
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitoramento analítico em tempo real do fluxo completo de almoxarifado, ordens de serviço e produtividade.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('almoxarifado_entradas')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
          >
            <span>+ Entrada NF</span>
          </button>
          <button
            onClick={() => onNavigate('servicos_requisicao_rm')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors shadow-xs"
          >
            <span>+ Emitir RM</span>
          </button>
          <button
            onClick={() => onNavigate('servicos_aplicacao')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors shadow-xs"
          >
            <span>+ Aplicar Insumo</span>
          </button>
          <button
            onClick={() => onNavigate('servicos_devolucao')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors shadow-xs"
          >
            <span>+ Devolver Sobra</span>
          </button>
          <button
            onClick={onOpenNewOrderModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Orçamento/OS</span>
          </button>
        </div>
      </div>

      {/* 2. Grid de 4 Cards de Métricas Principais (Single elevation) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Ordens de Serviço */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">
              Ordens de Serviço
            </span>
            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {activeOrders.length}
            <span className="text-xs font-normal text-slate-500 ml-1.5">ativas</span>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{budgetOrders.length} orçamentos</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-700 font-medium">{completedOrders.length} concluídas</span>
          </div>
        </div>

        {/* Card 2: Insumos em Custódia com Técnicos */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">
              Em Custódia (Matrícula)
            </span>
            <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {totalItemsInCustody}
            <span className="text-xs font-normal text-slate-500 ml-1.5">unidades</span>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Valor em trânsito:</span>
            <span className="font-mono font-semibold text-slate-800">
              R$ {totalCustodyValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Card 3: Almoxarifado Central */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">
              Almoxarifado Central
            </span>
            <PackageCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            R$ {warehouseTotalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{products.length} itens cadastrados</span>
            <span aria-hidden="true">·</span>
            <span className={lowStockProducts.length > 0 ? 'text-amber-700 font-medium' : 'text-slate-500'}>
              {lowStockProducts.length} em nível crítico
            </span>
          </div>
        </div>

        {/* Card 4: Faturamento & Aproveitamento de Sobras */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">
              Devolução de Sobras
            </span>
            <Undo2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {returnRate}%
            <span className="text-xs font-normal text-slate-500 ml-1.5">reaproveitadas</span>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Desperdício zero</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono font-medium text-slate-700">
              {totalReturnedQty} un devolvidas
            </span>
          </div>
        </div>
      </div>

      {/* 3. Seção Visual: Fluxo Ciclo de Insumos & Produtividade por Matrícula */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel Esquerdo: Ciclo Operacional de Insumos (O Core Solicitado) */}
        <div className="lg:col-span-2 p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Ciclo Fechado de Insumos (Kardex Operacional)
              </h2>
              <p className="text-xs text-slate-500">
                Rastreabilidade de ponta a ponta desde a entrada da NF até a devolução da sobra.
              </p>
            </div>
            <button
              onClick={() => onNavigate('relatorios_produtividade')}
              className="text-xs text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1"
            >
              <span>Ver relatório</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Gráfico Visual do Fluxo */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-y border-slate-100 my-3">
            {/* Etapa 1 */}
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="text-[11px] font-semibold text-slate-500 mb-1">
                1. Entrada Almoxarifado
              </div>
              <div className="text-xl font-bold font-mono tabular-nums text-slate-900">
                {totalEntriesQty}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                {entries.length} NFs registradas
              </div>
            </div>

            {/* Etapa 2 */}
            <div className="p-3 bg-blue-50/60 rounded-lg">
              <div className="text-[11px] font-semibold text-blue-800 mb-1">
                2. Requisição RM
              </div>
              <div className="text-xl font-bold font-mono tabular-nums text-blue-900">
                {totalRMQty}
              </div>
              <div className="text-[10px] text-blue-700 mt-1">
                Sai Almox. → Entra Matrícula
              </div>
            </div>

            {/* Etapa 3 */}
            <div className="p-3 bg-indigo-50/60 rounded-lg">
              <div className="text-[11px] font-semibold text-indigo-800 mb-1">
                3. Aplicação em OS
              </div>
              <div className="text-xl font-bold font-mono tabular-nums text-indigo-900">
                {totalAppliedQty}
              </div>
              <div className="text-[10px] text-indigo-700 mt-1">
                Sai Matrícula → Entra Serviço
              </div>
            </div>

            {/* Etapa 4 */}
            <div className="p-3 bg-emerald-50/60 rounded-lg">
              <div className="text-[11px] font-semibold text-emerald-800 mb-1">
                4. Devolução de Sobras
              </div>
              <div className="text-xl font-bold font-mono tabular-nums text-emerald-900">
                {totalReturnedQty}
              </div>
              <div className="text-[10px] text-emerald-700 mt-1">
                Sobra → Volta Almoxarifado
              </div>
            </div>
          </div>

          {/* Custódia Atual por Colaborador */}
          <div className="mt-4">
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2.5">
              Saldo em Custódia por Colaborador (Matrícula)
            </h3>
            {collaborators.length === 0 ? (
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg text-center text-xs text-slate-500">
                Nenhum colaborador cadastrado ainda.{' '}
                <button
                  onClick={() => onNavigate('cadastros_colaboradores')}
                  className="text-slate-900 font-semibold hover:underline"
                >
                  Cadastrar Colaborador (com Matrícula) →
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {collaborators.map((col) => {
                  const totalColQty = col.custody.reduce((acc, c) => acc + c.quantity, 0);
                  return (
                    <div
                      key={col.id}
                      className="flex items-center justify-between p-2.5 bg-slate-50/70 border border-slate-100 rounded-lg text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-slate-800 bg-white border border-slate-200 px-2 py-0.5 rounded">
                          {col.matricola}
                        </span>
                        <div>
                          <div className="font-semibold text-slate-900">{col.name}</div>
                          <div className="text-[11px] text-slate-500">{col.role}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-right">
                        <div>
                          <div className="font-mono font-bold text-slate-900">
                            {totalColQty} itens
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {col.custody.length} tipos de insumos
                          </div>
                        </div>
                        <button
                          onClick={() => onNavigate('servicos_aplicacao')}
                          className="px-2 py-1 text-[11px] font-medium text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-100"
                        >
                          Aplicar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Painel Direito: Alertas de Estoque Mínimo & Frota */}
        <div className="space-y-6">
          {/* Card Alertas de Estoque Mínimo */}
          <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  Estoque Mínimo (Almoxarifado)
                </h2>
              </div>
              <span className="text-xs font-mono font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded">
                {lowStockProducts.length} itens
              </span>
            </div>

            {products.length === 0 ? (
              <p className="text-xs text-slate-500 py-3">
                Nenhum insumo no Almoxarifado.{' '}
                <button
                  onClick={() => onNavigate('cadastros_produtos')}
                  className="text-slate-900 font-semibold hover:underline"
                >
                  Cadastrar Insumos →
                </button>
              </p>
            ) : lowStockProducts.length === 0 ? (
              <p className="text-xs text-slate-500 py-3">
                Todos os insumos estão acima do nível de segurança.
              </p>
            ) : (
              <div className="space-y-2 mt-2">
                {lowStockProducts.slice(0, 4).map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2.5 bg-amber-50/40 border border-amber-100 rounded-lg text-xs"
                  >
                    <div>
                      <div className="font-medium text-slate-900">{p.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        SKU: {p.sku} · Mín: {p.minStock} {p.unit}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-amber-700">
                        {p.currentStock} {p.unit}
                      </div>
                      <button
                        onClick={() => onNavigate('almoxarifado_entradas')}
                        className="text-[10px] text-blue-700 hover:underline font-medium"
                      >
                        Repor
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card Frota Operacional */}
          <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-slate-700" />
                <h2 className="text-sm font-bold text-slate-900">
                  Veículos em Campo
                </h2>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                {vehicles.length} cadastrados
              </span>
            </div>

            {vehicles.length === 0 ? (
              <p className="text-xs text-slate-500 py-3">
                Nenhum veículo cadastrado na frota.{' '}
                <button
                  onClick={() => onNavigate('cadastros_veiculos')}
                  className="text-slate-900 font-semibold hover:underline"
                >
                  Cadastrar Veículo →
                </button>
              </p>
            ) : (
              <div className="space-y-2">
                {vehicles.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between p-2 bg-slate-50 border border-slate-100 rounded-lg text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                        {v.plate}
                      </span>
                      <div>
                        <div className="font-medium text-slate-800">
                          {v.brand} {v.model}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Resp: {v.assignedMatricola || 'Livre'}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                        v.status === 'em_servico'
                          ? 'bg-blue-50 text-blue-700'
                          : v.status === 'disponivel'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {v.status === 'em_servico'
                        ? 'Em Campo'
                        : v.status === 'disponivel'
                        ? 'Disponível'
                        : 'Manutenção'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Tabela de Agendamentos & Ordens Recentes */}
      <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Agendamentos & Ordens de Serviço Recentes
            </h2>
            <p className="text-xs text-slate-500">
              Controle unificado de clientes, veículos, colaboradores e cronogramas de atendimento.
            </p>
          </div>
          <button
            onClick={() => onNavigate('servicos_orcamentos')}
            className="text-xs text-slate-700 hover:text-slate-900 font-medium flex items-center gap-1"
          >
            <span>Ver todas as OS</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {serviceOrders.length === 0 ? (
          <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-lg border border-slate-100 space-y-2">
            <div className="font-semibold text-slate-700 text-xs">
              Nenhuma ordem de serviço cadastrada ainda.
            </div>
            <p className="text-slate-500 text-[11px]">
              Crie seu primeiro orçamento ou ordem de serviço vinculando cliente, equipe e insumos.
            </p>
            <button
              onClick={onOpenNewOrderModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Criar Primeiro Orçamento / OS</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Código</th>
                  <th className="py-2.5 px-3">Cliente</th>
                  <th className="py-2.5 px-3">Serviço / Escopo</th>
                  <th className="py-2.5 px-3">Técnico (Matrícula)</th>
                  <th className="py-2.5 px-3">Agendamento</th>
                  <th className="py-2.5 px-3">Veículo</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Total Real</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {serviceOrders.slice(0, 5).map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                    {order.code}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-900">{order.clientName}</div>
                    <div className="text-[11px] text-slate-500">{order.clientPhone}</div>
                  </td>
                  <td className="py-3 px-3 max-w-xs">
                    <div className="font-medium text-slate-800 truncate">{order.title}</div>
                    <div className="text-[11px] text-slate-500 truncate">{order.description}</div>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="font-medium text-slate-800">{order.assignedTechnicianName}</div>
                    <div className="text-[10px] font-mono text-slate-500">{order.assignedMatricola}</div>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="flex items-center gap-1 text-slate-700">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{order.scheduledDate}</span>
                    </div>
                    {order.scheduledTime && (
                      <div className="text-[10px] text-slate-500">{order.scheduledTime}</div>
                    )}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className="font-mono text-xs text-slate-700">
                      {order.vehiclePlate || '-'}
                    </span>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                        order.status === 'em_execucao'
                          ? 'bg-blue-50 text-blue-700'
                          : order.status === 'concluido'
                          ? 'bg-emerald-50 text-emerald-700'
                          : order.status === 'aprovado'
                          ? 'bg-indigo-50 text-indigo-700'
                          : order.status === 'orcamento'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {order.status === 'orcamento'
                        ? 'Orçamento'
                        : order.status === 'aprovado'
                        ? 'Aprovado'
                        : order.status === 'em_execucao'
                        ? 'Em Execução'
                        : order.status === 'concluido'
                        ? 'Concluído'
                        : 'Cancelado'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 tabular-nums whitespace-nowrap">
                    R$ {(order.totalReal > 0 ? order.totalReal : order.totalEstimated).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
    </div>
  );
}
