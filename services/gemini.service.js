const {GoogleGenAI} = require("@google/genai");

const MODEL = "gemini-3.6-flash";

const client = new GoogleGenAI({
    apiKey : process.env.GEMINI_API_KEY
})

const embeddings = async (chunks)=>{

    const response = await client.models.embedContent({
          model: 'gemini-embedding-2',
        contents: chunks,
    });

    return response.embeddings

}

const generateResponse = async (prompt, context)=>{
    const response = await client.models.generateContent({
        model : MODEL,
//         contents: `
// You are a helpful assistant answering questions using the provided context.

// Answer the user's question directly and concisely.

// Rules:
// - Use only information available in the context.
// - Do not mention the context, documents, chunks, retrieval, embeddings, or RAG.
// - Do not say "based on the provided document".
// - If the answer cannot be found in the context, say: "I couldn't find that information."
// - Do not invent or assume facts.

// Context:
// ${context}

// User question:
// ${prompt}

// Answer:
//         `,

  contents: `
Answer the user's question using only the information provided below.

Rules:
- Give the answer directly.
- Do not mention the context, document, chunks, embeddings, or RAG.
- Do not say "based on the provided context" or similar phrases.
- If the answer cannot be found in the information below, respond exactly:
"I couldn't find that information."

Information:
${context}

User question:
${prompt}
  `,
});

    return response.text
}

module.exports = {
    embeddings,
    generateResponse
}