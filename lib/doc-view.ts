// Preparação dos ficheiros recebidos para os componentes do painel (textos e linhas já formatadas).
import type { DocTexts, DocView } from "@/components/doc-files";
import { isChannel } from "@/components/channel-icon";
import type { Dictionary, Locale } from "@/lib/i18n";

export const DOC_COLUMNS = "id, request_id, item_id, client_id, filename, size_bytes, channel, created_at, filed_by, state, drive_file_id";

export type DocRow = {
  id: string;
  request_id: string | null;
  item_id: string | null;
  client_id: string | null;
  filename: string;
  size_bytes: number;
  channel: string;
  created_at: string;
  filed_by: "ai" | "client" | "office" | null;
  state: "review" | "filed";
  drive_file_id?: string | null;
};

export function docTexts(d: Dictionary): DocTexts {
  const x = d.app.docs;
  const p = d.public;
  return {
    view: x.view,
    download: x.download,
    remove: x.remove,
    removeConfirm: x.removeConfirm,
    share: x.share,
    fileTo: x.fileTo,
    move: x.move,
    by: x.by,
    via: d.common.via,
    error: x.error,
    zip: x.zip(-1).replace("-1", "{n}"),
    zipping: x.zipping,
    drop: x.drop,
    dropHint: x.dropHint,
    uploading: p.uploading(-1, -2).replace("-1", "{a}").replace("-2", "{b}"),
    issue: {
      type: p.issue.type("{name}"),
      size: p.issue.size("{name}"),
      duplicate: p.issue.duplicate("{name}"),
      limit: p.issue.limit("{name}"),
      failed: p.issue.failed("{name}"),
    },
  };
}

// Dia e hora de chegada, no fuso horário do escritório (ex.: «30 de outubro, 14:32»)
function arrivedAt(iso: string, locale: Locale, timeZone?: string) {
  const d = new Date(iso);
  const opt = timeZone ? { timeZone } : {};
  const day = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", ...opt }).format(d);
  const time = new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit", hour12: false, ...opt }).format(d);
  return `${day}, ${time}`;
}

export function docView(r: DocRow, locale: Locale, timeZone?: string): DocView {
  return {
    id: r.id,
    filename: r.filename,
    size: r.size_bytes,
    channel: isChannel(r.channel) ? r.channel : "other",
    date: arrivedAt(r.created_at, locale, timeZone),
    filedBy: r.filed_by,
    itemId: r.item_id,
    inDrive: !!r.drive_file_id,
  };
}
