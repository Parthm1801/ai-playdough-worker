export default async function getChatCompletion(match, query, openai) {
	const chatMessages = [{
		role: 'system',
		content: `You are an enthusiastic movie expert who loves recommending movies to people. You will be given two pieces of information - some context about movies and a question. Your main job is to formulate a short answer to the question using the provided context. The context contains answers to three questions: era (new or classic), genre and duration (1-2 hours, 2+ hours). Your answer should be in the format: {"movie": "Movie name (release year)", "about": "A gew lines about the movie"}. Example response: {"movie": "School of Rock (2009)", "about": "A fun and stupid movie about a wannabe rocker turned fraud substitute teacher forming a rock band with his students to win the Battle of the Bands"}`
	}, {
		role: 'user',
		content: `Context: ${match} Question: ${query}`
	}];

	const response = await openai.chat.completions.create({
		model: 'gpt-3.5-turbo',
		messages: chatMessages,
		temperature: 0.5,
		frequency_penalty: 0.5
	})

	return response;
}
