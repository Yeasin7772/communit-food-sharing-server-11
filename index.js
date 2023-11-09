const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://communit-food-sharing.web.app",
      "https://communit-food-sharing.firebaseapp.com",
    ],
    credentials: true,
  })
);

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
    // await client.connect();

    const foodsCollection = client.db("donationDB").collection("foods");
    const requestCollection = client.db("donationDB").collection("request");

    // token verify
    const gateman = (req, res, next) => {
      const { token } = req.cookies;
      // console.log(token);
      if (!token) {
        return res.status(401).send({ message: "You are not authorize" });
      }

      jwt.verify(token, process.env.DB_USER_ACCESS, function (err, decoded) {
        if (err) {
          return res.status(401).send({ message: "You are not authorize" });
        }

        req.user = decoded;
        next();
      });
    };

    // user donation request collection

    // patch use approve data

    app.patch("/api/v1/user/request/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const approveRequest = req.body;
      //console.log(approveRequest);

      updateDoc = {
        $set: {
          status: approveRequest.status,
        },
      };

      const result = await requestCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // request cancel

    app.delete("/api/v1/user/request/:id", async (req, res) => {
      const id = req.params.id;
      //console.log(id);
      const query = { _id: new ObjectId(id) };
      const result = await requestCollection.deleteOne(query);

      res.send(result);
    });

    //get the email specie
    app.get("/api/v1/user/request/:donator_email", async (req, res) => {
      const donator_email = req.params.donator_email;
      const query = { donator_email: donator_email };
      const result = await requestCollection.findOne(query);
      res.send(result);
    });
    // user data get
    app.get("/api/v1/user/request", async (req, res) => {
      const queryEmail = req.query.email;
      const tokenEmail = req.query.email;
      // match user token email

      if (queryEmail !== tokenEmail) {
        return res.status(403).send({ message: "forbidden access" });
      }
      //console.log(req.query.email);
      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email };
      }
      const result = await requestCollection.find().toArray();
      res.send(result);
    });

    app.post("/api/v1/auth/access-token", (req, res) => {
      // create in token
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.DB_USER_ACCESS, {
        expiresIn: 60 * 60,
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: true,
          sameSite: "none",
        })
        .send({ success: true });
    });

    //post user data

    /// manage singe food

    app.get("/api/v1/user/request/ownerReq", async (req, res) => {
      const ownerEmail = req.query.ownerEmail;
      console.log(req.query);

      const cursor = requestCollection.find({ ownerEmail: ownerEmail });
      // console.log(cursor);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.put("/api/v1/user/request/:id", async (req, res) => {
      const id = req.params.id;
      // console.log(id);
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const { status } = req.body;

      const updateConditions = {
        $set: {
          status,
        },
      };
      console.log(updateConditions);

      const result = await requestCollection.updateOne(
        filter,
        updateConditions,
        options
      );
      console.log(result);
      res.send(result);
    });

    app.get("/api/v1/user/request", async (req, res) => {
      const email = req.query.email;
      console.log(req.query);

      const cursor = applyCollection.find({ email: email });
      // console.log(cursor)
      const result = await cursor.toArray();
      res.send(result);
    });

    app.post("/api/v1/user/request", async (req, res) => {
      const request = req.body;
      try {
        const result = await requestCollection.insertOne(request);
        //console.log(result);
        res.status(201).json({ insertedId: result.insertedId });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: " Server Error" });
      }
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

      const result = await foodsCollection.updateOne(filter, food, options);
      //console.log(result);
      res.send(result);
    });

    // delete food

    app.delete("/api/v1/foods/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodsCollection.deleteOne(query);
      // console.log(result);
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

    // food query sorting
    // http://localhost:5000/api/v1/foods?food_name=Pizza%20Margherita

    app.get("/api/v1/foods", async (req, res) => {
      let queryObj = {};
      let sortObj = {};
      const food_name = req.query.food_name;
      const sortField = req.query.sortField;
      const sortOrder = req.query.sortOrder;

      if (food_name) {
        queryObj.food_name = food_name;
      }
      if (sortField && sortOrder) {
        if (sortOrder === "asc") {
          sortObj[sortField] = 1;
        } else if (sortOrder === "dsc") {
          sortObj[sortField] = -1;
        }
      }

      const cursor = foodsCollection.find(queryObj).sort(sortObj);
      const result = await cursor.toArray();
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
