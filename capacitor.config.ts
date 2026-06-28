import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
 appId: 'app.lovable.bad2b8be352b404793fcaec9c6ba4b77',
 appName: 'soutalbalad',
 webDir: 'dist',
 server: {
 url: 'https://bad2b8be-352b-4047-93fc-aec9c6ba4b77.lovableproject.com?forceHideBadge=true',
 cleartext: true,
 },
 android: {
 allowMixedContent: true,
 },
};

export default config;
