import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseConfig } from '@/types';

let cachedClient: SupabaseClient | null = null;
let lastUsedConfig: { url: string; key: string } | null = null;

export function getSupabaseClient(config: SupabaseConfig): SupabaseClient | null {
  if (!config.url || !config.anonKey) return null;
  
  // Se a URL ou a chave mudaram, recria o client
  if (!cachedClient || lastUsedConfig?.url !== config.url || lastUsedConfig?.key !== config.anonKey) {
    try {
      cachedClient = createClient(config.url, config.anonKey);
      lastUsedConfig = { url: config.url, key: config.anonKey };
    } catch (e) {
      console.warn('Falha ao inicializar client Supabase:', e);
      return null;
    }
  }
  return cachedClient;
}

export async function testSupabaseConnection(config: SupabaseConfig): Promise<{ success: boolean; message: string }> {
  try {
    const client = getSupabaseClient(config);
    if (!client) {
      return { success: false, message: 'URL ou Chave do Supabase inválidas.' };
    }

    // Tenta uma consulta simples de conexão
    const { error } = await client.from('clientes').select('id').limit(1);
    
    if (error) {
      // Se a tabela não existir ainda, a conexão com o Supabase funcionou mas precisa rodar o script SQL
      if (error.code === '42P01') {
        return { 
          success: true, 
          message: 'Conectado ao Supabase com sucesso! As tabelas do banco "aniel" ainda não foram criadas. Copie e execute o script SQL.' 
        };
      }
      return { success: false, message: `Erro ao comunicar com Supabase: ${error.message}` };
    }

    return { success: true, message: 'Conectado com sucesso ao banco de dados Supabase "aniel"!' };
  } catch (err: any) {
    return { success: false, message: `Falha de rede ou timeout: ${err?.message || 'Erro desconhecido'}` };
  }
}
