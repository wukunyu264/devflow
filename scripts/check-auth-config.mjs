import nextEnv from '@next/env';
import {backendConfig} from '../src/lib/backend.ts';

nextEnv.loadEnvConfig(process.cwd(),true,{info(){},error(){}});
try {
  const config=backendConfig();
  if (config.backend !== 'supabase') {
    console.log('LOCAL: email confirmation is not used. Configure Supabase to check cloud registration.');
  } else {
    const response=await fetch(new URL('/auth/v1/settings',config.url),{
      headers:{apikey:config.key},signal:AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error('settings_unavailable');
    const settings=await response.json();
    console.log(JSON.stringify({signupEnabled:settings.disable_signup === false,
      emailProviderEnabled:settings.external?.email === true,
      emailConfirmationRequired:settings.mailer_autoconfirm === false},null,2));
    console.log('Read-only check. No accounts created, emails sent, or credentials printed.');
    if (settings.disable_signup !== false || settings.external?.email !== true) {
      console.error('ACTION: enable email signup in Supabase Authentication > Sign In / Providers.');
      process.exitCode=1;
    } else if (settings.mailer_autoconfirm === false) {
      console.log('ACTION: confirmation is enabled. Configure custom SMTP, or explicitly disable Confirm email for a demo site. Settings cannot reveal remaining SMTP quota. See DEPLOYMENT.md.');
    }
  }
} catch {
  console.error('Unable to inspect Auth settings. Check backend environment and network; no credentials were printed.');
  process.exitCode=1;
}
