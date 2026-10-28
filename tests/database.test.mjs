import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { beforeAll, afterAll, describe, expect, it } from 'vitest';

const alice = '11111111-1111-4111-8111-111111111111';
const bob = '22222222-2222-4222-8222-222222222222';
const post = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
let db;
async function as(role, id, sql, args = []) {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${id ?? ''}', false); set role ${role};`);
  try { return await db.query(sql, args); }
  finally { await db.exec('reset role'); }
}
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    create role anon nologin; create role authenticated nologin;
    create schema auth;
    create table auth.users(id uuid primary key, raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
    $$;
    grant usage on schema auth to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;
  `);
  const schema = await readFile(new URL('../supabase/schema.sql', import.meta.url), 'utf8').catch(() => '');
  await db.exec(schema);
});
afterAll(async () => { await db?.close(); });
describe('Postgres access rules and workshop behavior', () => {
  it('installs the schema and creates a profile when an auth user is added', async () => {
    await db.query('insert into auth.users(id, raw_user_meta_data) values ($1,$2),($3,$4)', [alice, {username:'alice',display_name:'Alice'}, bob, {username:'bob',display_name:'Bob'}]);
    const {rows} = await as('authenticated', alice, 'select * from public.get_profiles($1::uuid[])', [[alice,bob]]);
    expect(rows).toHaveLength(2);
    expect(rows.find(r=>r.id===alice).display_name).toBe('Alice');
    expect(rows[0]).not.toHaveProperty('email');
  });
  it('exposes only a setup status check to signed-out users', async () => {
    expect((await as('anon', null, 'select public.workshop_status() as status')).rows[0].status.version).toBe('1.0.0');
    await expect(as('anon', null, 'select * from public.profiles')).rejects.toThrow();
    await expect(as('anon', null, 'select * from public.posts')).rejects.toThrow();
    await expect(as('anon', null, 'select * from public.list_posts()')).rejects.toThrow();
  });
  it('lets a signed-in user create a post for their own identity', async () => {
    // The owner uses a privileged insert only to choose a deterministic test ID.
    await db.query('insert into public.posts(id,user_id,content) values ($1,$2,$3)',[post,alice,'Hello class']);
    await as('authenticated', alice, 'insert into public.posts(user_id,content) values ($1,$2)', [alice,'Second post']);
    const {rows}=await as('authenticated',bob,'select * from public.list_posts(10,0,\'newest\',null)');
    expect(rows).toHaveLength(2);
    expect(rows.find(r=>r.id===post).content).toBe('Hello class');
  });
  it('rejects an insert that impersonates another user', async () => {
    await expect(as('authenticated',bob,'insert into public.posts(user_id,content) values ($1,$2)',[alice,'Forged'])).rejects.toThrow();
  });
  it('rejects missing, blank, whitespace-only and over-limit post content', async () => {
    for (const content of [null,'','   ','\n\t','x'.repeat(281)]) {
      await expect(as('authenticated',alice,'insert into public.posts(user_id,content) values ($1,$2)',[alice,content])).rejects.toThrow();
    }
    await as('authenticated',alice,'insert into public.posts(user_id,content) values ($1,$2)',[alice,'x'.repeat(280)]);
  });
  it('prevents someone else from changing or deleting a post', async () => {
    expect((await as('authenticated',bob,'update public.posts set content=$1 where id=$2 returning id',['Changed',post])).rows).toHaveLength(0);
    expect((await as('authenticated',bob,'delete from public.posts where id=$1 returning id',[post])).rows).toHaveLength(0);
  });
  it('allows only the owner to update their own public profile fields', async () => {
    await as('authenticated',alice,'update public.profiles set display_name=$1,bio=$2 where id=$3',['Alice Updated','Learning',alice]);
    expect((await as('authenticated',bob,'update public.profiles set bio=$1 where id=$2 returning id',['Impersonation',alice])).rows).toHaveLength(0);
    await expect(as('authenticated',alice,'update public.profiles set id=$1 where id=$2',[bob,alice])).rejects.toThrow();
    await expect(as('authenticated',alice,'update public.profiles set username=$1 where id=$2',['admin',alice])).rejects.toThrow();
  });
  it('computes likes from unique records and records the current user correctly', async () => {
    await as('authenticated',bob,'insert into public.likes(user_id,post_id) values ($1,$2)',[bob,post]);
    await expect(as('authenticated',bob,'insert into public.likes(user_id,post_id) values ($1,$2)',[bob,post])).rejects.toThrow();
    const rows=(await as('authenticated',bob,'select * from public.list_posts(10,0,\'popular\',null)')).rows;
    expect(rows[0].id).toBe(post); expect(Number(rows[0].likes_count)).toBe(1); expect(rows[0].liked).toBe(true);
    await expect(as('authenticated',alice,'insert into public.likes(user_id,post_id) values ($1,$2)',[bob,post])).rejects.toThrow();
    expect((await as('authenticated',alice,'delete from public.likes where user_id=$1 returning user_id',[bob])).rows).toHaveLength(0);
  });
  it('computes follows and stops impersonation and self-following', async () => {
    await as('authenticated',bob,'insert into public.follows(follower_id,followee_id) values ($1,$2)',[bob,alice]);
    await expect(as('authenticated',bob,'insert into public.follows(follower_id,followee_id) values ($1,$2)',[bob,bob])).rejects.toThrow();
    await expect(as('authenticated',alice,'insert into public.follows(follower_id,followee_id) values ($1,$2)',[bob,alice])).rejects.toThrow();
    const rows=(await as('authenticated',alice,'select * from public.get_profiles($1::uuid[])',[[alice,bob]])).rows;
    expect(Number(rows.find(r=>r.id===alice).followers_count)).toBe(1);
    expect(Number(rows.find(r=>r.id===bob).following_count)).toBe(1);
  });
  it('requires a real session identity even if the database role is authenticated', async () => {
    expect((await as('authenticated',null,'select * from public.profiles')).rows).toHaveLength(0);
    await expect(as('authenticated',null,'insert into public.posts(user_id,content) values ($1,$2)',[alice,'No identity'])).rejects.toThrow();
  });
  it('limits results, filters by author and supports page offsets', async () => {
    expect((await as('authenticated',alice,'select * from public.list_posts(1,0,\'newest\',$1)',[bob])).rows).toHaveLength(0);
    const first=(await as('authenticated',alice,'select * from public.list_posts(1,0,\'newest\',$1)',[alice])).rows;
    const second=(await as('authenticated',alice,'select * from public.list_posts(1,1,\'newest\',$1)',[alice])).rows;
    expect(first).toHaveLength(1);expect(second).toHaveLength(1);expect(first[0].id).not.toBe(second[0].id);
  });
  it('does not allow clients to change server-managed IDs or timestamps', async () => {
    await expect(as('authenticated',alice,'update public.posts set user_id=$1 where id=$2',[bob,post])).rejects.toThrow();
    await expect(as('authenticated',alice,'insert into public.posts(id,user_id,content) values ($1,$2,$3)',[post,alice,'With custom ID'])).rejects.toThrow();
  });
  it('allows rerunning setup without deleting existing posts', async () => {
    const schema=await readFile(new URL('../supabase/schema.sql',import.meta.url),'utf8');
    await db.exec(schema);
    expect(Number((await db.query('select count(*) as n from public.posts')).rows[0].n)).toBe(3);
  });
});
