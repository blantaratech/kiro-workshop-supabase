import {configuration} from '../lib/supabase';
export default function SetupNotice() {
  return <main className="setup-notice">
    <h1>Connect your Supabase project</h1>
    <p>{configuration.error}</p>
    <ol><li>Create your own Supabase project and run <code>supabase/schema.sql</code>.</li>
      <li>Copy <code>frontend/.env.example</code> to <code>frontend/.env.local</code>.</li>
      <li>Add the Project URL and publishable key from the project’s Connect panel.</li>
      <li>Stop the terminal with Ctrl+C, then run <code>npm run dev</code> again.</li></ol>
    <p>Follow kiro-101/STUDENT_SETUP_GUIDE.html included with this kit. Use a publishable key; keep secret keys out of the frontend.</p>
  </main>;
}
