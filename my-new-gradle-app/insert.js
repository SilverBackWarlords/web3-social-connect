const { MongoClient, ServerApiVersion } = require('mongodb');

// Store your connection string in an environment variable for security
// For development, you can put it directly or in a .env file
const uri = "mongodb+srv://rcsonebiz:tDd8qrrFukFQb0r1@cluster0.xho7l.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// Example: connecting to a specific database and inserting a document
async function run() {
  try {
    // Connect the client to the server
    await client.connect();
    // Get the database instance. **Remember to change "your_store_db" to your desired database name!**
    const database = client.db("your_store_db");
    const products = database.collection("products");

    // Insert a product document
    const result = await products.insertOne({ name: "Gaming Mouse", price: 49.99, stock: 100 });
    console.log(`A document was inserted with the _id: ${result.insertedId}`);

    // Find all products
    const allProducts = await products.find({}).toArray();
    console.log("All products:", allProducts);

    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);
