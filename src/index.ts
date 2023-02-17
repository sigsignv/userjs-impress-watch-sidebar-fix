/**
* First Contentful Paint を遅延させて CLS を防止する
*/
function delayFirstContentfulPaint() {
    if (document.readyState !== 'loading') {
        return
    }
    document.documentElement.style.display = 'none'
    document.addEventListener('readystatechange', () => {
        if (document.readyState !== 'interactive') {
            return
        }
        // DOMContentLoaded の一番最後に実行する
        document.addEventListener('DOMContentLoaded', () => {
            document.documentElement.style.display = ''
        }, { once: true })
    })
}

/**
 * 画像のデコードを非同期化する
 */
function asyncImageDecoding() {
    const lazyLoader = (img: HTMLImageElement) => {
        const src = img.attributes.getNamedItem('ajax')?.value
        if (!src) {
            return
        }
        try {
            const url = new URL(src)
            if (!url.hostname.endsWith('.impress.co.jp')) {
                return
            }
        } catch {
            return
        }
        img.loading = 'lazy'
        img.src = src
        img.attributes.removeNamedItem('ajax')
    }
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type !== 'childList') {
                continue
            }
            for (const n of mutation.addedNodes) {
                if (n instanceof HTMLImageElement) {
                    n.decoding = 'async'
                    lazyLoader(n)
                }
            }
        }
    })
    observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
    })
    document.addEventListener('DOMContentLoaded', () => {
        observer.disconnect()
    }, { once: true })
}

/**
* 要素が確定するまでサイドバーを隠して CLS を防止する
*/
function delaySidebarRendering() {
    const delayRenderer = (sidebar: HTMLElement) => {
        let timer: number | undefined

        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type !== 'childList') {
                    return
                }
                clearTimeout(timer)
                timer = setTimeout(() => {
                    observer.disconnect()
                    const posY = window.scrollY
                    sidebar.style.display = ''
                    window.scroll(0, posY)
                }, 3 * 1000)
            }
        })
        sidebar.style.display = 'none'
        observer.observe(sidebar, {
            childList: true,
            subtree: true,
        })
    }
    document.addEventListener('DOMContentLoaded', () => {
        const sidebar = document.querySelector<HTMLElement>('aside#extra')
        if (!sidebar) {
            return
        }
        delayRenderer(sidebar)
    }, { once: true })
}

delayFirstContentfulPaint()
asyncImageDecoding()
delaySidebarRendering()
