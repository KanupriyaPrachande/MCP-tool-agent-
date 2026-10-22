export interface TraceEvent {
  status: "ok" | "denied" | "error" | string;
  tool?: string;
  sql?: string;
  table?: string;
  rows?: any[];
  error?: string;
  [key: string]: any;
}

export interface ApprovalEvent {
  tool?: string;
  action?: string;
  args?: Record<string, any>;
  prompt?: string;
  [key: string]: any;
}

export interface SSECallbacks {
  onTrace?: (trace: TraceEvent) => void;
  onApproval?: (approval: ApprovalEvent) => void;
  onAnswer?: (chunk: { text: string }) => void;
  onDone?: () => void;
  onError?: (error: Error) => void;
}

export async function consumeSSEStream(
  response: Response,
  callbacks: SSECallbacks
) {
  if (!response.body) {
    throw new Error("No response body available for streaming");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      // Keep unfinished chunk in buffer
      buffer = lines.pop() || "";

      for (const block of lines) {
        if (!block.trim()) continue;

        let eventType = "message";
        let dataStr = "";

        const subLines = block.split("\n");
        for (const line of subLines) {
          if (line.startsWith("event:")) {
            eventType = line.slice(6).trim();
          } else if (line.startsWith("data:")) {
            dataStr = line.slice(5).trim();
          }
        }

        if (!dataStr) continue;

        try {
          const parsed = JSON.parse(dataStr);
          if (eventType === "trace" && callbacks.onTrace) {
            callbacks.onTrace(parsed);
          } else if (eventType === "approval" && callbacks.onApproval) {
            callbacks.onApproval(parsed);
          } else if (eventType === "answer" && callbacks.onAnswer) {
            callbacks.onAnswer(parsed);
          } else if (eventType === "done" && callbacks.onDone) {
            callbacks.onDone();
          }
        } catch (err) {
          console.warn("Failed to parse SSE JSON:", dataStr, err);
        }
      }
    }
  } catch (err: any) {
    if (callbacks.onError) {
      callbacks.onError(err);
    } else {
      throw err;
    }
  } finally {
    if (callbacks.onDone) {
      callbacks.onDone();
    }
  }
}
