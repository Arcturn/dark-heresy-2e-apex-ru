/** Display-only localization of source-generated stock state effect tooltips. */
import {stateEffectSources, translateStateEffectName} from './state-effect-l10n.mjs';

const SYSTEM = 'dark-heresy-2e-apex';
const CARD = 'article.dark-heresy-2e-apex-effect-tooltip-content';
const REGISTRATIONS = new WeakMap();
const active = game => game?.system?.id === SYSTEM && game?.i18n?.lang === 'ru';
const current = source => typeof source === 'function' ? source() : source;
const singleText = element => element?.childNodes?.length === 1 && element.childNodes[0].nodeType === 3 ? element.childNodes[0] : null;
const noAttributes = element => !element?.attributes?.length;
const meaningfulChildren = element => Array.from(element?.childNodes ?? []).filter(node => node.nodeType !== 3 || node.nodeValue.trim());
const tag = (element, name) => element?.nodeType === 1 && String(element.tagName).toLowerCase() === name;

/** Accept the complete stock two-paragraph markup, not fragments of custom rules. */
function descriptionParts(description) {
  const children = meaningfulChildren(description);
  if (children.length !== 2 || !children.every(node => tag(node, 'p') && noAttributes(node))) return null;
  const [rule, citation] = children;
  const ruleText = singleText(rule);
  const citationChildren = meaningfulChildren(citation);
  if (!ruleText || citationChildren.length !== 1 || !tag(citationChildren[0], 'em') || !noAttributes(citationChildren[0])) return null;
  const citationText = singleText(citationChildren[0]);
  return citationText ? {ruleText, citationText} : null;
}

function stockTooltip(card, game) {
  const image = card.querySelector(':scope > header > img');
  const description = card.querySelector(':scope > section.description');
  if (!image || !description) return null;
  const parts = descriptionParts(description);
  if (!parts) return null;
  const img = image.getAttribute('src');
  for (const [id, source] of Object.entries(stateEffectSources)) {
    if (img !== source.img) continue;
    const key = `FALLOUTMAW.DH2E.States.${id}.Rule`;
    const rule = game.i18n.localize(key);
    if (typeof rule !== 'string' || rule === key) continue;
    if (parts.ruleText.nodeValue !== source.rule && parts.ruleText.nodeValue !== rule) continue;
    if (![ `Dark Heresy p. ${source.page}`, `Dark Heresy стр. ${source.page}` ].includes(parts.citationText.nodeValue)) continue;
    return {...parts, id, source, rule};
  }
  return null;
}

/** Change text nodes only; document data, markup, icons and custom text stay intact. */
export function applyStateEffectTooltipTranslations(html, {game = globalThis.game} = {}) {
  const stats = {active: false, matched: 0, translated: 0};
  if (!active(game)) return stats;
  const root = html?.nodeType ? html : html?.[0] ?? html;
  if (!root?.querySelectorAll) return stats;
  const cards = [...(root.matches?.(CARD) ? [root] : []), ...root.querySelectorAll(CARD)];
  stats.active = cards.length > 0;
  for (const card of cards) {
    const stock = stockTooltip(card, game);
    if (!stock) continue;
    stats.matched++;
    const replace = (node, value) => {
      if (node && node.nodeValue !== value) {node.nodeValue = value; stats.translated++;}
    };
    replace(stock.ruleText, stock.rule);
    replace(stock.citationText, `Dark Heresy стр. ${stock.source.page}`);
    const nameNode = singleText(card.querySelector(':scope > header > div > strong'));
    if (nameNode) replace(nameNode, translateStateEffectName(stock.id, nameNode.nodeValue, game));
  }
  return stats;
}

/** Attach after Foundry creates its single shared tooltip element. */
export function observeStateEffectTooltips({
  tooltip = globalThis.game?.tooltip?.tooltip,
  game = () => globalThis.game,
  MutationObserver = globalThis.MutationObserver
} = {}) {
  if (!tooltip?.querySelectorAll || typeof MutationObserver !== 'function') return null;
  if (REGISTRATIONS.has(tooltip)) return REGISTRATIONS.get(tooltip);
  let disposed = false;
  const refresh = () => disposed ? {active: false, matched: 0, translated: 0} : applyStateEffectTooltipTranslations(tooltip, {game: current(game)});
  const observer = new MutationObserver(refresh);
  observer.observe(tooltip, {childList: true, characterData: true, subtree: true});
  const api = Object.freeze({refresh, dispose() {
    if (disposed) return;
    disposed = true;
    observer.disconnect();
    REGISTRATIONS.delete(tooltip);
  }});
  REGISTRATIONS.set(tooltip, api);
  refresh();
  return api;
}
