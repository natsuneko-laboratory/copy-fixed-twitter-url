const log = (message: string) => {
  console.log(
    '%c[copy-fixed-twitter-url]',
    'color:#fff; background-color:#ff7bff; padding: 2px 4px; border-radius: 0;',
    message,
  )
}

const waitForWhileTwitterIsLoading = async () => {
  return new Promise((resolve, reject) => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.target instanceof HTMLDivElement) {
          const el = mutation.target
          if (el.querySelector('#layers')) {
            return resolve(undefined)
          }
        }
      })
    })

    const layers = document.getElementById('layers')
    if (layers) {
      return resolve(undefined)
    } else {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      })
    }
  })
}

const setBehaviourWithTitle = (el: Node, id: string, name: string, onClick: () => void) => {
  if (el instanceof HTMLDivElement) {
    el.addEventListener('mouseover', () => (el.style.backgroundColor = 'rgba(255,255,255,0.03)'))
    el.addEventListener('mouseleave', () => (el.style.backgroundColor = ''))
    el.addEventListener('click', onClick)
    el.dataset.natsunekoId = id
    el.querySelector('span')!.innerText = name
  }
}

const run = async () => {
  await waitForWhileTwitterIsLoading()

  log('layer initialized, starting observer')

  const layers = document.getElementById('layers')!
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      const { target } = mutation
      if (target instanceof HTMLElement) {
        const el = target.querySelector("[data-testid='Dropdown']") as HTMLDivElement
        if (el) {
          log('dropdown detected')

          if (
            /status\/\d+/.test(window.location.href) &&
            /(リンクをコピー|Copy link)/.test(el.innerText)
          ) {
            const elDropDown = el
            const elCopyLink = elDropDown.childNodes[0] as HTMLDivElement
            const elOtherShares = elDropDown.childNodes[1] as HTMLDivElement

            const domains: { name: string; host: string }[] = [
              { name: 'FxTwitter', host: 'fxtwitter.com' },
              { name: 'FixUpX', host: 'fixupx.com' },
              { name: 'VXTwitter', host: 'vxtwitter.com' },
              { name: 'FixV', host: 'fixv.com' },
            ]

            const onClickEventHandler = (host: string) => () => {
              if (navigator.clipboard) {
                elCopyLink.click() // emulate click

                const url = new URL(window.location.href)
                url.hostname = host

                navigator.clipboard.writeText(`${url}`)
              }
            }

            for (const domain of domains) {
              if (elDropDown.querySelector(`[data-natsuneko-id='${domain.name}']`)) {
                log('link item already inserted')
                return
              }

              const elCopyLinkAsFxTwitter = elCopyLink.cloneNode(true)

              setBehaviourWithTitle(
                elCopyLinkAsFxTwitter,
                domain.name,
                `Copy link as ${domain.host}`,
                onClickEventHandler(domain.host),
              )

              elDropDown.insertBefore(elCopyLinkAsFxTwitter, elOtherShares)
            }
          }
        }
      }
    })
  })
  observer.observe(layers, {
    childList: true,
    subtree: true,
  })
}

run()
