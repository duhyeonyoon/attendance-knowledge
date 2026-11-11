// KB 상위 폴더의 .md 파일을 원본 그대로 읽어 Starlight 'docs' 컬렉션으로 넣는 로더.
// - 원본 파일은 수정하지 않음 (Claude용 KB와 동일한 원본을 공유)
// - 첫 번째 `# 제목` → 페이지 title 로 사용 (본문에서는 제거)
// - 문서 간 `xxx.md` 링크 → 사이트 경로로 변환
// - _learnings/ 는 최신 날짜가 위로 오도록 정렬
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

// 사이트에 노출하지 않을 폴더 (KB 루트 기준)
const EXCLUDE_DIRS = new Set(['site', 'skill', '_meta', 'node_modules', '.git', '.obsidian', '_archive', '_legacy']);

const slugSegment = (s) => s.trim().toLowerCase().replace(/\s+/g, '-');

export function toId(relPath) {
  const noExt = relPath.replace(/\.md$/i, '');
  return noExt.split('/').map(slugSegment).join('/');
}

function walk(dir, base, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name.startsWith('.')) continue;
    const abs = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (EXCLUDE_DIRS.has(ent.name)) continue;
      walk(abs, base, out);
    } else if (ent.isFile() && ent.name.toLowerCase().endsWith('.md')) {
      out.push(path.relative(base, abs).split(path.sep).join('/'));
    }
  }
  return out;
}

function splitFrontmatter(src) {
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { data: {}, body: src };
  let data = {};
  try { data = YAML.parse(m[1]) ?? {}; } catch { data = {}; }
  return { data, body: src.slice(m[0].length) };
}

function extractTitle(body) {
  const lines = body.split(/\r?\n/);
  let inFence = false;
  for (let i = 0; i < lines.length; i++) {
    if (/^(```|~~~)/.test(lines[i])) inFence = !inFence;
    if (inFence) continue;
    const m = lines[i].match(/^#\s+(.+?)\s*#*\s*$/);
    if (m) {
      lines.splice(i, 1);
      return { title: m[1].replace(/[`*_]/g, ''), body: lines.join('\n') };
    }
    if (lines[i].trim() && !lines[i].startsWith('>')) break; // 본문이 먼저 나오면 H1 없음으로 간주
  }
  return { title: null, body };
}

// GFM은 `~` 하나도 취소선으로 처리 → "09~18" 같은 범위 표기가 깨짐. 코드 밖의 단일 ~ 만 이스케이프.
function escapeSingleTilde(body) {
  let inFence = false;
  return body.split('\n').map((line) => {
    if (/^\s*(```|~~~)/.test(line)) { inFence = !inFence; return line; }
    if (inFence) return line;
    return line.split(/(`+[^`]*`+)/).map((seg, i) => (i % 2 ? seg : seg.replace(/(?<![~\\])~(?!~)/g, '\\~'))).join('');
  }).join('\n');
}

// 본문의 `product/xxx.md`, `KB:product/xxx.md` 같은 인라인 코드 경로 → 클릭 가능한 링크
function linkInlinePaths(body, known) {
  let inFence = false;
  return body.split('\n').map((line) => {
    if (/^\s*(```|~~~)/.test(line)) { inFence = !inFence; return line; }
    if (inFence) return line;
    return line.replace(/(?<!\[)`(?:KB:|attendance-knowledge\/)?([^`\s]+?\.md)`(?!\])/g, (all, p) => {
      const rel = p.replace(/^\.\//, '');
      if (!known.has(rel)) return all;
      const id = toId(rel);
      return `[${all}](${id === 'index' ? '/' : `/${id}/`})`;
    });
  }).join('\n');
}

function rewriteLinks(body, relPath, base, known, logger) {
  const dir = path.posix.dirname(relPath);
  return body.replace(/\]\((?!https?:|mailto:|#)(<)?([^)\s>]+?\.md)(#[^)\s>]*)?(>)?((?:\s+"[^"]*")?)\)/gi,
    (all, lt, target, hash = '', gt, titlePart) => {
      const decoded = decodeURI(target).replace(/^\.\//, '');
      const candidates = [path.posix.normalize(path.posix.join(dir, decoded)), path.posix.normalize(decoded)];
      const hit = candidates.find((c) => known.has(c));
      if (!hit) {
        logger?.warn(`링크 대상 없음: ${relPath} → ${target}`);
        return all;
      }
      const id = toId(hit);
      const href = id === 'index' ? '/' : `/${id}/`;
      return `](${href}${hash ?? ''}${titlePart ?? ''})`;
    });
}

// KB 페이지(product/…) ↔ 기능 명세서(spec/…) 상호 링크. 경로가 1:1 미러 (spec/README.md 참고)
function crossLinkNotice(rel, fm, known) {
  const href = (p) => `/${toId(p)}/`;
  if (rel.startsWith('product/')) {
    const spec = rel.replace(/^product\//, 'spec/');
    if (known.has(spec)) return `> 📄 이 화면의 **기능 명세서** → [명세서 보기](${href(spec)})\n\n`;
  } else if (rel.startsWith('spec/')) {
    const kb = typeof fm.kb === 'string' ? fm.kb : rel.replace(/^spec\//, 'product/');
    if (known.has(kb)) return `> 📘 코드 위치·API·데이터 모델은 **KB** → [KB 보기](${href(kb)})\n\n`;
  }
  return '';
}

export function kbLoader({ base = '..' } = {}) {
  return {
    name: 'kb-loader',
    load: async ({ config, store, parseData, renderMarkdown, generateDigest, logger, watcher }) => {
      const root = fileURLToPath(config.root);
      const kbRoot = path.resolve(root, base);

      const sync = async () => {
        const files = walk(kbRoot, kbRoot);
        const known = new Set(files);
        store.clear();
        for (const rel of files) {
          const abs = path.join(kbRoot, rel);
          const raw = fs.readFileSync(abs, 'utf8');
          const { data: fm, body: afterFm } = splitFrontmatter(raw);
          const { title, body: noH1 } = fm.title ? { title: fm.title, body: afterFm } : extractTitle(afterFm);
          const body = crossLinkNotice(rel, fm, known) + linkInlinePaths(rewriteLinks(escapeSingleTilde(noH1), rel, kbRoot, known, logger), known);
          const id = toId(rel);
          const fileName = path.posix.basename(rel, '.md');

          const data = { ...fm, title: title ?? fileName };
          const sidebar = { ...(fm.sidebar ?? {}) };
          if (/^readme$/i.test(fileName)) { sidebar.order ??= 0; sidebar.label ??= '폴더 안내'; }
          const date = fileName.match(/^(\d{4})-(\d{2})-(\d{2})/);
          if (date) {
            sidebar.order ??= 99999999 - Number(date.slice(1).join('')); // 최신순
            sidebar.label ??= `${date[2]}.${date[3]} · ${data.title.replace(/^\d{4}-\d{2}-\d{2}\s*[—–-]?\s*/, '')}`;
          }
          data.sidebar = sidebar;
          if (!data.lastUpdated) data.lastUpdated = fs.statSync(abs).mtime;

          const parsed = await parseData({ id, data, filePath: abs });
          store.set({
            id,
            data: parsed,
            body,
            filePath: path.relative(root, abs).split(path.sep).join('/'),
            digest: generateDigest(raw),
            rendered: await renderMarkdown(body),
          });
        }
        logger.info(`KB 문서 ${files.length}개 로드`);
      };

      await sync();

      if (watcher) {
        watcher.add(kbRoot);
        let timer;
        const onChange = (p) => {
          if (!p.endsWith('.md') || !p.startsWith(kbRoot) || p.startsWith(root)) return;
          clearTimeout(timer);
          timer = setTimeout(() => sync().catch((e) => logger.error(String(e))), 150);
        };
        watcher.on('change', onChange);
        watcher.on('add', onChange);
        watcher.on('unlink', onChange);
      }
    },
  };
}
