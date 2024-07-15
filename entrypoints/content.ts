const PROVIDERS: { name: string; host: string }[] = [
	{ name: "FxTwitter", host: "fxtwitter.com" },
	{ name: "FixUpX", host: "fixupx.com" },
	{ name: "VXTwitter", host: "vxtwitter.com" },
];

const log = (message: string) => {
	console.log(
		"%c[copy-fixed-twitter-url]",
		"color:#fff; background-color:#ff7bff; padding: 2px 4px; border-radius: 0;",
		message,
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
	onClick: () => void,
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
							"[data-testid='Dropdown']",
						) as HTMLDivElement;
						if (el) {
							log("dropdown detected");

							const ja = /リンクをコピー/.test(el.innerText);
							const en = /Copy link/.test(el.innerText);

							if (/status\/\d+/.test(window.location.href) && (ja || en)) {
								log("button detected, setting behaviour");

                const elDropDown = el;
                const elCopyLink = elDropDown.childNodes[0] as HTMLDivElement;
                const elOtherShares = elDropDown.childNodes[1] as HTMLDivElement;

                const onClickEventHandler = (host: string) => () => {
                  if (navigator.clipboard) {
                    elCopyLink.click();

                    const url = new URL(window.location.href);
                    url.hostname = host;

                    navigator.clipboard.writeText(`${url}`);
                  }
                };

                for (const provider of PROVIDERS) {
                  if (elDropDown.querySelector(`[data-testid='${provider.name}']`)) {
                    continue;
                  }

                  const node = elCopyLink.cloneNode(true);
                  setBehaviourWithTitle(
                    node as HTMLDivElement,
                    provider.name,
                    en ? `Copy link as ${provider.name} URL` : `${provider.name} としてリンクをコピー`,
                    onClickEventHandler(provider.host),
                  );

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
