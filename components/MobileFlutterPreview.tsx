'use client';

import React, { useState } from 'react';
import {
  Smartphone,
  Wrench,
  ArrowRightLeft,
  Undo2,
  PackageCheck,
  FileSpreadsheet,
  CheckCircle2,
  Calendar,
  Clock,
  User,
  Plus,
  ArrowLeft,
  Check,
  ChevronRight,
  ShieldCheck,
  Wifi,
  Battery,
  Signal
} from 'lucide-react';
import {
  Collaborator,
  ServiceOrder,
  Product,
  SupplyRequisitionRM,
  SupplyApplicationRecord,
  SupplyReturnRecord
} from '@/types';

interface MobileFlutterPreviewProps {
  collaborators: Collaborator[];
  serviceOrders: ServiceOrder[];
  products: Product[];
  onProcessRM: (rm: SupplyRequisitionRM) => boolean;
  onProcessApplication: (app: SupplyApplicationRecord) => boolean;
  onProcessReturn: (ret: SupplyReturnRecord) => boolean;
  onExitMobilePreview: () => void;
}

export function MobileFlutterPreview({
  collaborators,
  serviceOrders,
  products,
  onProcessRM,
  onProcessApplication,
  onProcessReturn,
  onExitMobilePreview,
}: MobileFlutterPreviewProps) {
  // Simula o técnico autenticado no app mobile
  const [activeTechnicianMatricola, setActiveTechnicianMatricola] = useState(
    collaborators[0]?.matricola || 'MAT-1021'
  );

  // Aba móvel ativa no BottomNavigationBar do Flutter
  const [mobileTab, setMobileTab] = useState<'os' | 'custodia' | 'requisitar' | 'aplicar' | 'devolver'>(
    'os'
  );

  // Estados dos fluxos rápidos móveis
  const [selectedOSId, setSelectedOSId] = useState('');
  const [selectedProdId, setSelectedProdId] = useState('');
  const [qty, setQty] = useState('1');
  const [mobileFeedback, setMobileFeedback] = useState<string | null>(null);

  const currentTechnician = collaborators.find(
    (c) => c.matricola === activeTechnicianMatricola
  );

  const technicianOrders = serviceOrders.filter(
    (o) => o.assignedMatricola === activeTechnicianMatricola
  );

  // Ações rápidas no app mobile
  const handleQuickRM = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProdId || !currentTechnician) return;
    const prod = products.find((p) => p.id === selectedProdId);
    if (!prod) return;

    const quantityNum = parseFloat(qty) || 1;
    if (prod.currentStock < quantityNum) {
      alert(`Saldo insuficiente no almoxarifado (${prod.currentStock} ${prod.unit} disponíveis).`);
      return;
    }

    const newRM: SupplyRequisitionRM = {
      id: `rm-mob-${Date.now()}`,
      rmNumber: `RM-MOB-${Math.floor(100 + Math.random() * 900)}`,
      date: new Date().toISOString(),
      matricola: currentTechnician.matricola,
      technicianName: currentTechnician.name,
      serviceOrderId: selectedOSId || undefined,
      dispensedBy: 'Almoxarifado Central (Auto RM Mobile)',
      status: 'retirado',
      items: [
        {
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          unit: prod.unit,
          quantity: quantityNum,
        },
      ],
      notes: 'Requisição gerada via Flutter Mobile',
    };

    onProcessRM(newRM);
    setMobileFeedback(`RM ${newRM.rmNumber} confirmada! Insumo entrou na sua matrícula.`);
    setSelectedProdId('');
    setQty('1');
    setTimeout(() => {
      setMobileFeedback(null);
      setMobileTab('custodia');
    }, 1500);
  };

  const handleQuickApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOSId || !selectedProdId || !currentTechnician) return;

    const inCustody = currentTechnician.custody.find((c) => c.productId === selectedProdId);
    if (!inCustody) return;

    const quantityNum = parseFloat(qty) || 1;
    if (inCustody.quantity < quantityNum) {
      alert(`Você possui apenas ${inCustody.quantity} ${inCustody.unit} em sua custódia.`);
      return;
    }

    const order = serviceOrders.find((o) => o.id === selectedOSId);
    if (!order) return;

    const newApp: SupplyApplicationRecord = {
      id: `app-mob-${Date.now()}`,
      appCode: `APL-MOB-${Math.floor(100 + Math.random() * 900)}`,
      date: new Date().toISOString(),
      matricola: currentTechnician.matricola,
      technicianName: currentTechnician.name,
      serviceOrderId: order.id,
      serviceOrderCode: order.code,
      clientName: order.clientName,
      items: [
        {
          productId: inCustody.productId,
          productName: inCustody.productName,
          sku: inCustody.sku,
          unit: inCustody.unit,
          quantity: quantityNum,
        },
      ],
      notes: 'Apontamento em campo via Flutter Mobile',
    };

    onProcessApplication(newApp);
    setMobileFeedback(`Insumo aplicado com sucesso na ${order.code}!`);
    setSelectedProdId('');
    setQty('1');
    setTimeout(() => {
      setMobileFeedback(null);
      setMobileTab('os');
    }, 1500);
  };

  const handleQuickReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProdId || !currentTechnician) return;

    const inCustody = currentTechnician.custody.find((c) => c.productId === selectedProdId);
    if (!inCustody) return;

    const quantityNum = parseFloat(qty) || 1;
    if (inCustody.quantity < quantityNum) {
      alert(`Você possui apenas ${inCustody.quantity} ${inCustody.unit} em custódia.`);
      return;
    }

    const newReturn: SupplyReturnRecord = {
      id: `dev-mob-${Date.now()}`,
      returnCode: `DEV-MOB-${Math.floor(100 + Math.random() * 900)}`,
      date: new Date().toISOString(),
      matricola: currentTechnician.matricola,
      technicianName: currentTechnician.name,
      items: [
        {
          productId: inCustody.productId,
          productName: inCustody.productName,
          sku: inCustody.sku,
          unit: inCustody.unit,
          quantity: quantityNum,
          condition: 'perfeito',
        },
      ],
      receivedBy: 'Almoxarifado Central (Devolução Mobile)',
      notes: 'Sobra devolvida via Flutter Mobile',
    };

    onProcessReturn(newReturn);
    setMobileFeedback(`Sobra devolvida! Almoxarifado Central reabastecido.`);
    setSelectedProdId('');
    setQty('1');
    setTimeout(() => {
      setMobileFeedback(null);
      setMobileTab('custodia');
    }, 1500);
  };

  return (
    <div className="flex flex-col items-center justify-center py-4 space-y-4">
      {/* Controles do Simulador */}
      <div className="flex items-center justify-between w-full max-w-sm px-2 text-xs">
        <button
          onClick={onExitMobilePreview}
          className="flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Desktop ERP</span>
        </button>

        {/* Simulador de Troca de Usuário Técnico */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">Técnico Logado:</span>
          <select
            value={activeTechnicianMatricola}
            onChange={(e) => setActiveTechnicianMatricola(e.target.value)}
            className="text-xs py-1 px-2 border border-slate-200 rounded font-mono font-bold bg-white"
          >
            {collaborators.length === 0 ? (
              <option value="">Nenhum técnico cadastrado</option>
            ) : (
              collaborators.map((c) => (
                <option key={c.id} value={c.matricola}>
                  {c.matricola} ({c.name ? c.name.split(' ')[0] : ''})
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Frame do Smartphone (Clean Flutter Mobile Interface) */}
      <div className="w-full max-w-[380px] bg-slate-950 rounded-[40px] p-3 shadow-2xl border-4 border-slate-800">
        <div className="w-full bg-slate-50 rounded-[32px] overflow-hidden flex flex-col h-[700px] border border-slate-200">
          {/* 1. Android/iOS Status Bar */}
          <div className="px-5 pt-3 pb-2 flex items-center justify-between bg-white text-slate-800 text-[11px] font-medium border-b border-slate-100">
            <span>14:30</span>
            <div className="w-20 h-4 bg-slate-900 rounded-full mx-auto" />
            <div className="flex items-center gap-1.5 text-slate-700">
              <Signal className="w-3 h-3" />
              <Wifi className="w-3 h-3" />
              <Battery className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* 2. Flutter Material 3 Top AppBar */}
          <div className="px-4 py-3 bg-white border-b border-slate-200 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                A
              </div>
              <div>
                <div className="font-bold text-xs text-slate-900 leading-tight">
                  Aniel Mobile Flutter
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {currentTechnician
                    ? `${currentTechnician.matricola} · ${currentTechnician.name.split(' ')[0]}`
                    : 'Nenhum técnico'}
                </div>
              </div>
            </div>

            <span className="text-[10px] font-mono font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {currentTechnician?.vehicleId || 'Sem veículo'}
            </span>
          </div>

          {/* Feedback Toast */}
          {mobileFeedback && (
            <div className="p-2.5 mx-3 mt-2 bg-emerald-600 text-white rounded-lg text-xs flex items-center gap-2 shadow-sm animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{mobileFeedback}</span>
            </div>
          )}

          {/* 3. Área de Conteúdo da Tela Móvel */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 text-xs">
            {/* ABA 1: MINHAS ORDENS DE SERVIÇO */}
            {mobileTab === 'os' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs">Minhas Ordens de Serviço</span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {technicianOrders.length} OS
                  </span>
                </div>

                {technicianOrders.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
                    Nenhuma OS atribuída para a sua matrícula hoje.
                  </div>
                ) : (
                  technicianOrders.map((order) => (
                    <div
                      key={order.id}
                      className="p-3 bg-white border border-slate-200 rounded-xl space-y-2 shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-slate-900">{order.code}</span>
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                            order.status === 'em_execucao'
                              ? 'bg-blue-50 text-blue-700'
                              : order.status === 'concluido'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {order.status === 'em_execucao'
                            ? 'Em Execução'
                            : order.status === 'concluido'
                            ? 'Concluído'
                            : 'Agendado'}
                        </span>
                      </div>

                      <div className="font-semibold text-slate-900 leading-tight">
                        {order.title}
                      </div>

                      <div className="text-[11px] text-slate-600">{order.clientName}</div>
                      <div className="text-[10px] text-slate-400">{order.clientAddress}</div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <div className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{order.scheduledDate} {order.scheduledTime}</span>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedOSId(order.id);
                            setMobileTab('aplicar');
                          }}
                          className="px-2.5 py-1 bg-indigo-600 text-white font-medium rounded text-[11px] hover:bg-indigo-700"
                        >
                          Aplicar Insumo
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ABA 2: MINHA CUSTÓDIA */}
            {mobileTab === 'custodia' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs">Insumos sob sua Custódia</span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Matrícula: {currentTechnician?.matricola}
                  </span>
                </div>

                {currentTechnician && currentTechnician.custody.length === 0 ? (
                  <div className="p-8 text-center bg-white border border-slate-200 rounded-xl space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                    <div className="font-bold text-slate-800">Custódia Livre</div>
                    <p className="text-slate-500 text-[11px]">
                      Você não tem insumos pendentes em sua matrícula. Requisite novos itens na aba &quot;Requisitar RM&quot;.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {currentTechnician?.custody.map((item) => (
                      <div
                        key={item.productId}
                        className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-xs"
                      >
                        <div>
                          <div className="font-semibold text-slate-900 leading-tight">
                            {item.productName}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            SKU: {item.sku}
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-mono font-bold text-indigo-700 text-sm">
                            {item.quantity} {item.unit}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ABA 3: REQUISITAR RM (Almoxarifado -> Matrícula) */}
            {mobileTab === 'requisitar' && (
              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-3 shadow-xs">
                <div>
                  <div className="font-bold text-slate-900 text-xs">
                    Requisitar Insumo do Almoxarifado (RM)
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Sai do Almoxarifado Central e entra na sua matrícula.
                  </div>
                </div>

                <form onSubmit={handleQuickRM} className="space-y-2.5">
                  <div>
                    <label className="block text-slate-600 mb-1">Insumo a Retirar</label>
                    <select
                      required
                      value={selectedProdId}
                      onChange={(e) => setSelectedProdId(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg text-slate-900 text-xs font-medium"
                    >
                      <option value="">Selecione o insumo...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id} disabled={p.currentStock <= 0}>
                          {p.name} (Disp: {p.currentStock} {p.unit})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1">Quantidade</label>
                    <input
                      type="number"
                      step="any"
                      min="0.1"
                      required
                      value={qty}
                      onChange={(e) => setQty(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg text-slate-900 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1">Vincular a uma OS (Opcional)</label>
                    <select
                      value={selectedOSId}
                      onChange={(e) => setSelectedOSId(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg text-slate-900 text-xs"
                    >
                      <option value="">Sem OS (Estoque do Veículo)</option>
                      {technicianOrders.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.code} - {o.clientName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 text-xs mt-2"
                  >
                    Confirmar Retirada (RM)
                  </button>
                </form>
              </div>
            )}

            {/* ABA 4: APLICAR NA OS (Matrícula -> Serviço) */}
            {mobileTab === 'aplicar' && (
              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-3 shadow-xs">
                <div>
                  <div className="font-bold text-slate-900 text-xs">
                    Aplicar Insumo em Serviço
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Sai da sua matrícula e é consumido na Ordem de Serviço.
                  </div>
                </div>

                <form onSubmit={handleQuickApplication} className="space-y-2.5">
                  <div>
                    <label className="block text-slate-600 mb-1">Ordem de Serviço (OS)</label>
                    <select
                      required
                      value={selectedOSId}
                      onChange={(e) => setSelectedOSId(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg text-slate-900 text-xs font-medium"
                    >
                      <option value="">Selecione a OS...</option>
                      {serviceOrders
                        .filter((o) => o.status !== 'concluido' && o.status !== 'cancelado')
                        .map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.code} - {o.clientName}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1">Insumo em sua Custódia</label>
                    <select
                      required
                      value={selectedProdId}
                      onChange={(e) => setSelectedProdId(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg text-slate-900 text-xs font-medium"
                    >
                      <option value="">Selecione o insumo em sua posse...</option>
                      {currentTechnician?.custody.map((c) => (
                        <option key={c.productId} value={c.productId}>
                          {c.productName} (Tem: {c.quantity} {c.unit})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1">Quantidade Utilizada</label>
                    <input
                      type="number"
                      step="any"
                      min="0.1"
                      required
                      value={qty}
                      onChange={(e) => setQty(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg text-slate-900 font-mono text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!currentTechnician || currentTechnician.custody.length === 0}
                    className="w-full py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-xs mt-2"
                  >
                    Confirmar Aplicação na OS
                  </button>
                </form>
              </div>
            )}

            {/* ABA 5: DEVOLVER SOBRA (Devolve a sobra para o Almoxarifado) */}
            {mobileTab === 'devolver' && (
              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-3 shadow-xs">
                <div>
                  <div className="font-bold text-slate-900 text-xs">
                    Devolver Sobra de Insumos
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Devolve a sobra não utilizada de volta ao Almoxarifado Central.
                  </div>
                </div>

                <form onSubmit={handleQuickReturn} className="space-y-2.5">
                  <div>
                    <label className="block text-slate-600 mb-1">Sobra a Devolver</label>
                    <select
                      required
                      value={selectedProdId}
                      onChange={(e) => setSelectedProdId(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg text-slate-900 text-xs font-medium"
                    >
                      <option value="">Selecione a sobra em sua posse...</option>
                      {currentTechnician?.custody.map((c) => (
                        <option key={c.productId} value={c.productId}>
                          {c.productName} (Tem: {c.quantity} {c.unit})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1">Quantidade Devolvida</label>
                    <input
                      type="number"
                      step="any"
                      min="0.1"
                      required
                      value={qty}
                      onChange={(e) => setQty(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg text-slate-900 font-mono text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!currentTechnician || currentTechnician.custody.length === 0}
                    className="w-full py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 text-xs mt-2"
                  >
                    Confirmar Estorno ao Almoxarifado
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* 4. Flutter BottomNavigationBar (5 itens clássicos do app) */}
          <div className="bg-white border-t border-slate-200 px-2 py-2 flex items-center justify-around text-[10px]">
            <button
              onClick={() => setMobileTab('os')}
              className={`flex flex-col items-center gap-1 p-1 rounded transition-colors ${
                mobileTab === 'os' ? 'text-slate-900 font-bold' : 'text-slate-400'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>OS</span>
            </button>

            <button
              onClick={() => setMobileTab('custodia')}
              className={`flex flex-col items-center gap-1 p-1 rounded transition-colors ${
                mobileTab === 'custodia' ? 'text-slate-900 font-bold' : 'text-slate-400'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Custódia</span>
            </button>

            <button
              onClick={() => setMobileTab('requisitar')}
              className={`flex flex-col items-center gap-1 p-1 rounded transition-colors ${
                mobileTab === 'requisitar' ? 'text-blue-600 font-bold' : 'text-slate-400'
              }`}
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>Bipar RM</span>
            </button>

            <button
              onClick={() => setMobileTab('aplicar')}
              className={`flex flex-col items-center gap-1 p-1 rounded transition-colors ${
                mobileTab === 'aplicar' ? 'text-indigo-600 font-bold' : 'text-slate-400'
              }`}
            >
              <Wrench className="w-4 h-4" />
              <span>Aplicar</span>
            </button>

            <button
              onClick={() => setMobileTab('devolver')}
              className={`flex flex-col items-center gap-1 p-1 rounded transition-colors ${
                mobileTab === 'devolver' ? 'text-emerald-600 font-bold' : 'text-slate-400'
              }`}
            >
              <Undo2 className="w-4 h-4" />
              <span>Devolver</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
