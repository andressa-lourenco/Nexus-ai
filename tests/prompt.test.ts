import { describe, expect, it } from "vitest";
import { buildMessages, extractCitations, SYSTEM_PROMPT } from "@/lib/rag/prompt";

describe("buildMessages", () => {
  it("puts numbered, labelled sources and the question in the final user message", () => {
    const messages = buildMessages(
      "What is the refund window?",
      [
        { n: 1, documentName: "policy.pdf", page: 3, text: "Refunds are accepted within 30 days." },
        { n: 2, documentName: "faq.md", page: null, text: "Contact support for help." },
      ],
      [{ role: "user", content: "Hi" }, { role: "assistant", content: "Hello" }],
    );
    expect(messages[0]).toEqual({ role: "system", content: SYSTEM_PROMPT });
    expect(messages).toHaveLength(4);
    const last = messages.at(-1)!;
    expect(last.role).toBe("user");
    expect(last.content).toContain("[1] (policy.pdf, page 3)");
    expect(last.content).toContain("[2] (faq.md)");
    expect(last.content).toContain("Refunds are accepted within 30 days.");
    expect(last.content.trim().endsWith("Question: What is the refund window?")).toBe(true);
  });
});

describe("extractCitations", () => {
  it("collects distinct in-range citations in order of first use", () => {
    expect(extractCitations("A [2]. B [1, 3]. C [2][7] D [0]", 3)).toEqual([2, 1, 3]);
    expect(extractCitations("No citations here", 3)).toEqual([]);
  });
});
