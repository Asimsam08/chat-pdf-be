const { embeddings, generateResponse } = require("../services/gemini.service");
const { searchChunks } = require("../services/qdrant.documents");

const chatController = async (req, res) => {

  console.log("body params", req.body?.documentId, req.body?.query)
  try {
    if (!req.body.documentId || !req.body.query) {
      return res.status(400).json({
        message: "Query and documentId is required",
      });
    }

    const { query, documentId } = req.body;
      const userId = req?.userId;
    const queryEmbedding = await embeddings(query);
    const similarChunks = await searchChunks(queryEmbedding, userId, documentId, 5);
    console.log("similarChunks", similarChunks);

    // const sorrtedResponse = similarChunks?.points?.sort((a, b) => b.score - a.score);

    const relevantChunks = similarChunks.points
    .slice(0, 3);

    console.log("relevantChunks", relevantChunks);


    const context = relevantChunks
    .map(result => result.payload.text)
    .join("\n\n");

    const llmResponse = await generateResponse(query, context);

    return res.status(200).json({
      message: "Query processed successfully",
      data: llmResponse,
    });
  } catch (error) {
    console.error("Error in chatController:", error);
    return res.status(500).json({
      message: "Error processing query",
      error: error.message,
    });
  }
};

module.exports = {
  chatController,
};
