// src/background.ts - Service Worker with OAuth
import { supabase } from './bg/supabaseClient.js';

console.log('[bg] loaded');

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  console.log('[bg] Received message:', msg.type);
  
  if (msg?.type === 'START_GOOGLE_OAUTH') {
    console.log('[bg] Starting Google OAuth flow...');
    
    (async () => {
      try {
        const redirectTo = chrome.identity.getRedirectURL('provider_cb');
        console.log('[bg] Redirect URL:', redirectTo);

        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo,
            skipBrowserRedirect: true,
            queryParams: { prompt: 'consent' },
          },
        });
        if (error || !data?.url) throw new Error(error?.message || 'No URL');
        
        console.log('[bg] OAuth URL received, launching WebAuthFlow...');

        const cbUrl: string = await new Promise((resolve, reject) => {
          chrome.identity.launchWebAuthFlow(
            { url: data.url!, interactive: true },
            (returned) => {
              console.log('[bg] WebAuthFlow callback received:', returned);
              if (chrome.runtime.lastError || !returned) {
                console.error('[bg] WebAuthFlow error:', chrome.runtime.lastError);
                return reject(chrome.runtime.lastError ?? new Error('No redirect'));
              }
              resolve(returned);
            }
          );
        });

        console.log('[bg] Processing OAuth callback...');
        const u = new URL(cbUrl);
        const code = u.searchParams.get('code');
        
        if (code) {
          console.log('[bg] PKCE code found, exchanging for session...');
          const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
          if (exErr) throw new Error(exErr.message);
        } else {
          console.log('[bg] Implicit tokens found, setting session...');
          const h = new URLSearchParams(u.hash.slice(1));
          const at = h.get('access_token');
          const rt = h.get('refresh_token');
          if (!at || !rt) throw new Error('No code or tokens in redirect');
          const { error: setErr } = await supabase.auth.setSession({ access_token: at, refresh_token: rt });
          if (setErr) throw new Error(setErr.message);
        }

        console.log('[bg] OAuth completed successfully, sending AUTH_STATE_CHANGED...');
        // Session persisted via chromeStorageAdapter
        chrome.runtime.sendMessage({ type: 'AUTH_STATE_CHANGED' });
        sendResponse({ ok: true });
        console.log('[bg] OAuth flow completed successfully');
      } catch (e: any) {
        console.error('[bg] OAuth error:', e);
        sendResponse({ ok: false, error: String(e?.message || e) });
      }
    })();

    return true; // keep channel open
  }

  if (msg?.type === 'CAPTURE_CURRENT_WINDOW') {
    console.log('[bg] Capturing current window tabs...');
    
    (async () => {
      try {
        const currentWindow = await chrome.windows.getCurrent();
        const tabs = await chrome.tabs.query({ windowId: currentWindow.id });
        
        const tabData = tabs.map(tab => ({
          url: tab.url,
          title: tab.title,
          favIconUrl: tab.favIconUrl,
          tabIndex: tab.index
        }));
        
        console.log('[bg] Captured tabs:', tabData);
        sendResponse({ success: true, tabs: tabData });
      } catch (error) {
        console.error('[bg] Error capturing tabs:', error);
        sendResponse({ success: false, error: String(error) });
      }
    })();
    
    return true; // keep channel open
  }

  if (msg?.type === 'CAPTURE_ALL_WINDOWS') {
    console.log('[bg] Capturing all windows tabs...');
    
    (async () => {
      try {
        const windows = await chrome.windows.getAll();
        const allTabs = [];
        
        for (const window of windows) {
          const tabs = await chrome.tabs.query({ windowId: window.id });
          allTabs.push(...tabs.map(tab => ({
            url: tab.url,
            title: tab.title,
            favIconUrl: tab.favIconUrl,
            tabIndex: tab.index
          })));
        }
        
        console.log('[bg] Captured all tabs:', allTabs);
        sendResponse({ success: true, tabs: allTabs });
      } catch (error) {
        console.error('[bg] Error capturing all tabs:', error);
        sendResponse({ success: false, error: String(error) });
      }
    })();
    
    return true; // keep channel open
  }

  if (msg?.type === 'RESTORE_SESSION') {
    console.log('[bg] Restoring session...');
    
    (async () => {
      try {
        const currentWindow = await chrome.windows.getCurrent();
        
        // Close existing tabs in current window
        const existingTabs = await chrome.tabs.query({ windowId: currentWindow.id });
        for (const tab of existingTabs) {
          if (tab.id) {
            await chrome.tabs.remove(tab.id);
          }
        }

        // Open new tabs
        for (const tab of msg.tabs) {
          await chrome.tabs.create({ 
            url: tab.url, 
            windowId: currentWindow.id,
            active: false 
          });
        }

        // Make first tab active
        if (msg.tabs.length > 0) {
          const newTabs = await chrome.tabs.query({ windowId: currentWindow.id });
          if (newTabs[0]?.id) {
            await chrome.tabs.update(newTabs[0].id, { active: true });
          }
        }

        sendResponse({ success: true });
      } catch (error) {
        console.error('[bg] Error restoring session:', error);
        sendResponse({ success: false, error: String(error) });
      }
    })();
    
    return true; // keep channel open
  }

  if (msg?.type === 'PING') {
    console.log('[bg] PING received, responding...');
    sendResponse({ ok: true });
    return true;
  }
});
