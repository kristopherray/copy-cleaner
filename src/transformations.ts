import { Buffer } from "node:buffer";
import { Parser } from "htmlparser2";

const graphemes = new Intl.Segmenter(undefined, { granularity: "grapheme" });
const words = new Intl.Segmenter(undefined, { granularity: "word" });

function fileSafeName(text: string): string {
  const normalized = text
    .normalize("NFD")
    .replace(/(\p{Script=Latin})\p{M}+/gu, "$1")
    .normalize("NFC")
    .toLowerCase()
    .replace(/['’]/gu, "");
  const parts = normalized.match(/[\p{L}\p{N}_][\p{L}\p{M}\p{N}_]*/gu);
  let name = parts?.join("-") ?? "";

  if (Buffer.byteLength(name) > 255) {
    let length = 0;
    let shortened = "";
    for (const { segment } of graphemes.segment(name)) {
      length += Buffer.byteLength(segment);
      if (length > 255) break;
      shortened += segment;
    }
    name = shortened.replace(/-+$/, "");
  }
  return /^(con|prn|aux|nul|(?:com|lpt)[1-9¹²³])$/u.test(name)
    ? "_" + name
    : name;
}

function sentenceCase(text: string): string {
  let startOfSentence = true;
  return text
    .toLowerCase()
    .replace(/[\p{L}\p{N}]+|[^\p{L}\p{N}]+/gu, (part) => {
      if (!/^[\p{L}\p{N}]/u.test(part)) {
        startOfSentence ||= /[\r\n。！？]|[.!?…](?=[\s"'’”»)\]}])/.test(part);
        return part;
      }
      if (!startOfSentence) return part;
      startOfSentence = false;
      return part.replace(/^\p{L}/u, (letter) => letter.toUpperCase());
    });
}

function capitalizeWords(text: string): string {
  let result = "";
  for (const { segment, isWordLike } of words.segment(text)) {
    result += isWordLike
      ? segment.toLowerCase().replace(/^\p{L}/u, (c) => c.toUpperCase())
      : segment;
  }
  return result;
}

// RGI emoji include multi-code-point sequences such as flags and families.
const emoji = new RegExp("\\p{RGI_Emoji}|[0-9#*]\\uFE0F?\\u20E3", "v");

function removeEmojis(text: string): string {
  if (!emoji.test(text)) return text;
  let result = "";
  for (const { segment } of graphemes.segment(text)) {
    if (!emoji.test(segment)) result += segment;
  }
  return result;
}

const blockTags = new Set(
  "address article aside blockquote dd div dl dt fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 header hr li main nav ol p pre section table tr ul".split(
    " ",
  ),
);

function removeHtmlTags(text: string): string {
  let result = "";
  let separator = "";
  let hidden = false;

  const parser = new Parser({
    onopentag(name) {
      if (name === "script" || name === "style") hidden = true;
      if (hidden) return;
      if (name === "br") {
        result += "\n";
        separator = "";
      } else if (blockTags.has(name)) {
        separator = "\n";
      }
    },
    onclosetag(name) {
      if (name === "script" || name === "style") hidden = false;
      if (hidden) return;
      if (blockTags.has(name)) separator = "\n";
      else if ((name === "td" || name === "th") && !separator) separator = "\t";
    },
    ontext(chunk) {
      if (hidden) return;
      if (
        separator &&
        result &&
        !/[\r\n]$/.test(result) &&
        !/^[\r\n]/.test(chunk)
      )
        result += separator;
      result += chunk;
      separator = "";
    },
  });

  // Keep the previous plain-space behavior for &nbsp; and let the parser decode other references once.
  parser.end(text.replace(/&nbsp;/g, " "));
  return result;
}

export const transformations = [
  { title: "File-Safe Name", transform: fileSafeName },
  { title: "Sentence Case", transform: sentenceCase },
  { title: "Lowercase", transform: (text: string) => text.toLowerCase() },
  { title: "Capitalize Words", transform: capitalizeWords },
  {
    title: "Remove Formatting (Plain Text)",
    transform: (text: string) => text,
  },
  { title: "Remove Emojis", transform: removeEmojis },
  { title: "Remove HTML Tags", transform: removeHtmlTags },
];
