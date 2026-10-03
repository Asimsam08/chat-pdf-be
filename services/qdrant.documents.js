const qdrant = require("./qdrant.service");
const { randomUUID } = require("crypto");
const { COLLECTION_NAME } = require("./qdrant.collection");

async function storeChunks({userId, documentId, fileName, chunks, embeddings}) {
    const points = chunks.map((chunk, index) => ({
           id: randomUUID(),

        vector: embeddings[index].values,

        payload: {
            text: chunk,
            documentId,
            chunkIndex: index,
            userId,
            fileName,
        },
    }));

    await qdrant.upsert(COLLECTION_NAME, {
        wait: true,
        points,
    });
}

async function searchChunks(queryEmbedding, userId, documentId,  limit = 3) {
    const result = await qdrant.query(COLLECTION_NAME, {
        query: queryEmbedding[0].values,
        limit,
         filter: {
        must: [
            {
                key: "userId",
                match: {
                    value: userId
                }
            },
            {
                key: "documentId",
                match: {
                    value: documentId
                }
            }
        ]
    },
        with_payload: true,
    });

    return result;
}
module.exports = {
    storeChunks,
    searchChunks,
};