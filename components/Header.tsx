'use client';

import React from 'react';
import { 
  Building2, 
  Smartphone, 
  Monitor, 
  Database, 
  Download, 
  PlusCircle, 
  RotateCcw,
  Search,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { SupabaseConfig } from '@/types';

interface HeaderProps {
  currentViewTitle: string;
  isMobilePreview: boolean;
  setIsMobilePreview: (val: boolean) => void;
  supabaseConfig: SupabaseConfig;
  onOpenSupabaseModal: () => void;
  onOpenNewServiceOrderModal: () => void;
  onExportData: () => void;
  onClearData: () => void;
  onLoadDemoData: () => void;
  isDatabaseEmpty: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export function Header({
  currentViewTitle,
  isMobilePreview,
  setIsMobilePreview,
  supabaseConfig,
  onOpenSupabaseModal,
  onOpenNewServiceOrderModal,
  onExportData,
  onClearData,
  onLoadDemoData,
  isDatabaseEmpty,
  searchTerm,
  setSearchTerm,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 px-6 py-3.5 bg-white border-b border-slate-200">
      {/* Zone 1: Brand Wordmark & Current Context */}
      <div className="flex items-center gap-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            A
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap">
                Aniel Gestão
              </span>
              {isDatabaseEmpty ? (
                <span className="hidden sm:inline-block text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                  Base Limpa
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="font-medium text-slate-700">{currentViewTitle}</span>
              <span aria-hidden="true">·</span>
              <span>Multi-Setor</span>
            </div>
          </div>
        </div>
      </div>

      {/* Zone 2: Search & Mode Switch */}
      <div className="hidden md:flex items-center gap-3 flex-1 max-w-xl mx-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por colaborador, matrícula, insumo, cliente ou OS..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white transition-all"
          />
        </div>

        {/* Flutter Mobile vs Desktop ERP View Switcher */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg shrink-0">
          <button
            onClick={() => setIsMobilePreview(false)}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
              !isMobilePreview
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Visualização Completa de Desktop ERP"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Desktop ERP</span>
          </button>
          <button
            onClick={() => setIsMobilePreview(true)}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
              isMobilePreview
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Visualização Aplicativo Mobile Flutter"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Flutter Mobile</span>
          </button>
        </div>
      </div>

      {/* Zone 3: Actions & Supabase Integration */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Supabase 'aniel' Connector Status */}
        <button
          onClick={onOpenSupabaseModal}
          className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors"
          title="Configurações e Esquema SQL do Supabase aniel"
        >
          <Database className="w-3.5 h-3.5 text-emerald-600" />
          <span className="hidden sm:inline">Supabase:</span>
          <span className="font-semibold text-slate-900">aniel</span>
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
        </button>

        {/* Data Tools: Export / Clear / Load Demo */}
        <button
          onClick={onExportData}
          className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
          title="Exportar backup completo JSON"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Backup</span>
        </button>

        <button
          onClick={onClearData}
          className="hidden xl:flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium border border-slate-200 rounded-lg text-slate-600 hover:text-rose-700 hover:bg-rose-50 transition-colors"
          title="Limpar todos os dados e deixar a base 100% zerada"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Zerar Base</span>
        </button>

        {isDatabaseEmpty && (
          <button
            onClick={onLoadDemoData}
            className="hidden 2xl:flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium border border-blue-200 rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
            title="Carregar dados de exemplo (demonstração)"
          >
            <span>Carregar Exemplo</span>
          </button>
        )}

        {/* Primary Action Button */}
        <button
          onClick={onOpenNewServiceOrderModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Nova OS / Orçamento</span>
        </button>
      </div>
    </header>
  );
}
