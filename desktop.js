import { app, BrowserWindow, dialog } from 'electron';
import { writeFile } from 'node:fs/promises';
import { startServer, stopServer } from './server.js';

let window;
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();
else {
  app.on('second-instance', () => {
    if (window) {
      if (window.isMinimized()) window.restore();
      window.show();
      window.focus();
    }
  });

  app.whenReady().then(async () => {
    try {
      const port = await startServer({ port: Number(process.env.BLACKSITE_PORT || 3000), host: '0.0.0.0' });
      const origin = `http://127.0.0.1:${port}`;
      window = new BrowserWindow({
        title: 'BLACKSITE SHIFT',
        width: 1280,
        height: 760,
        minWidth: 900,
        minHeight: 560,
        backgroundColor: '#101410',
        autoHideMenuBar: true,
        show: false,
        webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true }
      });
      window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
      window.webContents.on('will-navigate', (event, url) => {
        if (!url.startsWith(origin + '/')) event.preventDefault();
      });
      if (process.env.BLACKSITE_DIAGNOSTIC_FILE) {
        window.webContents.once('did-finish-load', () => setTimeout(async () => {
          try {
            const file = process.env.BLACKSITE_DIAGNOSTIC_FILE;
            if(process.env.BLACKSITE_DIAGNOSTIC_RUN){
              await window.webContents.executeJavaScript("document.querySelector('#solo-button')?.click()");
              await new Promise(resolve=>setTimeout(resolve,2400));
            }
            if(process.env.BLACKSITE_DIAGNOSTIC_MANUAL){
              await window.webContents.executeJavaScript("document.querySelector('#manual-hud')?.click()");
              if(process.env.BLACKSITE_DIAGNOSTIC_MANUAL==='enemies')await window.webContents.executeJavaScript("document.querySelector('[data-manual=enemies]')?.click()");
              await new Promise(resolve=>setTimeout(resolve,350));
            }
            const image = await window.webContents.capturePage();
            const page = await window.webContents.executeJavaScript(`(() => {
              const menu = document.querySelector('#menu');
              const canvas = document.querySelector('#game');
              const gl = canvas?.getContext('webgl2');
              return { title: document.title, readyState: document.readyState,
                bodyBackground: getComputedStyle(document.body).backgroundColor,
                menuDisplay: menu && getComputedStyle(menu).display,
                hudDisplay: getComputedStyle(document.querySelector('#hud')).display,
                waveLabel: document.querySelector('#wave-label')?.textContent,
                menuText: menu?.innerText.slice(0,120),
                manualDisplay:getComputedStyle(document.querySelector('#manual')).display,
                manualCards:document.querySelectorAll('#manual-content .manual-card').length,
                webgl: !!gl, contextLost: gl?.isContextLost() };
            })()`);
            await writeFile(file, image.toPNG());
            await writeFile(file + '.json', JSON.stringify(page, null, 2));
          } catch (error) { console.error('Diagnostic capture failed:', error); }
        }, 1500));
      }
      window.once('ready-to-show', () => window.show());
      await window.loadURL(origin);
    } catch (error) {
      dialog.showErrorBox('BLACKSITE SHIFT', `Could not start the game server.\n\n${error.message}`);
      app.quit();
    }
  });
  app.on('before-quit', () => { try { stopServer(); } catch {} });
  app.on('window-all-closed', () => app.quit());
}
