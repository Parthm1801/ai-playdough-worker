import OpenAI from "openai";

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'POST, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type'
};

export default {
	async fetch(request, env, ctx) {
		// Handle CORS preflight requests
		if (request.method === 'OPTIONS') {
			return new Response(null, { headers: corsHeaders });
		}

		// Only process POST requests
		if (request.method !== 'POST') {
			return new Response(JSON.stringify({ error: `${request.method} method not allowed.`}), { status: 405, headers: corsHeaders })
		}

		const openai = new OpenAI({
			apiKey: env.OPENAI_API_KEY,
			defaultOrganisation: 'org-lMbYjma3VasH1xvj0aV4S9q6',
			baseURL: 'https://gateway.ai.cloudflare.com/v1/1bca07eae1cf3a30dbad5a204b5f0bb2/ai-playdough/openai'
		})

		try {
			const messages = await request.json()
			const chatCompletion = await openai.chat.completions.create({
				model: 'gpt-3.5-turbo',
				messages,
				temperature: 1.1,
				presence_penalty: 0,
				frequency_penalty: 0
			})
			const response = chatCompletion.choices[0].message

			return new Response(JSON.stringify(response), { headers: corsHeaders })
		} catch (error) {
			return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
		}
	},
};
