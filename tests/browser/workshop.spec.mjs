// These tests simulate Supabase HTTP responses. They never contact a cloud project.
import {test,expect} from '@playwright/test';
const id='11111111-1111-4111-8111-111111111111';
const bob='22222222-2222-4222-8222-222222222222';
const user={id,email:'student@example.test',aud:'authenticated',role:'authenticated',created_at:'2026-10-26T00:00:00Z',app_metadata:{provider:'email'},user_metadata:{username:'student',display_name:'Student'},identities:[]};
function session() {
  const exp=Math.floor(Date.now()/1000)+3600;
  const encode=value=>Buffer.from(JSON.stringify(value)).toString('base64url');
  return {access_token:`${encode({alg:'HS256',typ:'JWT'})}.${encode({sub:id,aud:'authenticated',role:'authenticated',exp})}.synthetic-test-signature`,refresh_token:'synthetic-test-refresh',token_type:'bearer',expires_in:3600,expires_at:exp,user};
}
async function fixture(page,{confirm=false,rejectLogin=false,failPost=false,missingSchema=false}={}) {
  const posts=[];let display='Student';let following=false;
  const requests=[];
  await page.route('**/*',async route=>{
    const url=new URL(route.request().url());
    if(['127.0.0.1','localhost'].includes(url.hostname))return route.continue();
    if(url.hostname!=='workshop-test.supabase.co')return route.abort();
    const body=route.request().postDataJSON(); requests.push({path:url.pathname,method:route.request().method(),body});
    const json=(data,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
    if(url.pathname==='/auth/v1/token')return rejectLogin?json({code:'invalid_credentials',msg:'Invalid login credentials'},400):json(session());
    if(url.pathname==='/auth/v1/signup')return json(confirm?{user,session:null}:session());
    if(url.pathname==='/auth/v1/user')return json(user);
    if(url.pathname==='/auth/v1/logout')return route.fulfill({status:204});
    if(url.pathname==='/rest/v1/rpc/workshop_status')return missingSchema?json({code:'PGRST202',message:'Could not find workshop_status'},404):json({version:'1.0.0',backend:'supabase'});
    if(url.pathname==='/rest/v1/rpc/get_profiles')return json(body.target_ids.map(uid=>({id:uid,username:uid===id?'student':'bob',display_name:uid===id?display:'Bob',bio:'',followers_count:uid===bob&&following?1:0,following_count:uid===id&&following?1:0})));
    if(url.pathname==='/rest/v1/rpc/list_posts')return json(posts.filter(p=>!body.author_id||p.user_id===body.author_id).slice(body.page_offset,body.page_offset+body.page_size));
    if(url.pathname==='/rest/v1/posts'&&route.request().method()==='POST'){
      if(failPost)return json({message:'Workshop test: database unavailable'},503);
      const post={id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',user_id:body.user_id,content:body.content,created_at:new Date().toISOString(),updated_at:new Date().toISOString(),likes_count:0,liked:false};posts.unshift(post);return json(post,201);
    }
    if(url.pathname==='/rest/v1/likes'){
      posts[0].liked=true;posts[0].likes_count=1;return route.fulfill({status:201});
    }
    if(url.pathname==='/rest/v1/profiles'&&route.request().method()==='PATCH'){display=body.display_name;return route.fulfill({status:204});}
    if(url.pathname==='/rest/v1/follows'){
      if(route.request().method()==='POST'){following=true;return route.fulfill({status:201});}
      if(route.request().method()==='DELETE'){following=false;return route.fulfill({status:204});}
      return json(following?[{followee_id:bob}]:[]);
    }
    return json({message:`Unmocked test endpoint ${url.pathname}`},404);
  });
  return {requests};
}
async function login(page) {
  await page.goto('/login');
  await page.getByLabel('Email',{exact:true}).fill(user.email);
  await page.getByLabel('Password',{exact:true}).fill('synthetic-test-password');
  await page.getByRole('button',{name:'Login',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Recent',exact:true})).toBeVisible();
}
test('missing configuration shows the student setup steps',async({page})=>{
  await page.goto('http://127.0.0.1:5174');
  await expect(page.getByRole('heading',{name:'Connect your Supabase project'})).toBeVisible();
  await expect(page.getByText('frontend/.env.local',{exact:true})).toBeVisible();
});
test('connection check confirms the schema before login',async({page})=>{
  await fixture(page);await page.goto('/login');
  await page.getByRole('button',{name:'Check connection'}).click();
  await expect(page.getByRole('status')).toContainText('database is ready');
});
test('a missing schema does not report a successful connection',async({page})=>{
  await fixture(page,{missingSchema:true});await page.goto('/login');
  await page.getByRole('button',{name:'Check connection'}).click();
  await expect(page.getByRole('status')).not.toContainText('database is ready');
  await expect(page.getByRole('status')).not.toContainText('Checking');
});
test('login uses email, restores after refresh, and signs out',async({page})=>{
  const state=await fixture(page);await login(page);
  expect(state.requests.find(r=>r.path==='/auth/v1/token').body.email).toBe(user.email);
  await page.reload();await expect(page.getByRole('heading',{name:'Recent',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Logout',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Login',exact:true})).toBeVisible();
  await page.reload();await expect(page.getByRole('heading',{name:'Login',exact:true})).toBeVisible();
});
test('signup that requires confirmation explains the next step',async({page})=>{
  await fixture(page,{confirm:true});await page.goto('/register');
  await page.getByLabel('Username',{exact:true}).fill('student');
  await page.getByLabel('Email',{exact:true}).fill(user.email);
  await page.getByLabel('Display Name',{exact:true}).fill('Student');
  await page.getByLabel('Password',{exact:true}).fill('synthetic-test-password');
  await page.getByLabel('Confirm Password',{exact:true}).fill('synthetic-test-password');
  await page.getByRole('button',{name:'Register',exact:true}).click();
  await expect(page.getByText(/Account created. Confirm your email/)).toBeVisible();
  await expect(page.getByRole('heading',{name:'Recent',exact:true})).toHaveCount(0);
});
test('workshop signup with immediate session enters the feed',async({page})=>{
  await fixture(page);await page.goto('/register');
  for(const [label,value] of [['Username','student'],['Email',user.email],['Display Name','Student'],['Password','synthetic-test-password'],['Confirm Password','synthetic-test-password']])await page.getByLabel(label,{exact:true}).fill(value);
  await page.getByRole('button',{name:'Register',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Recent',exact:true})).toBeVisible();
});
test('a post persists across refresh and a like is reflected',async({page})=>{
  await fixture(page);await login(page);
  await page.getByRole('link',{name:'New Post',exact:true}).click();
  await expect(page.getByRole('button',{name:'Cancel',exact:true})).toHaveCount(0);
  await page.getByLabel("What's on your mind?").fill('Hello from the workshop');
  await page.getByRole('button',{name:'Post',exact:true}).click();
  await expect(page.getByText('Hello from the workshop',{exact:true})).toBeVisible();
  await page.reload();await expect(page.getByText('Hello from the workshop',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'0 Likes',exact:true}).click();
  await expect(page.getByRole('button',{name:'1 Like',exact:true})).toBeDisabled();
});
test('failed posting preserves the typed draft and explains the failure',async({page})=>{
  await fixture(page,{failPost:true});await login(page);
  await page.getByRole('link',{name:'New Post',exact:true}).click();
  await page.getByLabel("What's on your mind?").fill('Keep my draft');
  await page.getByRole('button',{name:'Post',exact:true}).click();
  await expect(page.getByText('Workshop test: database unavailable')).toBeVisible();
  await expect(page.getByLabel("What's on your mind?")).toHaveValue('Keep my draft');
});
test('invalid login shows an error without opening the feed',async({page})=>{
  await fixture(page,{rejectLogin:true});await page.goto('/login');
  await page.getByLabel('Email',{exact:true}).fill(user.email);
  await page.getByLabel('Password',{exact:true}).fill('synthetic-test-password');
  await page.getByRole('button',{name:'Login',exact:true}).click();
  await expect(page.getByText('Invalid login credentials',{exact:true})).toBeVisible();
});
test('profile editing and follow/unfollow are usable',async({page})=>{
  await fixture(page);await login(page);
  await page.getByRole('link',{name:'Profile',exact:true}).click();
  await page.getByRole('button',{name:'Edit Profile'}).click();
  await page.getByLabel('Display Name').fill('Student Updated');
  await page.getByRole('button',{name:'Save',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Student Updated',exact:true})).toBeVisible();
  await page.goto(`/profile/${bob}`);
  await page.getByRole('button',{name:'Follow',exact:true}).click();
  await expect(page.getByRole('button',{name:'Unfollow',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Unfollow',exact:true}).click();
  await expect(page.getByRole('button',{name:'Follow',exact:true})).toBeVisible();
});
test('login and setup guidance fit a narrow student screen',async({page})=>{
  await fixture(page);await page.setViewportSize({width:390,height:844});await page.goto('/login');
  await expect(page.getByRole('heading',{name:'Login',exact:true})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
