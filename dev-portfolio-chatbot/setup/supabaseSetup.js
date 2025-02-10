import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { OpenAIEmbeddings } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";

const PLACEHOLDER = ''

const supabase = createClient('https://pjykziqjpjabotkpahxd.supabase.co', PLACEHOLDER);

const textData = fs.readFileSync('./assets/profile.md', 'utf-8');

const splitter = new RecursiveCharacterTextSplitter({
	chunkSize: 500,
	chunkOverlap: 50,
	separators: ['\n\n', '\n', ' ', '', '# ', '## ']
});

const processAndStore = async () => {
	try {
		const output = await splitter.createDocuments([textData])

		const openAIApiKey = PLACEHOLDER;

		await SupabaseVectorStore.fromDocuments(
			output,
			new OpenAIEmbeddings({openAIApiKey}),
			{
				client: supabase,
				tableName: 'portfolio',
			}
		)
		console.log('Embeddings successfully stored in Supabase!');
	} catch (error) {
		console.error('Error processing and storing embeddings:', error);
	}
}

processAndStore();
