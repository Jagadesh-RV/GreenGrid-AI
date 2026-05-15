import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Login() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const handleLogin = async () => {
  try {
    const res = await axios.post(
      "http://localhost:5000/api/auth/login",
      {
        phone,
        password,
      }
    );
    
    localStorage.setItem("token", res.data.token);

    // 🔥 REDIRECT HERE
    navigate("/dashboard");

  } catch (err) {
    console.error(err.response?.data || err.message);
    alert("Login failed");
  }
};

  return (
    <div style={{ padding: "40px" }}>
      <h2>Login</h2>

      <input
        type="text"
        placeholder="Phone"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />

      <br /><br />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <br /><br />

      <button onClick={handleLogin}>Login</button>
    </div>
  );
}

export default Login;