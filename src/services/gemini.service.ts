import { geminiModels, geminiConfig } from "@/config/gemini";
import { prisma } from "@/config/database";
import { logger } from "@/utils/logger";

export class GeminiService {
  async analyzeQuery(
    query: string,
    workspaceId: string,
    context?: Record<string, any>
  ): Promise<any> {
    try {
      // Get knowledge base for context
      const knowledgeBase = await prisma.knowledgeBase.findMany({
        where: { workspaceId },
        take: 10,
        orderBy: { updatedAt: "desc" },
      });

      const contextText = knowledgeBase
        .map(
          (kb: { title: any; content: any }) =>
            `Title: ${kb.title}\nContent: ${kb.content}`
        )
        .join("\n\n");

      const prompt = `You are an AI customer support assistant. Analyze the following customer query and provide a helpful response based on the knowledge base.

        Knowledge Base:
        ${contextText}

        Customer Query: ${query}

        Additional Context: ${context ? JSON.stringify(context) : "None"}

        Provide a response in the following JSON format:
        {
          "response": "Your helpful response here",
          "confidence": 0.85,
          "needsHumanEscalation": false,
          "suggestedActions": ["action1", "action2"],
          "sentiment": "neutral|positive|negative"
        }

        Rules:
        - If confidence is below 0.7, set needsHumanEscalation to true
        - Provide 2-3 suggested actions
        - Keep response professional and helpful
        - Detect sentiment accurately`;

      const model = geminiModels.pro;
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: geminiConfig,
      });

      const responseText = result.response.text();

      // Parse JSON response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed;
      }

      // Fallback if JSON parsing fails
      return {
        response: responseText,
        confidence: 0.6,
        needsHumanEscalation: true,
        suggestedActions: ["Review manually"],
        sentiment: "neutral",
      };
    } catch (error) {
      logger.error("Gemini analysis error:", error);
      return {
        response:
          "I apologize, but I need to escalate this to a human agent for better assistance.",
        confidence: 0.0,
        needsHumanEscalation: true,
        suggestedActions: ["Escalate to human agent"],
        sentiment: "neutral",
      };
    }
  }

  async generateEmbedding(text: string): Promise<string> {
    // For production, use a proper embedding model
    // This is a simplified version
    return Buffer.from(text).toString("base64");
  }

  async searchKnowledge(
    query: string,
    workspaceId: string,
    limit = 5
  ): Promise<any[]> {
    const searchTerms = query.toLowerCase().split(" ");

    const results = await prisma.knowledgeBase.findMany({
      where: {
        workspaceId,
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { content: { contains: query, mode: "insensitive" } },
          { category: { contains: query, mode: "insensitive" } },
          // Search if ANY tag matches ANY word in query
          ...searchTerms.map((term) => ({ tags: { has: term } })),
        ],
      },
      take: limit,
      orderBy: { updatedAt: "desc" },
    });

    return results;
  }

  async summarizeConversation(messages: any[]): Promise<string> {
    try {
      const conversationText = messages
        .map((m) => `${m.sender}: ${m.content}`)
        .join("\n");

      const prompt = `Summarize the following customer support conversation in 2-3 sentences:
        ${conversationText}
        Summary:`;

      const model = geminiModels.pro;
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { ...geminiConfig, maxOutputTokens: 200 },
      });

      return result.response.text();
    } catch (error) {
      logger.error("Conversation summary error:", error);
      return "Unable to generate summary";
    }
  }
}

export const geminiService = new GeminiService();
