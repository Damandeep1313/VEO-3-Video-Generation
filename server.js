const express = require("express");
const axios = require("axios");
const FormData = require("form-data");
const cloudinary = require("cloudinary").v2;
require("dotenv").config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();
app.use(express.json({ limit: "10mb" }));

app.post("/generate-video", async (req, res) => {
  console.log("➡️  Received /generate-video request");

let replicateToken = req.headers["authorization"] || req.headers["Authorization"];
if (!replicateToken.startsWith("Bearer ")) {
  replicateToken = `Bearer ${replicateToken}`;
}
  const prompt = req.body?.prompt;

  if (!replicateToken || !prompt) {
    console.warn("⛔ Missing Authorization or prompt.");
    return res.status(400).json({ error: "Missing Authorization or prompt" });
  }

  if (!replicateToken.startsWith("Bearer ")) {
    replicateToken = `Bearer ${replicateToken}`;
  }

  console.log("📝 Prompt:", prompt);

  try {
    // Step 1: Start prediction
    console.log("🚀 Sending prompt to Replicate...");
    const startRes = await axios.post(
      "https://api.replicate.com/v1/models/google/veo-3/predictions",
      { input: { prompt } },
      {
        headers: {
          Authorization: replicateToken,
          "Content-Type": "application/json",
          Prefer: "wait",
        },
      }
    );

    const pollUrl = `https://api.replicate.com/v1/predictions/${startRes.data.id}`;
    console.log("🔁 Polling for result at:", pollUrl);

    // Step 2: Poll for output
    let status = "starting";
    let outputUrl = null;

    while (status !== "succeeded" && status !== "failed" && status !== "canceled") {
      const pollRes = await axios.get(pollUrl, {
        headers: { Authorization: replicateToken },
      });

      status = pollRes.data.status;
      console.log("📡 Status:", status);

      if (status === "succeeded") {
        outputUrl = pollRes.data.output;
        console.log("✅ Video ready at:", outputUrl);
        break;
      }

      await new Promise((r) => setTimeout(r, 5000));
    }

    if (!outputUrl) {
      console.error("❌ Video generation failed.");
      return res.status(500).json({ error: "Video generation failed." });
    }

    // Step 3: Download video
    console.log("⬇️  Downloading video...");
    const videoBuffer = await axios
      .get(outputUrl, { responseType: "arraybuffer" })
      .then((r) => r.data);

    // Step 4: Upload to Cloudinary
    console.log("☁️  Uploading to Cloudinary...");
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: "video" },
        (err, result) => (err ? reject(err) : resolve(result))
      );

    const { Readable } = require("stream");
    const bufferStream = new Readable();
    bufferStream.push(videoBuffer);
    bufferStream.push(null); // end of stream
    bufferStream.pipe(uploadStream);

    });

    console.log("✅ Cloudinary upload complete:", uploadResult.secure_url);
    return res.json({ cloudinary_url: uploadResult.secure_url });
  } catch (err) {
    console.error("🔥 Error:", err.message);
    return res.status(500).json({ error: "Internal error", details: err.message });
  }
});

app.listen(3000, () => {
  console.log("✅ Server running on http://localhost:3000");
});
