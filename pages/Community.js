import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import "../styles/layout.css";
import "../styles/community.css";
import axios from "axios";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

export default function Community() {

  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [type, setType] = useState("general");

  // ✅ Fetch initial posts
  useEffect(() => {
  axios.get("http://localhost:5000/api/fields")
    .then(res => {
      console.log("API DATA:", res.data); // 👈 ADD THIS
      setFields(res.data);
    })
    .catch(err => console.error(err));
}, []);

  // ✅ Real-time updates
  useEffect(() => {
    socket.on("postUpdate", (post) => {
      setPosts(prev => [post, ...prev]);
    });

    return () => socket.off("postUpdate");
  }, []);

  // ✅ Add post
  const addPost = () => {
    if (!newPost.trim()) return;

    const post = {
      user: "You",
      content: newPost,
      type,
      likes: 0,
      time: new Date().toLocaleTimeString()
    };

    socket.emit("newPost", post); // send to backend
    setPosts([post, ...posts]);   // update UI

    setNewPost("");
  };

  // ✅ Like post (UI only)
  const likePost = (index) => {
    const updated = [...posts];
    updated[index].likes = (updated[index].likes || 0) + 1;
    setPosts(updated);
  };

  return (
    <div className="layout">
      <Sidebar />

      <div className="main">
        <Navbar />

        <h2>🌐 Farmer Community</h2>

        {/* CREATE POST */}
        <div className="post-box">
          <textarea
            placeholder="Share your update, sell crops, or ask..."
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
          />

          <div className="post-controls">
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="general">General</option>
              <option value="sell">Sell</option>
              <option value="buy">Buy</option>
            </select>

            <button onClick={addPost}>Post</button>
          </div>
        </div>

        {/* FEED */}
        <div className="feed">
          {posts.map((p, i) => (
            <div key={i} className={`post ${p.type}`}>

              <div className="post-header">
                <h4>{p.user}</h4>
                <span>{p.time}</span>
              </div>

              <p>{p.content}</p>

              <div className="actions">
                <button onClick={() => likePost(i)}>
                  👍 {p.likes || 0}
                </button>
                <button>💬 Comment</button>
                <button>📩 Contact</button>
              </div>

            </div>
          ))}
        </div>

      </div>
    </div>
  );
}