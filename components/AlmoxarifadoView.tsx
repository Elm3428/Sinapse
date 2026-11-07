'use client';

import React, { useState } from 'react';
import {
  ArrowDownToLine,
  PackageCheck,
  Plus,
  Trash2,
  FileText,
  AlertTriangle,
  Search,
  CheckCircle2,
  Calendar,
  Building,
  DollarSign
} from 'lucide-react';
import { Product, WarehouseEntry, WarehouseEntryItem } from '@/types';

interface AlmoxarifadoViewProps {
  products: Product[];
  entries: WarehouseEntry[];
  onAddEntry: (entry: WarehouseEntry) => void;
  onNavigateToCatalog: () => void;
}

export function AlmoxarifadoView({
  products,
  entries,
  onAddEntry,
  onNavigateToCatalog,
}: AlmoxarifadoViewProps) {
  const [isEntryFormOpen, setIsEntryFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [supplier, setSupplier] = useState('');
  const [entryDate, setEntryDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [receivedByMatricola, setReceivedByMatricola] = useState('MAT-1001 (Almoxarife)');
  const [notes, setNotes] = useState('');

  // Itens da Entrada
  const [entryItems, setEntryItems] = useState<WarehouseEntryItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [itemQuantity, setItemQuantity] = useState('1');
  const [itemUnitCost, setItemUnitCost] = useState('0');

  const handleSelectProduct = (productId: string) => {
    setSelectedProductId(productId);
    const prod = products.find((p) => p.id === productId);
    if (prod) {
      setItemUnitCost(prod.unitCost.toString());
    }
  };

  const handleAddItemToEntry = () => {
    if (!selectedProductId) return;
    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod) return;

    const qty = parseFloat(itemQuantity) || 1;
    const cost = parseFloat(itemUnitCost) || prod.unitCost;

    const newItem: WarehouseEntryItem = {
      productId: prod.id,
      productName: prod.name,
      sku: prod.sku,
      unit: prod.unit,
      quantity: qty,
      unitCost: cost,
      totalCost: qty * cost,
    };

    setEntryItems([...entryItems, newItem]);
    setSelectedProductId('');
    setItemQuantity('1');
    setItemUnitCost('0');
  };

  const handleRemoveItem = (index: number) => {
    setEntryItems(entryItems.filter((_, i) => i !== index));
  };

  const totalEntryValue = entryItems.reduce((acc, curr) => acc + curr.totalCost, 0);

  const handleSubmitEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (entryItems.length === 0 || !invoiceNumber || !supplier) {
      alert('Preencha os campos obrigatórios da Nota Fiscal e adicione ao menos um insumo.');
      return;
    }

    const newEntry: WarehouseEntry = {
      id: `entry-${Date.now()}`,
      entryNumber: `ENT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      invoiceNumber,
      supplier,
      entryDate: `${entryDate}T${new Date().toISOString().split('T')[1]}`,
      items: entryItems,
      totalValue: totalEntryValue,
      receivedByMatricola,
      notes,
    };

    onAddEntry(newEntry);
    setIsEntryFormOpen(false);
    // Reset
    setInvoiceNumber('');
    setSupplier('');
    setNotes('');
    setEntryItems([]);
  };

  const filteredEntries = entries.filter(
    (e) =>
      e.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.entryNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* 1. Header do Almoxarifado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Almoxarifado Central & Entrada de Insumos
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro de compras e Notas Fiscais (NF-e). O recebimento alimenta imediatamente o estoque central.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEntryFormOpen(!isEntryFormOpen)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
          >
            <ArrowDownToLine className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isEntryFormOpen ? 'Fechar Formulário' : 'Nova Entrada de Insumos (NF)'}</span>
          </button>
        </div>
      </div>

      {/* 2. Formulário Expansível de Entrada de Insumos */}
      {isEntryFormOpen && (
        <div className="p-5 bg-white border border-slate-300 rounded-xl shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ArrowDownToLine className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">
                Registrar Entrada de Insumos por Nota Fiscal
              </h2>
            </div>
            <span className="text-xs text-slate-500">
              * Atualiza estoque e custo médio no Almoxarifado
            </span>
          </div>

          <form onSubmit={handleSubmitEntry} className="space-y-4 text-xs">
            {/* Dados da NF */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Número da Nota Fiscal (NF-e) *
                </label>
                <input
                  type="text"
                  required
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="Ex: NF-e 105.882"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-medium text-slate-700 mb-1">
                  Fornecedor / Distribuidora *
                </label>
                <input
                  type="text"
                  required
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  placeholder="Ex: Distribuidora FrioMax Refrigeração Ltda"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Data de Recebimento
                </label>
                <input
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>

            {/* Adicionar Insumos à Entrada */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <div className="font-semibold text-slate-800">
                Adicionar Insumos Recebidos
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-6">
                  <label className="block text-slate-600 mb-1">Selecione o Insumo do Catálogo</label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => handleSelectProduct(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    <option value="">Escolha um insumo cadastrado...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        [{p.sku}] {p.name} (Atual: {p.currentStock} {p.unit})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-600 mb-1">Quantidade</label>
                  <input
                    type="number"
                    step="any"
                    min="0.1"
                    value={itemQuantity}
                    onChange={(e) => setItemQuantity(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 font-mono bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-600 mb-1">Custo Unitário (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={itemUnitCost}
                    onChange={(e) => setItemUnitCost(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 font-mono bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div className="sm:col-span-2">
                  <button
                    type="button"
                    onClick={handleAddItemToEntry}
                    className="w-full flex items-center justify-center gap-1 px-3 py-1.5 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Inserir</span>
                  </button>
                </div>
              </div>

              {/* Tabela de Itens Adicionados */}
              {entryItems.length > 0 && (
                <div className="mt-3 bg-white border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-500 uppercase text-[10px]">
                      <tr>
                        <th className="py-2 px-3">Item / SKU</th>
                        <th className="py-2 px-3 text-right">Qtd</th>
                        <th className="py-2 px-3 text-center">Un</th>
                        <th className="py-2 px-3 text-right">Custo Unit.</th>
                        <th className="py-2 px-3 text-right">Subtotal</th>
                        <th className="py-2 px-3 text-right">Remover</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {entryItems.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-2 px-3 font-sans">
                            <span className="font-semibold text-slate-900">{item.productName}</span>{' '}
                            <span className="text-slate-400">[{item.sku}]</span>
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-slate-900">
                            {item.quantity}
                          </td>
                          <td className="py-2 px-3 text-center text-slate-600 font-medium">
                            {item.unit}
                          </td>
                          <td className="py-2 px-3 text-right text-slate-700">
                            R$ {item.unitCost.toFixed(2)}
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-slate-900">
                            R$ {item.totalCost.toFixed(2)}
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
                    <tfoot className="bg-slate-50 border-t border-slate-200 font-mono font-bold text-xs">
                      <tr>
                        <td colSpan={4} className="py-2 px-3 text-right text-slate-700 font-sans">
                          Valor Total da Nota Fiscal:
                        </td>
                        <td className="py-2 px-3 text-right text-slate-900 text-sm">
                          R$ {totalEntryValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Observações do Lote / Recebimento
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Lacre da transportadora intacto, lote de conformidade técnica 2026-X..."
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEntryFormOpen(false)}
                className="px-3 py-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={entryItems.length === 0}
                className="px-4 py-1.5 font-medium text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg shadow-xs"
              >
                Confirmar Recebimento e Atualizar Estoque
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. Resumo do Almoxarifado Central & Saldo Atual */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tabela de Saldo em Tempo Real no Almoxarifado */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Saldo Atual do Almoxarifado Central
              </h2>
              <p className="text-xs text-slate-500">
                Quantidades físicas disponíveis prontas para requisição (RM) pelos técnicos.
              </p>
            </div>
            <button
              onClick={onNavigateToCatalog}
              className="text-xs text-slate-600 hover:text-slate-900 font-medium"
            >
              Ver Catálogo Completo →
            </button>
          </div>

          <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase text-[10px] sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">Código</th>
                  <th className="py-2.5 px-3">Insumo</th>
                  <th className="py-2.5 px-3">Local</th>
                  <th className="py-2.5 px-3 text-right">Saldo Físico</th>
                  <th className="py-2.5 px-3 text-right">Mínimo</th>
                  <th className="py-2.5 px-3 text-right">Custo Unit.</th>
                  <th className="py-2.5 px-3 text-right">Total Estocado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {products.map((prod) => {
                  const isLow = prod.currentStock <= prod.minStock;
                  const totalEstocado = prod.currentStock * prod.unitCost;
                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/70 transition-colors font-sans">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-800 whitespace-nowrap">
                        {prod.sku}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900">{prod.name}</div>
                        <div className="text-[10px] text-slate-400 font-sans">{prod.category}</div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                        {prod.location || 'Central'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded ${
                            isLow ? 'bg-amber-100 text-amber-900' : 'text-slate-900'
                          }`}
                        >
                          {prod.currentStock} {prod.unit}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                        {prod.minStock} {prod.unit}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                        R$ {prod.unitCost.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        R$ {totalEstocado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}

                {products.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <PackageCheck className="w-8 h-8 text-slate-300" />
                        <div className="font-semibold text-slate-700 text-xs">Almoxarifado sem insumos cadastrados.</div>
                        <p className="text-slate-500 text-[11px]">Dê entrada de insumos por Nota Fiscal ou adicione no catálogo de produtos.</p>
                        <button
                          onClick={() => setIsEntryFormOpen(true)}
                          className="mt-1 px-3.5 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 shadow-xs"
                        >
                          + Lançar Entrada de NF
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Histórico Recente de Entradas por NF */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs flex flex-col">
          <div className="p-4 border-b border-slate-200">
            <h2 className="text-sm font-bold text-slate-900">
              Histórico de Entradas (NF-e)
            </h2>
            <p className="text-xs text-slate-500">
              Últimas entradas lançadas no sistema.
            </p>
          </div>

          <div className="p-3 divide-y divide-slate-100 overflow-y-auto max-h-[420px] flex-1">
            {filteredEntries.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs italic">
                Nenhuma Nota Fiscal de entrada registrada até o momento.
              </div>
            ) : (
              filteredEntries.map((entry) => (
                <div key={entry.id} className="py-3 first:pt-0 last:pb-0 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {entry.invoiceNumber}
                    </span>
                    <span className="font-mono font-bold text-emerald-700">
                      R$ {entry.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="font-medium text-slate-800">{entry.supplier}</div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{new Date(entry.entryDate).toLocaleDateString('pt-BR')}</span>
                    <span>{entry.items.length} itens recebidos</span>
                  </div>

                  <div className="text-[10px] text-slate-400 bg-slate-50 p-2 rounded border border-slate-100">
                    {entry.items.map((i) => `${i.quantity} ${i.unit} ${i.productName}`).join(' · ')}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
