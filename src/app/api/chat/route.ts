import { NextResponse } from "next/server";
import { answerQuestion } from "@/lib/chatbot";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      message?: string;
      history?: { role: "user" | "assistant"; content: string }[];
    };

    const message = (body.message ?? "").slice(0, 1000);
    if (!message.trim()) {
      return NextResponse.json(
        { reply: "Ask me anything about the store.", products: [], suggestions: [] },
        { status: 400 },
      );
    }

    const reply = await answerQuestion(message, body.history ?? []);
    return NextResponse.json(reply);
  } catch (error) {
    console.error("chat error", error);
    return NextResponse.json(
      {
        reply: "Something went wrong on my side. Please try again.",
        products: [],
        suggestions: [],
      },
      { status: 500 },
    );
  }
}
