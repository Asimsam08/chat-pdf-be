const qdrant = require("./qdrant.service");

const COLLECTION_NAME = "rag_documents";
const VECTOR_SIZE = 3072;

async function createCollection() {
    const collections = await qdrant.getCollections();

    const exists = collections.collections.some(
        (collection) => collection.name === COLLECTION_NAME
    );

    if (!exists) {
        await qdrant.createCollection(COLLECTION_NAME, {
            vectors: {
                size: VECTOR_SIZE,
                distance: "Cosine",
            },
        });

        console.log(`Qdrant collection "${COLLECTION_NAME}" created`);
    }
}

module.exports = {
    COLLECTION_NAME,
    createCollection,
};