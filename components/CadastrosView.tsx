'use client';

import React, { useState } from 'react';
import {
  Users,
  UserSquare2,
  PackageCheck,
  Truck,
  Plus,
  Search,
  Trash2,
  Edit2,
  Phone,
  Mail,
  MapPin,
  Building,
  CheckCircle2,
  AlertTriangle,
  FileText,
  X
} from 'lucide-react';
import { Client, Collaborator, Product, Vehicle, SegmentType } from '@/types';

interface CadastrosViewProps {
  initialSubtab?: 'clientes' | 'colaboradores' | 'produtos' | 'veiculos';
  clients: Client[];
  collaborators: Collaborator[];
  products: Product[];
  vehicles: Vehicle[];
  onSaveClient: (client: Client) => void;
  onDeleteClient: (id: string) => void;
  onSaveCollaborator: (col: Collaborator) => void;
  onDeleteCollaborator: (id: string) => void;
  onSaveProduct: (prod: Product) => void;
  onDeleteProduct: (id: string) => void;
  onSaveVehicle: (veh: Vehicle) => void;
  onDeleteVehicle: (id: string) => void;
}

export function CadastrosView({
  initialSubtab = 'clientes',
  clients,
  collaborators,
  products,
  vehicles,
  onSaveClient,
  onDeleteClient,
  onSaveCollaborator,
  onDeleteCollaborator,
  onSaveProduct,
  onDeleteProduct,
  onSaveVehicle,
  onDeleteVehicle,
}: CadastrosViewProps) {
  const [subtab, setSubtab] = useState<'clientes' | 'colaboradores' | 'produtos' | 'veiculos'>(
    initialSubtab
  );
  const [searchTerm, setSearchTerm] = useState('');

  // Modais de Criação / Edição
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const [isCollabModalOpen, setIsCollabModalOpen] = useState(false);
  const [editingCollab, setEditingCollab] = useState<Collaborator | null>(null);

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  // Filtros
  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.document.includes(searchTerm) ||
      c.segment.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCollabs = collaborators.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.matricola.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredVehicles = vehicles.filter(
    (v) =>
      v.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.assignedMatricola && v.assignedMatricola.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* 1. Header do Módulo de Cadastros */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Módulo de Cadastros Integrados
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gerencie clientes, colaboradores com matrícula, catálogo de insumos e frota de veículos.
          </p>
        </div>

        {/* Botão de Novo Registro conforme a Subtab ativa */}
        <div>
          {subtab === 'clientes' && (
            <button
              onClick={() => {
                setEditingClient(null);
                setIsClientModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Cliente</span>
            </button>
          )}

          {subtab === 'colaboradores' && (
            <button
              onClick={() => {
                setEditingCollab(null);
                setIsCollabModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Colaborador (Matrícula)</span>
            </button>
          )}

          {subtab === 'produtos' && (
            <button
              onClick={() => {
                setEditingProduct(null);
                setIsProductModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Insumo / Produto</span>
            </button>
          )}

          {subtab === 'veiculos' && (
            <button
              onClick={() => {
                setEditingVehicle(null);
                setIsVehicleModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Veículo</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Subtabs Navegáveis + Barra de Busca */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Segmented Control */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setSubtab('clientes')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              subtab === 'clientes'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Clientes ({clients.length})</span>
          </button>

          <button
            onClick={() => setSubtab('colaboradores')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              subtab === 'colaboradores'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserSquare2 className="w-3.5 h-3.5" />
            <span>Colaboradores ({collaborators.length})</span>
          </button>

          <button
            onClick={() => setSubtab('produtos')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              subtab === 'produtos'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PackageCheck className="w-3.5 h-3.5" />
            <span>Produtos & Insumos ({products.length})</span>
          </button>

          <button
            onClick={() => setSubtab('veiculos')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              subtab === 'veiculos'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Veículos ({vehicles.length})</span>
          </button>
        </div>

        {/* Input de Busca */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Filtrar registros..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>
      </div>

      {/* 3. Conteúdo da Subtab Ativa */}
      {/* 3.1. CLIENTES */}
      {subtab === 'clientes' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Razão Social / Nome</th>
                  <th className="py-2.5 px-4">CNPJ / CPF</th>
                  <th className="py-2.5 px-4">Segmento de Atividade</th>
                  <th className="py-2.5 px-4">Contato</th>
                  <th className="py-2.5 px-4">Localidade</th>
                  <th className="py-2.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{client.name}</div>
                      {client.notes && (
                        <div className="text-[11px] text-slate-500 truncate max-w-xs">
                          {client.notes}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">
                      {client.document}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                        {client.segment}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="text-slate-800">{client.phone}</div>
                      <div className="text-[11px] text-slate-400">{client.email}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-700">
                      {client.city} - {client.state}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap space-x-1">
                      <button
                        onClick={() => {
                          setEditingClient(client);
                          setIsClientModalOpen(true);
                        }}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded"
                        title="Editar"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Deseja excluir o cliente ${client.name}?`)) {
                            onDeleteClient(client.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredClients.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Users className="w-8 h-8 text-slate-300" />
                        <div className="font-semibold text-slate-700 text-xs">Nenhum cliente cadastrado ainda.</div>
                        <p className="text-slate-500 text-[11px]">Adicione os clientes para os quais sua empresa presta serviços.</p>
                        <button
                          onClick={() => {
                            setEditingClient(null);
                            setIsClientModalOpen(true);
                          }}
                          className="mt-1 px-3.5 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 shadow-xs"
                        >
                          + Cadastrar Primeiro Cliente
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3.2. COLABORADORES (COM MATRÍCULA E CUSTÓDIA) */}
      {subtab === 'colaboradores' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Matrícula</th>
                  <th className="py-2.5 px-4">Nome do Colaborador</th>
                  <th className="py-2.5 px-4">Função / Cargo</th>
                  <th className="py-2.5 px-4">Veículo Alocado</th>
                  <th className="py-2.5 px-4">Insumos em Custódia</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCollabs.map((col) => {
                  const totalCustody = col.custody.reduce((acc, c) => acc + c.quantity, 0);
                  return (
                    <tr key={col.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                          {col.matricola}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{col.name}</div>
                        <div className="text-[11px] text-slate-500">{col.phone}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-800">{col.role}</div>
                        <div className="text-[10px] text-slate-400">{col.department}</div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono">
                        {col.vehicleId ? (
                          <span className="text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                            {col.vehicleId}
                          </span>
                        ) : (
                          <span className="text-slate-400">Sem veículo fixo</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {col.custody.length > 0 ? (
                          <div>
                            <span className="font-mono font-bold text-indigo-700">
                              {totalCustody} un
                            </span>
                            <span className="text-slate-500 text-[11px] ml-1">
                              ({col.custody.length} itens)
                            </span>
                            <div className="text-[10px] text-slate-400 truncate max-w-xs mt-0.5">
                              {col.custody.map((c) => `${c.quantity}x ${c.productName}`).join(', ')}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Nenhum insumo em mãos</span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700">
                          Ativo
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap space-x-1">
                        <button
                          onClick={() => {
                            setEditingCollab(col);
                            setIsCollabModalOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Deseja excluir o colaborador ${col.name}?`)) {
                              onDeleteCollaborator(col.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredCollabs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <UserSquare2 className="w-8 h-8 text-slate-300" />
                        <div className="font-semibold text-slate-700 text-xs">Nenhum colaborador cadastrado ainda.</div>
                        <p className="text-slate-500 text-[11px]">Cadastre sua equipe técnica com matrícula para controlar a custódia de insumos.</p>
                        <button
                          onClick={() => {
                            setEditingCollab(null);
                            setIsCollabModalOpen(true);
                          }}
                          className="mt-1 px-3.5 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 shadow-xs"
                        >
                          + Cadastrar Primeiro Colaborador (Matrícula)
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3.3. PRODUTOS & INSUMOS (ALMOXARIFADO CENTRAL) */}
      {subtab === 'produtos' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Código / SKU</th>
                  <th className="py-2.5 px-4">Descrição do Insumo</th>
                  <th className="py-2.5 px-4">Categoria</th>
                  <th className="py-2.5 px-4">Local no Almoxarifado</th>
                  <th className="py-2.5 px-4 text-center">Unidade</th>
                  <th className="py-2.5 px-4 text-right">Saldo Almoxarifado</th>
                  <th className="py-2.5 px-4 text-right">Estoque Mínimo</th>
                  <th className="py-2.5 px-4 text-right">Custo Unitário</th>
                  <th className="py-2.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((prod) => {
                  const isLow = prod.currentStock <= prod.minStock;
                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800 whitespace-nowrap">
                        {prod.sku}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{prod.name}</div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                        {prod.category}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-500">
                        {prod.location || 'Central'}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-medium text-slate-700">
                        {prod.unit}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold tabular-nums whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded ${
                            isLow
                              ? 'bg-amber-100 text-amber-900 font-bold'
                              : 'text-slate-900'
                          }`}
                        >
                          {prod.currentStock} {prod.unit}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-500 tabular-nums">
                        {prod.minStock} {prod.unit}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-800 tabular-nums whitespace-nowrap">
                        R$ {prod.unitCost.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap space-x-1">
                        <button
                          onClick={() => {
                            setEditingProduct(prod);
                            setIsProductModalOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Deseja excluir o produto ${prod.name}?`)) {
                              onDeleteProduct(prod.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <PackageCheck className="w-8 h-8 text-slate-300" />
                        <div className="font-semibold text-slate-700 text-xs">Nenhum produto ou insumo cadastrado ainda.</div>
                        <p className="text-slate-500 text-[11px]">Cadastre os materiais que fazem parte do seu almoxarifado ou dê entrada via Nota Fiscal.</p>
                        <button
                          onClick={() => {
                            setEditingProduct(null);
                            setIsProductModalOpen(true);
                          }}
                          className="mt-1 px-3.5 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 shadow-xs"
                        >
                          + Cadastrar Primeiro Insumo
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3.4. VEÍCULOS & FROTA */}
      {subtab === 'veiculos' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Placa</th>
                  <th className="py-2.5 px-4">Modelo / Marca</th>
                  <th className="py-2.5 px-4">Ano</th>
                  <th className="py-2.5 px-4">Combustível</th>
                  <th className="py-2.5 px-4 text-right">Quilometragem (KM)</th>
                  <th className="py-2.5 px-4">Motorista / Responsável</th>
                  <th className="py-2.5 px-4">Status Operacional</th>
                  <th className="py-2.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVehicles.map((veh) => (
                  <tr key={veh.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                      <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                        {veh.plate}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">
                        {veh.brand} {veh.model}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">{veh.year}</td>
                    <td className="py-3 px-4 text-slate-600">{veh.fuelType}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-800">
                      {veh.currentKm.toLocaleString('pt-BR')} km
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-700">
                      {veh.assignedMatricola || <span className="text-slate-400 italic">Disponível</span>}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                          veh.status === 'em_servico'
                            ? 'bg-blue-50 text-blue-700'
                            : veh.status === 'disponivel'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {veh.status === 'em_servico'
                          ? 'Em Serviço'
                          : veh.status === 'disponivel'
                          ? 'Disponível'
                          : 'Manutenção'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap space-x-1">
                      <button
                        onClick={() => {
                          setEditingVehicle(veh);
                          setIsVehicleModalOpen(true);
                        }}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded"
                        title="Editar"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Deseja excluir o veículo placa ${veh.plate}?`)) {
                            onDeleteVehicle(veh.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredVehicles.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Truck className="w-8 h-8 text-slate-300" />
                        <div className="font-semibold text-slate-700 text-xs">Nenhum veículo cadastrado na frota.</div>
                        <p className="text-slate-500 text-[11px]">Adicione os carros, utilitários ou motos utilizados pelas equipes.</p>
                        <button
                          onClick={() => {
                            setEditingVehicle(null);
                            setIsVehicleModalOpen(true);
                          }}
                          className="mt-1 px-3.5 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 shadow-xs"
                        >
                          + Cadastrar Primeiro Veículo
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Modais de Cadastro */}

      {/* Modal Cliente */}
      {isClientModalOpen && (
        <ClientModal
          client={editingClient}
          onClose={() => setIsClientModalOpen(false)}
          onSave={(c) => {
            onSaveClient(c);
            setIsClientModalOpen(false);
          }}
        />
      )}

      {/* Modal Colaborador */}
      {isCollabModalOpen && (
        <CollaboratorModal
          collaborator={editingCollab}
          vehicles={vehicles}
          onClose={() => setIsCollabModalOpen(false)}
          onSave={(col) => {
            onSaveCollaborator(col);
            setIsCollabModalOpen(false);
          }}
        />
      )}

      {/* Modal Produto / Insumo */}
      {isProductModalOpen && (
        <ProductModal
          product={editingProduct}
          onClose={() => setIsProductModalOpen(false)}
          onSave={(p) => {
            onSaveProduct(p);
            setIsProductModalOpen(false);
          }}
        />
      )}

      {/* Modal Veículo */}
      {isVehicleModalOpen && (
        <VehicleModal
          vehicle={editingVehicle}
          collaborators={collaborators}
          onClose={() => setIsVehicleModalOpen(false)}
          onSave={(v) => {
            onSaveVehicle(v);
            setIsVehicleModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

// Subcomponente: Modal de Cliente
function ClientModal({
  client,
  onClose,
  onSave,
}: {
  client: Client | null;
  onClose: () => void;
  onSave: (c: Client) => void;
}) {
  const [name, setName] = useState(client?.name || '');
  const [document, setDocument] = useState(client?.document || '');
  const [segment, setSegment] = useState<SegmentType>(client?.segment || 'Serviços Gerais');
  const [phone, setPhone] = useState(client?.phone || '');
  const [email, setEmail] = useState(client?.email || '');
  const [address, setAddress] = useState(client?.address || '');
  const [city, setCity] = useState(client?.city || 'São Paulo');
  const [state, setState] = useState(client?.state || 'SP');
  const [notes, setNotes] = useState(client?.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !document) return;

    onSave({
      id: client?.id || `cli-${Date.now()}`,
      name,
      document,
      segment,
      phone,
      email,
      address,
      city,
      state,
      notes,
      createdAt: client?.createdAt || new Date().toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
          <h2 className="text-sm font-bold text-slate-900">
            {client ? 'Editar Cliente' : 'Novo Cliente'}
          </h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Razão Social / Nome Completo *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Indústria Metalúrgica Paulista Ltda"
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">CNPJ ou CPF *</label>
              <input
                type="text"
                required
                value={document}
                onChange={(e) => setDocument(e.target.value)}
                placeholder="00.000.000/0000-00"
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Ramo de Atividade</label>
              <select
                value={segment}
                onChange={(e) => setSegment(e.target.value as SegmentType)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="Climatização & HVAC">Climatização & HVAC</option>
                <option value="Elétrica & Energia Solar">Elétrica & Energia Solar</option>
                <option value="Telecomunicações & Redes">Telecomunicações & Redes</option>
                <option value="Manutenção Predial & Civil">Manutenção Predial & Civil</option>
                <option value="Mecânica & Frotas">Mecânica & Frotas</option>
                <option value="Segurança Eletrônica">Segurança Eletrônica</option>
                <option value="Serviços Gerais">Serviços Gerais</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Telefone / WhatsApp</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 99999-9999"
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">E-mail Comercial</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contato@empresa.com.br"
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Endereço Completo</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Av. Brasil, 1500 - Bairro"
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block font-medium text-slate-700 mb-1">Cidade</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">UF</label>
              <input
                type="text"
                maxLength={2}
                value={state}
                onChange={(e) => setState(e.target.value.toUpperCase())}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Observações Operacionais</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Instruções de acesso, portaria, horários permitidos..."
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs"
            >
              Salvar Cliente
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Subcomponente: Modal de Colaborador (com Matrícula)
function CollaboratorModal({
  collaborator,
  vehicles,
  onClose,
  onSave,
}: {
  collaborator: Collaborator | null;
  vehicles: Vehicle[];
  onClose: () => void;
  onSave: (col: Collaborator) => void;
}) {
  const [matricola, setMatricola] = useState(
    collaborator?.matricola || `MAT-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [name, setName] = useState(collaborator?.name || '');
  const [role, setRole] = useState(collaborator?.role || '');
  const [department, setDepartment] = useState(collaborator?.department || 'Operações de Campo');
  const [phone, setPhone] = useState(collaborator?.phone || '');
  const [email, setEmail] = useState(collaborator?.email || '');
  const [vehicleId, setVehicleId] = useState(collaborator?.vehicleId || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !matricola) return;

    onSave({
      id: collaborator?.id || `col-${Date.now()}`,
      matricola: matricola.toUpperCase(),
      name,
      role,
      department,
      phone,
      email,
      vehicleId: vehicleId || undefined,
      active: true,
      custody: collaborator?.custody || [],
      createdAt: collaborator?.createdAt || new Date().toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
          <h2 className="text-sm font-bold text-slate-900">
            {collaborator ? 'Editar Colaborador' : 'Novo Colaborador Técnico'}
          </h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3 text-xs">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="block font-medium text-slate-700 mb-1">Matrícula *</label>
              <input
                type="text"
                required
                value={matricola}
                onChange={(e) => setMatricola(e.target.value.toUpperCase())}
                placeholder="MAT-1000"
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
            <div className="col-span-2">
              <label className="block font-medium text-slate-700 mb-1">Nome Completo *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Carlos Eduardo Silveira"
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Cargo / Especialidade Técnica *</label>
            <input
              type="text"
              required
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Ex: Técnico em Climatização / Eletricista"
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Departamento / Setor</label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="Ex: Operações de Campo / Manutenção"
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Telefone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 98888-7777"
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Veículo Alocado</label>
              <select
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="">Sem veículo fixo</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.plate}>
                    {v.plate} - {v.model}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">E-mail Corporativo</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colaborador@empresa.com.br"
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs"
            >
              Salvar Colaborador
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Subcomponente: Modal de Produto / Insumo
function ProductModal({
  product,
  onClose,
  onSave,
}: {
  product: Product | null;
  onClose: () => void;
  onSave: (p: Product) => void;
}) {
  const [sku, setSku] = useState(product?.sku || `INS-${Math.floor(100 + Math.random() * 900)}`);
  const [name, setName] = useState(product?.name || '');
  const [category, setCategory] = useState(product?.category || 'Climatização & Fluidos');
  const [unit, setUnit] = useState<Product['unit']>(product?.unit || 'UN');
  const [currentStock, setCurrentStock] = useState(product?.currentStock?.toString() || '0');
  const [minStock, setMinStock] = useState(product?.minStock?.toString() || '10');
  const [unitCost, setUnitCost] = useState(product?.unitCost?.toString() || '0');
  const [unitPrice, setUnitPrice] = useState(product?.unitPrice?.toString() || '0');
  const [location, setLocation] = useState(product?.location || 'Almoxarifado Central');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !sku) return;

    onSave({
      id: product?.id || `prod-${Date.now()}`,
      sku: sku.toUpperCase(),
      name,
      category,
      unit,
      currentStock: parseFloat(currentStock) || 0,
      minStock: parseFloat(minStock) || 0,
      unitCost: parseFloat(unitCost) || 0,
      unitPrice: parseFloat(unitPrice) || 0,
      location,
      createdAt: product?.createdAt || new Date().toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
          <h2 className="text-sm font-bold text-slate-900">
            {product ? 'Editar Insumo / Produto' : 'Cadastrar Insumo / Produto'}
          </h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Código / SKU *</label>
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase())}
                placeholder="INS-001"
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
            <div className="col-span-2">
              <label className="block font-medium text-slate-700 mb-1">Descrição do Item *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Cabo Flexível 2,5mm Anti-Chama"
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Categoria</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Ex: Elétrica, Telecom, Peças"
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Unidade de Medida</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as Product['unit'])}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="UN">UN - Unidade</option>
                <option value="MT">MT - Metro</option>
                <option value="KG">KG - Quilograma</option>
                <option value="CX">CX - Caixa</option>
                <option value="LT">LT - Litro</option>
                <option value="PAR">PAR - Par</option>
                <option value="ROLO">ROLO - Rolo</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Saldo Atual (Almoxarifado)
              </label>
              <input
                type="number"
                step="any"
                value={currentStock}
                onChange={(e) => setCurrentStock(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Estoque Mínimo de Alerta</label>
              <input
                type="number"
                step="any"
                value={minStock}
                onChange={(e) => setMinStock(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Preço de Custo (R$)</label>
              <input
                type="number"
                step="0.01"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Preço de Aplicação / Venda (R$)</label>
              <input
                type="number"
                step="0.01"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Localização no Almoxarifado</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ex: Corredor A - Prateleira 03"
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs"
            >
              Salvar Insumo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Subcomponente: Modal de Veículo
function VehicleModal({
  vehicle,
  collaborators,
  onClose,
  onSave,
}: {
  vehicle: Vehicle | null;
  collaborators: Collaborator[];
  onClose: () => void;
  onSave: (v: Vehicle) => void;
}) {
  const [plate, setPlate] = useState(vehicle?.plate || '');
  const [brand, setBrand] = useState(vehicle?.brand || '');
  const [model, setModel] = useState(vehicle?.model || '');
  const [year, setYear] = useState(vehicle?.year?.toString() || '2024');
  const [currentKm, setCurrentKm] = useState(vehicle?.currentKm?.toString() || '30000');
  const [fuelType, setFuelType] = useState<Vehicle['fuelType']>(vehicle?.fuelType || 'Flex');
  const [assignedMatricola, setAssignedMatricola] = useState(vehicle?.assignedMatricola || '');
  const [status, setStatus] = useState<Vehicle['status']>(vehicle?.status || 'disponivel');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plate || !model) return;

    onSave({
      id: vehicle?.id || `veh-${Date.now()}`,
      plate: plate.toUpperCase(),
      brand,
      model,
      year: parseInt(year) || 2024,
      currentKm: parseInt(currentKm) || 0,
      fuelType,
      assignedMatricola: assignedMatricola || undefined,
      status,
      lastServiceDate: vehicle?.lastServiceDate || new Date().toISOString().split('T')[0],
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
          <h2 className="text-sm font-bold text-slate-900">
            {vehicle ? 'Editar Veículo da Frota' : 'Cadastrar Veículo'}
          </h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Placa (Mercosul) *</label>
              <input
                type="text"
                required
                maxLength={8}
                value={plate}
                onChange={(e) => setPlate(e.target.value.toUpperCase())}
                placeholder="ABC-1D23"
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Marca *</label>
              <input
                type="text"
                required
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Ex: Fiat, Renault, Chevrolet"
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block font-medium text-slate-700 mb-1">Modelo *</label>
              <input
                type="text"
                required
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Ex: Fiorino Endurance 1.4"
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Ano</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Quilometragem Atual (KM)</label>
              <input
                type="number"
                value={currentKm}
                onChange={(e) => setCurrentKm(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Combustível</label>
              <select
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value as Vehicle['fuelType'])}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="Flex">Flex</option>
                <option value="Diesel">Diesel</option>
                <option value="Gasolina">Gasolina</option>
                <option value="Elétrico">Elétrico</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Motorista / Matrícula</label>
              <select
                value={assignedMatricola}
                onChange={(e) => setAssignedMatricola(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="">Livre / Disponível</option>
                {collaborators.map((c) => (
                  <option key={c.id} value={c.matricola}>
                    {c.matricola} - {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Status Operacional</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Vehicle['status'])}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="disponivel">Disponível</option>
                <option value="em_servico">Em Serviço</option>
                <option value="manutencao">Manutenção</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs"
            >
              Salvar Veículo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
