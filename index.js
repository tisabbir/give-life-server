// requirements -> express, cors
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

//create app
const app = express();

//define port address
const port = process.env.PORT || 5000;
// use the middle wires
app.use(cors({
  origin: [
    "http://localhost:5173",
    "give-life-bd037.web.app",
    "give-life-bd037.firebaseapp.com",
  ],
}));
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
const blogCollection = client.db("giveLifeDB").collection("blogCollection");
const donationRequestCollection = client.db("giveLifeDB").collection("donationRequestCollection");


//middlewares
//middle ware
const verifyToken = (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).send({ message: "Forbidden Access" });
  }
  const token = req.headers.authorization.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Forbidden Access" });
    }
    req.decoded = decoded;
    next();
  });
};

//verifyAdmin
const verifyAdmin = async (req, res, next) => {
  const email = req.decoded.email;
  const query = { email: email };
  const user = await userCollection.findOne(query);
  const isAdmin = user?.role === "admin";
  if (!isAdmin) {
    return res.status(403).send({ message: "forbidden access" });
  }
  next();
};


async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    //JWT related api's
    app.post('/jwt', async(req,res)=>{
      const user = req.body;
      const token = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET, {expiresIn : '1h'})
      res.send({token});
    })

    //User Related API

    app.get('/users',verifyToken, verifyAdmin, async(req,res)=>{
      const result = await userCollection.find().toArray();
      res.send(result);
    })

    app.get("/users/:email",verifyToken, async (req, res) => {
      const query = { email: req.params.email };
      const result = await userCollection.findOne(query);
      res.send(result);
    });

    //check if the user is admin or not
    app.get("/users/admin/:email", verifyToken, async (req, res) => {
      const email = req.params.email;

      if (email !== req.decoded.email) {
        return res.status(403).send({ message: "unauthorized access" });
      }

      //if the user owns the token then get the user data from database
      const query = { email: email };
      const user = await userCollection.findOne(query);
      //now check if the user is admin or not
      let admin = false;
      if (user) {
        admin = user?.role === "admin";
      }
      //send the state of being admin true or false
      res.send({ admin });
    });


    //check if the user is volunteer or not
    app.get("/users/volunteer/:email", verifyToken, async (req, res) => {
      const email = req.params.email;

      if (email !== req.decoded.email) {
        return res.status(403).send({ message: "unauthorized access" });
      }

      //if the user owns the token then get the user data from database
      const query = { email: email };
      const user = await userCollection.findOne(query);
      //now check if the user is admin or not
      let volunteer = false;
      if (user) {
        volunteer = user?.role === "volunteer";
      }
      //send the state of being admin true or false
      res.send({ volunteer });
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

    app.patch("/users/:email",verifyToken, async (req, res) => {
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

    app.patch("/members/:email",verifyToken, async (req, res) => {
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


    app.get('/pendingDonationRequests', async(req, res) => {
        const query = {donationStatus : 'pending'}
        const result = await donationRequestCollection.find(query).toArray();
        res.send(result)
    })

    

    app.get('/donationRequests/:email',verifyToken, async(req,res)=>{
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
    



    app.post('/donationRequests',verifyToken, async(req, res) => {
        const donationRequest = req.body;
        const result = await donationRequestCollection.insertOne(donationRequest);
        res.send(result);

    })

    app.patch('/donationRequests/:id',verifyToken, async(req,res)=>{
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

    app.patch('/requests/:id',verifyToken, async(req,res)=>{
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

    app.delete('/donationRequests/:id',verifyToken, async(req, res)=> {
        const id = req.params.id;
        const query = {_id : new ObjectId(id)};
        const result = await donationRequestCollection.deleteOne(query);
        res.send(result);
    })

    //blog Related API
    app.get('/blogs', async(req, res)=>{
      const result = await blogCollection.find().toArray();
      res.send(result);
    })

    app.get('/blogs/:id', async(req,res)=>{
      const id = req.params.id;
      const query = {_id : new ObjectId(id)};
      const result = await blogCollection.findOne(query);
      res.send(result);
  })

    app.get('/publishedBlogs', async(req, res) => {
      const query = {status : 'published'}
      const result = await blogCollection.find(query).toArray();
      res.send(result)
  })
    

    app.post('/blogs',verifyToken, async(req,res)=>{
      const blog = req.body;
      const result = await blogCollection.insertOne(blog);
      res.send(result);
    })

    app.patch('/blogs/:id',verifyToken, async(req,res)=>{
      const id = req.params.id;
      const updatedBlog = req.body;
      const filter = {_id : new ObjectId(id)};
      const updatedDoc = {
          $set:{
              status : updatedBlog.status,
          }
      }
      const result = await blogCollection.updateOne(filter,updatedDoc);
      res.send(result);
  })

  app.delete('/blogs/:id',verifyToken, async(req, res)=> {
    const id = req.params.id;
    const query = {_id : new ObjectId(id)};
    const result = await blogCollection.deleteOne(query);
    res.send(result);
})


    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
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
