export const PUBLIC_URL: string = import.meta.env.VITE_PUBLIC_URL ?? location.origin;

export type ShareOutcome = "shared" | "copied" | "failed";

export async function shareResult(text: string): Promise<ShareOutcome> {
  try {
    if (navigator.share) {
      await navigator.share({ text });
      return "shared";
    }
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    return "failed";
  }
}
