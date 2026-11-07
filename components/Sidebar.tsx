'use client';

import React from 'react';
import {
  LayoutDashboard,
  Users,
  UserSquare2,
  PackageCheck,
  Truck,
  ArrowDownToLine,
  FileSpreadsheet,
  ArrowRightLeft,
  Wrench,
  Undo2,
  BarChart3,
  Database,
  Layers,
  ChevronRight,
  ShieldCheck,
  Smartphone
} from 'lucide-react';

export type ActiveSection = 
  | 'dashboard'
  | 'cadastros_clientes'
  | 'cadastros_colaboradores'
  | 'cadastros_produtos'
  | 'cadastros_veiculos'
  | 'almoxarifado_entradas'
  | 'servicos_orcamentos'
  | 'servicos_requisicao_rm'
  | 'servicos_aplicacao'
  | 'servicos_devolucao'
  | 'relatorios_produtividade'
  | 'supabase_panel';

interface SidebarProps {
  activeSection: ActiveSection;
  setActiveSection: (sec: ActiveSection) => void;
  pendingRMCount: number;
  custodyCountTotal: number;
  activeOSCount: number;
  lowStockCount: number;
  onOpenMobileView: () => void;
}

export function Sidebar({
  activeSection,
  setActiveSection,
  pendingRMCount,
  custodyCountTotal,
  activeOSCount,
  lowStockCount,
  onOpenMobileView,
}: SidebarProps) {
  const isCadastroActive = activeSection.startsWith('cadastros_');

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 min-h-[calc(100vh-57px)]">
      {/* Top operational badge */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
          Empresa / Unidade
        </div>
        <div className="flex items-center justify-between">
          <div className="text-sm font-bold text-slate-900 truncate">
            Matriz Operacional
          </div>
          <span className="text-xs text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded">
            Ativo
          </span>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-6 overflow-y-auto">
        {/* GRUPO 1: PRINCIPAL */}
        <div>
          <div className="px-3 mb-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Visão Geral
          </div>
          <div className="space-y-0.5">
            <button
              onClick={() => setActiveSection('dashboard')}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                activeSection === 'dashboard'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard Analítico</span>
              </div>
            </button>

            <button
              onClick={() => setActiveSection('relatorios_produtividade')}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                activeSection === 'relatorios_produtividade'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <BarChart3 className="w-4 h-4" />
                <span>Produtividade Real-Time</span>
              </div>
            </button>
          </div>
        </div>

        {/* GRUPO 2: CADASTROS */}
        <div>
          <div className="px-3 mb-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Cadastros Gerais
          </div>
          <div className="space-y-0.5">
            <button
              onClick={() => setActiveSection('cadastros_clientes')}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                activeSection === 'cadastros_clientes'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4" />
                <span>Clientes</span>
              </div>
            </button>

            <button
              onClick={() => setActiveSection('cadastros_colaboradores')}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                activeSection === 'cadastros_colaboradores'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <UserSquare2 className="w-4 h-4" />
                <span>Colaboradores & Matrícula</span>
              </div>
              {custodyCountTotal > 0 && (
                <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                  {custodyCountTotal} em custódia
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveSection('cadastros_produtos')}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                activeSection === 'cadastros_produtos'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <PackageCheck className="w-4 h-4" />
                <span>Produtos & Insumos</span>
              </div>
              {lowStockCount > 0 && (
                <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                  {lowStockCount} baixo
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveSection('cadastros_veiculos')}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                activeSection === 'cadastros_veiculos'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Truck className="w-4 h-4" />
                <span>Veículos & Frota</span>
              </div>
            </button>
          </div>
        </div>

        {/* GRUPO 3: ALMOXARIFADO */}
        <div>
          <div className="px-3 mb-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Almoxarifado
          </div>
          <div className="space-y-0.5">
            <button
              onClick={() => setActiveSection('almoxarifado_entradas')}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                activeSection === 'almoxarifado_entradas'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ArrowDownToLine className="w-4 h-4 text-emerald-600" />
                <span>Entrada de Insumos (NF)</span>
              </div>
            </button>
          </div>
        </div>

        {/* GRUPO 4: SERVIÇOS & CICLO DE INSUMOS */}
        <div>
          <div className="px-3 mb-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Serviços & Ciclo de Insumos
          </div>
          <div className="space-y-0.5">
            {/* 1. Orçamento / OS */}
            <button
              onClick={() => setActiveSection('servicos_orcamentos')}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                activeSection === 'servicos_orcamentos'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-4 h-4" />
                <span>Orçamento & Ordens (OS)</span>
              </div>
              {activeOSCount > 0 && (
                <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-blue-100 text-blue-800">
                  {activeOSCount} ativas
                </span>
              )}
            </button>

            {/* 2. Requisição RM (Almoxarifado -> Matrícula) */}
            <button
              onClick={() => setActiveSection('servicos_requisicao_rm')}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                activeSection === 'servicos_requisicao_rm'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
              title="Sai do Almoxarifado e entra na matrícula do colaborador"
            >
              <div className="flex items-center gap-2.5">
                <ArrowRightLeft className="w-4 h-4 text-blue-600" />
                <div className="text-left">
                  <div className="leading-tight">Requisição RM</div>
                  <div className="text-[10px] text-slate-400 font-normal">Almox. → Matrícula</div>
                </div>
              </div>
            </button>

            {/* 3. Aplicação de Insumos (Matrícula -> Serviço) */}
            <button
              onClick={() => setActiveSection('servicos_aplicacao')}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                activeSection === 'servicos_aplicacao'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
              title="Sai da matrícula do colaborador e aplica no Serviço"
            >
              <div className="flex items-center gap-2.5">
                <Wrench className="w-4 h-4 text-indigo-600" />
                <div className="text-left">
                  <div className="leading-tight">Aplicação no Serviço</div>
                  <div className="text-[10px] text-slate-400 font-normal">Matrícula → OS</div>
                </div>
              </div>
            </button>

            {/* 4. Devolução de Insumos (Devolve a sobra) */}
            <button
              onClick={() => setActiveSection('servicos_devolucao')}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                activeSection === 'servicos_devolucao'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
              title="Devolve a sobra de volta ao Almoxarifado"
            >
              <div className="flex items-center gap-2.5">
                <Undo2 className="w-4 h-4 text-emerald-600" />
                <div className="text-left">
                  <div className="leading-tight">Devolução de Sobras</div>
                  <div className="text-[10px] text-slate-400 font-normal">Sobra → Almox.</div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* GRUPO 5: INTEGRAÇÃO SUPABASE */}
        <div>
          <div className="px-3 mb-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Banco de Dados
          </div>
          <div className="space-y-0.5">
            <button
              onClick={() => setActiveSection('supabase_panel')}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                activeSection === 'supabase_panel'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Database className="w-4 h-4 text-emerald-600" />
                <span>Supabase: aniel</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-600 font-semibold">
                SQL DDL
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* Flutter Mobile Banner */}
      <div className="p-3 border-t border-slate-200 bg-slate-50">
        <button
          onClick={onOpenMobileView}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors shadow-xs"
        >
          <Smartphone className="w-4 h-4 text-emerald-600" />
          <span>Abrir App Flutter Mobile</span>
        </button>
      </div>
    </aside>
  );
}
