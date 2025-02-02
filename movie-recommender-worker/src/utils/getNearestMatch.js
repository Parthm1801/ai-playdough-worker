async function getNearestMatch(embedding, supabase) {
	const {data} = await supabase.rpc(
		"match_movies",
		{
			query_embedding: embedding,
			match_threshold: 0.50,
			match_count: 3
		}
	)

	const match = data.map(data => data.content).join('\n');
	return match;
}

export default getNearestMatch;
