import { NextResponse } from "next/server";
import path from "node:path";
import { createRequire } from "node:module";
import mammoth from "mammoth";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const require = createRequire(import.meta.url);

function normalizeText(value) {
  return String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function parseSingleFile(file) {
  if (!file) {
    throw new Error("文件不存在");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`文件 ${file.name} 超过 8MB，当前原型暂不支持`);
  }

  const ext = (file.name.split(".").pop() || "").toLowerCase();
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (["txt", "md", "csv", "json"].includes(ext)) {
    const content = normalizeText(buffer.toString("utf8"));
    return {
      name: file.name,
      kind: ext.toUpperCase(),
      statusText: "已解析文本文件",
      content
    };
  }

  if (ext === "pdf") {
    const pdfModulePath = path.join(
      process.cwd(),
      "node_modules",
      "pdf-parse",
      "dist",
      "pdf-parse",
      "cjs",
      "index.cjs"
    );
    const { PDFParse } = require(pdfModulePath);
    const parser = new PDFParse({ data: buffer });
    const parsed = await parser.getText();
    await parser.destroy();
    return {
      name: file.name,
      kind: "PDF",
      statusText: "已解析 PDF 文本",
      content: normalizeText(parsed.text)
    };
  }

  if (ext === "docx") {
    const result = await mammoth.extractRawText({ buffer });
    return {
      name: file.name,
      kind: "DOCX",
      statusText: "已解析 Word 文本",
      content: normalizeText(result.value)
    };
  }

  if (ext === "doc") {
    throw new Error(`文件 ${file.name} 是旧版 DOC，请先转成 DOCX 或 PDF`);
  }

  throw new Error(`暂不支持解析 ${file.name} 这种文件类型`);
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
