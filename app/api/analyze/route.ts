import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get("image");

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // Log the URL so we can see what's being called
    const modelUrl = process.env.MODEL_API_URL;
    console.log("Calling model at:", modelUrl);

    if (!modelUrl) {
      return NextResponse.json({ error: "MODEL_API_URL not set" }, { status: 500 });
    }

    const pythonForm = new FormData();
    pythonForm.append("image", image as Blob, "face.jpg");

    const response = await fetch(`${modelUrl}/predict`, {
      method: "POST",
      body: pythonForm,
    });

    console.log("Python server response status:", response.status);

    if (!response.ok) {
      const text = await response.text();
      console.error("Python server error body:", text);
      throw new Error(`Python server error: ${response.status}`);
    }

    const result = await response.json();
    return NextResponse.json(result);

  } catch (err) {
    console.error("Full error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}