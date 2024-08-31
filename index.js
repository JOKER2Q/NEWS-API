//LIBRARY
require("dotenv").config();
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const connection = require("./db");
const bodyParser = require("body-parser");
const NewsCard = require("./modules/news");
const newsRouter = require("./routes/newsRouter");
const topNewsRouter = require("./routes/topNewsRouter");
const morgan = require("morgan");
const path = require("path");
app.use(express.static(path.join(__dirname, "public")));

app.use(morgan("tiny"));
//end Libraries
//MIDDLEWARES
app.use(bodyParser.json()); // Parse JSON bodies
//end MIDDLEWARE
connection(); //DB connection
//MOUNTING
app.use("/api/top-news", topNewsRouter);
app.use("/api/news", newsRouter);
//end of MOUNTING process
//SERVER START
app.listen(port, () => {
  console.log(`listening... on ${port}`);
});
