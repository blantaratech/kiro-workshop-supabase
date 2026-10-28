import {createContext,useContext,useEffect,useState,type ReactNode} from 'react';
import type {Session} from '@supabase/supabase-js';
import type {User} from '../types/user';
import {getSupabase} from '../lib/supabase';
import {signupOutcome,validateRegistration} from '../lib/domain';
import {usersApi} from '../services/api';

interface AuthContextType {
  isAuthenticated:boolean;user:User|null;token:string|null;loading:boolean;error:string|null;
  login:(email:string,password:string)=>Promise<void>;
  register:(username:string,email:string,password:string,displayName:string)=>Promise<{confirmationRequired:boolean}>;
  logout:()=>Promise<void>;
}
const AuthContext=createContext<AuthContextType|undefined>(undefined);
export function AuthProvider({children}:{children:ReactNode}) {
  const [session,setSession]=useState<Session|null>(null);
  const [user,setUser]=useState<User|null>(null);
  const [ready,setReady]=useState(false);
  const [profileLoading,setProfileLoading]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const [revision,setRevision]=useState(0);
  useEffect(()=>{
    let mounted=true;let events=0;
    const client=getSupabase();
    const {data:{subscription}}=client.auth.onAuthStateChange((_event,next)=>{
      // Profile queries run outside this synchronous auth callback.
      events++;if(mounted){setSession(next);setReady(true);}
    });
    void client.auth.getSession().then(({data,error:sessionError})=>{
      if(!mounted || events>0)return;
      if(sessionError)setError(sessionError.message);
      setSession(data.session);setReady(true);
    }).catch(()=>{if(mounted){setError('Could not restore your session. Sign in again.');setReady(true);}});
    return ()=>{mounted=false;subscription.unsubscribe();};
  },[]);
  useEffect(()=>{
    let active=true;
    if(!session){setUser(null);setProfileLoading(false);return;}
    setProfileLoading(true);
    void usersApi.getProfile(session.user.id).then(({user:profile})=>{
      if(active){setUser(profile);setError(null);}
    }).catch((reason:unknown)=>{
      if(active){setUser(null);setError(reason instanceof Error?reason.message:'Could not load the profile. Check the database setup.');}
    }).finally(()=>{if(active)setProfileLoading(false);});
    return ()=>{active=false;};
  },[session,revision]);
  async function login(email:string,password:string) {
    setBusy(true);setError(null);
    try {
      const {data,error:loginError}=await getSupabase().auth.signInWithPassword({email:email.trim(),password});
      if(loginError)throw loginError;
      setSession(data.session);setRevision(value=>value+1);
    } catch(reason) {
      setError(reason instanceof Error?reason.message:'Login failed. Check your email, password and connection.');throw reason;
    } finally {setBusy(false);}
  }
  async function register(username:string,email:string,password:string,displayName:string) {
    setBusy(true);setError(null);
    try {
      const valid=validateRegistration(username,displayName);
      const {data,error:signupError}=await getSupabase().auth.signUp({
        email:email.trim(),password,options:{data:{username:valid.username,display_name:valid.displayName},emailRedirectTo:window.location.origin},
      });
      if(signupError)throw signupError;
      const outcome=signupOutcome(data);
      if(data.session)setSession(data.session);
      return outcome;
    } catch(reason) {
      setError(reason instanceof Error?reason.message:'Signup failed. Check the class setup guide.');throw reason;
    } finally {setBusy(false);}
  }
  async function logout() {
    setBusy(true);setError(null);
    try {
      const {error:logoutError}=await getSupabase().auth.signOut({scope:'local'});
      if(logoutError)throw logoutError;
      setSession(null);setUser(null);
    } catch(reason) {setError(reason instanceof Error?reason.message:'Could not sign out. Try again.');}
    finally {setBusy(false);}
  }
  return <AuthContext.Provider value={{isAuthenticated:!!session&&!!user,user,token:session?.access_token??null,
    loading:!ready||profileLoading||busy||(!!session&&!user&&!error),error,login,register,logout}}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const context=useContext(AuthContext);
  if(!context)throw new Error('useAuth must be used within AuthProvider.');
  return context;
}
