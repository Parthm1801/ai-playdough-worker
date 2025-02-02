import createEmbedding from "./utils/createEmbedding.js";
import getNearestMatch from "./utils/getNearestMatch.js";
import getChatCompletion from "./utils/getChatCompletion.js";
import OpenAI from "openai";
import {createClient} from "@supabase/supabase-js";

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'POST, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type'
};

export default {
	async fetch(request, env, ctx) {
		const openai = new OpenAI({
			apiKey: env.OPEN_AI_KEY,
			baseURL: 'https://gateway.ai.cloudflare.com/v1/1bca07eae1cf3a30dbad5a204b5f0bb2/ai-playdough/openai'
		});

		const privateKey = env.SUPABASE_API_KEY;
		if (!privateKey) throw new Error(`Expected env var SUPABASE_API_KEY`);

		const url = env.SUPABASE_URL;
		if (!url) throw new Error(`Expected env var SUPABASE_URL`);

		const supabase = createClient(url, privateKey);

		if (request.method === 'OPTIONS') {
			return new Response(null, { headers: corsHeaders });
		}

		if (request.method !== 'POST') {
			return new Response(JSON.stringify({ error: `${request.method} method not allowed.`}), { status: 405, headers: corsHeaders })
		}

		const {era, genre, duration} = await request.json();
		const message = `Movie from the ${era} era of ${genre} genre and ${duration} hours long`
		console.log(message)

		const embedding = await createEmbedding(message, openai);
		console.log(embedding)
		const match = await getNearestMatch(embedding, supabase);
		const responseObject = await getChatCompletion(match, message, openai);
		const response = responseObject.choices[0].message.content
		console.log(response);

		return new Response(JSON.stringify(response), { headers: corsHeaders });
	},
};
