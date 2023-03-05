// ==UserScript==
// @name        Impress Watch: TTI fix
// @description Reduce TTI (Time to Interactive) in Impress Watch
// @namespace   https://github.com/sigsignv/impress-watch-tti-fix
// @version     0.4.0
// @author      Sigsign
// @license     Apache-2.0
// @match       https://*.watch.impress.co.jp/docs/*
// @run-at      document-start
// @noframes
// @grant       none
// ==/UserScript==
(function () {
'use strict';

/**
* First Contentful Paint を遅延させて CLS を防止する
*/
function delayFirstContentfulPaint() {
    if (document.readyState !== 'loading') {
        return;
    }
    document.documentElement.style.display = 'none';
    document.addEventListener('DOMContentLoaded', () => {
        requestAnimationFrame(() => {
            document.documentElement.style.display = '';
        });
    });
}
/**
 * 画像のデコードを非同期化する
 */
function asyncImageDecoding() {
    const lazyLoader = (img) => {
        const src = img.attributes.getNamedItem('ajax')?.value;
        if (!src) {
            return;
        }
        try {
            const url = new URL(src);
            if (!url.hostname.endsWith('.impress.co.jp')) {
                return;
            }
        }
        catch {
            return;
        }
        img.loading = 'lazy';
        img.src = src;
        img.attributes.removeNamedItem('ajax');
    };
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type !== 'childList') {
                continue;
            }
            for (const n of mutation.addedNodes) {
                if (n instanceof HTMLImageElement) {
                    n.decoding = 'async';
                    lazyLoader(n);
                }
            }
        }
    });
    observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
    });
    document.addEventListener('DOMContentLoaded', () => {
        observer.disconnect();
    }, { once: true });
}
/**
* Load イベントまでサイドバーを隠して CLS を防止する
*/
function delaySidebarRendering() {
    document.addEventListener('DOMContentLoaded', () => {
        const sidebar = document.querySelector('aside#extra');
        if (!sidebar) {
            return;
        }
        sidebar.style.display = 'none';
        window.addEventListener('load', () => {
            const idleTask = window.requestIdleCallback?.bind(window) ?? function (cb) {
                return setTimeout(() => {
                    cb();
                }, 1);
            };
            idleTask(() => {
                const posY = window.scrollY;
                sidebar.style.display = '';
                window.scroll(0, posY);
            });
        }, { once: true });
    }, { once: true });
}
delayFirstContentfulPaint();
asyncImageDecoding();
delaySidebarRendering();

})();