let express = require("express");
let path = require("path");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();
const { DATABASE_URL } = process.env;

let app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function getPostgresVersion() {
  const client = await pool.connect();
  try {
    const res = await client.query("SELECT version()");
    console.log(res.rows[0]);
  } finally {
    client.release();
  }
}

getPostgresVersion();

app.post("/posts", async (req, res) => {
  const client = await pool.connect();
  try {
    const data = {
      title: req.body.title,
      content: req.body.content,
      author: req.body.author,
      created_at: new Date().toISOString(),
    };

    const query =
      "INSERT INTO posts (title, content, author, created_at) VALUES ($1, $2, $3, $4) RETURNING id";
    const params = [data.title, data.content, data.author, data.created_at];

    const result = await client.query(query, params);
    data.id = result.rows[0].id; // assign the last inserted id to data object

    console.log(`Post created successfully with id ${data.id}`);
    res.json({
      status: "success",
      data: data,
      message: "Post created successfully",
    });
  } catch (error) {
    console.error("Error: ", error.message);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

app.get("/posts", async (req, res) => {
  const client = await pool.connect();
  try {
    const query = "SELECT * FROM posts";
    const result = await client.query(query);
    res.json(result.rows);
  } catch (err) {
    console.log(err.stack);
    res.status(500).send("An error occurred");
  } finally {
    client.release();
  }
});

app.get("/posts/:id", async (req, res) => {
  const id = req.params.id;
  const client = await pool.connect();
  try {
    const query = "SELECT * FROM posts WHERE id = $1";
    const result = await client.query(query, [id]);
    res.json(result.rows);
  } catch (err) {
    console.log(err.stack);
    res.status(500).send("An error occurred");
  } finally {
    client.release();
  }
});

app.get("/posts/author/:author", async (req, res) => {
  const author = req.params.author;
  const client = await pool.connect();
  try {
    const query = "SELECT * FROM posts WHERE author = $1";
    const result = await client.query(query, [author]);
    res.json(result.rows);
  } catch (err) {
    console.log(err.stack);
    res.status(500).send("An error occurred");
  } finally {
    client.release();
  }
});

app.get("/posts/:startDate/:endDate", async (req, res) => {
  const startDate = req.params.startDate;
  const endDate = req.params.endDate;
  const client = await pool.connect();
  try {
    const query = "SELECT * FROM posts WHERE created_at BETWEEN $1 AND $2";
    const params = [startDate, endDate];
    const result = await client.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.log(err.stack);
    res.status(500).send("An error occurred");
  } finally {
    client.release();
  }
});

app.put("/posts/:id", async (req, res) => {
  const id = req.params.id;
  const updatedData = req.body;
  const client = await pool.connect();
  try {
    const updateQuery =
      "UPDATE posts SET title = $1, content = $2, author = $3 WHERE id = $4";
    const queryData = [
      updatedData.title,
      updatedData.content,
      updatedData.author,
      id,
    ];
    await client.query(updateQuery, queryData);

    res.json({ status: "success", message: "Post updated successfully" });
  } catch (error) {
    console.error("Error: ", error.message);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

app.delete("/posts/:id", async (req, res) => {
  const id = req.params.id;
  const client = await pool.connect();
  try {
    const query = "DELETE FROM posts WHERE id = $1";
    const params = [id];
    const result = await client.query(query, params);
    res.json({ status: "success", message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error: ", error.message);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

app.delete("/posts/author/:author", async (req, res) => {
  const author = req.params.author;
  const client = await pool.connect();
  try {
    const query = "DELETE FROM posts WHERE author = $1";
    const result = await client.query(query, [author]);
    res.json({ status: "success", message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error: ", error.message);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname + "/index.html"));
});

app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname + "/404.html"));
});

app.listen(3000, () => {
  console.log("App is listening on port 3000");
});
