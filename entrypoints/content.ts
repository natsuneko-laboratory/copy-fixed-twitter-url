const PROVIDERS: { name: string; host: string }[] = [
  { name: "FxTwitter", host: "fxtwitter.com" },
  { name: "FixUpX", host: "fixupx.com" },
  { name: "VXTwitter", host: "vxtwitter.com" },
];

const I18N_LABELS: { [key: string]: RegExp } = {
  ar: /نسخ الرابط/, // アラビア語
  "ar-x-fm": /نسخ الرابط/, // アラビア語 (女性形)
  bg: /TODO/, // ブルガリア語
  bn: /TODO/, // ベンガル語
  ca: /Copia l'enllaç/, // カタロニア語
  cs: /TODO/, // チェコ語
  da: /TODO/, // デンマーク語
  de: /TODO/, // ドイツ語
  el: /Αντιγραφή συνδέσμου/, // ギリシャ語
  "en-gb": /Copy link/, // 英語 (イギリス)
  "en-us": /Copy link/, // 英語 (アメリカ)
  es: /TODO/, // スペイン語
  eu: /TODO/, // バスク語
  fa: /TODO/, // ペルシャ語
  fi: /TODO/, // フィンランド語
  fil: /TODO/, // フィリピン語
  fr: /TODO/, // フランス語
  gl: /Copiar ligazón/, // ガリシア語
  gu: /TODO/, // グジャラート語
  he: /TODO/, // ヘブライ語
  hi: /TODO/, // ヒンディー語
  hr: /TODO/, // クロアチア語
  hu: /TODO/, // ハンガリー語
  it: /Copia link/, // イタリア語
  id: /Salin tautan/, // インドネシア語
  ja: /リンクをコピー/, // 日本語
  ko: /링크 복사하기/, // 韓国語
  kn: /ಲಿಂಕ್ ನಕಲಿಸಿ/, // カンナダ語
  mr: /TODO/, // マラーティー語
  msa: /TODO/, // マレー語
  nl: /Link kopiëren/, // オランダ語
  no: /TODO/, // ノルウェー語
  pl: /TODO/, // ポーランド語
  pt: /TODO/, // ポルトガル語
  ro: /TODO/, // ルーマニア語
  ru: /TODO/, // ロシア語
  sk: /TODO/, // スロバキア語
  sr: /TODO/, // セルビア語
  sv: /TODO/, // スウェーデン語
  ta: /TODO/, // タミル語
  th: /TODO/, // タイ語
  tr: /TODO/, // トルコ語
  uk: /Копіювати посилання/, // ウクライナ語
  ur: /لنک کاپی کریں/, // ウルドゥー語
  vi: /TODO/, // ベトナム語
  "zh-cn": /复制链接/, // 中国語 (簡体)
  "zh-tw": /複製連結/, // 中国語 (繁体)
};

const log = (message: string) => {
  console.log(
    "%c[copy-fixed-twitter-url]",
    "color:#fff; background-color:#ff7bff; padding: 2px 4px; border-radius: 0;",
    message
  );
};

const waitForWhileTwitterIsLoading = async () => {
  return new Promise((resolve, reject) => {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.target instanceof HTMLDivElement) {
          const el = mutation.target;
          if (el.querySelector("#layers")) {
            return resolve(undefined);
          }
        }
      }
    });

    const layers = document.getElementById("layers");
    if (layers) {
      return resolve(undefined);
    }

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  });
};

const setBehaviourWithTitle = (
  el: Node,
  id: string,
  name: string,
  onClick: () => void
) => {
  if (el instanceof HTMLDivElement) {
    el.addEventListener("mouseover", () => {
      el.style.backgroundColor = "rgba(255,255,255,0.03)";
    });

    el.addEventListener("mouseleave", () => {
      el.style.backgroundColor = "";
    });

    el.addEventListener("click", onClick);
    el.dataset.testid = id;

    const span = el.querySelector("span");
    if (span) {
      span.innerText = name;
    }
  }
};

export default defineContentScript({
  matches: ["https://twitter.com/*", "https://x.com/*"],
  main: async () => {
    await waitForWhileTwitterIsLoading();

    log("layer initialized, starting observer");

    const layers = document.getElementById("layers");
    if (layers) {
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          const { target } = mutation;
          if (target instanceof HTMLElement) {
            const el = target.querySelector(
              "[data-testid='Dropdown']"
            ) as HTMLDivElement;
            if (el) {
              log("dropdown detected");

              const text = el.innerText;
              const isMatch = Object.values(I18N_LABELS).some((regex) =>
                new RegExp(regex).test(text)
              );

              if (/status\/\d+/.test(window.location.href) && isMatch) {
                log("button detected, setting behaviour");

                const elDropDown = el;
                const elCopyLink = elDropDown.childNodes[0] as HTMLDivElement;
                const elOtherShares = elDropDown
                  .childNodes[1] as HTMLDivElement;

                const onClickEventHandler = (host: string) => () => {
                  if (navigator.clipboard) {
                    elCopyLink.click();

                    const url = new URL(window.location.href);
                    url.hostname = host;

                    navigator.clipboard.writeText(`${url}`);
                  }
                };

                for (const provider of PROVIDERS) {
                  if (
                    elDropDown.querySelector(`[data-testid='${provider.name}']`)
                  ) {
                    continue;
                  }

                  const node = elCopyLink.cloneNode(true);
                  setBehaviourWithTitle(
                    node as HTMLDivElement,
                    provider.name,
                    `${elCopyLink.innerText} (${provider.host})`,
                    onClickEventHandler(provider.host)
                  );

                  console.log({ text, el, e: el.innerHTML });

                  elDropDown.insertBefore(node, elOtherShares);
                }
              }
            }
          }
        }
      });

      observer.observe(layers, {
        childList: true,
        subtree: true,
      });
    }
  },
});
