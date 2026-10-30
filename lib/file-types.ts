// Tipos de ficheiro aceites (partilhado entre o navegador e o servidor)

// Tipos aceites, pela extensão (o tipo que o navegador indica nem sempre é fiável: HEIC e CSV chegam vazios ou trocados)
const TYPES: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  xls: "application/vnd.ms-excel",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  doc: "application/msword",
  csv: "text/csv",
  txt: "text/plain",
  xml: "application/xml",
};

export const ACCEPT = Object.keys(TYPES).map((e) => `.${e}`).join(",") + ",image/*,application/pdf";

export function fileKind(name: string): { ext: string; mime: string } | null {
  const ext = name.toLowerCase().match(/\.([a-z0-9]{2,5})$/)?.[1];
  if (!ext || !TYPES[ext]) return null;
  return { ext: ext === "jpeg" ? "jpg" : ext, mime: TYPES[ext] };
}
