// src/background.ts - Service Worker with OAuth
import { supabase } from './bg/supabaseClient.js';

console.log('[bg] loaded');

// Test if background script is working
chrome.runtime.onStartup.addListener(() => {
  console.log('[bg] Extension started');
});

chrome.runtime.onInstalled.addListener(() => {
  console.log('[bg] Extension installed');
});

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
    console.log('[bg] Restoring session…');

    (async () => {
      try {
        const urls: string[] = (msg.tabs || [])
          .map((t: any) => t?.url)
          .filter((u: any): u is string => !!u);

        const win = await chrome.windows.getLastFocused({ windowTypes: ['normal'] });
        if (!win?.id) throw new Error('No normal window found');
        const windowId = win.id;

        const beforeTabs = await chrome.tabs.query({ windowId });
        console.log('[bg] Existing tabs BEFORE:', beforeTabs.map(t => ({ id: t.id, url: t.url, pinned: t.pinned })));

        // Choose/create keeper
        const keeper = beforeTabs.find(t => !t.pinned) ?? beforeTabs[0];
        const keeperId = keeper?.id ?? (await chrome.tabs.create({ windowId, url: 'chrome://newtab/' })).id!;
        const keepIds = new Set<number>([keeperId]);

        // Put first URL in keeper, create the rest and record their IDs
        if (urls.length > 0) {
          await chrome.tabs.update(keeperId, { url: urls[0], active: true });
          for (let i = 1; i < urls.length; i++) {
            const created = await chrome.tabs.create({ windowId, url: urls[i], active: false });
            if (created?.id) keepIds.add(created.id);
          }
        } else {
          await chrome.tabs.update(keeperId, { url: 'chrome://newtab/', active: true });
        }

        // Re-query after creation
        const afterTabs = await chrome.tabs.query({ windowId });
        console.log('[bg] Tabs AFTER creating:', afterTabs.map(t => ({ id: t.id, url: t.url, pinned: t.pinned })));

        // Remove anything that is:
        //  - not pinned
        //  - and NOT in the keepIds allow-list
        const toRemove = afterTabs
          .filter(t => !t.pinned && !keepIds.has(t.id!))
          .map(t => t.id!)
          .filter(Boolean);

        // Safety: never delete all non-pinned tabs
        const nonPinnedCount = afterTabs.filter(t => !t.pinned).length;
        if (toRemove.length >= nonPinnedCount) {
          console.warn('[bg] Refusing to remove tabs to avoid closing the window.');
        } else if (toRemove.length) {
          await chrome.tabs.remove(toRemove);
        }

        const finalTabs = await chrome.tabs.query({ windowId });
        console.log('[bg] FINAL tabs:', finalTabs.map(t => ({ id: t.id, url: t.url, pinned: t.pinned })));

        sendResponse({ success: true });
      } catch (e: any) {
        console.error('[bg] restore error:', e);
        sendResponse({ success: false, error: String(e?.message || e) });
      }
    })();

    return true;
  }

  if (msg?.type === 'PING') {
    console.log('[bg] PING received, responding...');
    sendResponse({ ok: true });
    return true;
  }
});
