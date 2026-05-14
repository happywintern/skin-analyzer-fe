# Lumina — AI Skin Analyzer

A clean, minimal Next.js web app for AI-powered skin condition detection using a CNN model.

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page — promotes the app |
| `/tutorial` | Step-by-step guide for best results |
| `/analyze` | Camera capture page |
| `/results` | Displays condition, confidence score & ingredient recommendations |

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Connecting Your CNN Model

The app is ready to plug in your real model. Two places to update:

### 1. API Route (`app/api/analyze/route.ts`)
Replace the mock response with a call to your real model endpoint:

```ts
// Uncomment and update:
const response = await fetch("https://your-model-endpoint.com/predict", {
  method: "POST",
  body: formData,
  headers: { Authorization: `Bearer ${process.env.MODEL_API_KEY}` },
});
const prediction = await response.json();
return NextResponse.json(prediction);
```

### 2. Camera Page (`app/analyze/page.tsx`)
Uncomment the real API call block inside `analyzePhoto()`:

```ts
const blob = await (await fetch(capturedImage)).blob();
const formData = new FormData();
formData.append("image", blob, "face.jpg");
const response = await fetch("/api/analyze", { method: "POST", body: formData });
const result = await response.json();
```

### Expected Model Response Shape

```json
{
  "condition": "Acne Vulgaris",
  "confidence": 87,
  "description": "...",
  "ingredients": [
    {
      "name": "Niacinamide",
      "benefit": "...",
      "concentration": "5–10%"
    }
  ]
}
```

## Environment Variables

Create a `.env.local` file:

```
MODEL_API_KEY=your_api_key_here
MODEL_ENDPOINT=https://your-model-endpoint.com/predict
```

## Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Or connect your GitHub repo at vercel.com for auto-deploys
```

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Google Fonts** — Cormorant Garamond + DM Sans
