import { 
  Client, 
  Collaborator, 
  Product, 
  Vehicle, 
  WarehouseEntry, 
  ServiceOrder, 
  SupplyRequisitionRM, 
  SupplyApplicationRecord, 
  SupplyReturnRecord,
  SupabaseConfig
} from '@/types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    sku: 'INS-HVAC-01',
    name: 'Gás Refrigerante R410A (Botija 11.3kg)',
    category: 'Climatização & Fluidos',
    unit: 'KG',
    currentStock: 48,
    minStock: 20,
    unitCost: 65.0,
    unitPrice: 110.0,
    location: 'Corredor A - Prateleira 01',
    createdAt: '2026-01-10T08:00:00Z',
  },
  {
    id: 'prod-2',
    sku: 'INS-ELET-02',
    name: 'Cabo Flexível 2,5mm 750V Anti-Chama',
    category: 'Elétrica',
    unit: 'MT',
    currentStock: 350,
    minStock: 100,
    unitCost: 2.8,
    unitPrice: 5.5,
    location: 'Corredor B - Bobina 04',
    createdAt: '2026-01-10T08:00:00Z',
  },
  {
    id: 'prod-3',
    sku: 'INS-TEL-03',
    name: 'Cabo de Rede UTP Cat6 24AWG Puro Cobre',
    category: 'Telecomunicações',
    unit: 'MT',
    currentStock: 620,
    minStock: 200,
    unitCost: 3.2,
    unitPrice: 6.8,
    location: 'Corredor B - Bobina 01',
    createdAt: '2026-01-11T09:00:00Z',
  },
  {
    id: 'prod-4',
    sku: 'INS-TEL-04',
    name: 'Conector Macho RJ45 Cat6 Blindado',
    category: 'Telecomunicações',
    unit: 'UN',
    currentStock: 180,
    minStock: 50,
    unitCost: 1.5,
    unitPrice: 3.5,
    location: 'Gaveteiro 12 - Caixa A',
    createdAt: '2026-01-11T09:30:00Z',
  },
  {
    id: 'prod-5',
    sku: 'INS-HVAC-05',
    name: 'Tubo de Cobre Flexível 3/8" Parede 1/32"',
    category: 'Climatização & Fluidos',
    unit: 'MT',
    currentStock: 85,
    minStock: 30,
    unitCost: 22.0,
    unitPrice: 38.0,
    location: 'Corredor A - Prateleira 03',
    createdAt: '2026-01-12T10:00:00Z',
  },
  {
    id: 'prod-6',
    sku: 'INS-ELET-06',
    name: 'Disjuntor Bipolar Din 32A Curva C',
    category: 'Elétrica',
    unit: 'UN',
    currentStock: 24,
    minStock: 10,
    unitCost: 34.0,
    unitPrice: 62.0,
    location: 'Gaveteiro 05 - Gaveta 02',
    createdAt: '2026-01-12T10:15:00Z',
  },
  {
    id: 'prod-7',
    sku: 'INS-MEC-07',
    name: 'Óleo Sintético Lubrificante Motor 5W30',
    category: 'Mecânica & Frotas',
    unit: 'LT',
    currentStock: 42,
    minStock: 15,
    unitCost: 38.0,
    unitPrice: 70.0,
    location: 'Setor Frotas - Armário 01',
    createdAt: '2026-01-13T11:00:00Z',
  },
  {
    id: 'prod-8',
    sku: 'INS-GER-08',
    name: 'Fita Isolante Alta Fusão 19mm x 10m',
    category: 'Serviços Gerais',
    unit: 'UN',
    currentStock: 65,
    minStock: 25,
    unitCost: 7.5,
    unitPrice: 15.0,
    location: 'Gaveteiro 08 - Gaveta 01',
    createdAt: '2026-01-13T11:30:00Z',
  },
  {
    id: 'prod-9',
    sku: 'INS-CIV-09',
    name: 'Espuma Expansiva de Poliuretano 500ml',
    category: 'Manutenção Predial & Civil',
    unit: 'UN',
    currentStock: 18,
    minStock: 15,
    unitCost: 26.0,
    unitPrice: 48.0,
    location: 'Corredor C - Prateleira 02',
    createdAt: '2026-01-14T14:00:00Z',
  },
  {
    id: 'prod-10',
    sku: 'INS-EPI-10',
    name: 'Óculos de Proteção Antirrisco e Antiembaçante',
    category: 'EPI & Segurança',
    unit: 'PAR',
    currentStock: 30,
    minStock: 10,
    unitCost: 14.0,
    unitPrice: 28.0,
    location: 'Armário EPI - Porta 01',
    createdAt: '2026-01-14T14:30:00Z',
  }
];

export const INITIAL_COLLABORATORS: Collaborator[] = [
  {
    id: 'col-1',
    matricola: 'MAT-1021',
    name: 'Carlos Eduardo Silveira',
    role: 'Técnico HVAC / Climatização Senior',
    department: 'Operações de Campo',
    phone: '(11) 98124-5501',
    email: 'carlos.silveira@aniel.emp.br',
    vehicleId: 'BRA-2A19',
    active: true,
    custody: [
      {
        productId: 'prod-1',
        productName: 'Gás Refrigerante R410A (Botija 11.3kg)',
        sku: 'INS-HVAC-01',
        unit: 'KG',
        quantity: 5,
        lastUpdated: '2026-11-01T09:15:00Z'
      },
      {
        productId: 'prod-5',
        productName: 'Tubo de Cobre Flexível 3/8" Parede 1/32"',
        sku: 'INS-HVAC-05',
        unit: 'MT',
        quantity: 12,
        lastUpdated: '2026-11-01T09:15:00Z'
      },
      {
        productId: 'prod-8',
        productName: 'Fita Isolante Alta Fusão 19mm x 10m',
        sku: 'INS-GER-08',
        unit: 'UN',
        quantity: 2,
        lastUpdated: '2026-11-01T09:15:00Z'
      }
    ],
    createdAt: '2025-06-15T08:00:00Z'
  },
  {
    id: 'col-2',
    matricola: 'MAT-1035',
    name: 'Roberto Mendes Ramos',
    role: 'Eletricista de Manutenção & Solar',
    department: 'Engenharia Elétrica',
    phone: '(11) 97422-9988',
    email: 'roberto.mendes@aniel.emp.br',
    vehicleId: 'RIO-4D88',
    active: true,
    custody: [
      {
        productId: 'prod-2',
        productName: 'Cabo Flexível 2,5mm 750V Anti-Chama',
        sku: 'INS-ELET-02',
        unit: 'MT',
        quantity: 45,
        lastUpdated: '2026-11-02T08:30:00Z'
      },
      {
        productId: 'prod-6',
        productName: 'Disjuntor Bipolar Din 32A Curva C',
        sku: 'INS-ELET-06',
        unit: 'UN',
        quantity: 4,
        lastUpdated: '2026-11-02T08:30:00Z'
      }
    ],
    createdAt: '2025-08-20T08:00:00Z'
  },
  {
    id: 'col-3',
    matricola: 'MAT-1048',
    name: 'Juliana Castro de Faria',
    role: 'Especialista em Redes & Telecom',
    department: 'Infraestrutura de TI',
    phone: '(11) 99655-3312',
    email: 'juliana.castro@aniel.emp.br',
    vehicleId: 'SPK-9J22',
    active: true,
    custody: [
      {
        productId: 'prod-3',
        productName: 'Cabo de Rede UTP Cat6 24AWG Puro Cobre',
        sku: 'INS-TEL-03',
        unit: 'MT',
        quantity: 110,
        lastUpdated: '2026-11-02T13:40:00Z'
      },
      {
        productId: 'prod-4',
        productName: 'Conector Macho RJ45 Cat6 Blindado',
        sku: 'INS-TEL-04',
        unit: 'UN',
        quantity: 35,
        lastUpdated: '2026-11-02T13:40:00Z'
      }
    ],
    createdAt: '2025-09-01T08:00:00Z'
  },
  {
    id: 'col-4',
    matricola: 'MAT-1062',
    name: 'Marcos Vinicius Lima',
    role: 'Mecânico de Frotas & Equipamentos',
    department: 'Oficina Central',
    phone: '(11) 98831-4490',
    email: 'marcos.lima@aniel.emp.br',
    vehicleId: 'MGX-3B45',
    active: true,
    custody: [
      {
        productId: 'prod-7',
        productName: 'Óleo Sintético Lubrificante Motor 5W30',
        sku: 'INS-MEC-07',
        unit: 'LT',
        quantity: 8,
        lastUpdated: '2026-11-03T07:45:00Z'
      }
    ],
    createdAt: '2025-11-10T08:00:00Z'
  }
];

export const INITIAL_CLIENTS: Client[] = [
  {
    id: 'cli-1',
    name: 'Hospital São Lucas & Maternidade',
    document: '14.892.411/0001-95',
    email: 'engenharia@saolucashosp.com.br',
    phone: '(11) 3215-8000',
    address: 'Av. Paulista, 1842 - Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    segment: 'Manutenção Predial & Civil',
    notes: 'Acesso restrito: exigir crachá e EPI completo.',
    createdAt: '2026-01-05T10:00:00Z'
  },
  {
    id: 'cli-2',
    name: 'Condomínio Residencial Parque das Flores',
    document: '08.312.774/0001-12',
    email: 'sindico@parquedasflores.condo.br',
    phone: '(11) 4589-2210',
    address: 'Rua das Camélias, 350 - Morumbi',
    city: 'São Paulo',
    state: 'SP',
    segment: 'Elétrica & Energia Solar',
    notes: 'Horário de barulho permitido: 09h às 17h.',
    createdAt: '2026-01-08T11:30:00Z'
  },
  {
    id: 'cli-3',
    name: 'TechCloud Soluções em DataCenter',
    document: '29.450.812/0001-44',
    email: 'datacenter@techcloud.net.br',
    phone: '(11) 3991-6650',
    address: 'Rodovia Anhanguera, Km 26 - Polvilho',
    city: 'Cajamar',
    state: 'SP',
    segment: 'Telecomunicações & Redes',
    notes: 'Sala limpa: proibido entrada com ferramentas não higienizadas.',
    createdAt: '2026-01-12T14:10:00Z'
  },
  {
    id: 'cli-4',
    name: 'Transportadora TransLogística Rápida',
    document: '19.224.633/0001-09',
    email: 'frotas@translogistica.com.br',
    phone: '(11) 2987-1122',
    address: 'Av. Presidente Wilson, 4500 - Mooca',
    city: 'São Paulo',
    state: 'SP',
    segment: 'Mecânica & Frotas',
    notes: 'Manutenção preventiva da frota aos sábados.',
    createdAt: '2026-01-15T09:00:00Z'
  }
];

export const INITIAL_VEHICLES: Vehicle[] = [
  {
    id: 'veh-1',
    plate: 'BRA-2A19',
    brand: 'Fiat',
    model: 'Fiorino Endurance 1.4',
    year: 2024,
    currentKm: 34200,
    assignedMatricola: 'MAT-1021',
    status: 'em_servico',
    fuelType: 'Flex',
    lastServiceDate: '2026-09-15'
  },
  {
    id: 'veh-2',
    plate: 'RIO-4D88',
    brand: 'Renault',
    model: 'Master Furgão L3H2',
    year: 2023,
    currentKm: 68500,
    assignedMatricola: 'MAT-1035',
    status: 'em_servico',
    fuelType: 'Diesel',
    lastServiceDate: '2026-08-20'
  },
  {
    id: 'veh-3',
    plate: 'SPK-9J22',
    brand: 'Chevrolet',
    model: 'Montana Premier Turbo',
    year: 2025,
    currentKm: 18400,
    assignedMatricola: 'MAT-1048',
    status: 'em_servico',
    fuelType: 'Flex',
    lastServiceDate: '2026-10-02'
  },
  {
    id: 'veh-4',
    plate: 'MGX-3B45',
    brand: 'Volkswagen',
    model: 'Saveiro Robust 1.6',
    year: 2024,
    currentKm: 27900,
    assignedMatricola: 'MAT-1062',
    status: 'disponivel',
    fuelType: 'Flex',
    lastServiceDate: '2026-10-18'
  }
];

export const INITIAL_SERVICE_ORDERS: ServiceOrder[] = [
  {
    id: 'os-1',
    code: 'OS-2026-0038',
    clientId: 'cli-1',
    clientName: 'Hospital São Lucas & Maternidade',
    clientPhone: '(11) 3215-8000',
    clientAddress: 'Av. Paulista, 1842 - Bela Vista, SP',
    title: 'Manutenção Corretiva Chiller Bloco C - Carga de Gás',
    description: 'Vazamento sanado no flange de expansão. Necessário vácuo e reposição de 4kg de fluído R410A com teste de rendimento.',
    scheduledDate: '2026-11-03',
    scheduledTime: '09:00',
    assignedMatricola: 'MAT-1021',
    assignedTechnicianName: 'Carlos Eduardo Silveira',
    vehiclePlate: 'BRA-2A19',
    status: 'em_execucao',
    laborCost: 650.0,
    estimatedSupplies: [
      {
        productId: 'prod-1',
        productName: 'Gás Refrigerante R410A (Botija 11.3kg)',
        sku: 'INS-HVAC-01',
        unit: 'KG',
        quantity: 4,
        unitCost: 65.0,
        unitPrice: 110.0
      },
      {
        productId: 'prod-8',
        productName: 'Fita Isolante Alta Fusão 19mm x 10m',
        sku: 'INS-GER-08',
        unit: 'UN',
        quantity: 1,
        unitCost: 7.5,
        unitPrice: 15.0
      }
    ],
    appliedSupplies: [
      {
        id: 'app-os-1',
        productId: 'prod-1',
        productName: 'Gás Refrigerante R410A (Botija 11.3kg)',
        sku: 'INS-HVAC-01',
        unit: 'KG',
        quantity: 3,
        appliedDate: '2026-11-03T11:20:00Z',
        matricola: 'MAT-1021',
        technicianName: 'Carlos Eduardo Silveira',
        unitCost: 65.0,
        notes: 'Carga parcial efetuada e balanceamento de pressões nominal.'
      }
    ],
    totalEstimated: 1105.0,
    totalReal: 845.0,
    createdAt: '2026-11-01T10:00:00Z'
  },
  {
    id: 'os-2',
    code: 'OS-2026-0039',
    clientId: 'cli-3',
    clientName: 'TechCloud Soluções em DataCenter',
    clientPhone: '(11) 3991-6650',
    clientAddress: 'Rodovia Anhanguera, Km 26 - Cajamar, SP',
    title: 'Cabeamento Estruturado Racks R04 e R05',
    description: 'Instalação de 24 pontos de rede Cat6 interligando patch panels com teste de certificação Fluke.',
    scheduledDate: '2026-11-04',
    scheduledTime: '13:30',
    assignedMatricola: 'MAT-1048',
    assignedTechnicianName: 'Juliana Castro de Faria',
    vehiclePlate: 'SPK-9J22',
    status: 'aprovado',
    laborCost: 1200.0,
    estimatedSupplies: [
      {
        productId: 'prod-3',
        productName: 'Cabo de Rede UTP Cat6 24AWG Puro Cobre',
        sku: 'INS-TEL-03',
        unit: 'MT',
        quantity: 80,
        unitCost: 3.2,
        unitPrice: 6.8
      },
      {
        productId: 'prod-4',
        productName: 'Conector Macho RJ45 Cat6 Blindado',
        sku: 'INS-TEL-04',
        unit: 'UN',
        quantity: 24,
        unitCost: 1.5,
        unitPrice: 3.5
      }
    ],
    appliedSupplies: [],
    totalEstimated: 1828.0,
    totalReal: 0.0,
    createdAt: '2026-11-02T14:00:00Z'
  },
  {
    id: 'os-3',
    code: 'OS-2026-0040',
    clientId: 'cli-2',
    clientName: 'Condomínio Residencial Parque das Flores',
    clientPhone: '(11) 4589-2210',
    clientAddress: 'Rua das Camélias, 350 - Morumbi, SP',
    title: 'Instalação de Quadro Geral da Piscina Aquecida',
    description: 'Substituição do quadro antigo por caixa hermética com disjuntor bipolar 32A e cabeamento anti-chama 2,5mm.',
    scheduledDate: '2026-11-02',
    scheduledTime: '08:30',
    assignedMatricola: 'MAT-1035',
    assignedTechnicianName: 'Roberto Mendes Ramos',
    vehiclePlate: 'RIO-4D88',
    status: 'concluido',
    laborCost: 450.0,
    estimatedSupplies: [
      {
        productId: 'prod-2',
        productName: 'Cabo Flexível 2,5mm 750V Anti-Chama',
        sku: 'INS-ELET-02',
        unit: 'MT',
        quantity: 30,
        unitCost: 2.8,
        unitPrice: 5.5
      },
      {
        productId: 'prod-6',
        productName: 'Disjuntor Bipolar Din 32A Curva C',
        sku: 'INS-ELET-06',
        unit: 'UN',
        quantity: 2,
        unitCost: 34.0,
        unitPrice: 62.0
      }
    ],
    appliedSupplies: [
      {
        id: 'app-os-3',
        productId: 'prod-2',
        productName: 'Cabo Flexível 2,5mm 750V Anti-Chama',
        sku: 'INS-ELET-02',
        unit: 'MT',
        quantity: 26,
        appliedDate: '2026-11-02T15:10:00Z',
        matricola: 'MAT-1035',
        technicianName: 'Roberto Mendes Ramos',
        unitCost: 2.8,
        notes: '26 metros utilizados com sobra de 4m devolvida ao almoxarifado.'
      },
      {
        id: 'app-os-3-2',
        productId: 'prod-6',
        productName: 'Disjuntor Bipolar Din 32A Curva C',
        sku: 'INS-ELET-06',
        unit: 'UN',
        quantity: 2,
        appliedDate: '2026-11-02T15:10:00Z',
        matricola: 'MAT-1035',
        technicianName: 'Roberto Mendes Ramos',
        unitCost: 34.0,
        notes: 'Instalados e testados sob carga contínua.'
      }
    ],
    totalEstimated: 739.0,
    totalReal: 672.8,
    completionDate: '2026-11-02T17:00:00Z',
    completionNotes: 'Serviço finalizado com êxito. Quadro testado e aprovado pelo síndico.',
    createdAt: '2026-10-30T11:00:00Z'
  },
  {
    id: 'os-4',
    code: 'OS-2026-0041',
    clientId: 'cli-4',
    clientName: 'Transportadora TransLogística Rápida',
    clientPhone: '(11) 2987-1122',
    clientAddress: 'Av. Presidente Wilson, 4500 - Mooca, SP',
    title: 'Troca de Óleo e Filtros em Caminhão Iveco Daily',
    description: 'Revisão periódica de 60.000km com substituição de 7 litros de óleo sintético 5W30.',
    scheduledDate: '2026-11-05',
    scheduledTime: '09:00',
    assignedMatricola: 'MAT-1062',
    assignedTechnicianName: 'Marcos Vinicius Lima',
    vehiclePlate: 'MGX-3B45',
    status: 'orcamento',
    laborCost: 300.0,
    estimatedSupplies: [
      {
        productId: 'prod-7',
        productName: 'Óleo Sintético Lubrificante Motor 5W30',
        sku: 'INS-MEC-07',
        unit: 'LT',
        quantity: 7,
        unitCost: 38.0,
        unitPrice: 70.0
      }
    ],
    appliedSupplies: [],
    totalEstimated: 790.0,
    totalReal: 0.0,
    createdAt: '2026-11-03T09:30:00Z'
  }
];

export const INITIAL_WAREHOUSE_ENTRIES: WarehouseEntry[] = [
  {
    id: 'entry-1',
    entryNumber: 'ENT-2026-0012',
    invoiceNumber: 'NF-e 88.421',
    supplier: 'Distribuidora FrioMax Refrigeração Ltda',
    entryDate: '2026-10-25T14:30:00Z',
    items: [
      {
        productId: 'prod-1',
        productName: 'Gás Refrigerante R410A (Botija 11.3kg)',
        sku: 'INS-HVAC-01',
        unit: 'KG',
        quantity: 30,
        unitCost: 65.0,
        totalCost: 1950.0
      },
      {
        productId: 'prod-5',
        productName: 'Tubo de Cobre Flexível 3/8" Parede 1/32"',
        sku: 'INS-HVAC-05',
        unit: 'MT',
        quantity: 50,
        unitCost: 22.0,
        totalCost: 1100.0
      }
    ],
    totalValue: 3050.0,
    receivedByMatricola: 'MAT-1001 (Almoxarife Chefe)',
    notes: 'Conferido com lacre intacto e certificado de conformidade técnica.'
  },
  {
    id: 'entry-2',
    entryNumber: 'ENT-2026-0013',
    invoiceNumber: 'NF-e 104.992',
    supplier: 'EletroCondutores São Paulo S/A',
    entryDate: '2026-10-28T10:15:00Z',
    items: [
      {
        productId: 'prod-2',
        productName: 'Cabo Flexível 2,5mm 750V Anti-Chama',
        sku: 'INS-ELET-02',
        unit: 'MT',
        quantity: 200,
        unitCost: 2.8,
        totalCost: 560.0
      },
      {
        productId: 'prod-6',
        productName: 'Disjuntor Bipolar Din 32A Curva C',
        sku: 'INS-ELET-06',
        unit: 'UN',
        quantity: 20,
        unitCost: 34.0,
        totalCost: 680.0
      }
    ],
    totalValue: 1240.0,
    receivedByMatricola: 'MAT-1001 (Almoxarife Chefe)',
    notes: 'Lote aprovado no controle de qualidade.'
  }
];

export const INITIAL_REQUISITIONS_RM: SupplyRequisitionRM[] = [
  {
    id: 'rm-1',
    rmNumber: 'RM-2026-015',
    date: '2026-11-01T09:15:00Z',
    matricola: 'MAT-1021',
    technicianName: 'Carlos Eduardo Silveira',
    serviceOrderId: 'os-1',
    serviceOrderCode: 'OS-2026-0038',
    items: [
      {
        productId: 'prod-1',
        productName: 'Gás Refrigerante R410A (Botija 11.3kg)',
        sku: 'INS-HVAC-01',
        unit: 'KG',
        quantity: 5
      },
      {
        productId: 'prod-5',
        productName: 'Tubo de Cobre Flexível 3/8" Parede 1/32"',
        sku: 'INS-HVAC-05',
        unit: 'MT',
        quantity: 12
      },
      {
        productId: 'prod-8',
        productName: 'Fita Isolante Alta Fusão 19mm x 10m',
        sku: 'INS-GER-08',
        unit: 'UN',
        quantity: 2
      }
    ],
    dispensedBy: 'Almoxarifado Central (MAT-1001)',
    status: 'retirado',
    notes: 'Retirado para atendimento emergencial Hospital São Lucas.'
  },
  {
    id: 'rm-2',
    rmNumber: 'RM-2026-016',
    date: '2026-11-02T08:30:00Z',
    matricola: 'MAT-1035',
    technicianName: 'Roberto Mendes Ramos',
    serviceOrderId: 'os-3',
    serviceOrderCode: 'OS-2026-0040',
    items: [
      {
        productId: 'prod-2',
        productName: 'Cabo Flexível 2,5mm 750V Anti-Chama',
        sku: 'INS-ELET-02',
        unit: 'MT',
        quantity: 30
      },
      {
        productId: 'prod-6',
        productName: 'Disjuntor Bipolar Din 32A Curva C',
        sku: 'INS-ELET-06',
        unit: 'UN',
        quantity: 2
      }
    ],
    dispensedBy: 'Almoxarifado Central (MAT-1001)',
    status: 'retirado',
    notes: 'Material para quadro elétrico piscina.'
  }
];

export const INITIAL_APPLICATIONS: SupplyApplicationRecord[] = [
  {
    id: 'app-rec-1',
    appCode: 'APL-2026-022',
    date: '2026-11-03T11:20:00Z',
    matricola: 'MAT-1021',
    technicianName: 'Carlos Eduardo Silveira',
    serviceOrderId: 'os-1',
    serviceOrderCode: 'OS-2026-0038',
    clientName: 'Hospital São Lucas & Maternidade',
    items: [
      {
        productId: 'prod-1',
        productName: 'Gás Refrigerante R410A (Botija 11.3kg)',
        sku: 'INS-HVAC-01',
        unit: 'KG',
        quantity: 3
      }
    ],
    notes: 'Aplicação de gás no sistema de expansão direta.'
  },
  {
    id: 'app-rec-2',
    appCode: 'APL-2026-021',
    date: '2026-11-02T15:10:00Z',
    matricola: 'MAT-1035',
    technicianName: 'Roberto Mendes Ramos',
    serviceOrderId: 'os-3',
    serviceOrderCode: 'OS-2026-0040',
    clientName: 'Condomínio Residencial Parque das Flores',
    items: [
      {
        productId: 'prod-2',
        productName: 'Cabo Flexível 2,5mm 750V Anti-Chama',
        sku: 'INS-ELET-02',
        unit: 'MT',
        quantity: 26
      },
      {
        productId: 'prod-6',
        productName: 'Disjuntor Bipolar Din 32A Curva C',
        sku: 'INS-ELET-06',
        unit: 'UN',
        quantity: 2
      }
    ],
    notes: 'Instalação física concluída.'
  }
];

export const INITIAL_RETURNS: SupplyReturnRecord[] = [
  {
    id: 'ret-1',
    returnCode: 'DEV-2026-007',
    date: '2026-11-02T16:30:00Z',
    matricola: 'MAT-1035',
    technicianName: 'Roberto Mendes Ramos',
    serviceOrderId: 'os-3',
    serviceOrderCode: 'OS-2026-0040',
    items: [
      {
        productId: 'prod-2',
        productName: 'Cabo Flexível 2,5mm 750V Anti-Chama',
        sku: 'INS-ELET-02',
        unit: 'MT',
        quantity: 4,
        condition: 'perfeito'
      }
    ],
    receivedBy: 'Almoxarifado Central (MAT-1001)',
    notes: 'Devolução de sobra de cabeamento não utilizada na OS-2026-0040. Retornado ao estoque central.'
  }
];

export const INITIAL_SUPABASE_CONFIG: SupabaseConfig = {
  url: 'https://aniel-gestao-supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFuaWVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwMDAwMDB9.aniel_service_token_hash',
  dbName: 'aniel',
  isConnected: true,
  autoSync: true,
  lastSync: '2026-11-03T14:30:00Z'
};
