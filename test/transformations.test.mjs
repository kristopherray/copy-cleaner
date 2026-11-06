import assert from "node:assert/strict";
import { test } from "node:test";
import { transformations } from "../src/transformations.ts";

const byName = Object.fromEntries(
  transformations.map(({ title, transform }) => [title, transform]),
);

test("the first action produces a single safe filename component", () => {
  assert.equal(transformations[0].title, "File-Safe Name");
  const name = byName["File-Safe Name"];
  assert.equal(name("  Résumé Q4 & Q1  "), "resume-q4-q1");
  assert.equal(name("Q4 / Launch—Plan - final: v2"), "q4-launch-plan-final-v2");
  assert.equal(name("It's 東京_2026"), "its-東京_2026");
  assert.equal(name("हिन्दी"), "हिन्दी");
  assert.equal(name("CON"), "_con");
  assert.equal(name("CON-" + "界" + "\u0301".repeat(140)), "_con");
  assert.equal(name("../✨"), "");
  const longName = name("界".repeat(90));
  assert.equal(longName, "界".repeat(85));
  assert.equal(Buffer.byteLength(longName), 255);
});

test("sentence case capitalizes after punctuation, opening quotes, and newlines", () => {
  const sentence = byName["Sentence Case"];
  assert.equal(sentence("hELLO WORLD"), "Hello world");
  assert.equal(
    sentence("  “HELLO.” goodbye! how ARE you?\nélan."),
    "  “Hello.” Goodbye! How are you?\nÉlan.",
  );
  assert.equal(sentence("COSTS 3.14 EACH."), "Costs 3.14 each.");
  assert.equal(sentence("A" + ".".repeat(15000)), "A" + ".".repeat(15000));
});

test("lowercase and word capitalization handle accented letters and contractions", () => {
  assert.equal(byName.Lowercase("ÉLAN ÜBER"), "élan über");
  assert.equal(
    byName["Capitalize Words"]("élan vital: don’t PANIC, full-time."),
    "Élan Vital: Don’t Panic, Full-Time.",
  );
});

test("plain text preserves whitespace, markup-like text, and case", () => {
  const text = "\t Keep <this> CAFÉ &amp; \n";
  assert.equal(byName["Remove Formatting (Plain Text)"](text), text);
});

test("emoji removal handles whole sequences and preserves non-emoji symbols and letters", () => {
  const clean = byName["Remove Emojis"];
  assert.equal(clean("A👩🏽‍💻🏳️‍🌈🇨🇦1️⃣♥️B"), "AB");
  assert.equal(
    clean("© 2026 · 𠀀 · \uE001 · 𝄞 · 1#*"),
    "© 2026 · 𠀀 · \uE001 · 𝄞 · 1#*",
  );
});

test("HTML cleanup respects document structure, quoted attributes, and encoded text", () => {
  const clean = byName["Remove HTML Tags"];
  assert.equal(
    clean('<p title="2 > 1">One&nbsp;&amp; two</p><p>Three<br>four</p>'),
    "One & two\nThree\nfour",
  );
  assert.equal(
    clean("&#169; &#x41; &mdash; &copy; &amp;lt;"),
    "© A — © &lt;",
  );
  assert.equal(
    clean("<style>p{}</style><script>alert(1)</script><b>ok</b>"),
    "ok",
  );
  assert.equal(clean(" \t5 < 8 and 3 > 2\n "), " \t5 < 8 and 3 > 2\n ");
  assert.equal(
    clean(
      "<table><tr><td>A</td><td>B</td></tr><tr><td>C</td><td>D</td></tr></table>",
    ),
    "A\tB\nC\tD",
  );
});

test("all seven transformations accept an empty clipboard string", () => {
  assert.equal(transformations.length, 7);
  for (const { title, transform } of transformations)
    assert.equal(transform(""), "", title);
});
