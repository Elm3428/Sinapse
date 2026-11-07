'use client';

import React, { useState } from 'react';
import {
  ArrowRightLeft,
  PackageCheck,
  UserSquare2,
  Plus,
  Trash2,
  FileCheck2,
  AlertCircle,
  Search,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Printer
} from 'lucide-react';
import {
  Collaborator,
  Product,
  ServiceOrder,
  SupplyRequisitionRM,
  RequisitionItem
} from '@/types';

interface RequisicaoRMViewProps {
  collaborators: Collaborator[];
  products: Product[];
  serviceOrders: ServiceOrder[];
  requisitions: SupplyRequisitionRM[];
  preselectedOrderId?: string;
  onProcessRM: (rm: SupplyRequisitionRM) => boolean;
}

export function RequisicaoRMView({
  collaborators,
  products,
  serviceOrders,
  requisitions,
  preselectedOrderId,
  onProcessRM,
}: RequisicaoRMViewProps) {
  const [isFormOpen, setIsFormOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [matricola, setMatricola] = useState(collaborators[0]?.matricola || '');
  const [serviceOrderId, setServiceOrderId] = useState(preselectedOrderId || '');
  const [dispensedBy, setDispensedBy] = useState('MAT-1001 (Almoxarife Central)');
  const [notes, setNotes] = useState('');

  // Itens da RM
  const [items, setItems] = useState<RequisitionItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const selectedCollab = collaborators.find((c) => c.matricola === matricola);
  const selectedProd = products.find((p) => p.id === selectedProductId);

  const handleAddItem = () => {
    if (!selectedProd) return;
    setErrorMessage('');
    const qty = parseFloat(quantity) || 1;

    // Validação de saldo no almoxarifado
    if (selectedProd.currentStock < qty) {
      setErrorMessage(
        `Saldo insuficiente no Almoxarifado para "${selectedProd.name}". Disponível: ${selectedProd.currentStock} ${selectedProd.unit}.`
      );
      return;
    }

    // Verifica se já adicionou
    const existingIndex = items.findIndex((i) => i.productId === selectedProd.id);
    if (existingIndex >= 0) {
      const updated = [...items];
      const newTotal = updated[existingIndex].quantity + qty;
      if (selectedProd.currentStock < newTotal) {
        setErrorMessage(
          `A soma solicitada (${newTotal} ${selectedProd.unit}) ultrapassa o saldo disponível de ${selectedProd.currentStock} ${selectedProd.unit}.`
        );
        return;
      }
      updated[existingIndex].quantity = newTotal;
      setItems(updated);
    } else {
      setItems([
        ...items,
        {
          productId: selectedProd.id,
          productName: selectedProd.name,
          sku: selectedProd.sku,
          unit: selectedProd.unit,
          quantity: qty,
        },
      ]);
    }

    setSelectedProductId('');
    setQuantity('1');
  };

  const handleRemoveItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!matricola || items.length === 0) {
      setErrorMessage('Selecione a matrícula do colaborador e adicione pelo menos um insumo.');
      return;
    }

    const col = collaborators.find((c) => c.matricola === matricola);
    const os = serviceOrders.find((o) => o.id === serviceOrderId);

    const newRM: SupplyRequisitionRM = {
      id: `rm-${Date.now()}`,
      rmNumber: `RM-2026-${Math.floor(100 + Math.random() * 900)}`,
      date: new Date().toISOString(),
      matricola,
      technicianName: col ? col.name : 'Colaborador',
      serviceOrderId: os ? os.id : undefined,
      serviceOrderCode: os ? os.code : undefined,
      items,
      dispensedBy,
      status: 'retirado',
      notes,
    };

    const ok = onProcessRM(newRM);
    if (ok) {
      setSuccessMessage(
        `Requisição ${newRM.rmNumber} confirmada! Os insumos saíram do Almoxarifado e entraram na custódia da matrícula ${matricola}.`
      );
      setItems([]);
      setNotes('');
    }
  };

  const filteredRMs = requisitions.filter(
    (r) =>
      r.rmNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.matricola.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.technicianName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.serviceOrderCode && r.serviceOrderCode.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* 1. Header & Banner Visual Explicativo */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Requisição de Insumos (RM)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Retirada física no almoxarifado. Debita o saldo central e transfere a responsabilidade para a matrícula do colaborador.
          </p>
        </div>

        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{isFormOpen ? 'Ver Histórico de RMs' : 'Nova Requisição RM'}</span>
        </button>
      </div>

      {/* 2. Banner de Regra de Negócio: Sai do Almoxarifado -> Entra na Matrícula */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
              RM
            </div>
            <div>
              <div className="font-bold text-blue-950">
                Regra Operacional: Almoxarifado Central ➔ Matrícula do Colaborador
              </div>
              <div className="text-blue-800 text-[11px] mt-0.5">
                Ao emitir esta RM, o estoque físico do Almoxarifado é baixado imediatamente e os insumos passam a constar na custódia da matrícula selecionada.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono font-bold text-xs bg-white/80 px-3 py-1.5 rounded-lg border border-blue-200 text-blue-900 shrink-0">
            <span>Almoxarifado</span>
            <ArrowRight className="w-4 h-4 text-blue-600" />
            <span className="text-indigo-700">Custódia Técnica</span>
          </div>
        </div>
      </div>

      {/* Alertas de Erro ou Sucesso */}
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

      {/* 3. Formulário de Emissão de RM */}
      {isFormOpen ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Formulário Principal (7 colunas) */}
          <div className="lg:col-span-7 p-5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">
                Emitir Nova Requisição de Material (RM)
              </h2>
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded">
                RM-2026-NOVA
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Matrícula do Colaborador * (Quem retira)
                  </label>
                  <select
                    required
                    value={matricola}
                    onChange={(e) => setMatricola(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 font-mono font-medium focus:outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    {collaborators.length === 0 ? (
                      <option value="">Nenhum colaborador cadastrado</option>
                    ) : (
                      collaborators.map((c) => (
                        <option key={c.id} value={c.matricola}>
                          [{c.matricola}] {c.name} - {c.role}
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
                    Ordem de Serviço Vinculada (Opcional)
                  </label>
                  <select
                    value={serviceOrderId}
                    onChange={(e) => setServiceOrderId(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    <option value="">Sem OS vinculada (Reposição de Viagem / Kit Básico)</option>
                    {serviceOrders
                      .filter((o) => o.status !== 'concluido' && o.status !== 'cancelado')
                      .map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.code} - {o.clientName} ({o.title.substring(0, 30)}...)
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Seletor de Insumos com verificação de estoque em tempo real */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">
                    Selecionar Insumos do Almoxarifado
                  </span>
                  {selectedProd && (
                    <span className="font-mono text-slate-600 text-[11px]">
                      Disponível em Almox.:{' '}
                      <strong
                        className={
                          selectedProd.currentStock <= selectedProd.minStock
                            ? 'text-amber-700'
                            : 'text-slate-900'
                        }
                      >
                        {selectedProd.currentStock} {selectedProd.unit}
                      </strong>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-8">
                    <label className="block text-slate-600 mb-1">Insumo / Material</label>
                    <select
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                    >
                      <option value="">Selecione o insumo...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id} disabled={p.currentStock <= 0}>
                          [{p.sku}] {p.name} - Saldo: {p.currentStock} {p.unit}
                          {p.currentStock <= 0 ? ' (SEM ESTOQUE)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-600 mb-1">Qtd</label>
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
                      onClick={handleAddItem}
                      disabled={!selectedProductId}
                      className="w-full py-1.5 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 disabled:opacity-50"
                    >
                      Inserir
                    </button>
                  </div>
                </div>

                {/* Tabela de Insumos da RM */}
                {items.length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-lg overflow-hidden mt-3">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-500 uppercase text-[10px]">
                        <tr>
                          <th className="py-2 px-3">Item / Descrição</th>
                          <th className="py-2 px-3 text-right">Qtd Requisitada</th>
                          <th className="py-2 px-3 text-center">Unidade</th>
                          <th className="py-2 px-3 text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {items.map((it, idx) => (
                          <tr key={idx}>
                            <td className="py-2 px-3 font-sans">
                              <span className="font-semibold text-slate-900">{it.productName}</span>{' '}
                              <span className="text-slate-400 text-[10px]">[{it.sku}]</span>
                            </td>
                            <td className="py-2 px-3 text-right font-bold text-slate-900">
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
                  Observações / Justificativa da Retirada
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Insumos necessários para atendimento do chamado no Hospital São Lucas..."
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
                  className="px-4 py-1.5 font-medium text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg shadow-xs"
                >
                  Confirmar Retirada e Creditar na Matrícula
                </button>
              </div>
            </form>
          </div>

          {/* Painel Lateral: Custódia Atual da Matrícula Selecionada (5 colunas) */}
          <div className="lg:col-span-5 p-5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">
                Custódia Atual da Matrícula
              </h2>
              {selectedCollab && (
                <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                  {selectedCollab.matricola}
                </span>
              )}
            </div>

            {selectedCollab ? (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <div className="font-semibold text-slate-900">{selectedCollab.name}</div>
                  <div className="text-slate-500 text-[11px]">{selectedCollab.role}</div>
                  <div className="text-slate-500 text-[11px] font-mono mt-0.5">
                    Veículo habitual: {selectedCollab.vehicleId || 'Nenhum'}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Insumos em posse deste técnico:
                  </div>

                  {selectedCollab.custody.length === 0 ? (
                    <div className="p-4 text-center text-slate-400 text-xs italic bg-slate-50 rounded">
                      Este técnico não possui insumos em custódia no momento.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {selectedCollab.custody.map((item) => (
                        <div
                          key={item.productId}
                          className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-lg"
                        >
                          <div>
                            <div className="font-semibold text-slate-900">{item.productName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              SKU: {item.sku}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                              {item.quantity} {item.unit}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* 4. Histórico Completo de Requisições RM Emitidas */}
      <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Histórico de Requisições de Material (RM)
            </h2>
            <p className="text-xs text-slate-500">
              Auditoria de todos os comprovantes de saída do almoxarifado para os técnicos.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar RM, matrícula ou técnico..."
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
                <th className="py-2.5 px-3">Nº da RM</th>
                <th className="py-2.5 px-3">Data / Hora</th>
                <th className="py-2.5 px-3">Matrícula (Técnico)</th>
                <th className="py-2.5 px-3">Ordem de Serviço</th>
                <th className="py-2.5 px-3">Itens Dispensados</th>
                <th className="py-2.5 px-3">Almoxarife</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredRMs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400 font-sans text-xs">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <PackageCheck className="w-8 h-8 text-slate-300" />
                      <p className="font-medium text-slate-600">Nenhuma requisição de material emitida ainda.</p>
                      <p className="text-[11px] text-slate-400">Preencha o formulário acima para dispensar insumos do Almoxarifado para a matrícula de um técnico.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRMs.map((rm) => (
                <tr key={rm.id} className="hover:bg-slate-50/70 transition-colors font-sans">
                  <td className="py-3 px-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                    {rm.rmNumber}
                  </td>
                  <td className="py-3 px-3 text-slate-600 text-xs whitespace-nowrap">
                    {new Date(rm.date).toLocaleString('pt-BR')}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="font-semibold text-slate-900">{rm.technicianName}</div>
                    <div className="font-mono text-slate-500 text-[11px]">{rm.matricola}</div>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    {rm.serviceOrderCode ? (
                      <span className="font-mono text-slate-800 font-medium bg-slate-100 px-2 py-0.5 rounded">
                        {rm.serviceOrderCode}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Geral</span>
                    )}
                  </td>
                  <td className="py-3 px-3 max-w-xs">
                    <div className="text-slate-800 truncate">
                      {rm.items.map((i) => `${i.quantity} ${i.unit} ${i.productName}`).join(', ')}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-slate-600 text-xs whitespace-nowrap">
                    {rm.dispensedBy}
                  </td>
                  <td className="py-3 px-3 text-right whitespace-nowrap">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700">
                      Entregue
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
