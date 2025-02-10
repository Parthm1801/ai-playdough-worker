import {createClient} from "@supabase/supabase-js";
import {ChatOpenAI, OpenAIEmbeddings} from "@langchain/openai";
import getAnswer from "./conversationHandler.js";

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'POST, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type'
};

export default {
	async fetch(request, env, ctx) {
		if (request.method === 'OPTIONS') {
			return new Response(null, { headers: corsHeaders });
		}

		const url = new URL(request.url);
		const path = url.pathname;

		if (path === '/chat') {
			if (request.method !== 'POST') {
				return new Response(JSON.stringify({ error: `${request.method} method not allowed.`}), { status: 405, headers: corsHeaders })
			}

			const supabase = createClient(
				env.SUPABASE_URL,
				env.SUPABASE_API_KEY
			);
			const openAIApiKey = env.OPENAI_API_KEY;
			const llm = new ChatOpenAI({openAIApiKey})
			const embeddings = new OpenAIEmbeddings({openAIApiKey})

			const requestJson = await request.json();
			const question = requestJson.question;
			const convHistory = requestJson.convHistory;

			try {
				const response = await getAnswer(supabase, llm, embeddings, question, convHistory);
				return new Response(response, {status: 200});
			} catch (error) {
				return new Response('Error: ' + error.message, {status: 500});
			}
		}

		return new Response("Not Found", { status: 404 });
	},
};
