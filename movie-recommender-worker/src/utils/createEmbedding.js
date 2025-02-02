async function createEmbedding(input, openai) {
	const embeddingResponse = await openai.embeddings.create({
		model: "text-embedding-ada-002",
		input
	});
	return embeddingResponse.data[0].embedding;
}

export default createEmbedding;
