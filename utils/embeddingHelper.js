const { embeddings, generateResponse } = require("../services/gemini.service")


const embeddingsData  = async (chunks)=>{

    const result = []

    for(let chunk of chunks) {
        const emnbedding = await embeddings(chunk)
        result.push(emnbedding[0])
    }

    return result

}





module.exports = {
    embeddingsData
}