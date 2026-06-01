const router = require("express").Router();
const Post = require("../models/Post");

// GET posts
router.get("/", async (req, res) => {
  const posts = await Post.find().sort({ createdAt: -1 });
  res.json(posts);
});

// CREATE post
router.post("/", async (req, res) => {
  const { user, content, type } = req.body;
  const post = new Post({ user, content, type });
  await post.save();
  res.json(post);
});

module.exports = router;