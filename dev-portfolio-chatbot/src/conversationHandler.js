import {PromptTemplate} from "@langchain/core/prompts";
import {StringOutputParser} from "@langchain/core/output_parsers";
import {SupabaseVectorStore} from "@langchain/community/vectorstores/supabase";
import {RunnablePassthrough, RunnableSequence} from "@langchain/core/runnables";

const combineDocuments = (docs) => {
	return docs.map((doc)=> doc.pageContent).join('\n')
}

const formatConvHistory = (messages) => {
	return messages.join('\n')
}

const standaloneQuestionTemplate = `Given some conversation history (if any) and a question, convert the question to a standalone question.
conversation history: {conv_history}
question: {question}
standalone question:`
const standaloneQuestionPrompt = PromptTemplate.fromTemplate(standaloneQuestionTemplate)

const answerTemplate = `You are a helpful and enthusiastic support bot who can answer a given question about Parth Maheshwari based on the context provided and the conversation history (You have to give all the answers as Parth in first person). Try to find the answer in the context. If the answer is not given in the context, find the answer in the conversation history if possible. If you really don't know the answer, say "Sorry, I don't know the answer to that. Maybe the real Parth does. You can email him at parthm1801@gmail.com or ping him on LinkedIn." Don't try to make up an answer. Always speak as if you were chatting to a friend.
context: {context}
conversation history: {conv_history}
question: {question}
answer: `
const answerPrompt = PromptTemplate.fromTemplate(answerTemplate)

const getAnswer = async (supabase, llm, embeddings, question, convHistory) => {
	try {
		const vectorStore = new SupabaseVectorStore(embeddings, {
			client: supabase,
			tableName: 'portfolio',
			queryName: 'match_portfolio'
		})
		const retriever = vectorStore.asRetriever();

		const standaloneQuestionChain = standaloneQuestionPrompt
			.pipe(llm)
			.pipe(new StringOutputParser())

		const retrieverChain = RunnableSequence.from([
			prevResult => prevResult.standalone_question,
			retriever,
			combineDocuments
		])
		const answerChain = answerPrompt
			.pipe(llm)
			.pipe(new StringOutputParser())

		const chain = RunnableSequence.from([
			{
				standalone_question: standaloneQuestionChain,
				original_input: new RunnablePassthrough()
			},
			{
				context: retrieverChain,
				question: ({original_input}) => original_input.question,
				conv_history: ({original_input}) => original_input.conv_history
			},
			answerChain
		])

		const response = await chain.invoke({
			question: question,
			conv_history: formatConvHistory(convHistory)
		})

		return response
	} catch (error) {
		throw new Error(error);
	}
}

export default getAnswer;
