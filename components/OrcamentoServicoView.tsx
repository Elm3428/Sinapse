'use client';

import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Printer,
  Calendar,
  Clock,
  User,
  Truck,
  CheckCircle2,
  AlertCircle,
  Search,
  Check,
  Play,
  ArrowRight,
  DollarSign,
  ChevronRight,
  X,
  Trash2
} from 'lucide-react';
import {
  ServiceOrder,
  Client,
  Collaborator,
  Vehicle,
  Product,
  ServiceSupplyEstimated,
  ServiceOrderStatus
} from '@/types';

interface OrcamentoServicoViewProps {
  serviceOrders: ServiceOrder[];
  clients: Client[];
  collaborators: Collaborator[];
  vehicles: Vehicle[];
  products: Product[];
  onSaveServiceOrder: (order: ServiceOrder) => void;
  onDeleteServiceOrder: (id: string) => void;
  onPrintOrder: (order: ServiceOrder) => void;
  onNavigateToRM: (orderId: string) => void;
  onNavigateToApplication: (orderId: string) => void;
}

export function OrcamentoServicoView({
  serviceOrders,
  clients,
  collaborators,
  vehicles,
  products,
  onSaveServiceOrder,
  onDeleteServiceOrder,
  onPrintOrder,
  onNavigateToRM,
  onNavigateToApplication,
}: OrcamentoServicoViewProps) {
  const [statusFilter, setStatusFilter] = useState<'todos' | ServiceOrderStatus>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<ServiceOrder | null>(
    serviceOrders[0] || null
  );

  // Form State para Nova OS / Orçamento
  const [clientId, setClientId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledDate, setScheduledDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [assignedMatricola, setAssignedMatricola] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [laborCost, setLaborCost] = useState('350');
  const [estimatedSupplies, setEstimatedSupplies] = useState<ServiceSupplyEstimated[]>([]);

  // Item selector inside modal
  const [selectedProdId, setSelectedProdId] = useState('');
  const [selectedQty, setSelectedQty] = useState('1');

  const handleAddEstimatedSupply = () => {
    if (!selectedProdId) return;
    const prod = products.find((p) => p.id === selectedProdId);
    if (!prod) return;

    const qty = parseFloat(selectedQty) || 1;
    const newItem: ServiceSupplyEstimated = {
      productId: prod.id,
      productName: prod.name,
      sku: prod.sku,
      unit: prod.unit,
      quantity: qty,
      unitCost: prod.unitCost,
      unitPrice: prod.unitPrice,
    };

    setEstimatedSupplies([...estimatedSupplies, newItem]);
    setSelectedProdId('');
    setSelectedQty('1');
  };

  const handleRemoveEstimatedSupply = (index: number) => {
    setEstimatedSupplies(estimatedSupplies.filter((_, i) => i !== index));
  };

  const handleCreateOrder = (e: React.FormEvent, initialStatus: ServiceOrderStatus = 'orcamento') => {
    e.preventDefault();
    const client = clients.find((c) => c.id === clientId);
    if (!client || !title) {
      alert('Selecione o cliente e preencha o título do serviço.');
      return;
    }

    const technician = collaborators.find((c) => c.matricola === assignedMatricola);
    const parsedLabor = parseFloat(laborCost) || 0;
    const suppliesCost = estimatedSupplies.reduce(
      (acc, s) => acc + s.quantity * s.unitPrice,
      0
    );
    const totalEstimated = parsedLabor + suppliesCost;

    const newOrder: ServiceOrder = {
      id: `os-${Date.now()}`,
      code: `OS-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      clientId: client.id,
      clientName: client.name,
      clientPhone: client.phone,
      clientAddress: client.address,
      title,
      description,
      scheduledDate,
      scheduledTime,
      assignedMatricola: assignedMatricola || 'MAT-PENDENTE',
      assignedTechnicianName: technician ? technician.name : 'A definir',
      vehiclePlate: vehiclePlate || undefined,
      status: initialStatus,
      laborCost: parsedLabor,
      estimatedSupplies,
      appliedSupplies: [],
      totalEstimated,
      totalReal: 0,
      createdAt: new Date().toISOString(),
    };

    onSaveServiceOrder(newOrder);
    setSelectedOrderForDetails(newOrder);
    setIsModalOpen(false);

    // Reset Form
    setTitle('');
    setDescription('');
    setClientId('');
    setAssignedMatricola('');
    setVehiclePlate('');
    setEstimatedSupplies([]);
  };

  // Status Updater
  const handleUpdateStatus = (order: ServiceOrder, newStatus: ServiceOrderStatus) => {
    const updated: ServiceOrder = {
      ...order,
      status: newStatus,
      completionDate:
        newStatus === 'concluido' ? new Date().toISOString() : order.completionDate,
    };
    onSaveServiceOrder(updated);
    if (selectedOrderForDetails?.id === order.id) {
      setSelectedOrderForDetails(updated);
    }
  };

  const filteredOrders = serviceOrders.filter((o) => {
    const matchesStatus = statusFilter === 'todos' || o.status === statusFilter;
    const matchesSearch =
      o.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.assignedTechnicianName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header do Módulo de Serviços */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Orçamentos & Ordens de Serviço (OS)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Criação de propostas comerciais, agendamento de equipes técnicas e acompanhamento do custo real vs orçado.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Criar Novo Orçamento / OS</span>
        </button>
      </div>

      {/* 2. Filtros de Status & Busca */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center bg-slate-100 p-1 rounded-lg overflow-x-auto">
          {(
            [
              { key: 'todos', label: 'Todas as OS' },
              { key: 'orcamento', label: 'Orçamentos' },
              { key: 'aprovado', label: 'Aprovados' },
              { key: 'em_execucao', label: 'Em Execução' },
              { key: 'concluido', label: 'Concluídos' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-all ${
                statusFilter === tab.key
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por cliente, OS ou técnico..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>
      </div>

      {/* 3. Layout Dividido: Lista de Ordens (Esquerda) + Detalhes & Ações (Direita) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Coluna Esquerda: Lista de OS (5 colunas) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="p-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Ordens Encontradas ({filteredOrders.length})
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[640px] overflow-y-auto">
            {filteredOrders.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Nenhuma ordem de serviço encontrada para este filtro.
              </div>
            ) : (
              filteredOrders.map((order) => {
                const isSelected = selectedOrderForDetails?.id === order.id;
                return (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrderForDetails(order)}
                    className={`p-3.5 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-slate-100/90 border-l-2 border-slate-900'
                        : 'hover:bg-slate-50/70'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-xs text-slate-900">
                        {order.code}
                      </span>
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded ${
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
                    </div>

                    <div className="font-semibold text-xs text-slate-900 line-clamp-1">
                      {order.title}
                    </div>

                    <div className="text-[11px] text-slate-600 mt-0.5">
                      {order.clientName}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 pt-2 border-t border-slate-200/50">
                      <div className="flex items-center gap-1 font-mono">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{order.scheduledDate}</span>
                      </div>
                      <div className="font-mono font-bold text-slate-800">
                        R$ {(order.totalReal > 0 ? order.totalReal : order.totalEstimated).toFixed(2)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Coluna Direita: Detalhamento Completo da OS Selecionada (7 colunas) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          {selectedOrderForDetails ? (
            <div className="p-5 space-y-5 text-xs">
              {/* Barra Superior do Detalhe */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-base text-slate-900">
                      {selectedOrderForDetails.code}
                    </span>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded ${
                        selectedOrderForDetails.status === 'em_execucao'
                          ? 'bg-blue-50 text-blue-700'
                          : selectedOrderForDetails.status === 'concluido'
                          ? 'bg-emerald-50 text-emerald-700'
                          : selectedOrderForDetails.status === 'aprovado'
                          ? 'bg-indigo-50 text-indigo-700'
                          : selectedOrderForDetails.status === 'orcamento'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {selectedOrderForDetails.status === 'orcamento'
                        ? 'Orçamento Aberto'
                        : selectedOrderForDetails.status === 'aprovado'
                        ? 'Orçamento Aprovado'
                        : selectedOrderForDetails.status === 'em_execucao'
                        ? 'Serviço em Execução'
                        : selectedOrderForDetails.status === 'concluido'
                        ? 'Serviço Concluído'
                        : 'Cancelado'}
                    </span>
                  </div>
                  <h2 className="text-sm font-bold text-slate-900 mt-1">
                    {selectedOrderForDetails.title}
                  </h2>
                </div>

                {/* Botões de Ação na OS */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onPrintOrder(selectedOrderForDetails)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
                    title="Imprimir Ordem de Serviço A4 Oficial"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-600" />
                    <span>Imprimir OS</span>
                  </button>
                </div>
              </div>

              {/* Informações do Cliente & Logística */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 bg-slate-50 rounded-lg">
                <div>
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Cliente & Local de Execução
                  </div>
                  <div className="font-semibold text-slate-900">
                    {selectedOrderForDetails.clientName}
                  </div>
                  <div className="text-slate-600 mt-0.5">
                    {selectedOrderForDetails.clientAddress}
                  </div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    Tel: {selectedOrderForDetails.clientPhone}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Equipe e Frota Alocada
                  </div>
                  <div className="font-semibold text-slate-900">
                    Técnico: {selectedOrderForDetails.assignedTechnicianName}
                  </div>
                  <div className="font-mono text-slate-600 text-[11px]">
                    Matrícula: {selectedOrderForDetails.assignedMatricola}
                  </div>
                  <div className="font-mono text-slate-600 text-[11px] mt-0.5">
                    Veículo: {selectedOrderForDetails.vehiclePlate || 'Não vinculado'}
                  </div>
                  <div className="text-slate-500 text-[11px] mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>Agendado: {selectedOrderForDetails.scheduledDate} às {selectedOrderForDetails.scheduledTime || '09:00'}</span>
                  </div>
                </div>
              </div>

              {/* Escopo Técnico */}
              <div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Escopo e Descrição dos Trabalhos
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-lg text-slate-700 leading-relaxed">
                  {selectedOrderForDetails.description || 'Nenhuma descrição técnica informada.'}
                </div>
              </div>

              {/* Comparativo: Insumos Orçados vs Insumos Realmente Aplicados */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Insumos Previstos no Orçamento ({selectedOrderForDetails.estimatedSupplies.length})
                  </div>
                  {selectedOrderForDetails.status !== 'concluido' && (
                    <button
                      onClick={() => onNavigateToRM(selectedOrderForDetails.id)}
                      className="text-xs text-blue-700 font-medium hover:underline flex items-center gap-1"
                    >
                      <span>Requisitar no Almoxarifado (RM) →</span>
                    </button>
                  )}
                </div>

                {selectedOrderForDetails.estimatedSupplies.length === 0 ? (
                  <div className="p-3 bg-slate-50 text-slate-400 rounded text-center">
                    Nenhum insumo previsto nesta OS.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-400 uppercase text-[10px]">
                        <tr>
                          <th className="py-2 px-3">Item / SKU</th>
                          <th className="py-2 px-3 text-right">Qtd Prevista</th>
                          <th className="py-2 px-3 text-right">Preço Unit.</th>
                          <th className="py-2 px-3 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {selectedOrderForDetails.estimatedSupplies.map((item, idx) => (
                          <tr key={idx}>
                            <td className="py-2 px-3 font-sans">
                              <span className="font-semibold text-slate-900">{item.productName}</span>{' '}
                              <span className="text-slate-400 text-[10px]">[{item.sku}]</span>
                            </td>
                            <td className="py-2 px-3 text-right text-slate-800">
                              {item.quantity} {item.unit}
                            </td>
                            <td className="py-2 px-3 text-right text-slate-600">
                              R$ {item.unitPrice.toFixed(2)}
                            </td>
                            <td className="py-2 px-3 text-right font-bold text-slate-900">
                              R$ {(item.quantity * item.unitPrice).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Insumos Realmente Aplicados (Vindos da Matrícula do Técnico) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Insumos Aplicados no Serviço ({selectedOrderForDetails.appliedSupplies.length})
                  </div>
                  {selectedOrderForDetails.status !== 'concluido' && (
                    <button
                      onClick={() => onNavigateToApplication(selectedOrderForDetails.id)}
                      className="text-xs text-indigo-700 font-medium hover:underline flex items-center gap-1"
                    >
                      <span>Aplicar Insumo da Matrícula →</span>
                    </button>
                  )}
                </div>

                {selectedOrderForDetails.appliedSupplies.length === 0 ? (
                  <div className="p-3 bg-slate-50 text-slate-400 rounded text-center">
                    Ainda não há apontamento de insumos aplicados em campo.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-400 uppercase text-[10px]">
                        <tr>
                          <th className="py-2 px-3">Item Aplicado</th>
                          <th className="py-2 px-3 text-right">Qtd</th>
                          <th className="py-2 px-3">Matrícula Técnico</th>
                          <th className="py-2 px-3">Data / Hora</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {selectedOrderForDetails.appliedSupplies.map((app) => (
                          <tr key={app.id}>
                            <td className="py-2 px-3 font-sans">
                              <span className="font-semibold text-slate-900">{app.productName}</span>{' '}
                              <span className="text-slate-400 text-[10px]">[{app.sku}]</span>
                            </td>
                            <td className="py-2 px-3 text-right font-bold text-slate-900">
                              {app.quantity} {app.unit}
                            </td>
                            <td className="py-2 px-3 font-mono text-slate-700">
                              {app.matricola}
                            </td>
                            <td className="py-2 px-3 text-slate-500 text-[11px]">
                              {new Date(app.appliedDate).toLocaleString('pt-BR')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Valores & Totais */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between font-mono">
                <div>
                  <div className="text-[11px] font-sans text-slate-500">Mão de Obra:</div>
                  <div className="font-bold text-slate-800">
                    R$ {selectedOrderForDetails.laborCost.toFixed(2)}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[11px] font-sans text-slate-500">Total Orçado:</div>
                  <div className="font-semibold text-slate-600">
                    R$ {selectedOrderForDetails.totalEstimated.toFixed(2)}
                  </div>
                </div>

                <div className="text-right pl-4 border-l border-slate-200">
                  <div className="text-[11px] font-sans text-slate-700 font-semibold">Custo Real Final:</div>
                  <div className="text-base font-bold text-emerald-700">
                    R$ {(selectedOrderForDetails.totalReal > 0 ? selectedOrderForDetails.totalReal : selectedOrderForDetails.totalEstimated).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Controles de Status do Ciclo */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200">
                <button
                  onClick={() => {
                    if (confirm(`Deseja excluir a ordem de serviço ${selectedOrderForDetails.code}?`)) {
                      onDeleteServiceOrder(selectedOrderForDetails.id);
                      setSelectedOrderForDetails(null);
                    }
                  }}
                  className="px-3 py-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded"
                >
                  Excluir Ordem
                </button>

                <div className="flex items-center gap-2">
                  {selectedOrderForDetails.status === 'orcamento' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedOrderForDetails, 'aprovado')}
                      className="px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800"
                    >
                      Aprovar Orçamento
                    </button>
                  )}

                  {selectedOrderForDetails.status === 'aprovado' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedOrderForDetails, 'em_execucao')}
                      className="px-3.5 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                    >
                      Iniciar Execução em Campo
                    </button>
                  )}

                  {selectedOrderForDetails.status === 'em_execucao' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedOrderForDetails, 'concluido')}
                      className="px-3.5 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
                    >
                      Concluir Ordem de Serviço
                    </button>
                  )}

                  {selectedOrderForDetails.status !== 'concluido' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedOrderForDetails, 'cancelado')}
                      className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                      Cancelar OS
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 text-xs">
              <div className="max-w-xs mx-auto space-y-3">
                <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto" />
                <div className="font-bold text-slate-700 text-sm">
                  {serviceOrders.length === 0 ? 'Nenhum Orçamento ou OS Cadastrado' : 'Nenhuma Ordem Selecionada'}
                </div>
                <p className="text-slate-500 text-xs leading-relaxed">
                  {serviceOrders.length === 0
                    ? 'Sua base está limpa. Clique no botão "+ Novo Orçamento / OS" acima para abrir seu primeiro atendimento de serviço.'
                    : 'Selecione uma ordem de serviço na lista ao lado para ver todos os detalhes e insumos.'}
                </p>
                {serviceOrders.length === 0 && (
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Cadastrar Primeiro Orçamento</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Modal para Novo Orçamento / OS */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 sticky top-0 bg-white z-10">
              <h2 className="text-sm font-bold text-slate-900">
                Criar Novo Orçamento ou Ordem de Serviço
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={(e) => handleCreateOrder(e, 'orcamento')} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Cliente *</label>
                  <select
                    required
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    <option value="">
                      {clients.length === 0 ? 'Nenhum cliente cadastrado' : 'Selecione o cliente...'}
                    </option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.segment})
                      </option>
                    ))}
                  </select>
                  {clients.length === 0 && (
                    <span className="text-[10px] text-amber-600 block mt-1">
                      Aviso: Cadastre ao menos um cliente no menu "Cadastros".
                    </span>
                  )}
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Título do Serviço / Manutenção *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Instalação de Ar Condicionado Sala Reuniões"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Descrição / Escopo dos Trabalhos</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalhamento técnico do serviço a ser executado no local..."
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Data Agendada</label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Hora</label>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Técnico (Matrícula)</label>
                  <select
                    value={assignedMatricola}
                    onChange={(e) => {
                      setAssignedMatricola(e.target.value);
                      const col = collaborators.find((c) => c.matricola === e.target.value);
                      if (col?.vehicleId) setVehiclePlate(col.vehicleId);
                    }}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    <option value="">A definir depois</option>
                    {collaborators.map((c) => (
                      <option key={c.id} value={c.matricola}>
                        {c.matricola} - {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Veículo da Frota</label>
                  <select
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    <option value="">Nenhum</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.plate}>
                        {v.plate} ({v.model})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Insumos Estimados */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                <div className="font-semibold text-slate-800">
                  Previsão de Insumos / Materiais
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-8">
                    <label className="block text-slate-600 mb-1">Insumo</label>
                    <select
                      value={selectedProdId}
                      onChange={(e) => setSelectedProdId(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                    >
                      <option value="">Selecione o insumo...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (R$ {p.unitPrice.toFixed(2)}/{p.unit})
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
                      value={selectedQty}
                      onChange={(e) => setSelectedQty(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 font-mono bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={handleAddEstimatedSupply}
                      className="w-full py-1.5 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>

                {estimatedSupplies.length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-500 uppercase text-[10px]">
                        <tr>
                          <th className="py-1.5 px-3">Item</th>
                          <th className="py-1.5 px-3 text-right">Qtd</th>
                          <th className="py-1.5 px-3 text-right">Preço</th>
                          <th className="py-1.5 px-3 text-right">Remover</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {estimatedSupplies.map((item, idx) => (
                          <tr key={idx}>
                            <td className="py-1.5 px-3 font-sans font-medium text-slate-900">
                              {item.productName}
                            </td>
                            <td className="py-1.5 px-3 text-right">
                              {item.quantity} {item.unit}
                            </td>
                            <td className="py-1.5 px-3 text-right">
                              R$ {(item.quantity * item.unitPrice).toFixed(2)}
                            </td>
                            <td className="py-1.5 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveEstimatedSupply(idx)}
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
                <label className="block font-medium text-slate-700 mb-1">Valor da Mão de Obra (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={laborCost}
                  onChange={(e) => setLaborCost(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={(e) => handleCreateOrder(e, 'aprovado')}
                  className="px-3.5 py-1.5 text-slate-700 bg-slate-200 hover:bg-slate-300 font-medium rounded-lg"
                >
                  Salvar como Aprovado
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs"
                >
                  Salvar como Orçamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
