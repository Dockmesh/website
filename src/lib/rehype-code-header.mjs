// Wraps every highlighted <pre> in a frame with a header bar (language label
// + copy button), so the button sits above the code instead of over it.

export const LANG_LABELS = {
  sh: 'shell', bash: 'shell', shell: 'shell', console: 'shell', zsh: 'shell',
  yml: 'yaml', yaml: 'yaml', json: 'json', jsonc: 'json', toml: 'toml', ini: 'ini',
  caddyfile: 'caddyfile', dockerfile: 'dockerfile', go: 'go', js: 'javascript', ts: 'typescript',
  text: 'text', plaintext: 'text', txt: 'text', http: 'http', sql: 'sql', env: 'env', powershell: 'powershell',
};

export const langLabel = (lang) => LANG_LABELS[lang] ?? lang ?? 'text';

function langOf(pre) {
  if (pre.properties?.dataLanguage) return pre.properties.dataLanguage;
  const code = pre.children?.find((c) => c.tagName === 'code');
  const cls = [].concat(code?.properties?.className ?? []).find((c) => String(c).startsWith('language-'));
  return cls ? String(cls).slice(9) : 'text';
}

function frame(pre) {
  const lang = langOf(pre);
  return {
    type: 'element',
    tagName: 'div',
    properties: { className: ['dm-code'] },
    children: [
      {
        type: 'element',
        tagName: 'div',
        properties: { className: ['dm-code-head'] },
        children: [
          { type: 'element', tagName: 'span', properties: { className: ['dm-code-lang'] }, children: [{ type: 'text', value: langLabel(lang) }] },
          {
            type: 'element',
            tagName: 'button',
            properties: { type: 'button', className: ['dm-copy'], dataCopy: '', ariaLabel: 'Copy code' },
            children: [{ type: 'text', value: 'Copy' }],
          },
        ],
      },
      pre,
    ],
  };
}

export function rehypeCodeHeader() {
  const walk = (node) => {
    if (!node.children) return;
    node.children = node.children.map((child) => {
      if (child.type === 'element' && child.tagName === 'pre') {
        return frame(child);
      }
      // Docs tables scroll sideways on small screens; keyboard users need to reach them.
      if (child.type === 'element' && child.tagName === 'table') {
        child.properties = { ...child.properties, tabIndex: 0 };
      }
      walk(child);
      return child;
    });
  };
  return (tree) => walk(tree);
}
