import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const require=createRequire(import.meta.url);
const vite=path.join(path.dirname(require.resolve('vite/package.json')),'bin/vite.js');
const cli=path.join(path.dirname(require.resolve('@playwright/test/package.json')),'cli.js');
const servers=[];
let result=1;
try {
  for(const [port,configured] of [[5173,true],[5174,false]]) {
    try {await fetch(`http://127.0.0.1:${port}`);throw new Error(`Port ${port} is in use. Stop your previous workshop dev server first.`);}
    catch(error){if(!String(error).includes('fetch failed'))throw error;}
    const server=spawn(process.execPath,[vite,'--host','127.0.0.1','--port',String(port),'--strictPort'],{
      cwd:path.join(root,'frontend'),stdio:'ignore',env:{...process.env,
        VITE_SUPABASE_URL:configured?'https://workshop-test.supabase.co':'',
        VITE_SUPABASE_PUBLISHABLE_KEY:configured?'sb_publishable_workshop_test_key':'',
      },
    });servers.push(server);
    let ready=false;
    for(let attempt=0;attempt<120;attempt++){
      if(server.exitCode!==null)throw new Error(`Test server exited on port ${port}.`);
      try{ready=(await fetch(`http://127.0.0.1:${port}`)).ok;}catch{ /* Starting. */ }
      if(ready)break;await new Promise(resolve=>setTimeout(resolve,250));
    }
    if(!ready)throw new Error(`Test server did not start on port ${port}.`);
  }
  const runner=spawn(process.execPath,[cli,'test',...process.argv.slice(2)],{cwd:root,stdio:'inherit',env:{...process.env,PW_EXTERNAL_SERVER:'1'}});
  result=await new Promise(resolve=>runner.on('exit',code=>resolve(code??1)));
} catch(error) {console.error(error.message);}
finally {for(const server of servers)server.kill('SIGTERM');}
process.exit(result);
