import fetch from 'node-fetch';
import sharp from 'sharp';

export default async function generateImage(prompt) {
    const response = await fetch("https://api.together.xyz/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.TOGETHER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "black-forest-labs/FLUX.1-schnell-Free",
        prompt,
        width: 512,
        height: 768,
        steps: 2
      })
    });
  
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}\n${errorText}`);
    }
  
    const json = await response.json();
    const imageUrl = json.data?.[0]?.url;
    if (!imageUrl) throw new Error("❌ Image URL not found in API response");
  
    const imageRes = await fetch(imageUrl);
    const originalBuffer = Buffer.from(await imageRes.arrayBuffer());
  
    const blurredBuffer = await sharp(originalBuffer).blur(1).toBuffer();
    return blurredBuffer;
  }
