import { getSupabase } from '../lib/supabase';
import { parsePage, toPost, toUser, validatePost, type PostRow, type ProfileRow } from '../lib/domain';
import type { User } from '../types/user';

// Supabase's current session supplies identity to the database rules. The token
// argument preserves the call pattern used by the original workshop pages.
export const usersApi = {
  async getProfile(userId: string, _token?: string): Promise<{user: User}> {
    const {data,error}=await getSupabase().rpc('get_profiles',{target_ids:[userId]});
    if (error) throw new Error(`Could not load the profile: ${error.message}`);
    if (!data?.length) throw new Error('Profile not found. Run supabase/schema.sql before creating the app account.');
    return {user:toUser((data as ProfileRow[])[0])};
  },
  async updateProfile(userId:string, data:Pick<User,'displayName'|'bio'>, token?:string) {
    const display=data.displayName.trim();
    if (!display || display.length>64) throw new Error('Use a display name of 1–64 characters.');
    if ((data.bio??'').length>500) throw new Error('Keep your bio within 500 characters.');
    const {error}=await getSupabase().from('profiles').update({display_name:display,bio:data.bio??''}).eq('id',userId);
    if (error) throw new Error(error.message);
    return usersApi.getProfile(userId,token);
  },
  async followUser(userId:string,_token?:string) {
    const {data:{user},error:authError}=await getSupabase().auth.getUser();
    if (authError || !user) throw new Error('Sign in again to follow someone.');
    const {error}=await getSupabase().from('follows').insert({follower_id:user.id,followee_id:userId});
    if (error && error.code!=='23505') throw new Error(error.message);
  },
  async unfollowUser(userId:string,_token?:string) {
    const {data:{user},error:authError}=await getSupabase().auth.getUser();
    if (authError || !user) throw new Error('Sign in again to unfollow someone.');
    const {error}=await getSupabase().from('follows').delete().eq('follower_id',user.id).eq('followee_id',userId);
    if (error) throw new Error(error.message);
  },
  async checkFollowing(userId:string,_token?:string):Promise<{following:boolean}> {
    const {data:{user},error:authError}=await getSupabase().auth.getUser();
    if (authError || !user) throw new Error('Sign in again to check follow status.');
    const {data,error}=await getSupabase().from('follows').select('followee_id').eq('follower_id',user.id).eq('followee_id',userId).maybeSingle();
    if (error) throw new Error(error.message);
    return {following:!!data};
  },
};
export const postsApi = {
  async getPosts(_token:string,options:{limit?:number;nextToken?:string;sortBy?:'newest'|'popular';userId?:string}={}) {
    const {limit,offset}=parsePage(options.limit,options.nextToken);
    const {data,error}=await getSupabase().rpc('list_posts',{
      page_size:limit+1,page_offset:offset,sort_by:options.sortBy??'newest',author_id:options.userId??null,
    });
    if (error) throw new Error(`Could not load posts: ${error.message}`);
    const rows=(data??[]) as PostRow[];
    return {posts:rows.slice(0,limit).map(toPost),nextToken:rows.length>limit?String(offset+limit):null};
  },
  async createPost(content:string,_token?:string) {
    const valid=validatePost(content);
    const {data:{user},error:authError}=await getSupabase().auth.getUser();
    if (authError || !user) throw new Error('Sign in again to create a post.');
    const {data,error}=await getSupabase().from('posts').insert({user_id:user.id,content:valid}).select().single();
    if (error) throw new Error(error.message);
    return {post:toPost(data as PostRow)};
  },
  async likePost(postId:string,_token?:string) {
    const {data:{user},error:authError}=await getSupabase().auth.getUser();
    if (authError || !user) throw new Error('Sign in again to like a post.');
    const {error}=await getSupabase().from('likes').insert({user_id:user.id,post_id:postId});
    if (error && error.code!=='23505') throw new Error(error.message);
    return {added:!error};
  },
};
