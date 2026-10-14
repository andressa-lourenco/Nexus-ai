import { Fragment, type ReactNode } from "react";

/**
 * Minimal, safe Markdown renderer for model answers (no HTML injection).
 * Supports paragraphs, headings, bullet/numbered lists, **bold**, *italic*, `code`
 * and turns citation markers like [1] or [1, 2] into interactive chips.
 */
export function Markdown({ text, renderCitation }: { text: string; renderCitation: (n: number, key: string) => ReactNode }) {
  const blocks = text.replace(/\r\n/g, "\n").split(/\n{2,}/);

  const inline = (value: string, keyPrefix: string): ReactNode[] => {
    const nodes: ReactNode[] = [];
    const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*\s][^*]*\*|\[\d+(?:\s*[,;]\s*\d+)*\])/g;
    let last = 0;
    let i = 0;
    for (const match of value.matchAll(pattern)) {
      const token = match[0];
      if (match.index > last) nodes.push(value.slice(last, match.index));
      const key = `${keyPrefix}-${i++}`;
      if (token.startsWith("**")) nodes.push(<strong key={key} className="font-semibold text-mist-50">{token.slice(2, -2)}</strong>);
      else if (token.startsWith("`")) nodes.push(<code key={key} className="rounded bg-violet-200/[0.07] px-1 py-0.5 font-mono text-[0.85em] text-violet-100">{token.slice(1, -1)}</code>);
      else if (token.startsWith("[")) {
        const nums = token.slice(1, -1).split(/[,;]/).map((n) => Number(n.trim()));
        const chips = nums.map((n, j) => renderCitation(n, `${key}-${j}`)).filter(Boolean);
        const prev = nodes.at(-1);
        if (chips.length) nodes.push(<Fragment key={key}>{chips}</Fragment>);
        else if (typeof prev === "string") nodes[nodes.length - 1] = prev.trimEnd();
      } else nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
      last = match.index + token.length;
    }
    if (last < value.length) nodes.push(value.slice(last));
    return nodes;
  };

  return (
    <div className="space-y-3 text-[14.5px] leading-relaxed text-mist-200">
      {blocks.map((block, b) => {
        const lines = block.split("\n").filter((l) => l.trim());
        if (lines.length === 0) return null;
        const heading = /^(#{1,4})\s+(.*)$/.exec(lines[0]);
        if (heading && lines.length === 1) {
          return <h3 key={b} className="pt-1 text-[15px] font-semibold text-mist-50">{inline(heading[2], `h${b}`)}</h3>;
        }
        if (lines.every((l) => /^\s*[-*•]\s+/.test(l))) {
          return (
            <ul key={b} className="space-y-1.5 pl-1">
              {lines.map((l, i) => (
                <li key={i} className="flex gap-2.5"><span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-violet-400" /><span>{inline(l.replace(/^\s*[-*•]\s+/, ""), `u${b}-${i}`)}</span></li>
              ))}
            </ul>
          );
        }
        if (lines.every((l) => /^\s*\d+[.)]\s+/.test(l))) {
          return (
            <ol key={b} className="space-y-1.5 pl-1">
              {lines.map((l, i) => (
                <li key={i} className="flex gap-2.5"><span className="font-mono text-xs leading-[1.9] text-violet-300">{i + 1}.</span><span>{inline(l.replace(/^\s*\d+[.)]\s+/, ""), `o${b}-${i}`)}</span></li>
              ))}
            </ol>
          );
        }
        return (
          <p key={b}>
            {lines.map((l, i) => (
              <Fragment key={i}>{i > 0 && <br />}{inline(l.replace(/^#{1,4}\s+/, ""), `p${b}-${i}`)}</Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
