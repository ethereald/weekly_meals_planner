'use client';

import { useEffect } from 'react';

export default function PWARegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('SW registered: ', registration);
            
            // Check for updates
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // New content is available, show update notification
                    if (confirm('New version available! Click OK to update.')) {
                      window.location.reload();
                    }
                  }
                });
              }
            });
          })
          .catch((registrationError) => {
            console.log('SW registration failed: ', registrationError);
          });
      });
    }

    // Handle app install prompt
    let deferredPrompt: any;
    
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      deferredPrompt = e;
      
      // Show custom install button (you can implement this in your UI)
      console.log('App can be installed');
      
      // Optionally show a custom install prompt
      const showInstallPromotion = () => {
        const installBanner = document.createElement('div');
        installBanner.innerHTML = `
          <div style="
            position: fixed;
            bottom: 20px;
            left: 20px;
            right: 20px;
            background: #3B82F6;
            color: white;
            padding: 16px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-family: system-ui, sans-serif;
          ">
            <div>
              <strong>Install Weekly Meals Planner</strong>
              <div style="font-size: 0.9em; opacity: 0.9;">Add to home screen for quick access</div>
            </div>
            <div>
              <button id="install-btn" style="
                background: white;
                color: #3B82F6;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                font-weight: 600;
                margin-right: 8px;
                cursor: pointer;
              ">Install</button>
              <button id="dismiss-btn" style="
                background: transparent;
                color: white;
                border: 1px solid rgba(255,255,255,0.3);
                padding: 8px 12px;
                border-radius: 4px;
                cursor: pointer;
              ">×</button>
            </div>
          </div>
        `;
        
        document.body.appendChild(installBanner);
        
        // Handle install button click
        document.getElementById('install-btn')?.addEventListener('click', () => {
          if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult: any) => {
              if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the install prompt');
              }
              deferredPrompt = null;
              document.body.removeChild(installBanner);
            });
          }
        });
        
        // Handle dismiss button click
        document.getElementById('dismiss-btn')?.addEventListener('click', () => {
          document.body.removeChild(installBanner);
        });
        
        // Auto-dismiss after 10 seconds
        setTimeout(() => {
          if (document.body.contains(installBanner)) {
            document.body.removeChild(installBanner);
          }
        }, 10000);
      };
      
      // Show install promotion after a short delay
      setTimeout(showInstallPromotion, 2000);
    });

    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed');
      deferredPrompt = null;
    });

  }, []);

  return null;
}
