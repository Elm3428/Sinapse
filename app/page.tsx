'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Sidebar, ActiveSection } from '@/components/Sidebar';
import { DashboardView } from '@/components/DashboardView';
import { CadastrosView } from '@/components/CadastrosView';
import { AlmoxarifadoView } from '@/components/AlmoxarifadoView';
import { OrcamentoServicoView } from '@/components/OrcamentoServicoView';
import { RequisicaoRMView } from '@/components/RequisicaoRMView';
import { AplicacaoInsumosView } from '@/components/AplicacaoInsumosView';
import { DevolucaoInsumosView } from '@/components/DevolucaoInsumosView';
import { RelatoriosProdutividadeView } from '@/components/RelatoriosProdutividadeView';
import { SupabaseModal } from '@/components/SupabaseModal';
import { PrintServiceOrderModal } from '@/components/PrintServiceOrderModal';
import { MobileFlutterPreview } from '@/components/MobileFlutterPreview';

import { StorageService } from '@/lib/storage';
import {
  Client,
  Collaborator,
  Product,
  Vehicle,
  ServiceOrder,
  WarehouseEntry,
  SupplyRequisitionRM,
  SupplyApplicationRecord,
  SupplyReturnRecord,
  SupabaseConfig
} from '@/types';

export default function HomePage() {
  // Estado de navegação e visualização
  const [activeSection, setActiveSection] = useState<ActiveSection>('dashboard');
  const [isMobilePreview, setIsMobilePreview] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Modais globais
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [printOrder, setPrintOrder] = useState<ServiceOrder | null>(null);

  // Estados de dados principais
  const [clients, setClients] = useState<Client[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [entries, setEntries] = useState<WarehouseEntry[]>([]);
  const [requisitions, setRequisitions] = useState<SupplyRequisitionRM[]>([]);
  const [applications, setApplications] = useState<SupplyApplicationRecord[]>([]);
  const [returns, setReturns] = useState<SupplyReturnRecord[]>([]);
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>({
    url: '',
    anonKey: '',
    dbName: 'aniel',
    isConnected: true,
    autoSync: true,
  });

  const [preselectedOrderId, setPreselectedOrderId] = useState<string | undefined>(undefined);
  const [isMounted, setIsMounted] = useState(false);

  // Carrega dados e garante base zerada no primeiro carregamento
  useEffect(() => {
    setIsMounted(true);
    StorageService.ensureCleanStartup();
    setClients(StorageService.getClients());
    setCollaborators(StorageService.getCollaborators());
    setProducts(StorageService.getProducts());
    setVehicles(StorageService.getVehicles());
    setServiceOrders(StorageService.getServiceOrders());
    setEntries(StorageService.getWarehouseEntries());
    setRequisitions(StorageService.getRequisitionsRM());
    setApplications(StorageService.getApplications());
    setReturns(StorageService.getReturns());
    setSupabaseConfig(StorageService.getSupabaseConfig());
  }, []);

  // Handlers de Zerar e Carregar Demo
  const handleClearData = () => {
    if (confirm('Atenção: Deseja zerar completamente todos os dados do sistema para cadastrar do zero?')) {
      StorageService.clearDatabase();
      setClients([]);
      setCollaborators([]);
      setProducts([]);
      setVehicles([]);
      setServiceOrders([]);
      setEntries([]);
      setRequisitions([]);
      setApplications([]);
      setReturns([]);
      setSupabaseConfig(StorageService.getSupabaseConfig());
    }
  };

  const handleLoadDemoData = () => {
    if (confirm('Deseja carregar a base de dados de exemplo para demonstração?')) {
      StorageService.loadDemoData();
      setClients(StorageService.getClients());
      setCollaborators(StorageService.getCollaborators());
      setProducts(StorageService.getProducts());
      setVehicles(StorageService.getVehicles());
      setServiceOrders(StorageService.getServiceOrders());
      setEntries(StorageService.getWarehouseEntries());
      setRequisitions(StorageService.getRequisitionsRM());
      setApplications(StorageService.getApplications());
      setReturns(StorageService.getReturns());
      setSupabaseConfig(StorageService.getSupabaseConfig());
    }
  };

  const isDatabaseEmpty =
    clients.length === 0 &&
    collaborators.length === 0 &&
    products.length === 0 &&
    serviceOrders.length === 0;

  // Handlers de Cadastros
  const handleSaveClient = (client: Client) => {
    const updated = StorageService.saveClient(client);
    setClients(updated);
  };
  const handleDeleteClient = (id: string) => {
    const updated = StorageService.deleteClient(id);
    setClients(updated);
  };

  const handleSaveCollaborator = (col: Collaborator) => {
    const updated = StorageService.saveCollaborator(col);
    setCollaborators(updated);
  };
  const handleDeleteCollaborator = (id: string) => {
    const updated = StorageService.deleteCollaborator(id);
    setCollaborators(updated);
  };

  const handleSaveProduct = (prod: Product) => {
    const updated = StorageService.saveProduct(prod);
    setProducts(updated);
  };
  const handleDeleteProduct = (id: string) => {
    const updated = StorageService.deleteProduct(id);
    setProducts(updated);
  };

  const handleSaveVehicle = (veh: Vehicle) => {
    const updated = StorageService.saveVehicle(veh);
    setVehicles(updated);
  };
  const handleDeleteVehicle = (id: string) => {
    const updated = StorageService.deleteVehicle(id);
    setVehicles(updated);
  };

  // Handlers de Serviços
  const handleSaveServiceOrder = (order: ServiceOrder) => {
    const updated = StorageService.saveServiceOrder(order);
    setServiceOrders(updated);
  };
  const handleDeleteServiceOrder = (id: string) => {
    const updated = StorageService.deleteServiceOrder(id);
    setServiceOrders(updated);
  };

  // 1. Entrada de Insumos no Almoxarifado (+estoque no Almoxarifado)
  const handleAddWarehouseEntry = (entry: WarehouseEntry) => {
    const res = StorageService.addWarehouseEntry(entry);
    setEntries(res.entries);
    setProducts(res.products);
  };

  // 2. Requisição RM (Sai do Almoxarifado -> Entra na Matrícula)
  const handleProcessRM = (rm: SupplyRequisitionRM): boolean => {
    const res = StorageService.processRequisitionRM(rm);
    if (!res.success) {
      alert(res.message || 'Erro ao processar requisição RM.');
      return false;
    }
    setRequisitions(res.requisitions);
    setProducts(res.products);
    setCollaborators(res.collaborators);
    return true;
  };

  // 3. Aplicação de Insumos (Sai da Matrícula -> Entra no Serviço)
  const handleProcessApplication = (app: SupplyApplicationRecord): boolean => {
    const res = StorageService.processSupplyApplication(app);
    if (!res.success) {
      alert(res.message || 'Erro ao processar aplicação de insumo.');
      return false;
    }
    setApplications(res.applications);
    setCollaborators(res.collaborators);
    setServiceOrders(res.serviceOrders);
    return true;
  };

  // 4. Devolução de Insumos (Devolve a Sobra -> Volta ao Almoxarifado)
  const handleProcessReturn = (ret: SupplyReturnRecord): boolean => {
    const res = StorageService.processSupplyReturn(ret);
    if (!res.success) {
      alert(res.message || 'Erro ao processar devolução de sobra.');
      return false;
    }
    setReturns(res.returns);
    setCollaborators(res.collaborators);
    setProducts(res.products);
    return true;
  };

  // Salvar Config Supabase
  const handleSaveSupabaseConfig = (cfg: SupabaseConfig) => {
    const saved = StorageService.saveSupabaseConfig(cfg);
    setSupabaseConfig(saved);
  };

  // Exportar Backup JSON
  const handleExportData = () => {
    const jsonStr = StorageService.exportDatabaseJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `aniel_gestao_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Restaurar dados originais
  const handleResetData = () => {
    if (confirm('Deseja restaurar a base para os dados de demonstração iniciais?')) {
      StorageService.resetToInitialData();
      setClients(StorageService.getClients());
      setCollaborators(StorageService.getCollaborators());
      setProducts(StorageService.getProducts());
      setVehicles(StorageService.getVehicles());
      setServiceOrders(StorageService.getServiceOrders());
      setEntries(StorageService.getWarehouseEntries());
      setRequisitions(StorageService.getRequisitionsRM());
      setApplications(StorageService.getApplications());
      setReturns(StorageService.getReturns());
      setSupabaseConfig(StorageService.getSupabaseConfig());
    }
  };

  // Métricas auxiliares para a barra lateral
  const activeOSCount = serviceOrders.filter(
    (o) => o.status === 'em_execucao' || o.status === 'aprovado'
  ).length;

  const custodyCountTotal = collaborators.reduce(
    (acc, c) => acc + c.custody.reduce((sum, item) => sum + item.quantity, 0),
    0
  );

  const lowStockCount = products.filter((p) => p.currentStock <= p.minStock).length;

  // Título da seção para o header
  const getSectionTitle = () => {
    switch (activeSection) {
      case 'dashboard':
        return 'Dashboard Analítico';
      case 'cadastros_clientes':
        return 'Cadastro de Clientes';
      case 'cadastros_colaboradores':
        return 'Cadastro de Colaboradores & Matrícula';
      case 'cadastros_produtos':
        return 'Cadastro de Insumos & Catálogo';
      case 'cadastros_veiculos':
        return 'Cadastro de Veículos & Frota';
      case 'almoxarifado_entradas':
        return 'Almoxarifado · Entrada de Insumos';
      case 'servicos_orcamentos':
        return 'Serviços · Orçamentos & Ordens (OS)';
      case 'servicos_requisicao_rm':
        return 'Requisição RM · Almoxarifado ➔ Matrícula';
      case 'servicos_aplicacao':
        return 'Aplicação de Insumos · Matrícula ➔ OS';
      case 'servicos_devolucao':
        return 'Devolução de Sobras ➔ Almoxarifado';
      case 'relatorios_produtividade':
        return 'Produtividade & Kardex Real-Time';
      case 'supabase_panel':
        return 'Banco de Dados Supabase · aniel';
      default:
        return 'Visão Geral';
    }
  };

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg mx-auto shadow-sm animate-pulse">
            A
          </div>
          <div className="text-xs font-semibold text-slate-700">Carregando Aniel Gestão...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* 1. Top Bar Contract */}
      <Header
        currentViewTitle={getSectionTitle()}
        isMobilePreview={isMobilePreview}
        setIsMobilePreview={setIsMobilePreview}
        supabaseConfig={supabaseConfig}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        onOpenNewServiceOrderModal={() => setActiveSection('servicos_orcamentos')}
        onExportData={handleExportData}
        onClearData={handleClearData}
        onLoadDemoData={handleLoadDemoData}
        isDatabaseEmpty={isDatabaseEmpty}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      {/* 2. Conteúdo Principal */}
      <div className="flex-1 flex overflow-hidden">
        {/* Barra Lateral (Esquerda) */}
        {!isMobilePreview && (
          <Sidebar
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            pendingRMCount={requisitions.filter((r) => r.status === 'pendente').length}
            custodyCountTotal={custodyCountTotal}
            activeOSCount={activeOSCount}
            lowStockCount={lowStockCount}
            onOpenMobileView={() => setIsMobilePreview(true)}
          />
        )}

        {/* Viewport Principal (Direita) */}
        <main className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full">
          {/* Se a visualização móvel estilo Flutter estiver ativa */}
          {isMobilePreview ? (
            <MobileFlutterPreview
              collaborators={collaborators}
              serviceOrders={serviceOrders}
              products={products}
              onProcessRM={handleProcessRM}
              onProcessApplication={handleProcessApplication}
              onProcessReturn={handleProcessReturn}
              onExitMobilePreview={() => setIsMobilePreview(false)}
            />
          ) : (
            <>
              {/* 1. Dashboard Principal */}
              {activeSection === 'dashboard' && (
                <DashboardView
                  clients={clients}
                  collaborators={collaborators}
                  products={products}
                  vehicles={vehicles}
                  serviceOrders={serviceOrders}
                  entries={entries}
                  requisitions={requisitions}
                  applications={applications}
                  returns={returns}
                  onNavigate={(sec) => setActiveSection(sec)}
                  onOpenNewOrderModal={() => setActiveSection('servicos_orcamentos')}
                />
              )}

              {/* 2. Módulo de Cadastros */}
              {activeSection.startsWith('cadastros_') && (
                <CadastrosView
                  initialSubtab={
                    activeSection === 'cadastros_colaboradores'
                      ? 'colaboradores'
                      : activeSection === 'cadastros_produtos'
                      ? 'produtos'
                      : activeSection === 'cadastros_veiculos'
                      ? 'veiculos'
                      : 'clientes'
                  }
                  clients={clients}
                  collaborators={collaborators}
                  products={products}
                  vehicles={vehicles}
                  onSaveClient={handleSaveClient}
                  onDeleteClient={handleDeleteClient}
                  onSaveCollaborator={handleSaveCollaborator}
                  onDeleteCollaborator={handleDeleteCollaborator}
                  onSaveProduct={handleSaveProduct}
                  onDeleteProduct={handleDeleteProduct}
                  onSaveVehicle={handleSaveVehicle}
                  onDeleteVehicle={handleDeleteVehicle}
                />
              )}

              {/* 3. Almoxarifado (Entrada de Insumos) */}
              {activeSection === 'almoxarifado_entradas' && (
                <AlmoxarifadoView
                  products={products}
                  entries={entries}
                  onAddEntry={handleAddWarehouseEntry}
                  onNavigateToCatalog={() => setActiveSection('cadastros_produtos')}
                />
              )}

              {/* 4. Serviços: Orçamentos e Ordens de Serviço */}
              {activeSection === 'servicos_orcamentos' && (
                <OrcamentoServicoView
                  serviceOrders={serviceOrders}
                  clients={clients}
                  collaborators={collaborators}
                  vehicles={vehicles}
                  products={products}
                  onSaveServiceOrder={handleSaveServiceOrder}
                  onDeleteServiceOrder={handleDeleteServiceOrder}
                  onPrintOrder={(order) => setPrintOrder(order)}
                  onNavigateToRM={(orderId) => {
                    setPreselectedOrderId(orderId);
                    setActiveSection('servicos_requisicao_rm');
                  }}
                  onNavigateToApplication={(orderId) => {
                    setPreselectedOrderId(orderId);
                    setActiveSection('servicos_aplicacao');
                  }}
                />
              )}

              {/* 5. Serviços: Requisição RM (Almoxarifado -> Matrícula) */}
              {activeSection === 'servicos_requisicao_rm' && (
                <RequisicaoRMView
                  collaborators={collaborators}
                  products={products}
                  serviceOrders={serviceOrders}
                  requisitions={requisitions}
                  preselectedOrderId={preselectedOrderId}
                  onProcessRM={handleProcessRM}
                />
              )}

              {/* 6. Serviços: Aplicação de Insumos (Matrícula -> Serviço) */}
              {activeSection === 'servicos_aplicacao' && (
                <AplicacaoInsumosView
                  collaborators={collaborators}
                  serviceOrders={serviceOrders}
                  applications={applications}
                  preselectedOrderId={preselectedOrderId}
                  onProcessApplication={handleProcessApplication}
                />
              )}

              {/* 7. Serviços: Devolução de Insumos (Devolve a Sobra) */}
              {activeSection === 'servicos_devolucao' && (
                <DevolucaoInsumosView
                  collaborators={collaborators}
                  serviceOrders={serviceOrders}
                  returns={returns}
                  onProcessReturn={handleProcessReturn}
                />
              )}

              {/* 8. Produtividade & Kardex Real-Time */}
              {activeSection === 'relatorios_produtividade' && (
                <RelatoriosProdutividadeView
                  collaborators={collaborators}
                  serviceOrders={serviceOrders}
                  products={products}
                  entries={entries}
                  requisitions={requisitions}
                  applications={applications}
                  returns={returns}
                />
              )}

              {/* 9. Supabase Panel */}
              {activeSection === 'supabase_panel' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div>
                      <h1 className="text-xl font-bold tracking-tight text-slate-900">
                        Integração com Banco de Dados Supabase: aniel
                      </h1>
                      <p className="text-xs text-slate-500">
                        Sincronização bidirecional e script de migração DDL PostgreSQL.
                      </p>
                    </div>
                    <button
                      onClick={() => setIsSupabaseModalOpen(true)}
                      className="px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800"
                    >
                      Abrir Modal de Configurações
                    </button>
                  </div>

                  <div className="p-6 bg-white border border-slate-200 rounded-xl space-y-4">
                    <div className="flex items-center gap-3 text-emerald-800 bg-emerald-50 p-4 rounded-lg border border-emerald-200 text-xs">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <div>
                        <strong>Supabase Conectado ao banco: aniel</strong>
                        <div className="text-[11px] text-emerald-700 mt-0.5">
                          Todas as tabelas foram modeladas para suportar o fluxo completo: Clientes, Colaboradores, Veículos, Produtos, Entradas NF, Requisições RM por Matrícula, Aplicações em OS e Devoluções de Sobras.
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Esquema SQL Oficial Pronto para o Supabase
                      </div>
                      <pre className="p-4 bg-slate-900 text-slate-100 rounded-lg font-mono text-[11px] max-h-96 overflow-y-auto leading-relaxed">
                        {StorageService.generateSupabaseSQL()}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Modal de Configuração do Supabase aniel */}
      <SupabaseModal
        config={supabaseConfig}
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        onSaveConfig={handleSaveSupabaseConfig}
      />

      {/* Modal de Impressão Oficial A4 de Ordem de Serviço */}
      <PrintServiceOrderModal
        order={printOrder}
        onClose={() => setPrintOrder(null)}
      />
    </div>
  );
}
