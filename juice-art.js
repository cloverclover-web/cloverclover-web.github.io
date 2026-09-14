/* Exact diagram primitives. Painted story scenes are not quantity evidence. */
(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.JuiceArt = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const colours = { apple: "#d6a43f", orange: "#e6a349", water: "#a8cad4" };
  function vessel(id, values, capacity, label, x, scale, coaster, measure, scoopMl = 25, target = null) {
    const total = Object.values(values).reduce((a, b) => a + b, 0);
    const fill = total / capacity * 120;
    const juice = values.apple + values.orange;
    const liquid = juice ? (values.orange ? colours.orange : colours.apple) : colours.water;
    let mat = "";
    if (coaster) mat = coaster.shape === "circle"
      ? `<ellipse cx="65" cy="169" rx="63" ry="15" fill="${coaster.colour}" stroke="#80654a" stroke-width="2"/>`
      : `<path d="M0 157H117L132 177H15Z" fill="${coaster.colour}" stroke="#80654a" stroke-width="2"/>`;
    const labelledStep = capacity > 4 ? 4 : 2;
    const ticks = measure ? Array.from({length: capacity + 1}, (_, i) => `<path d="M25 ${153 - i * 120 / capacity}h${i % labelledStep ? 9 : 15}" stroke="#655442" stroke-width="1.4"/>${i % labelledStep ? "" : `<text x="44" y="${157 - i * 120 / capacity}" font-size="14" fill="#493c30">${i * scoopMl}</text>`}`).join("") : "";
    const goal = target === null ? "" : `<path data-target-ml="${target * scoopMl}" d="M15 ${153 - target * 120 / capacity}H109" stroke="#3c5738" stroke-width="2" stroke-dasharray="5 4"/>`;
    return `<g transform="translate(${x},8) scale(${scale})" data-vessel="${id}" data-total="${total}" data-ml="${total * scoopMl}" data-capacity-ml="${capacity * scoopMl}">
      <ellipse cx="65" cy="174" rx="61" ry="7" fill="#6c4b2520"/>${mat}
      <defs><clipPath id="clip-${id}"><path d="M13 22H112V160Q65 172 13 160Z"/></clipPath></defs>
      <path d="M110 49C158 37 164 123 107 131" fill="none" stroke="#705940" stroke-width="5"/>
      <path d="M13 22H112V160Q65 172 13 160Z" fill="#fffaf3" fill-opacity=".78"/>
      <g clip-path="url(#clip-${id})">${total ? `<rect x="10" y="${153 - fill}" width="105" height="${fill + 20}" fill="${liquid}" fill-opacity=".85"/>` : ""}<path d="M24 30V149" stroke="white" stroke-opacity=".55" stroke-width="5"/></g>
      <path d="M13 22H112V160Q65 172 13 160Z" fill="none" stroke="#705940" stroke-width="3"/>
      <ellipse cx="62.5" cy="22" rx="49.5" ry="7" fill="#fcf7ee" fill-opacity=".65" stroke="#705940" stroke-width="2"/>${ticks}${goal}
      ${measure ? '<text x="78" y="48" font-size="13" fill="#493c30">mL</text>' : ""}
      <text x="68" y="203" text-anchor="middle" font-family="Georgia, serif" font-size="20" fill="#403329">${esc(label)}</text>
      <text x="68" y="226" text-anchor="middle" font-size="20" fill="#403329">${total * scoopMl} mL</text></g>`;
  }
  function scene(s, kind, mode, palette, prefix) {
    const r = s[kind], v = s.variant;
    const data = [];
    if (kind === "jug" && (mode === "mix" || mode === "serve" || Object.values(r.jug).some((n) => n > 0))) {
      data.push(vessel(`${prefix}-jug`, r.jug, v.jugCapacity, "Our jug", 35, 1.04, null, true, v.scoopMl, mode === "mix" && r.checked[0] ? v.total : null));
      for (let i = 0; i < 3; i++) data.push(vessel(`${prefix}-cup-${i}`, r.cups[i], v.cupCapacity, ["Bunny", "Bear", "Duck"][i], 245 + i * 145, .79, r.coasters[i] && {...r.coasters[i], colour: palette[r.coasters[i].colour]}, false, v.scoopMl, r.checked[0] ? v.each : null));
    } else {
      for (let i = 0; i < 3; i++) data.push(vessel(`${prefix}-cup-${i}`, r.cups[i], v.cupCapacity, ["Bunny", "Bear", "Duck"][i], 100 + i * 195, 1, r.coasters[i] && {...r.coasters[i], colour: palette[r.coasters[i].colour]}, true, v.scoopMl, r.checked[kind === "jug" ? 0 : i] ? (kind === "jug" ? v.each : v.own[i].juice + v.own[i].water) : null));
    }
    const description = `${kind === "jug" ? `Jug: ${Object.values(r.jug).reduce((a,b)=>a+b,0) * v.scoopMl} mL. ` : ""}${r.cups.map((c,i)=>`${["Bunny","Bear","Duck"][i]}: ${Object.values(c).reduce((a,b)=>a+b,0) * v.scoopMl} mL`).join(". ")}.`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 248" role="img" aria-label="${esc(description)}"><title>${esc(description)}</title>${data.join("")}</svg>`;
  }
  function focus(s, kind, friend, palette, prefix, mode) {
    const r = s[kind], v = s.variant, own = kind === "own";
    const values = own ? r.cups[friend] : r.jug;
    const target = own ? v.own[friend].juice + v.own[friend].water : v.total;
    const mat = own && r.coasters[friend];
    const label = own ? ["Bunny", "Bear", "Duck"][friend] : "Our jug";
    const totalMl = Object.values(values).reduce((a, b) => a + b, 0) * v.scoopMl;
    const art = vessel(`${prefix}-${own ? `cup-${friend}` : "jug"}`, values, own ? v.cupCapacity : v.jugCapacity, label, 12, 1, mat && {...mat, colour: palette[mat.colour]}, true, v.scoopMl, mode === "serve" || !r.checked[own ? friend : 0] ? null : target);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 248" role="img" aria-label="${esc(`${label}: ${totalMl} mL. Scale in mL.`)}">${art}</svg>`;
  }
  return { scene, focus, vessel, esc };
});
