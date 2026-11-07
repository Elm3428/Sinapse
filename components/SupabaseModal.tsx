'use client';

import React, { useState } from 'react';
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Download,
  X,
  RefreshCw,
  Server,
  Layers,
  Code2
} from 'lucide-react';
import { SupabaseConfig } from '@/types';
import { StorageService } from '@/lib/storage';
import { testSupabaseConnection } from '@/lib/supabase';

interface SupabaseModalProps {
  config: SupabaseConfig;
  isOpen: boolean;
  onClose: () => void;
  onSaveConfig: (cfg: SupabaseConfig) => void;
}

export function SupabaseModal({
  config,
  isOpen,
  onClose,
  onSaveConfig,
}: SupabaseModalProps) {
  const [url, setUrl] = useState(config.url);
  const [anonKey, setAnonKey] = useState(config.anonKey);
  const [dbName, setDbName] = useState(config.dbName || 'aniel');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'sql' | 'tabelas'>('config');

  if (!isOpen) return null;

  const sqlSchema = StorageService.generateSupabaseSQL();

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    const updated = {
      ...config,
      url,
      anonKey,
      dbName,
    };
    const res = await testSupabaseConnection(updated);
    setIsTesting(false);
    setTestResult(res);
    if (res.success) {
      onSaveConfig({
        ...updated,
        isConnected: true,
        lastSync: new Date().toISOString(),
      });
    }
  };

  const handleSave = () => {
    onSaveConfig({
      ...config,
      url,
      anonKey,
      dbName,
      lastSync: new Date().toISOString(),
    });
    onClose();
  };

  const handleCopySQL = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSQL = () => {
    const blob = new Blob([sqlSchema], { type: 'text/sql;charset=utf-8;' });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', 'schema_supabase_aniel.sql');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Integração Supabase · Banco de Dados: <span className="text-emerald-700">aniel</span>
              </h2>
              <p className="text-xs text-slate-500">
                Conexão em tempo real, credenciais de API e esquema SQL DDL completo.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Subtabs */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-slate-200 bg-white">
          <button
            onClick={() => setActiveTab('config')}
            className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-all ${
              activeTab === 'config'
                ? 'border-emerald-600 text-emerald-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Configurações da Conexão
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-all ${
              activeTab === 'sql'
                ? 'border-emerald-600 text-emerald-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Script SQL (DDL Supabase)
          </button>
          <button
            onClick={() => setActiveTab('tabelas')}
            className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-all ${
              activeTab === 'tabelas'
                ? 'border-emerald-600 text-emerald-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Tabelas do Banco ({'11'})
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
          {/* TAB 1: CONFIG */}
          {activeTab === 'config' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-lg text-emerald-900 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <div>
                    <span className="font-semibold">Banco de Dados Ativo: aniel</span>
                    <div className="text-[11px] text-emerald-800">
                      O sistema está configurado para o banco de dados Supabase da empresa.
                    </div>
                  </div>
                </div>
                <span className="font-mono text-[11px] font-bold bg-white px-2 py-0.5 rounded border border-emerald-300">
                  PostgreSQL 15+
                </span>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Nome do Banco de Dados
                </label>
                <input
                  type="text"
                  value={dbName}
                  onChange={(e) => setDbName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Project URL do Supabase
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://xyzcompany.supabase.co"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Supabase Anon Public API Key
                </label>
                <textarea
                  rows={2}
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                    testResult.success
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                      : 'bg-amber-50 border border-amber-200 text-amber-800'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>{isTesting ? 'Testando Conexão...' : 'Testar Conexão com aniel'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: SQL SCHEMA */}
          {activeTab === 'sql' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-slate-600 text-xs">
                  Copie e execute este script no <strong>SQL Editor do Supabase</strong> para criar as tabelas do banco <code>aniel</code>:
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopySQL}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copiado!' : 'Copiar SQL'}</span>
                  </button>
                  <button
                    onClick={handleDownloadSQL}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Baixar .sql</span>
                  </button>
                </div>
              </div>

              <pre className="p-3.5 bg-slate-900 text-slate-100 rounded-lg font-mono text-[11px] overflow-x-auto max-h-[380px] leading-relaxed">
                {sqlSchema}
              </pre>
            </div>
          )}

          {/* TAB 3: TABELAS */}
          {activeTab === 'tabelas' && (
            <div className="space-y-2">
              {[
                { name: 'clientes', desc: 'Dados cadastrais, CNPJ/CPF, segmento e contatos' },
                { name: 'colaboradores', desc: 'Equipes técnicas com matrícula única e setor' },
                { name: 'produtos_insumos', desc: 'Catálogo de materiais e estoque no almoxarifado' },
                { name: 'veiculos', desc: 'Frota operacional, placas, motorista e KM' },
                { name: 'custodia_colaborador', desc: 'Saldo de insumos sob custódia de cada matrícula' },
                { name: 'entradas_almoxarifado', desc: 'Notas fiscais de entrada e fornecedores' },
                { name: 'ordens_servico', desc: 'Orçamentos, OS em execução e custos' },
                { name: 'requisicoes_rm', desc: 'Saída do almoxarifado para a matrícula do técnico' },
                { name: 'aplicacoes_servico', desc: 'Insumos aplicados e consumidos na OS' },
                { name: 'devolucoes_almoxarifado', desc: 'Retorno de sobras não utilizadas ao estoque' },
              ].map((tb) => (
                <div
                  key={tb.name}
                  className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-lg"
                >
                  <div>
                    <div className="font-mono font-bold text-slate-900">{tb.name}</div>
                    <div className="text-[11px] text-slate-500">{tb.desc}</div>
                  </div>
                  <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    RLS Habilitado
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-3.5 border-t border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-1.5 font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs"
          >
            Salvar Configurações
          </button>
        </div>
      </div>
    </div>
  );
}
