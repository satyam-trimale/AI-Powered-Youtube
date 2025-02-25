import jwt from "jsonwebtoken";

// Replace "your-secret-key" with your actual ACCESS_TOKEN_SECRET from .env
const token = jwt.sign({ _id: "testUserId123" }, "process.env.ACCESS_TOKEN_SECRET", { expiresIn: "1h" });

console.log("Generated Test Token:", token);
