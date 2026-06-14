import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://cjnagdninashngvpxidc.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable__Pn9EN9UXSnPAYhL4X86nA_E8jqveLM';
const supabase = createClient(supabaseUrl, supabaseKey);

// Configurações do App Meta (necessários para a renovação automática de token)
const metaClientId = process.env.VITE_META_CLIENT_ID || process.env.META_CLIENT_ID;
const metaClientSecret = process.env.VITE_META_CLIENT_SECRET || process.env.META_CLIENT_SECRET;

async function getMetaAccessToken(): Promise<string> {
  const { data, error } = await supabase
    .from('auth_tokens')
    .select('token')
    .eq('id', 'meta_marketing_api')
    .single();

  if (error || !data) {
    return 'EAAwh3noXha0BRkUPZCsTpbW42K7XZBzyQgPGO747GHS5bkd4JM2UZBI0sY8ZCkXLLC9pneo4DLQgNtthJAk8LiGOorZCSpVgp3lI3nZAZAAyWS3snbX1Gmj2vSRUmuOAKBiXpMBXhzABUZBzmY5aSGpZBlzZBULffBETDTXOXZAoZBzpzYKZBhGbiZAFZBxYoXwkLxMr5o44LDXM3aXIoUAVZBsi1T4Kv2Y2P8IXw7bAHLqKzYUZAB0QHtVZAA0QYBglrstP1bN983aRWIuP24c8sF284GfzQ1ktI8fwZDZD';
  }
  return data.token;
}

async function saveMetaAccessToken(token: string, expiresInSeconds: number = 5184000) {
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();
  const { error } = await supabase
    .from('auth_tokens')
    .upsert({
      id: 'meta_marketing_api',
      token,
      expires_at: expiresAt
    });
  if (error) {
    console.error('Erro ao salvar novo token no Supabase:', error);
    throw error;
  }
}

async function renewMetaAccessToken(oldToken: string): Promise<string> {
  if (!metaClientId || !metaClientSecret) {
    throw new Error('Credenciais do App Meta (META_CLIENT_ID/META_CLIENT_SECRET) não estão configuradas.');
  }
  console.log('Renovando token de acesso de longa duração da Meta...');
  const refreshUrl = `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${metaClientId}&client_secret=${metaClientSecret}&fb_exchange_token=${oldToken}`;
  
  const response = await fetch(refreshUrl);
  const data: any = await response.json();
  
  if (data.access_token) {
    await saveMetaAccessToken(data.access_token, data.expires_in || 5184000);
    return data.access_token;
  } else {
    throw new Error('Falha ao obter token de acesso renovado: ' + JSON.stringify(data));
  }
}

async function fetchMetaGraph(endpoint: string, method = 'GET', body: any = null): Promise<any> {
  let token = await getMetaAccessToken();
  const urlWithToken = (token: string) => endpoint.includes('?') ? `${endpoint}&access_token=${token}` : `${endpoint}?access_token=${token}`;
  
  const options: any = { method };
  if (body) {
    options.headers = { 'Content-Type': 'application/json' };
    options.body = JSON.stringify(body);
  }

  let response = await fetch(urlWithToken(token), options);
  let result: any = await response.json();

  if (result.error && result.error.type === 'OAuthException') {
    console.warn('OAuthException detectada, iniciando renovação de token...');
    try {
      token = await renewMetaAccessToken(token);
      response = await fetch(urlWithToken(token), options);
      result = await response.json();
    } catch (renewError: any) {
      console.error('Erro na renovação automática:', renewError);
      throw new Error(`Token expirado e falha na renovação: ${renewError.message}`);
    }
  }

  return result;
}

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
    
    // Retorna o manifesto se a rota contiver /mcp/context
    if (url.pathname.endsWith('/mcp/context')) {
      return res.status(200).json({
        "mcpServers": {
          "PlannerDiRio_MCP": {
            "command": "curl",
            "args": ["-s", "https://planner-di-rio-raquel.vercel.app/api/mcp-server/mcp/context"]
          }
        }
      });
    }

    // Rota de renovação (POST ou query parameter renew)
    if (req.method === 'POST' || url.searchParams.get('renew') === 'true') {
      const oldToken = await getMetaAccessToken();
      const newToken = await renewMetaAccessToken(oldToken);
      return res.status(200).json({ 
        success: true, 
        message: 'Token renovado com sucesso.', 
        expires_at: new Date(Date.now() + 5184000 * 1000).toISOString() 
      });
    }

    // Caso contrário, retorna o contexto das redes sociais
    let instagramMetrics = {
      username: 'Desconhecido',
      followers_count: 0,
      media_count: 0,
      engagement: 0
    };

    let facebookMetrics = {
      page_name: 'Desconhecido',
      fans_count: 0,
      engagement: 0
    };

    let campaignMetrics: any[] = [];

    try {
      const pagesData = await fetchMetaGraph('https://graph.facebook.com/v19.0/me/accounts?fields=name,fan_count,instagram_business_account{followers_count,username,media_count,media{like_count,comments_count}}');
      if (pagesData && pagesData.data && pagesData.data.length > 0) {
        const firstPage = pagesData.data[0];
        facebookMetrics.page_name = firstPage.name || 'Página Meta';
        facebookMetrics.fans_count = firstPage.fan_count || 0;

        const igAcc = firstPage.instagram_business_account;
        if (igAcc) {
          instagramMetrics.username = igAcc.username || 'instagram_user';
          instagramMetrics.followers_count = igAcc.followers_count || 0;
          instagramMetrics.media_count = igAcc.media_count || 0;
          
          let totalEngagement = 0;
          if (igAcc.media && igAcc.media.data) {
            for (const post of igAcc.media.data) {
              totalEngagement += (post.like_count || 0) + (post.comments_count || 0);
            }
          }
          instagramMetrics.engagement = totalEngagement;
        }
      }
    } catch (err) {
      console.warn('Erro ao buscar dados de Páginas/Instagram:', err);
    }

    try {
      const adAccountsData = await fetchMetaGraph('https://graph.facebook.com/v19.0/me/adaccounts?fields=name,account_id,campaigns{name,status,objective,insights{impressions,clicks,spend}}');
      if (adAccountsData && adAccountsData.data) {
        for (const adAcc of adAccountsData.data) {
          if (adAcc.campaigns && adAcc.campaigns.data) {
            for (const camp of adAcc.campaigns.data) {
              let impressions = 0;
              let clicks = 0;
              let spend = 0.0;
              if (camp.insights && camp.insights.data && camp.insights.data.length > 0) {
                const ins = camp.insights.data[0];
                impressions = parseInt(ins.impressions || '0');
                clicks = parseInt(ins.clicks || '0');
                spend = parseFloat(ins.spend || '0.0');
              }
              campaignMetrics.push({
                campaign_name: camp.name,
                status: camp.status,
                objective: camp.objective,
                impressions,
                clicks,
                spend
              });
            }
          }
        }
      }
    } catch (err) {
      console.warn('Erro ao buscar dados da Meta Marketing API:', err);
    }

    const responsePayload = {
      server_name: 'PlannerDiRio_MCP',
      scope: 'Central de Marketing - Redes Sociais e Anúncios',
      timestamp: new Date().toISOString(),
      metrics: {
        instagram: {
          username: instagramMetrics.username,
          followers: instagramMetrics.followers_count,
          posts_published: instagramMetrics.media_count,
          engagement: instagramMetrics.engagement,
          growth_rate_estimate: 'Calculado mensalmente via Central de Marketing'
        },
        facebook: {
          page_name: facebookMetrics.page_name,
          followers: facebookMetrics.fans_count,
          engagement_score: facebookMetrics.engagement
        },
        campaigns: campaignMetrics
      }
    };

    return res.status(200).json(responsePayload);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Erro interno ao consultar a API da Meta' });
  }
}
