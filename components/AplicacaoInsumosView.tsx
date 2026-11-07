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
  ApplicationItem
} from '@/types';

interface AplicacaoInsumosViewProps {
  collaborators: Collaborator[];
  serviceOrders: ServiceOrder[];
  applications: SupplyApplicationRecord[];
  preselectedOrderId?: string;
  onProcessApplication: (app: SupplyApplicationRecord) => boolean;
}

export function AplicacaoInsumosView({
  collaborators,
  serviceOrders,
  applications,
  preselectedOrderId,
  onProcessApplication,
}: AplicacaoInsumosViewProps) {
  const [matricola, setMatricola] = useState(collaborators[0]?.matricola || '');
  const [serviceOrderId, setServiceOrderId] = useState(preselectedOrderId || '');
  const [notes, setNotes] = useState('');

  // Itens para aplicar
  const [items, setItems] = useState<ApplicationItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const selectedCollab = collaborators.find((c) => c.matricola === matricola);
  const selectedOrder = serviceOrders.find((o) => o.id === serviceOrderId);

  // Insumo selecionado dentre os que o técnico possui em mãos
  const itemInCustody = selectedCollab?.custody.find(
    (c) => c.productId === selectedProductId
  );

  const handleAddItemToApply = () => {
    if (!itemInCustody) return;
    setErrorMessage('');
    const qty = parseFloat(quantity) || 1;

    if (itemInCustody.quantity < qty) {
      setErrorMessage(
        `O técnico possui apenas ${itemInCustody.quantity} ${itemInCustody.unit} em custódia. Não é possível aplicar ${qty} ${itemInCustody.unit}.`
      );
      return;
    }

    const existingIndex = items.findIndex((i) => i.productId === itemInCustody.productId);
    if (existingIndex >= 0) {
      const updated = [...items];
      const newTotal = updated[existingIndex].quantity + qty;
      if (itemInCustody.quantity < newTotal) {
        setErrorMessage(
          `Quantidade total (${newTotal} ${itemInCustody.unit}) excede a custódia disponível de ${itemInCustody.quantity} ${itemInCustody.unit}.`
        );
        return;
      }
      updated[existingIndex].quantity = newTotal;
      setItems(updated);
    } else {
      setItems([
        ...items,
        {
          productId: itemInCustody.productId,
          productName: itemInCustody.productName,
          sku: itemInCustody.sku,
          unit: itemInCustody.unit,
          quantity: qty,
        },
      ]);
    }

    setSelectedProductId('');
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
      id: `app-${Date.now()}`,
      appCode: `APL-2026-${Math.floor(100 + Math.random() * 900)}`,
      date: new Date().toISOString(),
      matricola: selectedCollab.matricola,
      technicianName: selectedCollab.name,
      serviceOrderId: selectedOrder.id,
      serviceOrderCode: selectedOrder.code,
      clientName: selectedOrder.clientName,
      items,
      notes,
    };

    const ok = onProcessApplication(newAppRecord);
    if (ok) {
      setSuccessMessage(
        `Aplicação confirmada! Os insumos saíram da matrícula ${selectedCollab.matricola} e foram incorporados ao custo real da ${selectedOrder.code}.`
      );
      setItems([]);
      setNotes('');
    }
  };

  const filteredApps = applications.filter(
    (a) =>
      a.appCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.matricola.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.serviceOrderCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.clientName.toLowerCase().includes(searchTerm.toLowerCase())
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
                  onChange={(e) => {
                    setMatricola(e.target.value);
                    setSelectedProductId('');
                    setItems([]);
                  }}
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
                  onChange={(e) => setServiceOrderId(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  <option value="">
                    {serviceOrders.length === 0
                      ? 'Nenhuma ordem cadastrada'
                      : 'Selecione a Ordem de Serviço...'}
                  </option>
                  {serviceOrders
                    .filter((o) => o.status !== 'cancelado')
                    .map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.code} - {o.clientName} ({o.status.toUpperCase()})
                      </option>
                    ))}
                </select>
                {serviceOrders.length === 0 && (
                  <span className="text-[10px] text-amber-600 block mt-1">
                    Aviso: Crie uma Ordem de Serviço no menu "Serviços & OS".
                  </span>
                )}
              </div>
            </div>

            {/* Insumos para Aplicar a partir da Custódia */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">
                  Insumos em Custódia com {selectedCollab?.name}
                </span>
                {itemInCustody && (
                  <span className="font-mono text-indigo-700 text-[11px] font-bold">
                    Disponível na matrícula: {itemInCustody.quantity} {itemInCustody.unit}
                  </span>
                )}
              </div>

              {selectedCollab && selectedCollab.custody.length === 0 ? (
                <div className="p-3 bg-white text-slate-400 border border-slate-200 rounded text-center">
                  Este colaborador não possui insumos em sua matrícula. Requisite no Almoxarifado primeiro.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-8">
                    <label className="block text-slate-600 mb-1">Item na Posse do Técnico</label>
                    <select
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                    >
                      <option value="">Selecione o insumo em custódia...</option>
                      {selectedCollab?.custody.map((c) => (
                        <option key={c.productId} value={c.productId}>
                          [{c.sku}] {c.productName} (Saldo: {c.quantity} {c.unit})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-600 mb-1">Qtd Usada</label>
                    <input
                      type="number"
                      step="any"
                      min="0.1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 font-mono bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={handleAddItemToApply}
                      disabled={!selectedProductId}
                      className="w-full py-1.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                    >
                      Aplicar
                    </button>
                  </div>
                </div>
              )}

              {/* Tabela de Itens Selecionados para Lançamento */}
              {items.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden mt-3">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-500 uppercase text-[10px]">
                      <tr>
                        <th className="py-2 px-3">Insumo Aplicado</th>
                        <th className="py-2 px-3 text-right">Qtd</th>
                        <th className="py-2 px-3 text-center">Un</th>
                        <th className="py-2 px-3 text-right">Remover</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {items.map((it, idx) => (
                        <tr key={idx}>
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
                    <div className="text-slate-900 font-semibold truncate">
                      {app.items.map((i) => `${i.quantity} ${i.unit} ${i.productName}`).join(', ')}
                    </div>
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
