import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { prompt } = await req.json()

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicKey) {
      throw new Error('ANTHROPIC_API_KEY non configurée')
    }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        system: 'Tu es un assistant spécialisé dans la rédaction de contrats de location. Réponds UNIQUEMENT avec un objet JSON valide contenant la clé "html_content" avec le HTML complet du contrat. Aucun texte en dehors du JSON.',
        messages: [
          { role: 'user', content: prompt }
        ],
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.error?.message || 'Échec de l\'appel LLM')
    }

    const text = data.content[0].text

    // Tente de parser le JSON retourné par Claude
    try {
      const parsed = JSON.parse(text)
      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } catch {
      // Si Claude n'a pas retourné du JSON pur, on enveloppe le texte brut
      return new Response(JSON.stringify({ html_content: text }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
