const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.o2tazeo.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const foodsCollection = client.db("donationDB").collection("foods");
    const requestCollection = client.db("donationDB").collection("request");

    // user donation booking collection

    app.get("/api/v1/user/request/:donator_email", async (req, res) => {
      const donator_email = req.params.donator_email;
      const query = { donator_email: donator_email };
      const result = await requestCollection.findOne(query);
      res.send(result);
    });
    // user data get
    app.get("/api/v1/user/request", async (req, res) => {
      console.log(req.query.email);
      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email };
      }
      const result = await requestCollection.find().toArray();
      res.send(result);
    });

    //post user data

    app.post("/api/v1/user/request", async (req, res) => {
      const request = req.body;
      //console.log(request);
      const result = await requestCollection.insertOne(request);
      res.send();
    });

    // update table Food

    app.put("/api/v1/foods/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const foodUpdate = req.body;


    //   const requestFood = {
    //     food_image, food_name,
    //     donator_image, donator_name,
    //     food_quantity, pickup_location,
    //     expired_date, additional_notes,
    //     donator_email, donation_money, request: _id
    // }

      const food = {
        $set: {
          food_name: foodUpdate.food_name,
          food_image: foodUpdate.food_image,
          donator_name: foodUpdate.donator_name,
          food_quantity: foodUpdate.food_quantity,
          pickup_location: foodUpdate.pickup_location,
          expired_date: foodUpdate.expired_date,
          additional_notes: foodUpdate.additional_notes,
          donator_email: foodUpdate.donator_email,
          donation_money: foodUpdate.donation_money,
          
        },
      };

      const result = await foodsCollection.updateOne(
        filter,
        food,
        options
      );
      //console.log(result);
      res.send(result);
    });

    // delete food

    app.delete("/api/v1/foods/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodsCollection.deleteOne(query);
      console.log(result);
      res.send(result);
    });

    // post data in client side
    app.post("/api/v1/foods", async (req, res) => {
      const foods = req.body;
      const result = await foodsCollection.insertOne(foods);
      res.send(result);
    });

    // for details btn

    app.get("/api/v1/foods/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodsCollection.findOne(query);
      res.send(result);
    });

    app.get("/api/v1/foods:food_quantity", async (req, res) => {
      const food_quantity = req.params.food_quantity;
      const query = { food_quantity: food_quantity };
      const result = await foodsCollection.findOne(query);
      res.send(result);
    });

    app.get("/api/v1/foods", async (req, res) => {
      const cursor = foodsCollection.find();
      const result = await cursor.toArray();
      //console.log(result);
      res.send(result);
    });
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
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Community food listening on port ${port}`);
});
