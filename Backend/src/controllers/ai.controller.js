import axios from "axios";
import dotenv from "dotenv";
import fetch from "node-fetch"; // 👈 To fetch images from URLs
dotenv.config();

/**
 * Converts an image URL to Base64
 * @param {string} imageUrl - URL of the image
 * @returns {Promise<string>} - Base64 encoded string of the image
 */
const convertImageToBase64 = async (imageUrl) => {
    try {
      console.log("🖼 Fetching Image for Base64:", imageUrl);
      
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);
  
      const buffer = await response.arrayBuffer();
      return Buffer.from(buffer).toString("base64");
    } catch (error) {
      console.error("❌ Error converting image to Base64:", error.message);
      return null; // Ensure failed images don't break the process
    }
  };
  

  export const generateVideoMetadata = async (req, res) => {
    try {
      const { frameUrls } = req.body;
  
      if (!frameUrls || frameUrls.length === 0) {
        return res.status(400).json({ error: "Frame URLs are required" });
      }
  
      console.log("🔍 Fetching Images & Converting to Base64...");
  
      // Convert each frame URL to Base64
      const base64Frames = await Promise.all(
        frameUrls.map(async (url) => {
          const base64Image = await convertImageToBase64(url);
          return base64Image
            ? { inline_data: { mime_type: "image/jpeg", data: base64Image } }
            : null;
        })
      );
  
      // Remove any failed Base64 conversions
      const validFrames = base64Frames.filter((frame) => frame !== null);
  
      if (validFrames.length === 0) {
        return res.status(400).json({ error: "Failed to process images" });
      }
  
      console.log("✅ Sending Base64 Images to Gemini:", validFrames.length);
  
      // 🔥 STRICT Prompt to Gemini
      const aiResponse = await axios.post(
        "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent",
        {
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: "Based on these images, generate a **single YouTube title and description** that best represents the video content. Format the response as:\n\n" +
                  "**Title:** <Generated Title>\n\n" +
                  "**Description:** <Generated Description with hashtags>\n\n" +
                  "Do not include extra options or explanations, just the formatted title and description."
                },
                ...validFrames, // ✅ Sending Base64 images
              ]
            }
          ]
        },
        {
          headers: { "Content-Type": "application/json" },
          params: { key: process.env.GEMINI_API_KEY },
        }
      );
  
      console.log("✅ AI Response:", aiResponse.data);
      
      // Extract AI-generated title and description
      const metadata = aiResponse.data.candidates[0].content.parts[0].text;
      console.log("📝 Raw AI Response:", metadata);
      const titleMatch = metadata.match(/\*\*Title:\*\*\s*(.+)/);
      const descriptionMatch = metadata.match(/\*\*Description:\*\*\s*([\s\S]+)/);
  
      const aiGeneratedTitle = titleMatch ? titleMatch[1].trim().replace(/\*\*/g, "") : "Untitled Video";
      const aiGeneratedDescription = descriptionMatch ? descriptionMatch[1].trim().replace(/\*\*/g, "") : "No description available.";
  
      res.json({
        title: aiGeneratedTitle,
        description: aiGeneratedDescription, // ✅ Timestamps inside description
      });
  
    } catch (error) {
      console.error("❌ Gemini API Error:", error.response?.data || error.message);
      res.status(500).json({ error: "Failed to generate video metadata" });
    }
  };
  
  
  