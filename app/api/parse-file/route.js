import { NextResponse } from "next/server";
import mammoth from "mammoth";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 8 * 1024 * 1024;

function normalizeText(value) {
  return String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function parsePdf(buffer) {
  // 使用 pdfjs-dist legacy build，不依赖浏览器 DOM API
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "";

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    useWorkerFetch: false,
    isEvalSupported: false,
    useSystemFonts: true,
  });

  const pdf = await loadingTask.promise;
  const pages = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    pages.push(pageText.trim());
  }

  return normalizeText(pages.filter(Boolean).join("\n\n"));
}

async function parseSingleFile(file) {
  if (!file) throw new Error("文件不存在");

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`文件 ${file.name} 超过 8MB，暂不支持`);
  }

  const ext = (file.name.split(".").pop() || "").toLowerCase();
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (["txt", "md", "csv", "json"].includes(ext)) {
    return {
      name: file.name,
      kind: ext.toUpperCase(),
      statusText: "已解析文本文件",
      content: normalizeText(buffer.toString("utf8")),
    };
  }

  if (ext === "pdf") {
    const content = await parsePdf(buffer);
    if (!content) throw new Error(`PDF ${file.name} 未能提取到文字内容，请确认不是扫描件`);
    return {
      name: file.name,
      kind: "PDF",
      statusText: "已解析 PDF 文本",
      content,
    };
  }

  if (ext === "docx") {
    const result = await mammoth.extractRawText({ buffer });
    return {
      name: file.name,
      kind: "DOCX",
      statusText: "已解析 Word 文本",
      content: normalizeText(result.value),
    };
  }

  if (ext === "doc") {
    throw new Error(`${file.name} 是旧版 DOC 格式，请另存为 DOCX 或 PDF 后再上传`);
  }

  throw new Error(`暂不支持 .${ext} 格式，请上传 PDF / DOCX / TXT`);
}

export async function POST(request) {
  const formData = await request.formData();
  const files = formData.getAll("files");

  if (!files.length) {
    return NextResponse.json({ error: "请至少上传一个文件" }, { status: 400 });
  }

  try {
    const parsedFiles = [];
    for (const file of files) {
      parsedFiles.push(await parseSingleFile(file));
    }
    return NextResponse.json({ files: parsedFiles });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "文件解析失败" },
      { status: 400 }
    );
  }
}
