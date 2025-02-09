const MAX_ITERATIONS = 5

async function callOpenAiTools(ingredients, openai, env) {

	const callSpoonacularApi = async (url) => {
		const response = await fetch(url, {
			method: 'GET',
			headers: {
				"x-api-key": env.SPOONACULAR_API_KEY,
				"Content-Type": "application/json"
			}
		});
		return response.json()
	}

	const fetch_recipe = async (ingredients) => {
		const findUrl = `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${ingredients.ingredients.join(',')}&number=1`;
		const recipes = await callSpoonacularApi(findUrl);
		if (!recipes || recipes.length === 0) {
			return {error: "No recipes found for these ingredients."};
		}
		return recipes[0];
	}

	const fetch_recipe_summary = async (recipeId) => {
		console.log(`Fetching recipe summary for ${JSON.stringify(recipeId)}`);
		const url = `https://api.spoonacular.com/recipes/${recipeId.recipeId}/summary`;
		const substitutionData = await callSpoonacularApi(url);
		// (Optional) Here you could filter or modify the substitutions based on the dietaryRestriction.
		return substitutionData;
	}

	const chatMessages = [
		{
			role: "system",
			content: "You are an AI cooking assistant. Always fetch the recipe summary after retrieving a recipe. Format the final response as: { recipe_name: <recipe name>, description: <recipe summary>, exclusions: <array of any ingredient which is provided in input but is not used in recipe>, recipe_link: <link to recipe> }."
		},
		{
			role: "user",
			content: `I have ${ingredients}. What should I do?`
		}
	]

	const tools = [
		{
			type: "function",
			function: {
				name: "fetch_recipe",
				description: "Fetch a recipe based on available ingredients",
				parameters: {
					type: "object",
					properties: {
						ingredients: {
							type: "array",               // Correctly define it as an array
							items: { type: "string" },   // Define the type of array items
							description: "List of ingredients you have"
						}
					},
					required: ["ingredients"]
				}
			}
		}, {
			type: "function",
			function: {
				name: "fetch_recipe_summary",
				description: "Fetch a recipe summary based on a recipe ID",
				parameters: {
					type: "object",
					properties: {
						recipeId: {
							type: "number",
							description: "ID of the recipe"
						}
					},
					required: ["recipeId"]
				}
			}
		}
	]

	const availableFunctions = {
		fetch_recipe,
		fetch_recipe_summary
	}

	for (let i = 0; i < MAX_ITERATIONS; i++) {
		const completion = await openai.chat.completions.create({
			model: 'gpt-3.5-turbo',
			messages: chatMessages,
			tools
		})

		const { finish_reason: finishReason, message } = completion.choices[0]
		const { tool_calls: toolCalls } = message

		chatMessages.push(message);


		if (finishReason === "stop") {
			return message.content
		} else if (finishReason === "tool_calls") {
			for (const toolCall of toolCalls) {
				const functionName = toolCall.function.name
				const functionToCall = availableFunctions[functionName]
				const functionArgs = JSON.parse(toolCall.function.arguments)
				const functionResponse = await functionToCall(functionArgs)
				chatMessages.push({
					tool_call_id: toolCall.id,
					role: "tool",
					name: functionName,
					content: JSON.stringify(functionResponse)
				})
			}
		}
	}
}

export default callOpenAiTools;
