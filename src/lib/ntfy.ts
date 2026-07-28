/**
 * ntfy.sh Helper Utility (TOOLS-INTEGRATION.md §7)
 * Used during development/testing for push notifications to developer smartphones
 * before full in-app/email notification pipelines are finalized.
 */

export interface SendNtfyOptions {
  topic?: string;
  title: string;
  message: string;
  priority?: 1 | 2 | 3 | 4 | 5; // 1=min, 3=default, 5=max
  tags?: string[];
}

export async function sendNtfyNotification({
  topic = process.env.NTFY_TOPIC || "slj-dev-reminder",
  title,
  message,
  priority = 3,
  tags = ["bookmark_tabs"],
}: SendNtfyOptions): Promise<boolean> {
  try {
    const res = await fetch(`https://ntfy.sh/${topic}`, {
      method: "POST",
      headers: {
        Title: title,
        Priority: String(priority),
        Tags: tags.join(","),
      },
      body: message,
    });

    return res.ok;
  } catch (err) {
    console.warn("ntfy notification fetch warning:", err);
    return false;
  }
}
