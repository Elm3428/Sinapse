export type SegmentType = 
  | 'Climatização & HVAC'
  | 'Elétrica & Energia Solar'
  | 'Telecomunicações & Redes'
  | 'Manutenção Predial & Civil'
  | 'Mecânica & Frotas'
  | 'Segurança Eletrônica'
  | 'Serviços Gerais';

export interface Client {
  id: string;
  name: string;
  document: string; // CPF ou CNPJ
  email: string;
  phone: string;
  address: string;
  segment: SegmentType;
  city: string;
  state: string;
  notes?: string;
  createdAt: string;
}

export interface CustodyItem {
  productId: string;
  productName: string;
  sku: string;
  unit: string;
  quantity: number;
  lastUpdated: string;
}

export interface Collaborator {
  id: string;
  matricola: string; // e.g. "MAT-101"
  name: string;
  role: string;
  department: string;
  phone: string;
  email: string;
  vehicleId?: string; // Placa ou ID do veículo alocado
  active: boolean;
  custody: CustodyItem[]; // Insumos atualmente na matrícula do colaborador
  createdAt: string;
}

export interface Product {
  id: string;
  sku: string; // Código de barras ou SKU
  name: string;
  category: string;
  unit: 'UN' | 'MT' | 'KG' | 'CX' | 'LT' | 'PAR' | 'ROLO';
  currentStock: number; // Saldo no almoxarifado
  minStock: number;
  unitCost: number; // Preço de custo (R$)
  unitPrice: number; // Preço de venda/aplicação (R$)
  location?: string; // Prateleira/Corredor no Almoxarifado
  createdAt: string;
}

export interface Vehicle {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  currentKm: number;
  assignedMatricola?: string; // Matrícula do colaborador responsável
  status: 'disponivel' | 'em_servico' | 'manutencao';
  fuelType: 'Flex' | 'Diesel' | 'Gasolina' | 'Elétrico';
  lastServiceDate?: string;
}

export interface WarehouseEntryItem {
  productId: string;
  productName: string;
  sku: string;
  unit: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export interface WarehouseEntry {
  id: string;
  entryNumber: string;
  invoiceNumber: string; // Nota Fiscal (NF-e)
  supplier: string;
  entryDate: string;
  items: WarehouseEntryItem[];
  totalValue: number;
  receivedByMatricola: string;
  notes?: string;
}

export interface ServiceSupplyEstimated {
  productId: string;
  productName: string;
  sku: string;
  unit: string;
  quantity: number;
  unitCost: number;
  unitPrice: number;
}

export interface ServiceSupplyApplied {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  unit: string;
  quantity: number;
  appliedDate: string;
  matricola: string;
  technicianName: string;
  unitCost: number;
  notes?: string;
}

export type ServiceOrderStatus = 
  | 'orcamento' 
  | 'aprovado' 
  | 'em_execucao' 
  | 'concluido' 
  | 'cancelado';

export interface ServiceOrder {
  id: string;
  code: string; // ex: "OS-2026-0042"
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientAddress: string;
  title: string;
  description: string;
  scheduledDate: string;
  scheduledTime?: string;
  assignedMatricola: string;
  assignedTechnicianName: string;
  vehiclePlate?: string;
  status: ServiceOrderStatus;
  laborCost: number; // Mão de obra (R$)
  estimatedSupplies: ServiceSupplyEstimated[];
  appliedSupplies: ServiceSupplyApplied[];
  totalEstimated: number;
  totalReal: number;
  completionDate?: string;
  completionNotes?: string;
  createdAt: string;
}

export interface RequisitionItem {
  productId: string;
  productName: string;
  sku: string;
  unit: string;
  quantity: number;
}

export interface SupplyRequisitionRM {
  id: string;
  rmNumber: string; // ex: "RM-2026-015"
  date: string;
  matricola: string;
  technicianName: string;
  serviceOrderId?: string;
  serviceOrderCode?: string;
  items: RequisitionItem[];
  dispensedBy: string; // Almoxarife
  status: 'retirado' | 'pendente';
  notes?: string;
}

export interface ApplicationItem {
  productId: string;
  productName: string;
  sku: string;
  unit: string;
  quantity: number;
}

export interface SupplyApplicationRecord {
  id: string;
  appCode: string;
  date: string;
  matricola: string;
  technicianName: string;
  serviceOrderId: string;
  serviceOrderCode: string;
  clientName: string;
  items: ApplicationItem[];
  notes?: string;
}

export interface ReturnItem {
  productId: string;
  productName: string;
  sku: string;
  unit: string;
  quantity: number;
  condition: 'perfeito' | 'revisao' | 'avariado';
}

export interface SupplyReturnRecord {
  id: string;
  returnCode: string; // ex: "DEV-2026-008"
  date: string;
  matricola: string;
  technicianName: string;
  serviceOrderId?: string;
  serviceOrderCode?: string;
  items: ReturnItem[];
  receivedBy: string; // Almoxarife
  notes?: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  dbName: string; // "aniel"
  isConnected: boolean;
  autoSync: boolean;
  lastSync?: string;
}
