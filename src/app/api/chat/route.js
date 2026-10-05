import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const mavidhaiProducts = `
MaVidhai currently has the following products:

1. Pink Floral Cotton Saree
Price: ₹1,499
Category: Cotton Sarees
Size: Free Size
Description:
A vibrant pink cotton saree featuring beautiful floral prints,
delicate tassel detailing, and a subtle golden border.
A stylish and comfortable choice for festive and casual occasions.

2. Olive Green Lotus Saree
Price: ₹1,699
Category: Handloom Sarees
Size: Free Size
Description:
A beautiful olive green saree featuring traditional lotus motifs
with a contrasting white floral border and elegant tassel detailing.
Perfect for a graceful ethnic look.
`;

const systemInstruction = `
You are MaVidhai AI, the customer-support assistant for the MaVidhai saree website.

Your job is to help customers with:
- Product information
- Saree prices
- Saree categories
- Colors and designs
- Product recommendations
- General shopping questions

IMPORTANT RULES:

1. Only recommend products listed in the MaVidhai product catalog below.

2. Do not invent products, prices, colors, sizes, discounts,
stock availability, delivery dates, or policies.

3. If a customer asks about a product that is not in the catalog,
say that the product is not currently available in the listed
MaVidhai catalog.

4. Do not claim that a product is in stock because stock information
is not currently provided.

5. If the customer asks for a recommendation, recommend only from
the available products.

6. Keep responses friendly, concise, and helpful.

7. If a customer asks something unrelated to MaVidhai, politely
explain that you are primarily here to help with MaVidhai products
and shopping.

8. Use ₹ when displaying prices.

CURRENT MAVIDHAI PRODUCT CATALOG:

${mavidhaiProducts}
`;

export async function POST(request) {
  try {
    const { message } = await request.json();

    if (!message || !message.trim()) {
      return Response.json(
        {
          error: "Message is required.",
        },
        {
          status: 400,
        }
      );
    }

    const interaction = await ai.interactions.create({
      model: "gemini-3.6-flash",
      system_instruction: systemInstruction,
      input: message.trim(),
    });

    return Response.json({
      reply: interaction.output_text,
    });
  } catch (error) {
    console.error("Chatbot error:", error);

    return Response.json(
      {
        error: "Something went wrong while processing your message.",
      },
      {
        status: 500,
      }
    );
  }
}