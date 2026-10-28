import type { User } from '../types/user';
import type { Post } from '../types/post';
export function validateRegistration(username: string, displayName: string) {
  const name=username.trim().toLowerCase();
  if (!/^[a-z0-9_]{3,24}$/.test(name)) throw new Error('Use a username of 3–24 lowercase letters, numbers or underscores.');
  const display=displayName.trim();
  if (!display || display.length>64) throw new Error('Use a display name of 1–64 characters.');
  return {username:name,displayName:display};
}
export function validatePost(content: string) {
  if (!content.trim()) throw new Error('Post content cannot be empty.');
  if (content.length>280) throw new Error('Post content cannot exceed 280 characters.');
  return content;
}
export function parsePage(limit=10,cursor?:string) {
  if (cursor !== undefined && (!/^\d+$/.test(cursor) || Number(cursor)>1000000)) throw new Error('This page cursor is invalid. Refresh the feed.');
  return {limit:Math.min(50,Math.max(1,Math.floor(limit))),offset:Number(cursor ?? 0)};
}
export function signupOutcome(data: {user: unknown; session: unknown}) {
  if (!data.user) throw new Error('The account was not created. Check the signup settings and try again.');
  return {confirmationRequired:!data.session};
}
export interface ProfileRow {
  id:string;username:string;display_name:string;bio?:string|null;
  created_at?:string;updated_at?:string;followers_count?:number|string;following_count?:number|string;
}
export function toUser(row: ProfileRow): User {
  return {id:row.id,username:row.username,displayName:row.display_name,bio:row.bio??'',
    createdAt:row.created_at,updatedAt:row.updated_at,
    followersCount:Number(row.followers_count??0),followingCount:Number(row.following_count??0)};
}
export interface PostRow {
  id:string;user_id:string;content:string;created_at:string;updated_at?:string;
  likes_count?:number|string;liked?:boolean;
}
export function toPost(row:PostRow):Post {
  return {id:row.id,userId:row.user_id,content:row.content,createdAt:row.created_at,
    updatedAt:row.updated_at??row.created_at,likesCount:Number(row.likes_count??0),liked:row.liked??false,commentsCount:0};
}
