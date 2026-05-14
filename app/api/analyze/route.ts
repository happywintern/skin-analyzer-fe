import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/analyze
 *
 * Replace this mock with your real CNN model endpoint.
 *
 * Expected input: multipart/form-data with an "image" field (JPEG/PNG)
 * Expected output: JSON matching the SkinResult shape below
 */

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get("image");

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // ── TODO: Replace with your real model call ──────────────────────────
    // Example with an external model API:
    //
    // const modelFormData = new FormData();
    // modelFormData.append("image", image);
    // const response = await fetch("https://your-model-endpoint.com/predict", {
    //   method: "POST",
    //   body: modelFormData,
    //   headers: { Authorization: `Bearer ${process.env.MODEL_API_KEY}` },
    // });
    // const prediction = await response.json();
    // return NextResponse.json(prediction);
    // ────────────────────────────────────────────────────────────────────

    // MOCK RESPONSE
    return NextResponse.json({
      condition: "Acne Vulgaris",
      confidence: 87,
      description:
        "Characterized by comedones, papules, and mild inflammation. Common in oily and combination skin types.",
      ingredients: [
        {
          name: "Niacinamide",
          benefit: "Reduces sebum production and minimizes pore appearance",
          concentration: "5–10%",
        },
        {
          name: "Salicylic Acid",
          benefit: "Exfoliates inside pores and clears blackheads",
          concentration: "0.5–2%",
        },
        {
          name: "Zinc PCA",
          benefit: "Antibacterial, balances oil and soothes redness",
          concentration: "0.5–1%",
        },
        {
          name: "Centella Asiatica",
          benefit: "Calms inflammation and supports skin barrier repair",
          concentration: "Use as listed",
        },
      ],
    });
  } catch (err) {
    console.error("Analysis error:", err);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
