const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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
    const bloodsReqCollection = db.collection("bloods");

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
    app.put("/users/:email", async (req, res) => {
      const email = req.params.email;
      const updatedData = req.body;
      delete updatedData._id;
      delete updatedData.email;
      const filter = { email: email };
      const updateDoc = {
        $set: updatedData,
      };
      try {
        const result = await usersCollection.updateOne(filter, updateDoc);
        if (result.modifiedCount > 0) {
          res.send({ success: true, message: "Profile updated successfully" });
        } else {
          res.send({ success: false, message: "No changes made" });
        }
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .send({ success: false, message: "Internal server error" });
      }
    });

    //  ********************  Blood Need Request apis **********************
    app.post("/bloods", async (req, res) => {
      const blood = req.body;
      blood.status = "pending";
      const result = await bloodsReqCollection.insertOne(blood);
      res.send(result);
    });
    app.get("/bloods/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bloodsReqCollection.findOne(query);
      res.send(result);
    });
    app.get("/my-requests/:email", async (req, res) => {
      const email = req.params.email;
      const status = req.query.status;
      const page = parseInt(req.query.page) || 1;
      const size = parseInt(req.query.size) || 5;
      const skip = (page - 1) * size;

      let query = { email: email };
      // যদি ফিল্টার থাকে তবে কুয়েরিতে যোগ করবে
      if (status && status !== "") {
        query.status = status;
      }

      try {
        const result = await bloodsReqCollection
          .find(query)
          .skip(skip)
          .limit(size)
          .toArray();

        const totalCount = await bloodsReqCollection.countDocuments(query);

        res.send({
          data: result,
          totalCount,
        });
      } catch (error) {
        res.status(500).send({ message: "Error fetching data", error });
      }
    });
    app.get("/lastRequest-bloods", async (req, res) => {
      const email = req.query.email;
      const result = await bloodsReqCollection
        .find({ email: email }) // শুধু নিজের রিকোয়েস্ট
        .sort({ _id: -1 }) // সর্বশেষ আগে
        .limit(3) // শেষ ৩টা
        .toArray();

      res.send(result);
    });
    app.get("/pending-blood-requests", async (req, res) => {
      try {
        const result = await bloodsReqCollection
          .find({ status: "pending" })
          .toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "ডেটা আনতে সমস্যা হয়েছে" });
      }
    });
    app.patch("/bloods/:id", async (req, res) => {
      const id = req.params.id;
      const { donorName, donorEmail, status } = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          donorName,
          donorEmail,
          status,
        },
      };
      const result = await bloodsReqCollection.updateOne(filter, updateDoc);
      res.send(result);
    });
    app.put("/lastRequest-bloods/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const updatedBlood = req.body;
        const filter = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: updatedBlood,
        };
        const result = await bloodsReqCollection.updateOne(filter, updateDoc);
        res.send({ success: true, result });
      } catch (error) {
        console.error("Error updating food:", error);
        res
          .status(500)
          .send({ success: false, message: "Failed to update food" });
      }
    });
    app.delete("/lastRequest-bloods/:id", async (req, res) => {
      const id = req.params.id;
      const email = req.query.email;
      const result = await bloodsReqCollection.deleteOne({
        _id: new ObjectId(id),
        email: email,
      });
      res.send(result);
    });

    // await client.db("admin").command({ ping: 1 });
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
