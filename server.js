const express = require("express")
require("dotenv").config()
const upload = require("./middlewares/upload.middleware")
const { embeddingsData } = require("./utils/embeddingHelper")
const {embeddings, generateResponse} = require("./services/gemini.service")
const { createCollection } = require("./services/qdrant.collection");
const uploadRouter = require("./routes/upload.routes.js")
const chatRouter = require("./routes/chat.routes.js")
const {documents, queries} = require("./data.js")
const pdf =   require("pdf-parse")
const PORT = process.env.PORT || 8000

const app = express()
app.use(express.json())

// function cosineSimilarity(a, b) {

//     let dotProduct = 0
//     let magnitudeA = 0
//     let magnitudeB = 0

//     for (let i = 0; i < a.length; i++) {

//         dotProduct += a[i] * b[i]

//         magnitudeA += a[i] * a[i]
//         magnitudeB += b[i] * b[i]
//     }

//     return dotProduct /
//         (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB))
// }

// app.get("/",async(req,res)=>{


//      let embeddingData = []
//    for(chunk of documents) {
//     const embedding = await embeddings(chunk)
//     embeddingData.push(embedding[0])
//    }

//   const queryEmbedding = await embeddings(" How many doctors are working at the hospital with 620 daily appointments?")

//  const similaritiesData =  embeddingData.map((docEmbeddding,index)=>{
//     similarity = cosineSimilarity(docEmbeddding.values, queryEmbedding[0].values)
//     return { document: documents[index], similarity }
//   })
    
//   const sortedEmbedding = similaritiesData.sort((a,b)=> b.similarity - a.similarity)



//  res.status(200).json({
//     message: "success",
//     data: similaritiesData,
//     similarEmbedding : sortedEmbedding[0].document

//  })
// })

// app.post("/upload",  upload.single("file"), async(req,res)=>{
//     try{

//        const pdfData = await pdf(req.file.buffer)

//         let chunks = []

//         chunks = pdfData.text.split("\n\n")

//         console.log("chunks length", chunks.length)

//          console.log("chunks length", chunks)

//          let filteredChunks = chunks.filter((chunk) => chunk.trim() !== "")

//          console.log("filtered chunks length", filteredChunks.length)

//          const emnbeddingData = await embeddingsData(filteredChunks)

//         const query = req.body.query

//         const queryEmbedding = await embeddings(query)
       
//         const similaritiesData =  emnbeddingData.map((docEmbeddding,index)=>{
//             similarity = cosineSimilarity(docEmbeddding.values, queryEmbedding[0].values)
//             return { document: filteredChunks[index], similarity }
//           })
    
        
//           const sortedEmbedding = similaritiesData.sort((a,b)=> b.similarity - a.similarity) 
          
//           console.log("sorted embedding", sortedEmbedding[0].document)
          
//           const generatedResponse = await generateResponse(query, sortedEmbedding[0].document)  
//           console.log("generated response", generatedResponse)

 

//        res.status(200).json({
//         message: "File uploaded successfully",
//         response: generatedResponse,
//        })

    

//     }catch(error) {
//           res.status(500).json({
//         message: `Upload failed: ${error.message}`,
//       });
//     }
// })
    
async function startServer() {
    try {
        await createCollection();

        app.use("/api/internal", uploadRouter);
        app.use("/api/internal", chatRouter);

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });

    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
}

startServer();