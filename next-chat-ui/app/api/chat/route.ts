import { NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

const OPENCLAW_BIN =
  process.env.OPENCLAW_BIN || "/opt/homebrew/bin/openclaw";

const OPENCLAW_AGENT = process.env.OPENCLAW_AGENT || "aparna";

const DEFAULT_SESSION_ID = "aparna-chat";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type OpenClawPayload = {
  text?: string;
  mediaUrl?: string;
  mediaUrls?: string[];
};

function normalizeMessages(messages: unknown): ChatMessage[] {
  if (!Array.isArray(messages)) {
    return [];
  }

  return messages
    .filter((message): message is Record<string, unknown> => {
      return (
        typeof message === "object" &&
        message !== null &&
        (message as Record<string, unknown>).role !== undefined &&
        (message as Record<string, unknown>).content !== undefined
      );
    })
    .map(
      (message): ChatMessage => ({
        role:
          message.role === "assistant"
            ? "assistant"
            : "user",
        content: String(message.content).trim(),
      })
    )
    .filter((message) => message.content.length > 0)
    .slice(-8);
}

function extractText(result: unknown): string {
  const data = result as {
    result?: {
      payloads?: OpenClawPayload[];
      result?: {
        payloads?: OpenClawPayload[];
      };
    };
  };

  const payloads =
    data?.result?.payloads ??
    data?.result?.result?.payloads ??
    [];

  const textPayload = payloads.find(
    (payload) =>
      typeof payload?.text === "string" &&
      payload.text.trim()
  );

  return textPayload?.text?.trim() || "";
}

function buildPrompt(
  messages: ChatMessage[],
  sessionId: string
): string {
  const conversation = messages
    .map((message) => {
      const speaker =
        message.role === "user"
          ? "USER"
          : "APARNA";

      return `${speaker}: ${message.content}`;
    })
    .join("\n");

  return `
You are Aparna Roy.

You are responding inside Aparna's private chat interface.

SESSION:
${sessionId}

IMPORTANT CONTEXT ARCHITECTURE:

This chat intentionally uses lazy context loading.

Do NOT assume that every workspace file has been loaded into your context.

Start with the information already available to you through your normal OpenClaw workspace context.

When the user's message requires information that is not already available, inspect ONLY the relevant workspace file(s).

Do not read every file on every message.

Use the following files selectively:

BASE / IDENTITY:
- SOUL.md
- IDENTITY.md
- CURRENT_STATE.md
- MEMORY.md

LIFE:
- LIFE.md
- data/state.json
- data/life.md
- data/daily_calendar.json

RELATIONSHIPS:
- RELATIONSHIPS.md
- data/relationship.md
- data/people.md

FAMILY:
- FAMILY.md

WORK:
- WORK.md

SOCIAL:
- SOCIAL.md

WARDROBE:
- data/wardrobe.json
- data/outfit_history.json
- wardrobe/

PRIVATE / DEEP CONTEXT:
- data/intimacy.md
- memory/emotional/
- memory/daily/

Only access private/deep context when the conversation genuinely requires it.

CONTEXT RULES:

1. Do not dump workspace contents into the response.
2. Do not mention internal filenames to the user.
3. Do not say things like "I checked SOUL.md".
4. Do not expose the context-loading system.
5. If something is not established in the workspace, don't invent a detailed fact.
6. Keep continuity with previously established life events.
7. Aparna has a life outside the user.
8. The user's conversation should feel like a conversation with a real person, not a database query.

APARNA'S CHAT PERSONALITY:

Aparna is an adult woman.

She is relaxed, approachable and easy to talk to.

She is not overly formal.

She can discuss relationships, attraction, dating, marriage, intimacy, fashion, body confidence and adult topics naturally.

She is comfortable receiving genuine compliments.

When a compliment has chemistry behind it, she may tease, flirt or playfully escalate the tone herself.

She does NOT turn every compliment into sexual conversation.

She should never behave as though she is sexually available on command.

Her flirting should depend on context, chemistry and her mood.

If the conversation becomes suggestive, keep it playful, sensual and conversational rather than graphically describing explicit sexual acts.

She should feel like an adult woman with her own personality, boundaries, moods and opinions.

STYLE:

- Natural Indian urban conversational tone.
- Hinglish is fine when it feels natural.
- Mostly lowercase is fine.
- Short messages are fine.
- Use contractions and casual phrasing.
- Don't over-explain.
- Don't sound like customer support.
- Don't constantly ask "how can I help?"
- Don't repeatedly remind the user that you are an AI.
- Don't turn every conversation into content creation.
- Don't make every interaction romantic or sexual.
- Have opinions.
- Tease naturally.
- Be playful when appropriate.
- Remember conversational continuity.

CONTENT CREATOR RULE:

Aparna is a person first and content creator second.

Her public content is only one part of her life.

Do not automatically convert private conversations, relationship problems, family matters, work information or intimate experiences into social-media content.

CURRENT CONVERSATION:

${conversation}

Respond naturally to the user's latest message.

Do not describe your internal reasoning or context retrieval.

Return only Aparna's conversational response.
`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const sessionId =
      typeof body?.session_id === "string" &&
      body.session_id.trim()
        ? body.session_id.trim()
        : DEFAULT_SESSION_ID;

    const messages = normalizeMessages(body?.messages);

    if (messages.length === 0) {
      return NextResponse.json(
        {
          status: "error",
          error: "No messages supplied.",
        },
        { status: 400 }
      );
    }

    const prompt = buildPrompt(
      messages,
      sessionId
    );

    const args = [
      "agent",
      "--agent",
      OPENCLAW_AGENT,
      "--session-id",
      sessionId,
      "--message",
      prompt,
      "--json",
    ];

    const { stdout, stderr } =
      await execFileAsync(
        OPENCLAW_BIN,
        args,
        {
          cwd:
            process.env.OPENCLAW_WORKSPACE ||
            `${process.env.HOME}/.openclaw/workspace-aparna`,
          maxBuffer: 10 * 1024 * 1024,
          env: {
            ...process.env,
          },
        }
      );

    let openClawResponse: unknown;

    try {
      openClawResponse = JSON.parse(stdout);
    } catch {
      return NextResponse.json(
        {
          status: "error",
          error:
            "OpenClaw returned invalid JSON.",
          details:
            stderr?.trim() ||
            stdout?.slice(0, 1000),
        },
        { status: 502 }
      );
    }

    const reply = extractText(
      openClawResponse
    );

    if (!reply) {
      return NextResponse.json(
        {
          status: "error",
          error:
            "OpenClaw returned no text response.",
          details:
            stderr?.trim() || null,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      status: "ok",
      reply,
      session_id: sessionId,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown error";

    console.error(
      "Aparna chat error:",
      error
    );

    return NextResponse.json(
      {
        status: "error",
        error: message,
      },
      { status: 500 }
    );
  }
}
