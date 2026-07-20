/* supabase-auth-runtime.js — Stage 10A+B.2 shared anonymous Supabase Auth.
   One persisted session and one in-flight auth request are shared by Expenses and Moments. */
(function(root){
  'use strict';

  const config=root.SYNC_CONFIG||{};
  const storage=root.STORAGE?.local;
  const SESSION_KEY='travel_engine_supabase_anon_session_v1';
  const state={inFlight:null,lastError:null};

  function readJSON(key,fallback){
    try{return storage?.readJSON?storage.readJSON(key,fallback):(JSON.parse(localStorage.getItem(key)||'null')??fallback);}
    catch(e){return fallback;}
  }
  function writeJSON(key,value){
    try{if(storage?.writeJSON)storage.writeJSON(key,value);else localStorage.setItem(key,JSON.stringify(value));}catch(e){}
  }
  function clearSession(){
    try{if(storage?.remove)storage.remove(SESSION_KEY);else localStorage.removeItem(SESSION_KEY);}catch(e){}
  }
  function configured(){return !!(config.enabled&&config.url&&config.anonKey);}
  function sessionValid(session){
    if(!session?.access_token||!session?.refresh_token)return false;
    const expiresAt=Number(session.expires_at||0)*1000;
    return !expiresAt||expiresAt>Date.now()+60000;
  }
  function headers(){
    return {
      apikey:config.anonKey,
      Authorization:`Bearer ${config.anonKey}`,
      'Content-Type':'application/json'
    };
  }
  async function request(path,body){
    const response=await fetch(config.url.replace(/\/$/,'')+path,{
      method:'POST',
      headers:headers(),
      body:JSON.stringify(body)
    });
    const raw=await response.text();
    let data={};
    try{data=raw?JSON.parse(raw):{};}catch(e){data={message:raw};}
    if(!response.ok){
      const message=data?.msg||data?.message||data?.error_description||data?.error||`Supabase Auth ${response.status}`;
      const error=new Error(message);
      error.status=response.status;
      error.code=data?.code||data?.error_code||null;
      error.details=data;
      throw error;
    }
    return data;
  }
  async function refresh(session){
    return request('/auth/v1/token?grant_type=refresh_token',{refresh_token:session.refresh_token});
  }
  async function signInAnonymously(){
    // Exact request shape used by supabase-js auth.signInAnonymously().
    return request('/auth/v1/signup',{
      data:{},
      gotrue_meta_security:{}
    });
  }
  async function getSession(){
    if(!configured())throw new Error('Supabase sync is not configured');
    const existing=readJSON(SESSION_KEY,null);
    if(sessionValid(existing))return existing;
    if(state.inFlight)return state.inFlight;

    state.inFlight=(async()=>{
      let session=existing;
      if(session?.refresh_token){
        try{
          session=await refresh(session);
          if(!session?.access_token)throw new Error('Supabase refresh returned no access token');
          writeJSON(SESSION_KEY,session);
          state.lastError=null;
          return session;
        }catch(error){
          clearSession();
        }
      }
      session=await signInAnonymously();
      if(!session?.access_token||!session?.refresh_token){
        throw new Error('Supabase anonymous sign-in returned no session');
      }
      writeJSON(SESSION_KEY,session);
      state.lastError=null;
      return session;
    })().catch(error=>{
      state.lastError=error;
      throw error;
    }).finally(()=>{state.inFlight=null;});

    return state.inFlight;
  }

  root.SUPABASE_AUTH=Object.freeze({getSession,clearSession,isConfigured:configured,getLastError:()=>state.lastError});
})(globalThis);
