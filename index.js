// requirements -> express, cors
const express = require("express");
const cors = require("cors");
require("dotenv").config();

//create app
const app = express();

//define port address
const port = process.env.PORT || 5000;
// use the middle wires
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bq6unn4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const userCollection = client.db("giveLifeDB").collection("userCollection");
const donationRequestCollection = client.db("giveLifeDB").collection("donationRequestCollection");

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    //User Related API

    app.get('/users', async(req,res)=>{
      const result = await userCollection.find().toArray();
      res.send(result);
    })

    app.get("/users/:email", async (req, res) => {
      const query = { email: req.params.email };
      const result = await userCollection.findOne(query);
      res.send(result);
    });

    app.post("/users", async (req, res) => {
      //TODO: get the user
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "User already exists", insertedId: null });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    app.patch("/users/:email", async (req, res) => {
      const updatedUser = req.body;
      const email = req.params.email;
      const filter = { email: email };
      const updatedDoc = {
        $set: {
          name: updatedUser.updatedName,
          avatarUrl: updatedUser.updatedPhoto,
          district: updatedUser.updatedDistrict,
          upozila: updatedUser.updatedUpozila,
          blood: updatedUser.updatedBlood,
        },
      };
      const result = await userCollection.updateOne(filter, updatedDoc)
      res.send(result);
    });

    //users is now considered as members, for avoiding the problem related ot undefined and missing key in updatedDoc. I will update it letter and will follow the DRY principle. 

    app.patch("/members/:email", async (req, res) => {
      const updatedUser = req.body;
      const email = req.params.email;
      const filter = { email: email };
      const updatedDoc = {
        $set: {
          status : updatedUser.status,
          role : updatedUser.role,
        },
      };
      const result = await userCollection.updateOne(filter, updatedDoc)
      res.send(result);
    });


    //donation request related api

    app.get('/donationRequests', async(req, res) => {
        const result = await donationRequestCollection.find().toArray();
        res.send(result)
    })

    

    app.get('/donationRequests/:email', async(req,res)=>{
        const email = req.params.email;
        const query = {requesterEmail : email};
        const result = await donationRequestCollection.find(query).toArray();
        res.send(result);
    })

    app.get('/requests/:id', async(req,res)=>{
        const id = req.params.id;
        const query = {_id : new ObjectId(id)};
        const result = await donationRequestCollection.findOne(query);
        res.send(result);
    })
    



    app.post('/donationRequests', async(req, res) => {
        const donationRequest = req.body;
        const result = await donationRequestCollection.insertOne(donationRequest);
        res.send(result);

    })

    app.patch('/donationRequests/:id', async(req,res)=>{
        const id = req.params.id;
        const updatedRequest = req.body;
        const filter = {_id : new ObjectId(id)};
        const updatedDoc = {
            $set:{
                donationStatus : updatedRequest.donationStatus,
                recipientName : updatedRequest.recipientName,
                recipientDistrict : updatedRequest.recipientDistrict,
                recipientUpozila : updatedRequest.recipientUpozila,
                hospital : updatedRequest.hospital,
                address : updatedRequest.address,
                donationDateAndTime : updatedRequest.donationDateAndTime,
                requestMessage : updatedRequest.requestMessage,
            }
        }
        const result = await donationRequestCollection.updateOne(filter,updatedDoc);
        res.send(result);
    })

    app.patch('/requests/:id', async(req,res)=>{
        const id = req.params.id;
        const updatedRequest = req.body;
        const filter = {_id : new ObjectId(id)};
        const updatedDoc = {
            $set:{
                donationStatus : updatedRequest.donationStatus,
            }
        }
        const result = await donationRequestCollection.updateOne(filter,updatedDoc);
        res.send(result);
    })

    app.delete('/donationRequests/:id', async(req, res)=> {
        const id = req.params.id;
        const query = {_id : new ObjectId(id)};
        const result = await donationRequestCollection.deleteOne(query);
        res.send(result);
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Give Life is spreading happiness in the world...");
});

app.listen(port, () => {
  console.log(
    `Give Life is spreading happiness in the world... on port : ${port}`
  );
});
