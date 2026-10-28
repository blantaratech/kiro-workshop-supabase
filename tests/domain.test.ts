import { describe, expect, it } from 'vitest';
import { readConfig } from '../frontend/src/lib/config';
import { validateRegistration, validatePost, parsePage, signupOutcome, toUser, toPost } from '../frontend/src/lib/domain';

describe('configuration is safe and useful before a student signs in', () => {
  it('explains missing configuration',()=>expect(readConfig({}).error).toMatch(/\.env\.local/));
  it.each(['http://demo.supabase.co','not-a-url','https://demo.supabase.co/rest/v1','https://user:pass@demo.supabase.co','https://demo.supabase.co?key=x'])(
    'rejects an incorrect project URL: %s',(url)=>expect(readConfig({VITE_SUPABASE_URL:url,VITE_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_example_class_key'}).error).toBeTruthy());
  it('rejects a placeholder URL',()=>expect(readConfig({VITE_SUPABASE_URL:'https://YOUR_PROJECT_REF.supabase.co',VITE_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_example_class_key'}).error).toBeTruthy());
  it('rejects secret keys',()=>expect(readConfig({VITE_SUPABASE_URL:'https://demo.supabase.co',VITE_SUPABASE_PUBLISHABLE_KEY:'sb_secret_do_not_use_here'}).error).toMatch(/secret/i));
  it('accepts and trims the public connection values',()=>expect(readConfig({VITE_SUPABASE_URL:' https://demo.supabase.co/ ',VITE_SUPABASE_PUBLISHABLE_KEY:' sb_publishable_example_class_key '}).url).toBe('https://demo.supabase.co'));
  it('rejects legacy service-role tokens',()=>{
    const payload=btoa(JSON.stringify({role:'service_role'}));
    expect(readConfig({VITE_SUPABASE_URL:'https://demo.supabase.co',VITE_SUPABASE_PUBLISHABLE_KEY:`eyJheader.${payload}.signature`}).error).toMatch(/secret|service/i);
  });
  it('accepts a legacy anon token only',()=>{
    const payload=btoa(JSON.stringify({role:'anon'}));
    expect(readConfig({VITE_SUPABASE_URL:'https://demo.supabase.co',VITE_SUPABASE_PUBLISHABLE_KEY:`eyJheader.${payload}.signature`}).error).toBeNull();
  });
  it.each(['random','eyJbad.invalid.signature','eyJbad.e30.signature','sb_publishable_'])('rejects malformed keys: %s',key=>expect(readConfig({VITE_SUPABASE_URL:'https://demo.supabase.co',VITE_SUPABASE_PUBLISHABLE_KEY:key}).error).toBeTruthy());
});
describe('observable workshop behavior',()=>{
  it('validates registration consistently',()=>{
    expect(validateRegistration(' Alice_1 ',' Alice ')).toEqual({username:'alice_1',displayName:'Alice'});
    for(const username of ['ab','invalid name','x'.repeat(25)])expect(()=>validateRegistration(username,'Alice')).toThrow(/username/i);
    for(const name of ['','  ','a'.repeat(65)])expect(()=>validateRegistration('alice',name)).toThrow(/display/i);
  });
  it('rejects blank and overlong posts, and preserves meaningful text',()=>{
    for(const value of ['', '   ','\n\t','a'.repeat(281)])expect(()=>validatePost(value)).toThrow();
    expect(validatePost('Hello class')).toBe('Hello class');
    expect(validatePost('a'.repeat(280))).toHaveLength(280);
  });
  it('bounds pagination and rejects modified cursors',()=>{
    expect(parsePage()).toEqual({limit:10,offset:0});
    expect(parsePage(99,'20')).toEqual({limit:50,offset:20});
    expect(parsePage(0)).toEqual({limit:1,offset:0});
    for(const cursor of ['-1','x','1e9','1000001'])expect(()=>parsePage(10,cursor)).toThrow(/page/i);
  });
  it('handles both signup outcomes without pretending email-confirmation is login',()=>{
    expect(signupOutcome({user:{id:'x'},session:null})).toEqual({confirmationRequired:true});
    expect(signupOutcome({user:{id:'x'},session:{access_token:'token'}})).toEqual({confirmationRequired:false});
    expect(()=>signupOutcome({user:null,session:null})).toThrow(/sign|account/i);
  });
  it('maps public profiles without leaking an email field',()=>{
    const user=toUser({id:'x',username:'alice',display_name:'Alice',bio:null,followers_count:'2',following_count:3,created_at:'today',updated_at:'today',email:'private@example.test'});
    expect(user).not.toHaveProperty('email');expect(user.displayName).toBe('Alice');expect(user.followersCount).toBe(2);expect(user.bio).toBe('');
    expect(toUser({id:'x',username:'alice',display_name:'Alice'}).followersCount).toBe(0);
  });
  it('maps feed records, not-yet-implemented comments remain zero',()=>{
    const p=toPost({id:'p',user_id:'u',content:'Hi',created_at:'now',updated_at:'now',likes_count:'3',liked:true});
    expect(p.userId).toBe('u');expect(p.likesCount).toBe(3);expect(p.liked).toBe(true);expect(p.commentsCount).toBe(0);
    expect(toPost({id:'p',user_id:'u',content:'Hi',created_at:'now'}).liked).toBe(false);
  });
});
