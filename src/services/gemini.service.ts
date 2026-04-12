import { TaskType } from "@google/generative-ai";
import { geminiModels, geminiConfig } from "@/config/gemini";
import { prisma } from "@/config/database";
import { logger } from "@/utils/logger";

interface KnowledgeDocumentInput {
  title: string;
  content: string;
  category?: string | null;
  tags?: string[];
}

interface RankedKnowledgeItem {
  id: string;
  title: string;
  content: string;
  category: string | null;
  tags: string[];
  embedding: string | null;
  workspaceId: string;
  createdAt: Date;
  updatedAt: Date;
}

const MAX_SEMANTIC_CANDIDATES = 200;

export class GeminiService {
  async analyzeQuery(
    query: string,
    workspaceId: string,
    context?: Record<string, any>
  ): Promise<any> {
    try {
      const knowledgeBase = await this.searchKnowledge(query, workspaceId, 10);

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

  private buildKnowledgeDocumentText(document: KnowledgeDocumentInput): string {
    const sections = [
      `Title: ${document.title}`,
      `Content: ${document.content}`,
    ];

    if (document.category) {
      sections.push(`Category: ${document.category}`);
    }

    if (document.tags && document.tags.length > 0) {
      sections.push(`Tags: ${document.tags.join(", ")}`);
    }

    return sections.join("\n");
  }

  private parseEmbedding(embedding: string | null): number[] | null {
    if (!embedding) {
      return null;
    }

    try {
      const parsed = JSON.parse(embedding);

      if (
        Array.isArray(parsed) &&
        parsed.every((value) => typeof value === "number")
      ) {
        return parsed;
      }
    } catch (error) {
      logger.warn("Failed to parse stored embedding", error);
    }

    return null;
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (!a.length || a.length !== b.length) {
      return 0;
    }

    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let index = 0; index < a.length; index += 1) {
      dotProduct += a[index] * b[index];
      magnitudeA += a[index] * a[index];
      magnitudeB += b[index] * b[index];
    }

    if (!magnitudeA || !magnitudeB) {
      return 0;
    }

    return dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
  }

  private keywordScore(query: string, article: RankedKnowledgeItem): number {
    const normalizedQuery = query.toLowerCase();
    const searchTerms = normalizedQuery.split(/\s+/).filter(Boolean);
    const title = article.title.toLowerCase();
    const content = article.content.toLowerCase();
    const category = article.category?.toLowerCase() || "";
    const tags = article.tags.map((tag) => tag.toLowerCase());

    let score = 0;

    if (title.includes(normalizedQuery)) {
      score += 4;
    }

    if (content.includes(normalizedQuery)) {
      score += 2;
    }

    if (category && category.includes(normalizedQuery)) {
      score += 1.5;
    }

    for (const term of searchTerms) {
      if (title.includes(term)) {
        score += 1.5;
      }

      if (content.includes(term)) {
        score += 0.5;
      }

      if (category.includes(term)) {
        score += 0.5;
      }

      if (tags.some((tag) => tag.includes(term))) {
        score += 1;
      }
    }

    return score;
  }

  private async keywordFallbackSearch(
    query: string,
    workspaceId: string,
    limit: number
  ): Promise<any[]> {
    const searchTerms = query.toLowerCase().split(/\s+/).filter(Boolean);

    return prisma.knowledgeBase.findMany({
      where: {
        workspaceId,
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { content: { contains: query, mode: "insensitive" } },
          { category: { contains: query, mode: "insensitive" } },
          ...searchTerms.map((term) => ({ tags: { has: term } })),
        ],
      },
      take: limit,
      orderBy: { updatedAt: "desc" },
    });
  }

  async generateEmbedding(
    text: string,
    taskType: TaskType = TaskType.RETRIEVAL_DOCUMENT
  ): Promise<string> {
    const normalizedText = text.trim();

    if (!normalizedText) {
      return JSON.stringify([]);
    }

    const response = await geminiModels.embedding.embedContent({
      content: {
        role: "user",
        parts: [{ text: normalizedText }],
      },
      taskType,
    });

    const values = response.embedding.values;

    if (!values || values.length === 0) {
      throw new Error("Gemini embedding response was empty");
    }

    return JSON.stringify(values);
  }

  async generateKnowledgeEmbedding(
    document: KnowledgeDocumentInput
  ): Promise<string> {
    return this.generateEmbedding(
      this.buildKnowledgeDocumentText(document),
      TaskType.RETRIEVAL_DOCUMENT
    );
  }

  async searchKnowledge(
    query: string,
    workspaceId: string,
    limit = 5
  ): Promise<any[]> {
    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      return [];
    }

    const candidates = await prisma.knowledgeBase.findMany({
      where: { workspaceId },
      take: MAX_SEMANTIC_CANDIDATES,
      orderBy: { updatedAt: "desc" },
    });

    if (!candidates.length) {
      return [];
    }

    let queryEmbedding: number[] | null = null;

    try {
      const rawQueryEmbedding = await this.generateEmbedding(
        normalizedQuery,
        TaskType.RETRIEVAL_QUERY
      );
      queryEmbedding = this.parseEmbedding(rawQueryEmbedding);
    } catch (error) {
      logger.warn("Query embedding failed, using keyword-only search", error);
    }

    const ranked = candidates
      .map((article) => {
        const semanticEmbedding = this.parseEmbedding(article.embedding);
        const semanticScore =
          queryEmbedding && semanticEmbedding
            ? this.cosineSimilarity(queryEmbedding, semanticEmbedding)
            : 0;
        const keywordScore = this.keywordScore(normalizedQuery, article);
        const normalizedKeywordScore = Math.min(keywordScore / 5, 1);
        const combinedScore = queryEmbedding
          ? semanticScore * 0.8 + normalizedKeywordScore * 0.2
          : normalizedKeywordScore;

        return {
          article,
          combinedScore,
          keywordScore,
          semanticScore,
        };
      })
      .filter((item) => item.semanticScore > 0.15 || item.keywordScore > 0)
      .sort((left, right) => {
        if (right.combinedScore !== left.combinedScore) {
          return right.combinedScore - left.combinedScore;
        }

        return right.article.updatedAt.getTime() - left.article.updatedAt.getTime();
      });

    if (ranked.length === 0) {
      return this.keywordFallbackSearch(normalizedQuery, workspaceId, limit);
    }

    return ranked.slice(0, limit).map((item) => item.article);
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
