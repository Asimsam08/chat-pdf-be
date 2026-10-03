const { storeChunks } = require("../services/qdrant.documents");
const { embeddingsData } = require("../utils/embeddingHelper");
const pdf = require("pdf-parse");
const crypto = require('crypto');


const uploadController = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded",
      });
    }

    const userId = req.userId;
    const documentId  = crypto.randomUUID();
    // Extract text from the uploaded PDF file
    const pdfData = await pdf(req.file.buffer);

    // create Chunks from the extracted text
     const filteredChunks = pdfData.text
            .split("\n\n")
            .map(chunk => chunk.trim())
            .filter(Boolean);

        if (!filteredChunks.length) {
            return res.status(400).json({
                message: "No text could be extracted from PDF"
            });
        }
       //  Generate embeddings for all document chunks
    const documentEmbeddings = await embeddingsData(filteredChunks);

    console.log("documentEmbeddings length", documentEmbeddings.length)


        // 4. Store chunks + embeddings in Qdrant
        // await storeChunks(
        //     filteredChunks,
        //     documentEmbeddings,
        //     req.file.originalname
        // );

        await storeChunks({
    userId,
    documentId,
    fileName: req.file.originalname,
    chunks: filteredChunks,
    embeddings: documentEmbeddings
});



    return res.status(200).json({
      message: "PDF processed successfully",
         document: {
                documentId,
                fileName: req.file.originalname
            }
    });
  }catch (error) {
    console.error("Error processing PDF:", error);
    return res.status(500).json({
      message: "Error processing PDF",
      error: error.message,
    });
  }
};

module.exports = {
  uploadController,
};
