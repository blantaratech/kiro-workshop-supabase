import {useState} from 'react';
import {configuration,getSupabase} from '../lib/supabase';
export default function ApiUrlDisplay() {
  const [status,setStatus]=useState('');
  const [checking,setChecking]=useState(false);
  async function check() {
    setChecking(true);setStatus('Checking…');
    try {
      const {data,error}=await getSupabase().rpc('workshop_status');
      if(error)throw error;
      if(data?.version!=='1.0.0')throw new Error('Unexpected database version. Run the SQL file from this kit.');
      setStatus('Connected — workshop database is ready.');
    } catch(reason) {
      setStatus(reason instanceof Error?reason.message:'Connection failed. Check the project URL, publishable key and schema.sql.');
    } finally {setChecking(false);}
  }
  return <footer className="connection-footer">
    <span>Supabase: {new URL(configuration.url).hostname}</span>{' '}
    <button type="button" onClick={()=>void check()} disabled={checking}>Check connection</button>
    <span role="status">{status}</span>
  </footer>;
}
