import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get("image");

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // Forward image to Python server
    const pythonForm = new FormData();
    pythonForm.append("image", image as Blob, "face.jpg");

    const response = await fetch(`${process.env.MODEL_API_URL}/predict`, {
      method: "POST",
      body: pythonForm,
    });

    if (!response.ok) {
      throw new Error("Model server error");
    }

    const result = await response.json();
    return NextResponse.json(result);

  } catch (err) {
    console.error("Analysis error:", err);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
