// Preparação dos ficheiros recebidos para os componentes do painel (textos e linhas já formatadas).
import type { DocTexts, DocView } from "@/components/doc-files";
import { isChannel } from "@/components/channel-icon";
import { formatDate, type Dictionary, type Locale } from "@/lib/i18n";

export const DOC_COLUMNS = "id, request_id, item_id, client_id, filename, size_bytes, channel, created_at, filed_by, state";

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
};

export function docTexts(d: Dictionary): DocTexts {
  const x = d.app.docs;
  const p = d.public;
  return {
    view: x.view,
    download: x.download,
    remove: x.remove,
    removeConfirm: x.removeConfirm,
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

export function docView(r: DocRow, locale: Locale): DocView {
  return {
    id: r.id,
    filename: r.filename,
    size: r.size_bytes,
    channel: isChannel(r.channel) ? r.channel : "other",
    date: formatDate(r.created_at, locale, false),
    filedBy: r.filed_by,
    itemId: r.item_id,
  };
}
