const { QdrantClient } = require("@qdrant/js-client-rest");

const qdrant = new QdrantClient({
    host: "localhost",
    port: 6333
});

module.exports = qdrant;