const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 3000;

// middileware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.uvhdimh.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // await client.connect();
    const db = client.db("redunity_db");

    //  ********************  DB Collections **********************
    const usersCollection = db.collection("users");

    //  ********************  User related apis **********************
    app.post("/users", async (req, res) => {
      const user = req.body;
      user.role = "Donor";
      user.createdAt = new Date();
      const email = user.email;
      const userExists = await usersCollection.findOne({ email });
      if (userExists) {
        return res.send({ message: "User exists" });
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    app.get("/users/:email/role", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      res.send({ role: user?.role || "Donor" });
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Redunity is United");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
