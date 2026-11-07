'use client';

import React from 'react';
import { X, Printer, CheckCircle2, Building2 } from 'lucide-react';
import { ServiceOrder } from '@/types';

interface PrintServiceOrderModalProps {
  order: ServiceOrder | null;
  onClose: () => void;
}

export function PrintServiceOrderModal({
  order,
  onClose,
}: PrintServiceOrderModalProps) {
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-300 w-full max-w-3xl overflow-hidden my-6">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="no-print flex items-center justify-between px-6 py-3.5 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm">Visualização de Impressão Oficial</span>
            <span className="font-mono text-xs text-slate-300">({order.code})</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Salvar PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Official Printable Sheet (A4 styled layout) */}
        <div className="p-8 text-slate-900 font-sans space-y-6 text-xs bg-white">
          {/* Header da Empresa */}
          <div className="flex items-start justify-between pb-4 border-b-2 border-slate-900">
            <div>
              <div className="text-xl font-black tracking-tight text-slate-900 uppercase">
                Aniel Gestão Operacional
              </div>
              <div className="text-slate-600 font-medium text-xs mt-0.5">
                Sistema Integrado de Gestão de Serviços, Almoxarifado e Frotas
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                CNPJ: 22.841.905/0001-40 · Unidade Central Operacional
              </div>
            </div>

            <div className="text-right">
              <div className="text-lg font-mono font-bold text-slate-900">
                {order.code}
              </div>
              <div className="text-xs text-slate-500 font-mono mt-0.5">
                Emissão: {new Date(order.createdAt).toLocaleDateString('pt-BR')}
              </div>
              <div className="inline-block mt-1 px-2.5 py-0.5 bg-slate-100 border border-slate-300 rounded font-bold uppercase text-[10px] text-slate-800">
                Status: {order.status.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Dados do Cliente e Dados Técnicos */}
          <div className="grid grid-cols-2 gap-4 p-4 border border-slate-300 rounded-lg bg-slate-50/50">
            <div>
              <div className="font-bold uppercase tracking-wider text-[10px] text-slate-500 mb-1">
                Dados do Cliente
              </div>
              <div className="font-bold text-sm text-slate-900">{order.clientName}</div>
              <div className="text-slate-700 mt-0.5">{order.clientAddress}</div>
              <div className="text-slate-600 mt-0.5">Contato: {order.clientPhone}</div>
            </div>

            <div>
              <div className="font-bold uppercase tracking-wider text-[10px] text-slate-500 mb-1">
                Equipe Técnica e Logística
              </div>
              <div className="font-bold text-slate-900">
                Técnico: {order.assignedTechnicianName}
              </div>
              <div className="font-mono text-slate-700">
                Matrícula: {order.assignedMatricola}
              </div>
              <div className="font-mono text-slate-700">
                Veículo Alocado: {order.vehiclePlate || 'Nenhum'}
              </div>
              <div className="text-slate-700 mt-0.5">
                Data do Atendimento: {order.scheduledDate} às {order.scheduledTime || '09:00'}
              </div>
            </div>
          </div>

          {/* Escopo do Serviço */}
          <div>
            <div className="font-bold uppercase tracking-wider text-[10px] text-slate-500 mb-1">
              Escopo e Descrição dos Serviços
            </div>
            <div className="p-3 border border-slate-200 rounded-lg text-slate-800 leading-relaxed font-medium bg-white">
              <div className="font-bold mb-1 text-slate-900">{order.title}</div>
              {order.description || 'Execução técnica conforme solicitação do cliente.'}
            </div>
          </div>

          {/* Insumos Aplicados no Serviço */}
          <div>
            <div className="font-bold uppercase tracking-wider text-[10px] text-slate-500 mb-1">
              Insumos e Materiais Utilizados (Apontamento Real de Campo)
            </div>
            {order.appliedSupplies.length === 0 ? (
              <div className="p-3 border border-dashed border-slate-300 rounded text-center text-slate-400 italic">
                Nenhum insumo lançado como aplicado nesta Ordem de Serviço até o momento.
              </div>
            ) : (
              <table className="w-full border border-slate-300 text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-bold border-b border-slate-300">
                  <tr>
                    <th className="py-2 px-3">Insumo</th>
                    <th className="py-2 px-3">SKU</th>
                    <th className="py-2 px-3 text-right">Qtd</th>
                    <th className="py-2 px-3 text-center">Un</th>
                    <th className="py-2 px-3">Matrícula Técnico</th>
                    <th className="py-2 px-3 text-right">Custo Unit.</th>
                    <th className="py-2 px-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono">
                  {order.appliedSupplies.map((it) => (
                    <tr key={it.id}>
                      <td className="py-2 px-3 font-sans font-medium text-slate-900">
                        {it.productName}
                      </td>
                      <td className="py-2 px-3 text-slate-500">{it.sku}</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900">
                        {it.quantity}
                      </td>
                      <td className="py-2 px-3 text-center text-slate-700">{it.unit}</td>
                      <td className="py-2 px-3 font-sans text-slate-700">{it.matricola}</td>
                      <td className="py-2 px-3 text-right text-slate-700">
                        R$ {it.unitCost.toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900">
                        R$ {(it.quantity * it.unitCost).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Resumo Financeiro */}
          <div className="flex justify-end">
            <div className="w-64 p-3 bg-slate-50 border border-slate-300 rounded-lg space-y-1.5 font-mono text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Mão de Obra:</span>
                <span>R$ {order.laborCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Materiais Aplicados:</span>
                <span>
                  R${' '}
                  {order.appliedSupplies
                    .reduce((acc, c) => acc + c.quantity * c.unitCost, 0)
                    .toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-300 font-bold text-sm text-slate-900">
                <span>Valor Total:</span>
                <span>
                  R${' '}
                  {(order.totalReal > 0 ? order.totalReal : order.totalEstimated).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Termo de Conclusão e Assinaturas */}
          <div className="pt-8 border-t border-slate-300 space-y-6">
            <p className="text-[10px] text-slate-500 leading-normal text-justify">
              Declaro que os serviços e materiais descritos nesta Ordem de Serviço foram executados e entregues em perfeitas condições de funcionamento e conformidade com as normas técnicas vigentes.
            </p>

            <div className="grid grid-cols-2 gap-12 pt-6">
              <div className="text-center">
                <div className="border-t border-slate-800 pt-2 font-bold text-slate-900">
                  {order.assignedTechnicianName}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  Matrícula: {order.assignedMatricola} · Técnico Executor
                </div>
              </div>

              <div className="text-center">
                <div className="border-t border-slate-800 pt-2 font-bold text-slate-900">
                  {order.clientName}
                </div>
                <div className="text-[11px] text-slate-500">
                  Assinatura do Cliente / Aceite Técnico
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
