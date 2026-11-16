'use client';

import React, { useState } from 'react';
import {
  Undo2,
  ArrowRight,
  PackageCheck,
  UserSquare2,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Search,
  Check,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import {
  Collaborator,
  SupplyRequisitionRM,
  SupplyReturnRecord,
  ReturnItem,
  ServiceOrder
} from '@/types';
import {
  QTY_EPSILON,
  getOriginBalances,
  nextSequentialCode,
  originKey,
  roundQty
} from '@/lib/supplyTrace';

interface DevolucaoInsumosViewProps {
  collaborators: Collaborator[];
  serviceOrders: ServiceOrder[];
  returns: SupplyReturnRecord[];
  requisitions: SupplyRequisitionRM[];
  onProcessReturn: (ret: SupplyReturnRecord) => boolean;
}

const newRequestId = () => `dev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const itemKey = (i: ReturnItem) => originKey(i.rmId, i.rmItemId, i.productId);

export function DevolucaoInsumosView({
  collaborators,
  serviceOrders,
  returns,
  requisitions,
  onProcessReturn,
}: DevolucaoInsumosViewProps) {
  const [matricola, setMatricola] = useState(collaborators[0]?.matricola || '');
  const [serviceOrderId, setServiceOrderId] = useState('');
  const [receivedBy, setReceivedBy] = useState('MAT-1001 (Almoxarife Central)');
  const [notes, setNotes] = useState('');

  // Itens para devolver (cada linha aponta para o item da RM de origem)
  const [items, setItems] = useState<ReturnItem[]>([]);
  const [selectedOriginKey, setSelectedOriginKey] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [condition, setCondition] = useState<ReturnItem['condition']>('perfeito');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  // Identificador único do lançamento: reenviar o formulário não devolve duas vezes
  const [requestId, setRequestId] = useState(newRequestId);

  const selectedCollab = collaborators.find((c) => c.matricola === matricola);
  const selectedOrder = serviceOrders.find((o) => o.id === serviceOrderId);

  // Sobras da matrícula, separadas por RM de origem (e o saldo anterior ao controle por RM)
  const origins = getOriginBalances(selectedCollab, requisitions);
  const selectedOrigin = origins.find((o) => o.key === selectedOriginKey);

  const stagedByKey = new Map<string, number>();
  for (const it of items) {
    stagedByKey.set(itemKey(it), roundQty((stagedByKey.get(itemKey(it)) || 0) + it.quantity));
  }
  const availableOf = (o: { key: string; remaining: number }) =>
    roundQty(o.remaining - (stagedByKey.get(o.key) || 0));

  const handleChangeMatricola = (value: string) => {
    setMatricola(value);
    setSelectedOriginKey('');
    setItems([]);
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleAddItemToReturn = () => {
    if (!selectedOrigin) return;
    setErrorMessage('');
    const qty = parseFloat(quantity);

    if (!Number.isFinite(qty) || qty <= 0) {
      setErrorMessage('Informe uma quantidade maior que zero.');
      return;
    }
    const available = availableOf(selectedOrigin);
    if (qty > available + QTY_EPSILON) {
      const where = selectedOrigin.origin === 'rm' ? `na ${selectedOrigin.rmNumber}` : 'no saldo anterior ao controle por RM';
      setErrorMessage(
        `Só restam ${available} ${selectedOrigin.unit} de "${selectedOrigin.productName}" ${where} (já descontado o que foi aplicado). Não é possível devolver ${qty} ${selectedOrigin.unit}.`
      );
      return;
    }

    const existingIndex = items.findIndex(
      (i) => itemKey(i) === selectedOrigin.key && i.condition === condition
    );
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
          condition,
          origin: selectedOrigin.origin,
          rmId: selectedOrigin.rmId,
          rmNumber: selectedOrigin.rmNumber,
          rmItemId: selectedOrigin.rmItemId,
        },
      ]);
    }

    setSelectedOriginKey('');
    setQuantity('1');
    setCondition('perfeito');
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!selectedCollab || items.length === 0) {
      setErrorMessage('Selecione o colaborador e adicione pelo menos um insumo de sobra para devolver.');
      return;
    }

    const newReturnRecord: SupplyReturnRecord = {
      id: requestId,
      returnCode: nextSequentialCode(
        'DEV',
        returns.map((r) => r.returnCode),
        new Date().getFullYear()
      ),
      date: new Date().toISOString(),
      matricola: selectedCollab.matricola,
      technicianName: selectedCollab.name,
      serviceOrderId: selectedOrder ? selectedOrder.id : undefined,
      serviceOrderCode: selectedOrder ? selectedOrder.code : undefined,
      items,
      receivedBy,
      notes,
    };

    const ok = onProcessReturn(newReturnRecord);
    if (ok) {
      setSuccessMessage(
        `Devolução processada com sucesso! O saldo das RMs de origem e a custódia da matrícula ${selectedCollab.matricola} foram atualizados.`
      );
      setItems([]);
      setNotes('');
      setSelectedOriginKey('');
      setRequestId(newRequestId());
    }
  };

  const filteredReturns = returns.filter(
    (r) =>
      r.returnCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.matricola.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.technicianName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.items.some((i) => (i.rmNumber || '').toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* 1. Header & Banner Visual */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Devolução de Insumos & Sobras de Serviços
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Retorno de materiais excedentes ao Almoxarifado Central. Desonera a matrícula do técnico e reaproveita o estoque.
          </p>
        </div>
      </div>

      {/* 2. Banner de Regra de Negócio: Devolve a Sobra */}
      <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
              DEV
            </div>
            <div>
              <div className="font-bold text-emerald-950">
                Regra Operacional: Devolução de Sobras ➔ Retorno ao Almoxarifado Central
              </div>
              <div className="text-emerald-800 text-[11px] mt-0.5">
                Os materiais sobressalentes não utilizados em campo são inspecionados e reintegrados ao saldo disponível do Almoxarifado.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono font-bold text-xs bg-white/80 px-3 py-1.5 rounded-lg border border-emerald-200 text-emerald-900 shrink-0">
            <span>Sobra Técnica</span>
            <ArrowRight className="w-4 h-4 text-emerald-600" />
            <span className="text-slate-900">Almoxarifado Reabastecido</span>
          </div>
        </div>
      </div>

      {/* Feedback Alerts */}
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

      {/* 3. Grid: Formulário de Devolução (7 colunas) + Sobras em Custódia (5 colunas) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Formulário (7 colunas) */}
        <div className="lg:col-span-7 p-5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">
              Registrar Devolução de Sobra de Insumos
            </h2>
            <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              Estorno ao Almoxarifado
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Matrícula do Técnico Devolvente *
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
                  Ordem de Serviço de Origem (Opcional)
                </label>
                <select
                  value={serviceOrderId}
                  onChange={(e) => setServiceOrderId(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  <option value="">Sem OS específica / Sobra Geral do Veículo</option>
                  {serviceOrders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.code} - {o.clientName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Seleção de Itens da Sobra, por RM de origem */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">
                  Sobras Disponíveis com {selectedCollab?.name}
                </span>
                {selectedOrigin && (
                  <span className="font-mono text-emerald-700 text-[11px] font-bold">
                    Saldo nesta requisição: {availableOf(selectedOrigin)} {selectedOrigin.unit}
                  </span>
                )}
              </div>

              {origins.length === 0 ? (
                <div className="p-3 bg-white text-slate-400 border border-slate-200 rounded text-center">
                  Este colaborador não possui insumos restantes em custódia.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-5">
                    <label className="block text-slate-600 mb-1">Insumo e RM de origem</label>
                    <select
                      value={selectedOriginKey}
                      onChange={(e) => setSelectedOriginKey(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                    >
                      <option value="">Selecione o item de sobra...</option>
                      {origins.map((o) => {
                        const left = availableOf(o);
                        return (
                          <option key={o.key} value={o.key} disabled={left <= QTY_EPSILON}>
                            {o.origin === 'rm' ? `[${o.rmNumber}]` : '[Saldo anterior, sem RM]'} [{o.sku}] {o.productName} — tem {left} {o.unit}
                            {o.origin === 'rm' ? ` (aplicado ${o.applied}, devolvido ${o.returned})` : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-600 mb-1">Qtd</label>
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

                  <div className="sm:col-span-3">
                    <label className="block text-slate-600 mb-1">Condição Física</label>
                    <select
                      value={condition}
                      onChange={(e) => setCondition(e.target.value as ReturnItem['condition'])}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                    >
                      <option value="perfeito">Perfeito Estado</option>
                      <option value="revisao">Necessita Revisão</option>
                      <option value="avariado">Avariado / Descarte</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={handleAddItemToReturn}
                      disabled={!selectedOrigin}
                      className="w-full py-1.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                    >
                      Devolver
                    </button>
                  </div>
                </div>
              )}

              {/* Tabela de Itens para Devolução */}
              {items.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden mt-3">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-500 uppercase text-[10px]">
                      <tr>
                        <th className="py-2 px-3">RM de Origem</th>
                        <th className="py-2 px-3">Item Devolvido</th>
                        <th className="py-2 px-3 text-right">Qtd</th>
                        <th className="py-2 px-3 text-center">Un</th>
                        <th className="py-2 px-3">Condição</th>
                        <th className="py-2 px-3 text-right">Remover</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {items.map((it, idx) => (
                        <tr key={`${itemKey(it)}#${it.condition}`}>
                          <td className="py-2 px-3 font-bold text-emerald-700 whitespace-nowrap">
                            {it.rmNumber || <span className="font-sans font-normal text-slate-400">Saldo anterior</span>}
                          </td>
                          <td className="py-2 px-3 font-sans">
                            <span className="font-semibold text-slate-900">{it.productName}</span>{' '}
                            <span className="text-slate-400 text-[10px]">[{it.sku}]</span>
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-emerald-700">
                            {it.quantity}
                          </td>
                          <td className="py-2 px-3 text-center text-slate-600 font-medium">
                            {it.unit}
                          </td>
                          <td className="py-2 px-3 font-sans">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                it.condition === 'perfeito'
                                  ? 'bg-emerald-50 text-emerald-800'
                                  : it.condition === 'revisao'
                                  ? 'bg-amber-50 text-amber-800'
                                  : 'bg-rose-50 text-rose-800'
                              }`}
                            >
                              {it.condition === 'perfeito'
                                ? 'Perfeito'
                                : it.condition === 'revisao'
                                ? 'Revisão'
                                : 'Avaria'}
                            </span>
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

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Motivo / Observações da Devolução
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Sobra de cabeamento após término do serviço sem necessidade de corte adicional..."
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
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
                disabled={items.length === 0}
                className="px-4 py-1.5 font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg shadow-xs"
              >
                Confirmar Estorno ao Almoxarifado
              </button>
            </div>
          </form>
        </div>

        {/* Visão da Custódia Restante do Técnico (5 colunas) */}
        <div className="lg:col-span-5 p-5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">
              Insumos em Posse do Técnico
            </h2>
            {selectedCollab && (
              <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                {selectedCollab.matricola}
              </span>
            )}
          </div>

          {selectedCollab ? (
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg space-y-0.5">
                <div className="font-semibold text-slate-900">{selectedCollab.name}</div>
                <div className="text-slate-500 text-[11px]">{selectedCollab.role}</div>
                <div className="text-slate-500 text-[11px] font-mono">
                  Veículo: {selectedCollab.vehicleId || 'Nenhum'}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Saldo de Custódia Atual ({selectedCollab.custody.length} tipos de itens):
                </div>

                {selectedCollab.custody.length === 0 ? (
                  <div className="p-4 bg-emerald-50 text-emerald-800 rounded-lg text-center text-xs">
                    <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
                    <strong>Custódia 100% Zerada!</strong>
                    <div className="text-[11px] mt-0.5">Nenhuma sobra pendente na matrícula deste colaborador.</div>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[340px] overflow-y-auto">
                    {origins.map((o) => (
                      <div
                        key={o.key}
                        className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-lg"
                      >
                        <div>
                          <div className="font-semibold text-slate-900">{o.productName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            SKU: {o.sku} ·{' '}
                            <span className="text-emerald-700 font-bold">
                              {o.origin === 'rm' ? o.rmNumber : 'Saldo anterior, sem RM'}
                            </span>
                          </div>
                          {o.origin === 'rm' && (
                            <div className="text-[10px] text-slate-400 font-mono">
                              req. {o.requested} · aplic. {o.applied} · dev. {o.returned}
                            </div>
                          )}
                        </div>
                        <span className="font-mono font-bold text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded">
                          {o.remaining} {o.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* 4. Histórico de Devoluções */}
      <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Histórico de Devoluções de Sobras
            </h2>
            <p className="text-xs text-slate-500">
              Auditoria de todos os estornos efetuados pelos colaboradores de volta ao Almoxarifado Central.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar devolução, técnico ou código..."
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
                <th className="py-2.5 px-3">Código Devolução</th>
                <th className="py-2.5 px-3">Data / Hora</th>
                <th className="py-2.5 px-3">Matrícula (Técnico)</th>
                <th className="py-2.5 px-3">OS Vinculada</th>
                <th className="py-2.5 px-3">Sobras Reintegradas</th>
                <th className="py-2.5 px-3">Recebido Por</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredReturns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400 font-sans text-xs">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <Undo2 className="w-8 h-8 text-slate-300" />
                      <p className="font-medium text-slate-600">Nenhuma devolução de sobras registrada ainda.</p>
                      <p className="text-[11px] text-slate-400">Quando houver sobras de materiais com o técnico após a conclusão da OS, registre a devolução para estornar o saldo ao Almoxarifado.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredReturns.map((ret) => (
                <tr key={ret.id} className="hover:bg-slate-50/70 transition-colors font-sans">
                  <td className="py-3 px-3 font-mono font-bold text-emerald-700 whitespace-nowrap">
                    {ret.returnCode}
                  </td>
                  <td className="py-3 px-3 text-slate-600 text-xs whitespace-nowrap">
                    {new Date(ret.date).toLocaleString('pt-BR')}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="font-semibold text-slate-900">{ret.technicianName}</div>
                    <div className="font-mono text-slate-500 text-[11px]">{ret.matricola}</div>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap font-mono text-slate-700">
                    {ret.serviceOrderCode || <span className="text-slate-400 italic">Geral</span>}
                  </td>
                  <td className="py-3 px-3 max-w-xs font-mono">
                    <div className="space-y-0.5">
                      {ret.items.map((i, idx) => (
                        <div key={idx} className="text-slate-900 font-medium">
                          {i.quantity} {i.unit} {i.productName} ({i.condition}){' '}
                          <span className="font-normal text-emerald-700">
                            {i.rmNumber ? `· ${i.rmNumber}` : '· sem RM (histórico anterior)'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-slate-600 text-xs whitespace-nowrap">
                    {ret.receivedBy}
                  </td>
                  <td className="py-3 px-3 text-right whitespace-nowrap">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700">
                      Estornado
                    </span>
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
