// terminal typing animation + notify form

// ---------- hero terminal ----------
const SCRIPT = [
  { t: "cmd", text: "wip commit --seal sec-team -m \"fix: CVE-2026-31337 heap overflow\"" },
  { t: "out", text: "sealed change rk3vwqpm created" },
  { t: "seal", text: "world sees: ▓▓▓▓▓▓▓▓▓▓ ciphertext · 4.1 KB · 2 recipients" },
  { t: "out", text: "" },
  { t: "cmd", text: "git log --oneline -1        # a plain-git colleague" },
  { t: "out", text: "8f21c04 [sealed] rk3vwqpm" },
  { t: "out", text: "" },
  { t: "cmd", text: "wip reveal rk3vwqpm         # embargo lifts, patch day" },
  { t: "out", text: "published 32-byte reveal key" },
  { t: "ok", text: "change rk3vwqpm is now world-readable. same hash. no rewrite." },
];

const CHAR_MS = 24;
const LINE_PAUSE = 420;
const CMD_PAUSE = 800;

function el() {
  return document.getElementById("terminal-body");
}

function span(cls, text) {
  return `<span class="${cls}">${text}</span>`;
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function typeLine(lines, line) {
  if (line.t === "cmd") {
    // type command char by char
    for (let i = 1; i <= line.text.length; i++) {
      render(lines, span("t-prompt", "$ ") + span("t-cmd", fmtCmd(line.text.slice(0, i))));
      await sleep(CHAR_MS);
    }
    lines.push(span("t-prompt", "$ ") + span("t-cmd", fmtCmd(line.text)));
    await sleep(CMD_PAUSE);
  } else {
    lines.push(span("t-" + line.t, esc(line.text)));
    render(lines, null);
    await sleep(LINE_PAUSE);
  }
}

function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
}

// dim trailing "# comment" in typed commands
function fmtCmd(s) {
  return esc(s).replace(/(#.*)$/, '<span class="t-comment">$1</span>');
}

function render(lines, partial) {
  const done = lines.join("\n");
  const cur = partial !== null && partial !== undefined ? (done ? done + "\n" : "") + partial : done;
  el().innerHTML = cur + '<span class="cursor">_</span>';
}

async function runTerminal() {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) {
    const all = SCRIPT.map((l) =>
      l.t === "cmd" ? span("t-prompt", "$ ") + span("t-cmd", fmtCmd(l.text)) : span("t-" + l.t, esc(l.text))
    );
    el().innerHTML = all.join("\n") + '<span class="cursor">_</span>';
    return;
  }
  // play once, leave the result on screen
  const lines = [];
  render(lines, "");
  for (const line of SCRIPT) {
    await typeLine(lines, line);
  }
}

document.addEventListener("DOMContentLoaded", runTerminal);

// ---------- dark/light toggle ----------
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("theme-toggle");
  if (!btn) return;
  btn.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("wip-theme", next);
  });
});

// ---------- notify form (Alpine component) ----------
window.notifyForm = function () {
  return {
    email: "",
    state: "idle",
    msg: "",
    async submit() {
      if (!this.email) return;
      this.state = "busy";
      this.msg = "";
      try {
        const res = await fetch("/api/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: this.email }),
        });
        if (!res.ok) throw new Error();
        this.state = "done";
        this.msg = "recorded. one email when there is a binary, then silence.";
      } catch {
        this.state = "idle";
        this.msg = "something broke. try again?";
      }
    },
  };
};
