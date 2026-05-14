"use client";

import { IslanderBridge } from "@/plugins/islander-bridge";
import { useIsland } from "./IslandManager";

const HISTORY_KEY = "islanders.calc.history";
const MAX_HISTORY = 3;

/**
 * Evaluates a simple arithmetic expression without using `eval` / `Function`.
 * Supports + - * / parentheses and unary minus. Returns NaN on parse error.
 */
export function safeEval(expr: string): number {
  const tokens = expr
    .replace(/[×∗]/g, "*")
    .replace(/÷/g, "/")
    .match(/(\d+\.?\d*|\.\d+|[+\-*/()])/g);
  if (!tokens) return NaN;

  let i = 0;
  const peek = () => tokens[i];
  const eat = () => tokens[i++];

  const parseFactor = (): number => {
    const t = peek();
    if (t === "(") { eat(); const v = parseExpr(); if (eat() !== ")") return NaN; return v; }
    if (t === "-") { eat(); return -parseFactor(); }
    if (t === "+") { eat(); return parseFactor(); }
    if (t && /^\d|^\./.test(t)) { eat(); return Number(t); }
    return NaN;
  };
  const parseTerm = (): number => {
    let v = parseFactor();
    while (peek() === "*" || peek() === "/") {
      const op = eat();
      const r = parseFactor();
      v = op === "*" ? v * r : v / r;
    }
    return v;
  };
  const parseExpr = (): number => {
    let v = parseTerm();
    while (peek() === "+" || peek() === "-") {
      const op = eat();
      const r = parseTerm();
      v = op === "+" ? v + r : v - r;
    }
    return v;
  };
  const out = parseExpr();
  return i === tokens.length ? out : NaN;
}

export async function pushCalculation(expression: string) {
  const result = safeEval(expression);
  const resultStr = Number.isFinite(result) ? formatResult(result) : "—";
  const history = loadHistory();
  history.unshift(`${expression} = ${resultStr}`);
  const trimmed = history.slice(0, MAX_HISTORY);
  saveHistory(trimmed);

  const payload = { expression, result: resultStr, history: trimmed };
  useIsland.getState().setCalculator(payload);
  await IslanderBridge.updateModule({ module: "calculator", data: payload });
}

function formatResult(n: number): string {
  if (Math.abs(n) >= 1e9 || (n !== 0 && Math.abs(n) < 1e-4))
    return n.toExponential(4);
  const fixed = Math.round(n * 1e6) / 1e6;
  return String(fixed);
}

function loadHistory(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]"); }
  catch { return []; }
}
function saveHistory(h: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h));
}
