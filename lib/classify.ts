import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { BUCKET, markReceived } from "@/lib/documents";

// Arrumação automática: a IA (Gemini, plano pago — os dados não treinam modelos) vê o ficheiro
// e diz a que documento do pedido pertence. Só arruma sozinha quando tem confiança alta;
// o resto fica «Por confirmar» no painel, para o escritório decidir num toque.
// Sem GEMINI_API_KEY não faz nada (os ficheiros ficam por confirmar).

const MIN_CONFIDENCE = 0.75;
const INLINE_MAX = 14 * 1024 * 1024; // o pedido à API tem limite de 20 MB (base64 aumenta ~33%)
const VISUAL = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "text/plain", "text/csv"]);

type Doc = { id: string; request_id: string | null; item_id: string | null; state: string; filename: string; mime: string; size_bytes: number; storage_path: string; channel: string; subject: string | null };

export async function classifyDocuments(ids: string[]) {
  const key = process.env.GEMINI_API_KEY;
  if (!key || !ids.length) return;
  const admin = createAdminClient();
  const { data: docs } = await admin
    .from("documents")
    .select("id, request_id, item_id, state, filename, mime, size_bytes, storage_path, channel, subject")
    .in("id", ids.slice(0, 40));
  for (const d of (docs ?? []) as Doc[]) {
    if (d.state !== "review" || d.item_id || !d.request_id) continue;
    try {
      await classifyOne(admin, key, d);
    } catch (e) {
      console.error("classify", d.id, e instanceof Error ? e.message : e);
    }
  }
}

async function classifyOne(admin: ReturnType<typeof createAdminClient>, key: string, d: Doc) {
  const { data: items } = await admin.from("request_items").select("id, label, status").eq("request_id", d.request_id!).order("position");
  if (!items?.length) return;
  const { data: req } = await admin.from("requests").select("period, months").eq("id", d.request_id!).maybeSingle();

  const parts: Record<string, unknown>[] = [];
  if (VISUAL.has(d.mime) && d.size_bytes <= INLINE_MAX) {
    const { data: blob } = await admin.storage.from(BUCKET).download(d.storage_path);
    if (blob) parts.push({ inline_data: { mime_type: d.mime, data: Buffer.from(await blob.arrayBuffer()).toString("base64") } });
  }
  const list = items.map((it, i) => `${i + 1}. ${it.label}`).join("\n");
  parts.push({
    text:
      `You help an accounting office file documents sent by a client.\n` +
      `Requested documents (period starting ${req?.period ?? "?"}, ${req?.months ?? 1} month(s)):\n${list}\n\n` +
      `File name: ${d.filename}\n${d.subject ? `E-mail subject: ${d.subject}\n` : ""}` +
      `Which requested document does this file belong to? Answer with the number from the list, or 0 if none fits or you cannot tell. ` +
      `confidence is your probability (0 to 1) that the answer is right.`,
  });

  const model = process.env.GEMINI_MODEL || "gemini-flash-latest";
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": key },
    signal: AbortSignal.timeout(30000),
    body: JSON.stringify({
      contents: [{ role: "user", parts }],
      generationConfig: {
        temperature: 0,
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: { item: { type: "INTEGER" }, confidence: { type: "NUMBER" } },
          required: ["item", "confidence"],
        },
      },
    }),
  });
  if (!res.ok) throw new Error(`gemini ${res.status}`);
  const body = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const text = body.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  let out: { item?: number; confidence?: number } = {};
  try {
    out = JSON.parse(text);
  } catch {
    return;
  }
  const idx = Number.isInteger(out.item) ? (out.item as number) : 0;
  const conf = typeof out.confidence === "number" ? Math.max(0, Math.min(1, out.confidence)) : 0;
  const item = idx >= 1 && idx <= items.length ? items[idx - 1] : null;

  if (item && conf >= MIN_CONFIDENCE) {
    // Só arruma se ninguém o arrumou entretanto
    const { data: moved } = await admin
      .from("documents")
      .update({ item_id: item.id, state: "filed", filed_by: "ai", ai_confidence: conf })
      .eq("id", d.id)
      .is("item_id", null)
      .select("id");
    if (moved?.length) {
      await markReceived(item.id, d.channel === "page" || d.channel === "email" || d.channel === "whatsapp" ? d.channel : "other");
    }
  } else {
    await admin.from("documents").update({ ai_confidence: conf }).eq("id", d.id).is("item_id", null);
  }
}
