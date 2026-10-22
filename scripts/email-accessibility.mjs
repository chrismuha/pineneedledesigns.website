export const escapeEmailHtml = (value) => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);

export function emailDocument(title, content) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeEmailHtml(title)}</title></head><body style="margin:0;background:#fff;color:#17212b;"><main style="max-width:800px;margin:auto;padding:24px;font-family:Arial,Helvetica,sans-serif;font-size:22px;line-height:1.6;overflow-wrap:anywhere;word-break:break-word;"><h1 style="font-size:34px;line-height:1.3;">${escapeEmailHtml(title)}</h1>${content}</main></body></html>`;
}

export function textEmailHtml(title, text) {
  const content = String(text || '').split(/\n\s*\n/).map(block => '<p>' + block.split('\n').map(line => {
    if (/^\s*-\s/.test(line)) return '<strong>' + escapeEmailHtml(line) + '</strong>';
    const colon = line.indexOf(': ');
    return colon > 0 ? '<strong>' + escapeEmailHtml(line.slice(0, colon + 1)) + '</strong> ' + escapeEmailHtml(line.slice(colon + 2)) : escapeEmailHtml(line);
  }).join('<br>') + '</p>').join('');
  return emailDocument(title, content);
}
