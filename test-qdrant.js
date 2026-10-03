const qdrant = require("./services/qdrant.service");

async function test() {
    try {
        const collections = await qdrant.getCollections();

        console.log("Connected to Qdrant!");
        console.log(collections);
    } catch (error) {
        console.error("Qdrant connection failed:");
        console.error(error);
    }
}

test();