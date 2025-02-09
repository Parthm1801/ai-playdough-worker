import OpenAI from "openai";
import callOpenAiTools from "./utils/openAiTools";

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'POST, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type'
};


export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);
		const path = url.pathname;
		const openai = new OpenAI({
			apiKey: env.OPENAI_API_KEY,
			baseURL: 'https://gateway.ai.cloudflare.com/v1/1bca07eae1cf3a30dbad5a204b5f0bb2/ai-playdough/openai'
		});

		if (request.method === 'OPTIONS') {
			return new Response(null, { headers: corsHeaders });
		}

		if (path === '/ping') {
			return new Response('pong');
		}

		if (path === '/recipe') {
			return await handleRecipeRequest(request, openai, env)
		}
		return new Response("Not Found", { status: 404 });
	},
};

const handleRecipeRequest = async (request, openai, env) => {
	try {
		const {ingredients} = await request.json();
		const result = await callOpenAiTools(ingredients, openai, env);
		console.log(result);
		return new Response(result, {
			headers: { ...corsHeaders, "Content-Type": "application/json" }
		});
	} catch (error) {
		console.log(error);
		return new Response(`Error: ${JSON.stringify(error)}`, {status: 500});
	}
}
