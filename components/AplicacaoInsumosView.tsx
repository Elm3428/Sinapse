'use client';

import React, { useState } from 'react';
import {
  Wrench,
  ArrowRight,
  UserSquare2,
  FileSpreadsheet,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Search,
  Check,
  Calendar
} from 'lucide-react';
import {
  Collaborator,
  ServiceOrder,
  SupplyApplicationRecord,
  SupplyRequisitionRM,
  ApplicationItem
} from '@/types';
import {
  QTY_EPSILON,
  getOriginBalances,
  nextSequentialCode,
  originKey,
  roundQty
} from '@/lib/supplyTrace';

interface AplicacaoInsumosViewProps {
  collaborators: Collaborator[];
  serviceOrders: ServiceOrder[];
  applications: SupplyApplicationRecord[];
  requisitions: SupplyRequisitionRM[];
  preselectedOrderId?: string;
  onProcessApplication: (app: SupplyApplicationRecord) => boolean;
}

const newRequestId = () => `app-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const itemKey = (i: ApplicationItem) => originKey(i.rmId, i.rmItemId, i.productId);

export function AplicacaoInsumosView({
  collaborators,
  serviceOrders,
  applications,
  requisitions,
  preselectedOrderId,
  onProcessApplication,
}: AplicacaoInsumosViewProps) {
  const [matricola, setMatricola] = useState(collaborators[0]?.matricola || '');
  const [serviceOrderId, setServiceOrderId] = useState(preselectedOrderId || '');
  const [responsibleName, setResponsibleName] = useState('');
  const [notes, setNotes] = useState('');

  // Itens para aplicar (cada linha aponta para o item da RM de origem)
  const [items, setItems] = useState<ApplicationItem[]>([]);
  const [selectedOriginKey, setSelectedOriginKey] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  // Identificador único do lançamento: se o formulário for enviado duas vezes, o armazenamento barra a segunda
  const [requestId, setRequestId] = useState(newRequestId);

  const selectedCollab = collaborators.find((c) => c.matricola === matricola);
  const selectedOrder = serviceOrders.find((o) => o.id === serviceOrderId);

  const openOrders = serviceOrders.filter((o) => o.status !== 'cancelado' && o.status !== 'concluido');
  // Só entram na lista as OS em que esta matrícula tem material para aplicar
  const ordersWithBalance = openOrders.filter(
    (o) => getOriginBalances(selectedCollab, requisitions, { serviceOrderId: o.id }).length > 0
  );

  // Produtos requisitados pela matrícula, cada um com a RM de origem e o saldo do item
  const origins = getOriginBalances(selectedCollab, requisitions, {
    serviceOrderId: serviceOrderId || undefined,
  });
  const selectedOrigin = origins.find((o) => o.key === selectedOriginKey);

  const stagedByKey = new Map<string, number>();
  for (const it of items) {
    stagedByKey.set(itemKey(it), roundQty((stagedByKey.get(itemKey(it)) || 0) + it.quantity));
  }
  const availableOf = (o: { key: string; remaining: number }) =>
    roundQty(o.remaining - (stagedByKey.get(o.key) || 0));

  const rmOrderCompatible = (rmId: string | undefined, orderId: string) => {
    const rm = rmId ? requisitions.find((r) => r.id === rmId) : undefined;
    return !rm?.serviceOrderId || rm.serviceOrderId === orderId;
  };

  const handleChangeMatricola = (value: string) => {
    setMatricola(value);
    setSelectedOriginKey('');
    setItems([]);
    setErrorMessage('');
    setSuccessMessage('');
    const col = collaborators.find((c) => c.matricola === value);
    if (serviceOrderId && getOriginBalances(col, requisitions, { serviceOrderId }).length === 0) {
      setServiceOrderId('');
    }
  };

  const handleChangeOrder = (value: string) => {
    setServiceOrderId(value);
    setErrorMessage('');
    if (value) {
      setItems(items.filter((i) => i.origin === 'legado' || rmOrderCompatible(i.rmId, value)));
      if (selectedOrigin?.serviceOrderId && selectedOrigin.serviceOrderId !== value) setSelectedOriginKey('');
    }
  };

  const handleSelectOrigin = (key: string) => {
    setSelectedOriginKey(key);
    setErrorMessage('');
    const origin = origins.find((o) => o.key === key);
    // RM vinculada a uma OS: a OS de destino é a da própria RM
    if (origin?.serviceOrderId && !serviceOrderId && openOrders.some((o) => o.id === origin.serviceOrderId)) {
      setServiceOrderId(origin.serviceOrderId);
    }
  };

  const handleAddItemToApply = () => {
    if (!selectedOrigin) return;
    setErrorMessage('');
    const qty = parseFloat(quantity);

    if (!Number.isFinite(qty) || qty <= 0) {
      setErrorMessage('Informe uma quantidade maior que zero.');
      return;
    }
    if (!serviceOrderId) {
      setErrorMessage('Selecione a Ordem de Serviço de destino antes de adicionar o insumo.');
      return;
    }
    if (selectedOrigin.serviceOrderId && selectedOrigin.serviceOrderId !== serviceOrderId) {
      setErrorMessage(
        `O material da ${selectedOrigin.rmNumber} foi retirado para ${selectedOrigin.serviceOrderCode} e só pode ser aplicado nessa OS.`
      );
      return;
    }

    const available = availableOf(selectedOrigin);
    if (qty > available + QTY_EPSILON) {
      const where = selectedOrigin.origin === 'rm' ? `na ${selectedOrigin.rmNumber}` : 'no saldo anterior ao controle por RM';
      setErrorMessage(
        `Só restam ${available} ${selectedOrigin.unit} de "${selectedOrigin.productName}" ${where}. Não é possível aplicar ${qty} ${selectedOrigin.unit}.`
      );
      return;
    }

    const existingIndex = items.findIndex((i) => itemKey(i) === selectedOrigin.key);
    if (existingIndex >= 0) {
      const updated = [...items];
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: roundQty(updated[existingIndex].quantity + qty),
      };
      setItems(updated);
    } else {
      setItems([
        ...items,
        {
          productId: selectedOrigin.productId,
          productName: selectedOrigin.productName,
          sku: selectedOrigin.sku,
          unit: selectedOrigin.unit,
          quantity: roundQty(qty),
          origin: selectedOrigin.origin,
          rmId: selectedOrigin.rmId,
          rmNumber: selectedOrigin.rmNumber,
          rmItemId: selectedOrigin.rmItemId,
        },
      ]);
    }

    setSelectedOriginKey('');
    setQuantity('1');
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!selectedCollab || !selectedOrder || items.length === 0) {
      setErrorMessage('Selecione o colaborador, a Ordem de Serviço e ao menos um insumo a ser aplicado.');
      return;
    }

    const newAppRecord: SupplyApplicationRecord = {
      id: requestId,
      appCode: nextSequentialCode(
        'APL',
        applications.map((a) => a.appCode),
        new Date().getFullYear()
      ),
      date: new Date().toISOString(),
      matricola: selectedCollab.matricola,
      technicianName: selectedCollab.name,
      serviceOrderId: selectedOrder.id,
      serviceOrderCode: selectedOrder.code,
      clientName: selectedOrder.clientName,
      items,
      responsibleName: responsibleName.trim() || selectedCollab.name,
      notes,
    };

    const ok = onProcessApplication(newAppRecord);
    if (ok) {
      const from = Array.from(new Set(items.map((i) => i.rmNumber).filter(Boolean))).join(', ');
      setSuccessMessage(
        `Aplicação confirmada! Baixados o saldo do item da RM${from ? ` (${from})` : ''}, a custódia da matrícula ${selectedCollab.matricola} e lançado o consumo na ${selectedOrder.code}.`
      );
      setItems([]);
      setNotes('');
      setSelectedOriginKey('');
      setRequestId(newRequestId());
    }
  };

  const filteredApps = applications.filter(
    (a) =>
      a.appCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.matricola.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.serviceOrderCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.items.some((i) => (i.rmNumber || '').toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* 1. Header & Banner Visual Explicativo */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Aplicação de Insumos em Serviços
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Apontamento de materiais gastos em campo. Baixa a custódia da matrícula do colaborador e lança no custo real da OS.
          </p>
        </div>
      </div>

      {/* 2. Banner de Regra de Negócio: Sai da Matrícula -> Aplica no Serviço */}
      <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
              APL
            </div>
            <div>
              <div className="font-bold text-indigo-950">
                Regra Operacional: Matrícula do Colaborador ➔ Aplicação no Serviço (OS)
              </div>
              <div className="text-indigo-800 text-[11px] mt-0.5">
                O insumo que estava na custódia do técnico é consumido e registrado como realizado na Ordem de Serviço, atualizando o custo real da operação.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono font-bold text-xs bg-white/80 px-3 py-1.5 rounded-lg border border-indigo-200 text-indigo-900 shrink-0">
            <span>Matrícula Técnico</span>
            <ArrowRight className="w-4 h-4 text-indigo-600" />
            <span className="text-emerald-700">OS Executada</span>
          </div>
        </div>
      </div>

      {/* Mensagens de Feedback */}
      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* 3. Grid: Formulário de Aplicação (Esquerda) + Insumos em Custódia (Direita) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Formulário de Apontamento (7 colunas) */}
        <div className="lg:col-span-7 p-5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">
              Lançar Consumo de Insumos na Ordem de Serviço
            </h2>
            <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
              Apontamento de Campo
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Matrícula do Técnico Responsável *
                </label>
                <select
                  required
                  value={matricola}
                  onChange={(e) => handleChangeMatricola(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 font-mono font-medium focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  {collaborators.length === 0 ? (
                    <option value="">Nenhum colaborador cadastrado</option>
                  ) : (
                    collaborators.map((c) => (
                      <option key={c.id} value={c.matricola}>
                        [{c.matricola}] {c.name}
                      </option>
                    ))
                  )}
                </select>
                {collaborators.length === 0 && (
                  <span className="text-[10px] text-amber-600 block mt-1">
                    Aviso: Cadastre colaboradores na aba "Cadastros" primeiro.
                  </span>
                )}
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Ordem de Serviço (OS) de Destino *
                </label>
                <select
                  required
                  value={serviceOrderId}
                  onChange={(e) => handleChangeOrder(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  <option value="">
                    {serviceOrders.length === 0
                      ? 'Nenhuma ordem cadastrada'
                      : ordersWithBalance.length === 0
                      ? 'Nenhuma OS com material desta matrícula'
                      : 'Selecione a Ordem de Serviço...'}
                  </option>
                  {ordersWithBalance.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.code} - {o.clientName} ({o.status.toUpperCase()})
                    </option>
                  ))}
                </select>
                {serviceOrders.length === 0 ? (
                  <span className="text-[10px] text-amber-600 block mt-1">
                    Aviso: Crie uma Ordem de Serviço no menu "Serviços & OS".
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500 block mt-1">
                    Só aparecem as OS em que esta matrícula tem material para aplicar.
                  </span>
                )}
              </div>
            </div>

            {/* Insumos requisitados pela matrícula, com a RM de origem de cada um */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">
                  Insumos requisitados por {selectedCollab?.name}
                </span>
                {selectedOrigin && (
                  <span className="font-mono text-indigo-700 text-[11px] font-bold">
                    Disponível nesta requisição: {availableOf(selectedOrigin)} {selectedOrigin.unit}
                  </span>
                )}
              </div>

              {origins.length === 0 ? (
                <div className="p-3 bg-white text-slate-400 border border-slate-200 rounded text-center">
                  {serviceOrderId
                    ? 'Esta matrícula não tem material disponível para a OS selecionada. Requisite no Almoxarifado vinculando a RM a esta OS.'
                    : 'Este colaborador não possui insumos requisitados com saldo. Requisite no Almoxarifado primeiro.'}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-8">
                    <label className="block text-slate-600 mb-1">Insumo e RM de origem</label>
                    <select
                      value={selectedOriginKey}
                      onChange={(e) => handleSelectOrigin(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                    >
                      <option value="">Selecione o insumo e a RM de origem...</option>
                      {origins.map((o) => {
                        const left = availableOf(o);
                        return (
                          <option key={o.key} value={o.key} disabled={left <= QTY_EPSILON}>
                            {o.origin === 'rm' ? `[${o.rmNumber}]` : '[Saldo anterior, sem RM]'} [{o.sku}] {o.productName} — saldo {left} {o.unit}
                            {o.origin === 'rm' ? ` (requisitado ${o.requested}, aplicado ${o.applied}, devolvido ${o.returned})` : ''}
                            {o.serviceOrderCode ? ` · OS ${o.serviceOrderCode}` : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-600 mb-1">Qtd Usada</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      max={selectedOrigin ? availableOf(selectedOrigin) : undefined}
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 font-mono bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={handleAddItemToApply}
                      disabled={!selectedOrigin}
                      className="w-full py-1.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                    >
                      Aplicar
                    </button>
                  </div>
                </div>
              )}

              {/* Detalhe da origem selecionada: de qual RM veio e quanto ainda resta */}
              {selectedOrigin && (
                <div className="p-3 bg-white border border-indigo-100 rounded-lg grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
                  <div>
                    <div className="text-slate-400 uppercase text-[10px]">RM de origem</div>
                    <div className="font-mono font-bold text-indigo-800">
                      {selectedOrigin.rmNumber || 'Sem RM (saldo anterior)'}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 uppercase text-[10px]">Requisitado</div>
                    <div className="font-mono font-bold text-slate-900">{selectedOrigin.requested} {selectedOrigin.unit}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 uppercase text-[10px]">Já aplicado</div>
                    <div className="font-mono font-bold text-slate-900">{selectedOrigin.applied} {selectedOrigin.unit}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 uppercase text-[10px]">Devolvido</div>
                    <div className="font-mono font-bold text-slate-900">{selectedOrigin.returned} {selectedOrigin.unit}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 uppercase text-[10px]">Saldo restante</div>
                    <div className="font-mono font-bold text-emerald-700">{availableOf(selectedOrigin)} {selectedOrigin.unit}</div>
                  </div>
                </div>
              )}

              {/* Tabela de Itens Selecionados para Lançamento */}
              {items.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden mt-3">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-500 uppercase text-[10px]">
                      <tr>
                        <th className="py-2 px-3">RM de Origem</th>
                        <th className="py-2 px-3">Insumo Aplicado</th>
                        <th className="py-2 px-3 text-right">Qtd</th>
                        <th className="py-2 px-3 text-center">Un</th>
                        <th className="py-2 px-3 text-right">Remover</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {items.map((it, idx) => (
                        <tr key={itemKey(it)}>
                          <td className="py-2 px-3 font-bold text-indigo-700 whitespace-nowrap">
                            {it.rmNumber || <span className="font-sans font-normal text-slate-400">Saldo anterior</span>}
                          </td>
                          <td className="py-2 px-3 font-sans">
                            <span className="font-semibold text-slate-900">{it.productName}</span>{' '}
                            <span className="text-slate-400 text-[10px]">[{it.sku}]</span>
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-indigo-700">
                            {it.quantity}
                          </td>
                          <td className="py-2 px-3 text-center text-slate-600 font-medium">
                            {it.unit}
                          </td>
                          <td className="py-2 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="text-slate-400 hover:text-rose-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Responsável pelo Lançamento
                </label>
                <input
                  type="text"
                  value={responsibleName}
                  onChange={(e) => setResponsibleName(e.target.value)}
                  placeholder={selectedCollab ? `Padrão: ${selectedCollab.name}` : 'Nome do responsável'}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Relato Técnico da Aplicação
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Utilizado na instalação da linha frigorífica do bloco cirúrgico..."
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setItems([])}
                className="px-3 py-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg"
              >
                Limpar
              </button>
              <button
                type="submit"
                disabled={items.length === 0 || !serviceOrderId}
                className="px-4 py-1.5 font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-xs"
              >
                Baixar da Matrícula e Lançar na OS
              </button>
            </div>
          </form>
        </div>

        {/* Detalhes da OS de Destino (5 colunas) */}
        <div className="lg:col-span-5 p-5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">
              Status da OS Selecionada
            </h2>
            {selectedOrder && (
              <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                {selectedOrder.code}
              </span>
            )}
          </div>

          {selectedOrder ? (
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg space-y-1">
                <div className="font-semibold text-slate-900">{selectedOrder.title}</div>
                <div className="text-slate-600">{selectedOrder.clientName}</div>
                <div className="text-slate-500 text-[11px] font-mono">
                  Agendamento: {selectedOrder.scheduledDate} · Resp: {selectedOrder.assignedTechnicianName}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Insumos já aplicados nesta OS ({selectedOrder.appliedSupplies.length}):
                </div>

                {selectedOrder.appliedSupplies.length === 0 ? (
                  <div className="p-3 bg-slate-50 text-slate-400 text-xs italic text-center rounded">
                    Nenhum insumo aplicado até o momento nesta OS.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[220px] overflow-y-auto">
                    {selectedOrder.appliedSupplies.map((app) => (
                      <div
                        key={app.id}
                        className="flex items-center justify-between p-2 bg-slate-50 border border-slate-100 rounded text-xs"
                      >
                        <div>
                          <span className="font-medium text-slate-900">{app.productName}</span>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Resp: {app.matricola} ({app.technicianName})
                            {app.rmNumber ? ` · ${app.rmNumber}` : ''}
                          </div>
                        </div>
                        <span className="font-mono font-bold text-slate-900">
                          {app.quantity} {app.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-between font-mono">
                <div>
                  <div className="text-[10px] font-sans text-indigo-700">Custo Real Acumulado:</div>
                  <div className="font-bold text-indigo-950 text-sm">
                    R$ {(selectedOrder.totalReal > 0 ? selectedOrder.totalReal : selectedOrder.totalEstimated).toFixed(2)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-sans text-indigo-700">Previsão Inicial:</div>
                  <div className="font-semibold text-indigo-800">
                    R$ {selectedOrder.totalEstimated.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs italic">
              Selecione uma Ordem de Serviço no formulário para visualizar os insumos já aplicados e os custos em tempo real.
            </div>
          )}
        </div>
      </div>

      {/* 4. Histórico de Apontamentos em Serviços */}
      <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Histórico de Apontamentos & Consumo Real em Campo
            </h2>
            <p className="text-xs text-slate-500">
              Registro de todas as aplicações físicas de materiais nas ordens de serviço.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por código, OS ou técnico..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Código Aplicação</th>
                <th className="py-2.5 px-3">Data / Hora</th>
                <th className="py-2.5 px-3">Matrícula (Técnico)</th>
                <th className="py-2.5 px-3">Ordem de Serviço (OS)</th>
                <th className="py-2.5 px-3">Cliente</th>
                <th className="py-2.5 px-3">Insumos Aplicados</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400 font-sans text-xs">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <Wrench className="w-8 h-8 text-slate-300" />
                      <p className="font-medium text-slate-600">Nenhum apontamento de insumos aplicado ainda.</p>
                      <p className="text-[11px] text-slate-400">Preencha o formulário acima para baixar insumos da matrícula do técnico e incorporá-los ao custo real da OS.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredApps.map((app) => (
                <tr key={app.id} className="hover:bg-slate-50/70 transition-colors font-sans">
                  <td className="py-3 px-3 font-mono font-bold text-indigo-700 whitespace-nowrap">
                    {app.appCode}
                  </td>
                  <td className="py-3 px-3 text-slate-600 text-xs whitespace-nowrap">
                    {new Date(app.date).toLocaleString('pt-BR')}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="font-semibold text-slate-900">{app.technicianName}</div>
                    <div className="font-mono text-slate-500 text-[11px]">{app.matricola}</div>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className="font-mono text-slate-900 font-bold bg-slate-100 px-2 py-0.5 rounded">
                      {app.serviceOrderCode}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-700">{app.clientName}</td>
                  <td className="py-3 px-3 max-w-xs font-mono">
                    <div className="space-y-0.5">
                      {app.items.map((i, idx) => (
                        <div key={idx} className="text-slate-900 font-semibold">
                          {i.quantity} {i.unit} {i.productName}{' '}
                          <span className="font-normal text-indigo-700">
                            {i.rmNumber ? `· ${i.rmNumber}` : '· sem RM (histórico anterior)'}
                          </span>
                        </div>
                      ))}
                    </div>
                    {app.responsibleName && (
                      <div className="text-[10px] font-sans text-slate-400 mt-1">Responsável: {app.responsibleName}</div>
                    )}
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
