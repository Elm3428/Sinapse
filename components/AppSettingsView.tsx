'use client';

import React, { useEffect, useState } from 'react';
import { Building2, ImagePlus, Save, Smartphone, Trash2 } from 'lucide-react';

type AppSettings = {
  appName: string; developer: string; companyName: string; tradeName: string;
  cnpj: string; stateRegistration: string; phone: string; email: string;
  address: string; city: string; state: string; zipCode: string; website: string;
  logo: string;
};

const STORAGE_KEY = 'aniel_app_settings_v1';
const DEFAULTS: AppSettings = {
  appName: 'Aniel Gestão', developer: 'Brenda Marconato',
  companyName: '', tradeName: '', cnpj: '', stateRegistration: '',
  phone: '', email: '', address: '', city: '', state: '', zipCode: '',
  website: '', logo: ''
};

export function AppSettingsView() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULTS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSettings({ ...DEFAULTS, ...JSON.parse(raw) });
    } catch (error) { console.error('Não foi possível carregar as configurações.', error); }
  }, []);

  const update = (field: keyof AppSettings, value: string) => {
    setSettings(current => ({ ...current, [field]: value }));
    setSaved(false);
  };

  const handleLogo = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Selecione um arquivo de imagem.'); return; }
    if (file.size > 2 * 1024 * 1024) { alert('A logo deve ter no máximo 2 MB.'); return; }
    const reader = new FileReader();
    reader.onload = () => update('logo', String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  const save = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      setSaved(true);
      alert('Configurações salvas neste navegador.');
    } catch (error) {
      alert('Não foi possível salvar. A imagem pode ser grande demais para o armazenamento local.');
    }
  };

  const field = (label: string, key: keyof AppSettings, placeholder = '', type = 'text') => (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      <input type={type} value={settings[key]} placeholder={placeholder}
        onChange={e => update(key, e.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
    </label>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 text-slate-900">
          <Building2 className="w-5 h-5" />
          <h1 className="text-xl font-bold">Configurações do aplicativo</h1>
        </div>
        <p className="text-sm text-slate-500 mt-1">Personalize a identificação do sistema e os dados da empresa usuária.</p>
      </div>

      <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2"><Smartphone className="w-4 h-4 text-blue-600" /><h2 className="font-semibold text-slate-900">Identidade do aplicativo</h2></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {field('Nome do aplicativo', 'appName', 'Ex.: Aniel Gestão')}
          {field('Nome do desenvolvedor', 'developer', 'Nome do desenvolvedor')}
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2"><Building2 className="w-4 h-4 text-blue-600" /><h2 className="font-semibold text-slate-900">Dados da empresa</h2></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {field('Razão social', 'companyName')}
          {field('Nome fantasia', 'tradeName')}
          {field('CNPJ', 'cnpj')}
          {field('Inscrição estadual', 'stateRegistration')}
          {field('Telefone', 'phone', '', 'tel')}
          {field('E-mail', 'email', '', 'email')}
          {field('Endereço', 'address')}
          {field('CEP', 'zipCode')}
          {field('Cidade', 'city')}
          {field('Estado (UF)', 'state', 'PR')}
          {field('Site', 'website', 'https://')}
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2"><ImagePlus className="w-4 h-4 text-blue-600" /><h2 className="font-semibold text-slate-900">Logotipo da empresa</h2></div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="w-32 h-32 rounded-xl border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden">
            {settings.logo ? <img src={settings.logo} alt="Logo da empresa" className="w-full h-full object-contain" /> : <div className="text-center text-slate-400 text-xs p-3">Prévia da logo</div>}
          </div>
          <div className="space-y-2">
            <label className="inline-flex items-center gap-2 cursor-pointer rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800">
              <ImagePlus className="w-4 h-4" /> Escolher imagem
              <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={handleLogo} className="hidden" />
            </label>
            <p className="text-xs text-slate-500">Formatos: PNG, JPG, WEBP ou SVG. Tamanho máximo: 2 MB.</p>
            {settings.logo && <button onClick={() => update('logo', '')} className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700"><Trash2 className="w-3.5 h-3.5" /> Remover logo</button>}
          </div>
        </div>
      </section>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-slate-500">As informações são gravadas no armazenamento deste navegador.</p>
        <button onClick={save} className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800">
          <Save className="w-4 h-4" /> Salvar configurações
        </button>
      </div>
      {saved && <p className="text-xs text-emerald-700">Configurações salvas.</p>}
    </div>
  );
}
