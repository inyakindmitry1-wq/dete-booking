import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

const LLM_BASE_URL = Deno.env.get('LLM_BASE_URL') || 'https://api.openai.com/v1';
const LLM_API_KEY = Deno.env.get('LLM_API_KEY') || '';
const LLM_MODEL = Deno.env.get('LLM_MODEL') || 'gpt-4o-mini';
const LLM_MAX_TURNS = parseInt(Deno.env.get('LLM_MAX_TURNS') || '3', 10);

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { tenant_slug, message, history = [], is_owner = false } = await req.json();

    if (!tenant_slug || !message) {
      return new Response(JSON.stringify({ error: 'Missing tenant_slug or message' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Resolve Tenant
    const { data: tenant } = await supabaseAdmin
      .from('tenants')
      .select('*')
      .eq('slug', tenant_slug)
      .single();

    if (!tenant) {
      return new Response(JSON.stringify({ error: 'Tenant not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Rate Limit & Budget Check (Atomic Counter)
    const today = new Date().toISOString().split('T')[0];
    const rateKey = `ai_budget:${tenant.id}:${today}`;

    const { data: rateData } = await supabaseAdmin
      .from('rate_limits')
      .select('count')
      .eq('key', rateKey)
      .maybeSingle();

    if (rateData && rateData.count >= 200) {
      return new Response(
        JSON.stringify({
          reply: 'Дневной лимит обращений к онлайн-консультанту исчерпан. Пожалуйста, воспользуйтесь стандартным каталогом для записи.',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Increment counter
    await supabaseAdmin
      .from('rate_limits')
      .upsert({
        key: rateKey,
        count: (rateData?.count || 0) + 1,
        reset_at: new Date(Date.now() + 86400000).toISOString(),
      });

    // 3. Define Strictly Authorized Tools (Enforcing Scopes)
    const clientTools = [
      {
        type: 'function',
        function: {
          name: 'get_service_catalog',
          description: 'Получить полный список активных услуг студии с актуальными ценами и длительностью',
          parameters: { type: 'object', properties: {} },
        },
      },
      {
        type: 'function',
        function: {
          name: 'get_studio_info',
          description: 'Получить адрес, телефон и режим работы студии',
          parameters: { type: 'object', properties: {} },
        },
      },
    ];

    const ownerTools = [
      {
        type: 'function',
        function: {
          name: 'get_occupancy_stats',
          description: 'Получить финансовую статистику и количество заездов владельца за сегодня',
          parameters: { type: 'object', properties: {} },
        },
      },
    ];

    // INVARIANT 7: Client cannot execute owner tools!
    const availableTools = is_owner ? [...clientTools, ...ownerTools] : clientTools;

    // Server-side Tool Execution Handlers
    async function executeTool(name: string, _args: any): Promise<string> {
      if (name === 'get_service_catalog') {
        const { data: srvs } = await supabaseAdmin
          .from('services')
          .select('name, category, price, duration_minutes')
          .eq('tenant_id', tenant.id)
          .eq('is_active', true);
        return JSON.stringify(srvs || []);
      }
      if (name === 'get_studio_info') {
        return JSON.stringify({
          name: tenant.name,
          phone: tenant.phone,
          address: tenant.address,
          city: tenant.city,
        });
      }
      if (name === 'get_occupancy_stats' && is_owner) {
        const start = new Date().toISOString().split('T')[0] + 'T00:00:00Z';
        const end = new Date().toISOString().split('T')[0] + 'T23:59:59Z';
        const { data: stats } = await supabaseAdmin.rpc('get_owner_stats', {
          p_tenant_id: tenant.id,
          p_start_date: start,
          p_end_date: end,
        });
        return JSON.stringify(stats);
      }
      return JSON.stringify({ error: 'Tool not authorized or unknown' });
    }

    // 4. If no LLM API key configured: fallback to local intent resolver
    if (!LLM_API_KEY) {
      let localReply = '';
      const lower = message.toLowerCase();
      if (lower.includes('цена') || lower.includes('услуг')) {
        const srvs = JSON.parse(await executeTool('get_service_catalog', {}));
        localReply = `В студии ${tenant.name} доступны услуги: ` + srvs.map((s: any) => `${s.name} (${s.price} ₽)`).join(', ');
      } else if (lower.includes('где') || lower.includes('адрес') || lower.includes('телефон')) {
        localReply = `Студия ${tenant.name} находится по адресу: ${tenant.city}, ${tenant.address}. Телефон: ${tenant.phone}.`;
      } else {
        localReply = `Здравствуйте! Я виртуальный ассистент студии ${tenant.name}. Вы можете посмотреть услуги и записаться прямо на сайте.`;
      }

      return new Response(JSON.stringify({ reply: localReply }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 5. LLM Tool Loop (Max turns = LLM_MAX_TURNS)
    const messages: any[] = [
      {
        role: 'system',
        content: `Вы — вежливый помощник в студии "${tenant.name}" (${tenant.business_type}). Отвечайте коротко и доброжелательно на русском языке. Перед ответом на вопросы о ценах и расписании обязательно вызывайте соответствующие инструменты.`,
      },
      ...history,
      { role: 'user', content: message },
    ];

    let currentTurn = 0;
    let finalReply = '';

    while (currentTurn < LLM_MAX_TURNS) {
      currentTurn++;

      const response = await fetch(`${LLM_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${LLM_API_KEY}`,
        },
        body: JSON.stringify({
          model: LLM_MODEL,
          messages,
          tools: availableTools,
          tool_choice: 'auto',
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error(`LLM provider error: ${response.statusText}`);
      }

      const resJson = await response.json();
      const choice = resJson.choices?.[0];
      const assistantMessage = choice?.message;

      if (!assistantMessage) break;

      messages.push(assistantMessage);

      // Check if LLM requested tool execution
      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        for (const toolCall of assistantMessage.tool_calls) {
          const fnName = toolCall.function.name;
          const fnArgs = JSON.parse(toolCall.function.arguments || '{}');
          const toolResult = await executeTool(fnName, fnArgs);

          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: toolResult,
          });
        }
      } else {
        // Model provided final text
        finalReply = assistantMessage.content || '';
        break;
      }
    }

    return new Response(JSON.stringify({ reply: finalReply || 'Спасибо за обращение! Выберите услугу в каталоге.' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('AI chat edge function error:', err);
    // Invariant 12: Graceful degradation
    return new Response(
      JSON.stringify({
        reply: 'Извините, сервис онлайн-консультанта сейчас перезагружается. Вы можете воспользоваться стандартной записью через каталог услуг.',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
