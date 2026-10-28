import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {marked} from 'marked';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const markdown=await fs.readFile(path.join(root,'STUDENT_SETUP_GUIDE.md'),'utf8');
const headings=[];
const renderer=new marked.Renderer();
renderer.heading=function({tokens,depth,text}){
  const id=text.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  if(depth===2)headings.push({id,text});
  return `<h${depth} id="${id}">${this.parser.parseInline(tokens)}</h${depth}>`;
};
const content=marked.parse(markdown,{renderer,gfm:true});
const css=`
:root{--ink:#241b35;--purple:#7040cf;--muted:#655d72;--line:#ded7ea;--bg:#f8f6fc}
*{box-sizing:border-box}html{scroll-behavior:smooth;scroll-padding-top:24px}body{margin:0;background:var(--bg);color:var(--ink);font:17px/1.7 system-ui,-apple-system,"Segoe UI",sans-serif}
.toolbar{background:#241b35;color:white;padding:18px 28px;display:flex;gap:24px;justify-content:space-between;align-items:center}.toolbar span{font-size:14px}.toolbar button{background:white;color:#241b35;border:0;padding:9px 15px;border-radius:4px;cursor:pointer}
.layout{display:grid;grid-template-columns:250px minmax(0,950px);gap:48px;max-width:1320px;margin:36px auto;padding:0 28px 80px}nav{position:sticky;top:24px;align-self:start;max-height:calc(100vh - 48px);overflow-y:auto;font-size:14px}nav strong{display:block;margin-bottom:12px}nav a{display:block;padding:7px 0;color:var(--muted);text-decoration:none;line-height:1.4}nav a:hover{color:var(--purple)}main{min-width:0;background:white;padding:40px 48px;border:1px solid var(--line)}h1{font-size:42px;line-height:1.15;letter-spacing:-1px;margin-top:0}h2{font-size:27px;line-height:1.3;color:var(--purple);border-top:1px solid var(--line);padding-top:30px;margin-top:44px}h3{font-size:21px;margin-top:28px}a{color:#6231b9;text-underline-offset:3px}p,li{overflow-wrap:anywhere}li{margin:7px 0}code{font:0.9em ui-monospace,Consolas,monospace;background:#f1edf8;padding:2px 5px;border-radius:3px}pre{position:relative;background:#251e32;color:#f5efff;padding:22px 20px;overflow:auto;line-height:1.6;border-radius:5px}pre code{background:none;padding:0;font-size:14px;white-space:pre}.copy{position:absolute;right:8px;top:8px;border:1px solid #88789a;color:white;background:#3b304b;padding:3px 8px;border-radius:3px;cursor:pointer;font-size:12px}.table-wrap{overflow-x:auto;margin:20px 0}table{width:100%;border-collapse:collapse;font-size:15px;line-height:1.55}th,td{border-bottom:1px solid var(--line);text-align:left;vertical-align:top;padding:12px 14px}th{background:#eee8f8;color:#49217f}th:first-child,td:first-child{min-width:160px}blockquote{border-left:4px solid var(--purple);margin:20px 0;padding:2px 18px;background:var(--bg)}input[type=checkbox]{margin-right:6px}ul.contains-task-list{padding-left:0;list-style:none}hr{border:0;border-top:1px solid var(--line)}
@media(max-width:1000px){.layout{grid-template-columns:1fr;gap:20px;margin-top:20px}nav{position:static;max-height:220px;border-bottom:1px solid var(--line);padding-bottom:16px}main{padding:28px}h1{font-size:34px}}
@media(max-width:540px){body{font-size:16px}.toolbar{padding:14px 18px}.toolbar span{display:none}.layout{padding:0 12px 40px}main{padding:24px 18px}h1{font-size:31px}h2{font-size:24px}th,td{padding:9px 10px;font-size:14px}pre{padding:36px 14px 18px}}
@media print{body{background:white;font-size:10.5pt;line-height:1.5}.toolbar,nav,.copy{display:none!important}.layout{display:block;max-width:none;margin:0;padding:0}main{border:0;padding:0}h1{font-size:27pt}h2{font-size:17pt;page-break-after:avoid;margin-top:24px;padding-top:16px}h3{page-break-after:avoid}pre{background:#f2eef8;color:#241b35;white-space:pre-wrap}pre code{white-space:pre-wrap;font-size:9pt}table{font-size:9pt}tr,pre{break-inside:avoid}a{color:#49217f}.table-wrap{overflow:visible} @page{size:A4;margin:18mm}}
`;
const toc=headings.map(h=>`<a href="#${h.id}">${h.text}</a>`).join('');
const js=`
document.querySelectorAll('table').forEach(table=>{const wrapper=document.createElement('div');wrapper.className='table-wrap';table.before(wrapper);wrapper.append(table)});
document.querySelectorAll('pre').forEach(pre=>{const b=document.createElement('button');b.className='copy';b.textContent='Copy';b.type='button';b.setAttribute('aria-label','Copy this command block');b.onclick=async()=>{const t=pre.querySelector('code').textContent;try{await navigator.clipboard.writeText(t);b.textContent='Copied';setTimeout(()=>b.textContent='Copy',1500)}catch{const selection=getSelection();const range=document.createRange();range.selectNodeContents(pre.querySelector('code'));selection.removeAllRanges();selection.addRange(range);b.textContent='Press Ctrl/Cmd+C'}};pre.append(b)});
`;
const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Kiro 101 — Student setup guide · Supabase edition</title><style>${css}</style></head><body><header class="toolbar"><strong>Kiro 101 · Student setup</strong><span>Supabase edition 1.0.0</span><button onclick="window.print()">Print / Save as PDF</button></header><div class="layout"><nav aria-label="Guide contents"><strong>On this page</strong>${toc}</nav><main>${content}</main></div><script>${js}</script></body></html>`;
await fs.writeFile(path.join(root,'STUDENT_SETUP_GUIDE.html'),html);
console.log('Created self-contained student guide.');
