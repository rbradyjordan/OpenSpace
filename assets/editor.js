/* OpenSpace overlay editor v2 — injected by /admin into page iframes.
   Editor-only UI carries data-ospace (stripped on serialize).
   Shipped runtime (scroll animations) carries id="ospace-anim-*" and IS kept. */
(() => {
  if (window.__ospaceEditor) return;
  window.__ospaceEditor = true;

  const TEXT_TAGS = ['H1','H2','H3','H4','H5','H6','P','A','SPAN','B','STRONG','EM','I','LI','BLOCKQUOTE','FIGCAPTION','DIV','BUTTON'];
  const doc = document;
  const I = (d, extra) => `<svg viewBox="0 0 24 24" style="width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;${extra||''}"><path d="${d}"/></svg>`;
  const IC = {
    edit: I('M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 17z M13.5 6.5l3 3'),
    dup: I('M8 8h11v11H8z M5 16H4V4h12v1'),
    del: I('M4 7h16 M9 7V5h6v2 m-9 0 1 13h8l1-13 M10 11v6 M14 11v6'),
    link: I('M9 15l6-6 M7.5 12 5.6 13.9a3.4 3.4 0 0 0 4.8 4.8L12.3 17 M16.5 12l1.9-1.9a3.4 3.4 0 0 0-4.8-4.8L11.7 7'),
    up: I('M12 19V5 M6 11l6-6 6 6'),
    down: I('M12 5v14 M6 13l6 6 6-6'),
    plus: I('M12 5v14 M5 12h14'),
    style: I('M12 3a9 9 0 1 0 0 18c1.4 0 2-.9 2-2 0-.6-.3-1-.6-1.4-.3-.4-.6-.8-.6-1.4 0-1.1.9-2 2-2h1.8A4.4 4.4 0 0 0 21 10.5C21 6.4 17 3 12 3z'),
    drag: I('M9 5h.01M15 5h.01M9 12h.01M15 12h.01M9 19h.01M15 19h.01', 'stroke-width:3'),
    parent: I('M12 19V9 M7 13l5-5 5 5 M5 5h14'),
    check: I('m4.5 12.5 5 5 10-11'),
    x: I('M6 6l12 12M18 6 6 18'),
    img: I('M4 5h16v14H4z m3 9 3-3 3 3 4-4 3 3'),
    play: I('M8 6v12l10-6z'),
    anim: I('m13 3-8 10h6l-1 8 8-10h-6z'),
    search: I('M10.5 4a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13z m9.5 16-4.8-4.8'),
    bold: '<b style="font-size:13px">B</b>',
    italic: '<i style="font-size:13px;font-family:serif">I</i>',
    under: '<u style="font-size:13px">U</u>',
    copy: I('M8 8h11v11H8z M5 16H4V4h12v1'),
    paste: I('M9 4h6v3H9z M9 5H6v15h12V5h-3'),
    text: I('M5 6h14 M12 6v13'),
    btnEl: I('M4 9h16v7H4z M8 12.5h8', 'stroke-width:1.6'),
    divider: I('M4 12h16 M9 7h6 M9 17h6'),
    spacer: I('M12 4v5 M12 15v5 M8 7l4-4 4 4 M8 17l4 4 4-4'),
    quote: I('M7 8c-2 0-3 1.4-3 3.2C4 13.4 5.2 15 7.2 15c.4 2-1 3-2.2 3.4 M17 8c-2 0-3 1.4-3 3.2 0 2.2 1.2 3.8 3.2 3.8.4 2-1 3-2.2 3.4'),
    chev: I('m9 6 6 6-6 6'),
  };

  /* ================= styles ================= */
  const css = doc.createElement('style');
  css.dataset.ospace = '1';
  css.textContent = `
  :root{--ospaceA:#f0523d;--ospaceB:#5aa2e8;--ospaceG:#34d68b;--ospaceP:#13161c;--ospaceP2:#191d24;--ospaceL:#252a33;--ospaceL2:#323945;--ospaceT:#eef1f5;--ospaceD:#8b94a1}
  /* editing surface: selection off (design-tool behavior); re-enabled inside text editing */
  body{-webkit-user-select:none;user-select:none}
  [contenteditable="true"],[contenteditable="true"] *{-webkit-user-select:text !important;user-select:text !important;cursor:text}
  img:not([draggable="true"]),video{-webkit-user-drag:none}
  .ospace-hover{outline:1.5px dashed rgba(90,162,232,.85) !important;outline-offset:-1.5px}
  .ospace-selected{outline:2px solid var(--ospaceA) !important;outline-offset:-2px}
  .ospace-sec-hover{outline:1.5px solid rgba(52,214,139,.55) !important;outline-offset:-1.5px}
  [contenteditable="true"]{outline:2px solid var(--ospaceB) !important;outline-offset:-2px;cursor:text}
  .ospace-dragging{opacity:.35;filter:grayscale(.5)}
  .ospace-drop-above{box-shadow:0 -4px 0 0 var(--ospaceG) !important}
  .ospace-drop-below{box-shadow:0 4px 0 0 var(--ospaceG) !important}
  .ospace-ui{font-family:Poppins,system-ui,sans-serif;color:var(--ospaceT);-webkit-font-smoothing:antialiased}
  .ospace-badge{position:fixed;z-index:2147483001;background:var(--ospaceA);color:#fff;font:600 10px/1 Poppins;padding:4px 8px;border-radius:6px 6px 6px 0;letter-spacing:.06em;text-transform:uppercase;pointer-events:none;animation:ospacePop .15s}
  @keyframes ospacePop{from{opacity:0;transform:translateY(3px)}to{opacity:1}}
  .ospace-toolbar{position:fixed;z-index:2147483002;display:flex;align-items:center;gap:1px;background:var(--ospaceP);border:1px solid var(--ospaceL2);border-radius:10px;padding:4px;box-shadow:0 12px 40px rgba(0,0,0,.55);animation:ospacePop .15s}
  .ospace-toolbar button{display:grid;place-items:center;background:none;border:0;color:var(--ospaceT);min-width:30px;height:30px;padding:0 8px;border-radius:7px;cursor:pointer;font-family:Poppins}
  .ospace-toolbar button:hover{background:var(--ospaceL)}
  .ospace-toolbar button.danger:hover{background:rgba(240,82,61,.18);color:#ff7b6e}
  .ospace-toolbar .sep{width:1px;height:18px;background:var(--ospaceL);margin:0 3px}
  .ospace-crumb{position:fixed;left:12px;bottom:12px;z-index:2147483001;display:flex;gap:4px;flex-wrap:wrap;max-width:70vw}
  .ospace-crumb button{background:var(--ospaceP);border:1px solid var(--ospaceL);color:var(--ospaceD);font:500 10.5px Poppins;padding:5px 9px;border-radius:7px;cursor:pointer;transition:all .12s}
  .ospace-crumb button:hover{color:var(--ospaceT);border-color:var(--ospaceL2)}
  .ospace-crumb button.last{color:var(--ospaceT);border-color:var(--ospaceA)}
  .ospace-sec-tools{position:fixed;z-index:2147483000;display:flex;flex-direction:column;gap:3px;background:var(--ospaceP);border:1px solid var(--ospaceL);padding:4px;border-radius:10px;box-shadow:0 10px 34px rgba(0,0,0,.5);animation:ospacePop .15s}
  .ospace-sec-tools button{width:30px;height:30px;border-radius:7px;background:none;color:var(--ospaceT);border:0;cursor:pointer;display:grid;place-items:center}
  .ospace-sec-tools button:hover{background:var(--ospaceL)}
  .ospace-sec-tools button.danger:hover{background:rgba(240,82,61,.18);color:#ff7b6e}
  .ospace-sec-tools .grab{cursor:grab}
  .ospace-addline{position:fixed;z-index:2147482999;left:0;right:0;height:0;display:flex;justify-content:center;pointer-events:none}
  .ospace-addline button{pointer-events:auto;transform:translateY(-50%);display:flex;align-items:center;gap:6px;background:var(--ospaceG);color:#06301c;font:600 11px Poppins;border:0;padding:7px 14px;border-radius:20px;cursor:pointer;box-shadow:0 6px 20px rgba(52,214,139,.4);opacity:0;transition:opacity .15s}
  .ospace-addline:hover button,.ospace-addline button:hover,.ospace-addline.show button{opacity:1}
  .ospace-addline::before{content:"";position:absolute;left:5%;right:5%;top:-1px;height:2px;background:linear-gradient(90deg,transparent,rgba(52,214,139,.7),transparent);opacity:0;transition:opacity .15s}
  .ospace-addline:hover::before,.ospace-addline.show::before{opacity:1}
  .ospace-panel{position:fixed;top:12px;right:12px;bottom:12px;width:308px;background:rgba(19,22,28,.97);border:1px solid var(--ospaceL2);border-radius:16px;z-index:2147483003;padding:18px;overflow-y:auto;font:13px Poppins;color:var(--ospaceT);box-shadow:0 20px 60px rgba(0,0,0,.6);animation:ospaceSlide .22s cubic-bezier(.2,.9,.3,1)}
  @keyframes ospaceSlide{from{opacity:0;transform:translateX(16px)}to{opacity:1}}
  .ospace-panel::-webkit-scrollbar{width:8px}.ospace-panel::-webkit-scrollbar-thumb{background:var(--ospaceL);border-radius:4px}
  .ospace-panel h4{font-size:10px;text-transform:uppercase;letter-spacing:.12em;color:var(--ospaceD);margin:16px 0 8px;font-weight:600;display:flex;align-items:center;gap:6px}
  .ospace-panel h4:first-of-type{margin-top:2px}
  .ospace-panel h4::after{content:"";flex:1;height:1px;background:var(--ospaceL)}
  .ospace-panel label{display:block;font-size:10.5px;color:var(--ospaceD);margin:9px 0 4px;font-weight:500}
  .ospace-panel input[type=text],.ospace-panel input[type=number],.ospace-panel select{width:100%;padding:8px 10px;border-radius:8px;border:1px solid var(--ospaceL);background:#0e1116;color:var(--ospaceT);font:12px Poppins;transition:border-color .15s}
  .ospace-panel input:focus,.ospace-panel select:focus{outline:none;border-color:var(--ospaceA)}
  .ospace-panel input[type=color]{width:34px;height:28px;padding:2px;border:1px solid var(--ospaceL);border-radius:7px;background:#0e1116;cursor:pointer}
  .ospace-panel input[type=range]{width:100%;accent-color:var(--ospaceA)}
  .ospace-panel .btn{display:flex;align-items:center;justify-content:center;gap:7px;width:100%;margin-top:8px;padding:9px;border-radius:9px;border:1px solid var(--ospaceL);background:var(--ospaceP2);color:var(--ospaceT);cursor:pointer;font:500 12px Poppins;transition:all .15s}
  .ospace-panel .btn:hover{border-color:var(--ospaceL2);background:#1e232b}
  .ospace-panel .btn.red{color:#ff7b6e}.ospace-panel .btn.red:hover{border-color:#ff7b6e55}
  .ospace-panel .close{position:absolute;top:12px;right:12px;background:none;border:0;color:var(--ospaceD);cursor:pointer;width:28px;height:28px;display:grid;place-items:center;border-radius:7px}
  .ospace-panel .close:hover{background:var(--ospaceL);color:var(--ospaceT)}
  .ospace-panel .title{font-weight:600;font-size:14px;margin-bottom:2px;padding-right:28px}
  .ospace-panel .sub{color:var(--ospaceD);font-size:10.5px;margin-bottom:8px}
  .ospace-panel .row2{display:grid;grid-template-columns:1fr 1fr;gap:8px}
  .ospace-panel .rowc{display:flex;align-items:center;gap:8px}
  .ospace-panel .swatches{display:flex;gap:6px;margin-top:6px;flex-wrap:wrap}
  .ospace-panel .swatches button{width:22px;height:22px;border-radius:6px;border:1px solid var(--ospaceL2);cursor:pointer}
  .ospace-panel .rangeval{font-size:10px;color:var(--ospaceD);min-width:34px;text-align:right}
  .ospace-check{display:flex !important;align-items:center;gap:8px;font-size:12px !important;color:var(--ospaceT) !important;margin:8px 0 !important;cursor:pointer}
  .ospace-check input{width:auto !important;accent-color:var(--ospaceA)}
  .ospace-media-top{display:flex;gap:8px;margin-bottom:4px}
  .ospace-media-top input{flex:1;padding:8px 11px;border-radius:9px;border:1px solid var(--ospaceL);background:#0e1116;color:var(--ospaceT);font:12px Poppins}
  .ospace-media-top input:focus{outline:none;border-color:var(--ospaceA)}
  .ospace-media-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:10px}
  .ospace-media-grid .cell{position:relative;border-radius:10px;overflow:hidden;cursor:pointer;border:2px solid transparent;transition:border-color .15s,transform .2s cubic-bezier(.34,1.56,.64,1);aspect-ratio:1;background:#0e1116;animation:ospaceSpring .25s cubic-bezier(.34,1.56,.64,1) both}
  .ospace-media-grid .cell:hover{border-color:var(--ospaceA);transform:translateY(-2px)}
  .ospace-media-grid img,.ospace-media-grid video{width:100%;height:100%;object-fit:cover;display:block;transition:transform .35s cubic-bezier(.2,.9,.3,1)}
  .ospace-media-grid .cell:hover img,.ospace-media-grid .cell:hover video{transform:scale(1.06)}
  .ospace-media-grid .veil{position:absolute;inset:0;background:linear-gradient(180deg,transparent 42%,rgba(5,6,8,.88));opacity:0;transition:opacity .18s;display:flex;flex-direction:column;justify-content:flex-end;padding:7px 8px;pointer-events:none}
  .ospace-media-grid .cell:hover .veil{opacity:1}
  .ospace-media-grid .veil .nm{font:600 9.5px Poppins;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .ospace-media-grid .veil .dt{font:400 8.5px Poppins;color:#aab3bf}
  .ospace-media-grid .kind{position:absolute;top:6px;left:6px;font:600 8px Poppins;letter-spacing:.06em;text-transform:uppercase;background:rgba(5,6,8,.7);backdrop-filter:blur(4px);color:#cfd6df;padding:3px 6px;border-radius:5px;pointer-events:none}
  .ospace-media-grid .rm{position:absolute;top:5px;right:5px;width:24px;height:24px;border-radius:7px;border:0;background:rgba(5,6,8,.72);color:#ff7b6e;display:grid;place-items:center;cursor:pointer;opacity:0;transition:opacity .15s,transform .15s,background .15s}
  .ospace-media-grid .cell:hover .rm{opacity:1}
  .ospace-media-grid .rm:hover{transform:scale(1.1);background:rgba(240,82,61,.85);color:#fff}
  .ospace-modal{position:fixed;inset:0;background:rgba(5,6,8,.68);z-index:2147483004;display:flex;align-items:center;justify-content:center;animation:ospaceFade .15s}
  @keyframes ospaceFade{from{opacity:0}to{opacity:1}}
  .ospace-box{background:var(--ospaceP);border:1px solid var(--ospaceL2);border-radius:16px;padding:22px;width:min(640px,94vw);max-height:82vh;overflow-y:auto;font-family:Poppins;color:var(--ospaceT);box-shadow:0 24px 70px rgba(0,0,0,.6);animation:ospaceSlideUp .25s cubic-bezier(.2,.9,.3,1)}
  @keyframes ospaceSlideUp{from{opacity:0;transform:translateY(14px) scale(.98)}to{opacity:1;transform:none}}
  .ospace-box h3{font-size:15px;margin-bottom:4px}
  .ospace-box .bsub{color:var(--ospaceD);font-size:11px;margin-bottom:16px}
  .ospace-tpl-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}
  .ospace-tpl-grid button{background:var(--ospaceP2);border:1px solid var(--ospaceL);border-radius:11px;padding:0 0 10px;color:var(--ospaceT);cursor:pointer;text-align:left;font-family:Poppins;overflow:hidden;transition:all .15s}
  .ospace-tpl-grid button:hover{border-color:var(--ospaceA);transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.4)}
  .ospace-tpl-grid .thumb{height:74px;margin-bottom:9px;background:#0e1116;border-bottom:1px solid var(--ospaceL);display:flex;align-items:center;justify-content:center;padding:10px}
  .ospace-tpl-grid .t{font-weight:600;font-size:11.5px;padding:0 10px 2px}
  .ospace-tpl-grid .d{font-size:9.5px;color:var(--ospaceD);padding:0 10px}
  .ospace-find{position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:2147483003;display:flex;gap:6px;background:var(--ospaceP);border:1px solid var(--ospaceL2);border-radius:12px;padding:8px;box-shadow:0 14px 44px rgba(0,0,0,.55);font-family:Poppins;animation:ospacePop .15s}
  .ospace-find input{width:170px;padding:7px 10px;border-radius:8px;border:1px solid var(--ospaceL);background:#0e1116;color:var(--ospaceT);font:12px Poppins}
  .ospace-find button{background:var(--ospaceP2);border:1px solid var(--ospaceL);color:var(--ospaceT);border-radius:8px;padding:0 12px;font:500 11.5px Poppins;cursor:pointer}
  .ospace-find button:hover{border-color:var(--ospaceL2)}
  .ospace-find .count{align-self:center;font-size:10.5px;color:var(--ospaceD);min-width:54px;text-align:center}
  .ospace-keys{font-family:Poppins;color:var(--ospaceT)}
  .ospace-keys table{width:100%;border-collapse:collapse;font-size:12px}
  .ospace-keys td{padding:7px 4px;border-bottom:1px solid var(--ospaceL)}
  .ospace-keys td:last-child{text-align:right;color:var(--ospaceD)}
  .ospace-keys kbd{background:var(--ospaceP2);border:1px solid var(--ospaceL2);border-radius:5px;padding:2px 7px;font:600 10.5px Poppins;color:var(--ospaceT)}
  body.ospace-panel-open{margin-right:320px}

  /* ============ fluid grid engine (Squarespace-style) ============ */
  .ospace-lattice{position:absolute;z-index:2147482800;pointer-events:none;
    background-image:
      repeating-linear-gradient(to right, rgba(255,255,255,.13) 0 1px, transparent 1px var(--cellw)),
      repeating-linear-gradient(to bottom, rgba(255,255,255,.13) 0 1px, transparent 1px var(--cellh));
    box-shadow:inset 0 0 0 1px rgba(255,255,255,.13);
    background-color:rgba(10,12,15,.25);
    border-radius:4px;animation:ospaceFade .12s}
  .ospace-griditem-dragging{opacity:.75;outline:2px solid var(--ospaceB) !important;cursor:grabbing !important}
  .ospace-handle{position:fixed;z-index:2147483005;width:12px;height:12px;background:#fff;border:2px solid var(--ospaceB);border-radius:3px;cursor:nwse-resize;box-shadow:0 2px 8px rgba(0,0,0,.5)}
  .ospace-handle.e{cursor:ew-resize;border-radius:3px}
  .ospace-handle.s{cursor:ns-resize}
  .ospace-posbadge{position:fixed;z-index:2147483006;background:var(--ospaceB);color:#06131f;font:600 10px Poppins;padding:4px 9px;border-radius:6px;pointer-events:none;white-space:nowrap}

  /* ============ v3: springy, glassy, tactile ============ */
  @keyframes ospaceSpring{0%{opacity:0;transform:scale(.9) translateY(8px)}60%{opacity:1;transform:scale(1.02) translateY(-2px)}100%{opacity:1;transform:none}}
  .ospace-toolbar,.ospace-sec-tools,.ospace-find,.ospace-panel{backdrop-filter:blur(16px) saturate(1.3);background:rgba(19,22,28,.88)}
  .ospace-toolbar{animation:ospaceSpring .2s cubic-bezier(.34,1.56,.64,1)}
  .ospace-toolbar button,.ospace-sec-tools button{transition:transform .13s cubic-bezier(.34,1.56,.64,1),background .13s}
  .ospace-toolbar button:hover{transform:scale(1.12)}
  .ospace-toolbar button:active,.ospace-sec-tools button:active{transform:scale(.9)}
  .ospace-sec-tools button:hover{transform:scale(1.12)}
  .ospace-selected{box-shadow:0 0 0 4px rgba(240,82,61,.16)}
  .ospace-addline button{transition:transform .15s cubic-bezier(.34,1.56,.64,1),opacity .15s}
  .ospace-addline button:hover{transform:translateY(-50%) scale(1.07)}

  /* context menu */
  .ospace-ctx{position:fixed;z-index:2147483250;min-width:224px;background:rgba(19,22,28,.92);backdrop-filter:blur(20px) saturate(1.3);border:1px solid var(--ospaceL2);border-radius:14px;padding:6px;box-shadow:0 20px 60px rgba(0,0,0,.65);font-family:Poppins;color:var(--ospaceT);animation:ospaceSpring .18s cubic-bezier(.34,1.56,.64,1)}
  .ospace-ctx .lbl{padding:7px 11px 3px;font:600 9px Poppins;letter-spacing:.14em;text-transform:uppercase;color:var(--ospaceD)}
  .ospace-ctx .it{position:relative;display:flex;align-items:center;gap:10px;padding:8px 11px;border-radius:9px;font-size:12.5px;cursor:pointer;white-space:nowrap;transition:background .1s}
  .ospace-ctx .it:hover{background:var(--ospaceL)}
  .ospace-ctx .it svg{flex:0 0 auto;color:var(--ospaceD)}
  .ospace-ctx .it:hover svg{color:var(--ospaceT)}
  .ospace-ctx .it .k{margin-left:auto;color:var(--ospaceD);font-size:10px;padding-left:14px}
  .ospace-ctx .it.danger,.ospace-ctx .it.danger svg{color:#ff7b6e}
  .ospace-ctx .it.danger:hover{background:rgba(240,82,61,.14)}
  .ospace-ctx .div{height:1px;background:var(--ospaceL);margin:5px 9px}
  .ospace-ctx .sub{position:absolute;left:calc(100% - 4px);top:-7px;display:none;min-width:190px;background:rgba(19,22,28,.94);backdrop-filter:blur(20px);border:1px solid var(--ospaceL2);border-radius:12px;padding:6px;box-shadow:0 16px 50px rgba(0,0,0,.6)}
  .ospace-ctx .it:hover>.sub{display:block;animation:ospaceSpring .16s cubic-bezier(.34,1.56,.64,1)}

  /* template picker v3 — categories + live previews */
  .ospace-cats{display:flex;gap:6px;margin-bottom:16px;flex-wrap:wrap}
  .ospace-cats button{background:var(--ospaceP2);border:1px solid var(--ospaceL);color:var(--ospaceD);border-radius:20px;padding:6px 15px;font:500 11.5px Poppins;cursor:pointer;transition:all .15s cubic-bezier(.34,1.56,.64,1)}
  .ospace-cats button:hover{color:var(--ospaceT);transform:translateY(-1px)}
  .ospace-cats button.on{background:var(--ospaceA);border-color:var(--ospaceA);color:#fff}
  .ospace-tpl-grid.v3{grid-template-columns:1fr 1fr}
  .ospace-live-thumb{height:128px;overflow:hidden;position:relative;background:#000;border-bottom:1px solid var(--ospaceL)}
  .ospace-live-thumb>div{width:1200px;transform:scale(.235);transform-origin:0 0;pointer-events:none}
  .ospace-live-thumb::after{content:"";position:absolute;inset:0}
  .ospace-tpl-grid button{animation:ospaceSpring .25s cubic-bezier(.34,1.56,.64,1) both}

  /* element palette */
  .ospace-elem-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
  .ospace-elem-grid button{background:var(--ospaceP2);border:1px solid var(--ospaceL);border-radius:13px;padding:15px 8px 12px;display:flex;flex-direction:column;align-items:center;gap:9px;color:var(--ospaceT);cursor:pointer;font:500 11px Poppins;transition:all .16s cubic-bezier(.34,1.56,.64,1)}
  .ospace-elem-grid button:hover{border-color:var(--ospaceA);transform:translateY(-3px) scale(1.04);box-shadow:0 12px 30px rgba(0,0,0,.45)}
  .ospace-elem-grid .ic{width:36px;height:36px;border-radius:10px;background:var(--ospaceL);display:grid;place-items:center;color:var(--ospaceB);transition:all .16s}
  .ospace-elem-grid button:hover .ic{background:rgba(240,82,61,.18);color:var(--ospaceA)}
  `;
  doc.head.appendChild(css);

  /* ============ shipped animation runtime (kept in serialized page) ============
     v2: entrance timing is tunable via CSS vars (--anim-dur/--anim-delay/--anim-ease)
     set inline per element, plus data-hover micro-interactions. */
  function ensureAnimRuntime() {
    const oldCss = doc.getElementById('ospace-anim-css');
    if (oldCss && oldCss.getAttribute('data-v') !== '2') oldCss.remove();
    if (!doc.getElementById('ospace-anim-css')) {
      const s = doc.createElement('style');
      s.id = 'ospace-anim-css';
      s.setAttribute('data-v', '2');
      s.textContent = `[data-anim]{opacity:0}[data-anim].ospace-in{opacity:1}
@keyframes ospaceFadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:none}}
@keyframes ospaceFadeIn{from{opacity:0}to{opacity:1}}
@keyframes ospaceSlideL{from{opacity:0;transform:translateX(-40px)}to{opacity:1;transform:none}}
@keyframes ospaceSlideR{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:none}}
@keyframes ospaceZoom{from{opacity:0;transform:scale(.88)}to{opacity:1;transform:none}}
[data-anim="fade-up"].ospace-in{animation:ospaceFadeUp var(--anim-dur,.8s) var(--anim-ease,cubic-bezier(.2,.8,.3,1)) var(--anim-delay,0s) both}
[data-anim="fade-in"].ospace-in{animation:ospaceFadeIn var(--anim-dur,1s) var(--anim-ease,ease) var(--anim-delay,0s) both}
[data-anim="slide-left"].ospace-in{animation:ospaceSlideL var(--anim-dur,.8s) var(--anim-ease,cubic-bezier(.2,.8,.3,1)) var(--anim-delay,0s) both}
[data-anim="slide-right"].ospace-in{animation:ospaceSlideR var(--anim-dur,.8s) var(--anim-ease,cubic-bezier(.2,.8,.3,1)) var(--anim-delay,0s) both}
[data-anim="zoom"].ospace-in{animation:ospaceZoom var(--anim-dur,.7s) var(--anim-ease,cubic-bezier(.2,.8,.3,1)) var(--anim-delay,0s) both}
[data-hover]{transition:transform .28s cubic-bezier(.2,.9,.3,1),box-shadow .28s cubic-bezier(.2,.9,.3,1),opacity .28s ease,filter .28s ease}
[data-hover="lift"]:hover{transform:translateY(-6px);box-shadow:0 18px 44px rgba(0,0,0,.45)}
[data-hover="zoom"]:hover{transform:scale(1.035)}
[data-hover="glow"]:hover{box-shadow:0 10px 38px rgba(240,82,61,.45)}
[data-hover="fade"]:hover{opacity:.72}
@media (prefers-reduced-motion:reduce){[data-anim]{opacity:1;animation:none !important}[data-hover]{transition:none}[data-hover]:hover{transform:none;box-shadow:none;opacity:1}}`;
      doc.head.appendChild(s);
    }
    if (!doc.getElementById('ospace-anim-js')) {
      const sc = doc.createElement('script');
      sc.id = 'ospace-anim-js';
      sc.textContent = `(function(){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('ospace-in');io.unobserve(e.target)}})},{threshold:.15});document.querySelectorAll('[data-anim]').forEach(function(n){io.observe(n)});})();`;
      doc.body.appendChild(sc);
    }
  }
  if (doc.querySelector('[data-anim],[data-hover]')) {
    ensureAnimRuntime();
    doc.querySelectorAll('[data-anim]').forEach((n) => n.classList.add('ospace-in'));
  }

  /* ================= state ================= */
  let selected = null;
  let undoStack = [], redoStack = [];
  const bodySnapshot = () => {
    // exclude editor UI — snapshots must contain only real page content
    const c = doc.body.cloneNode(true);
    c.querySelectorAll('[data-ospace]').forEach((n) => n.remove());
    return c.innerHTML;
  };
  function markDirty() { parent.postMessage({ type: 'ospace-dirty' }, '*'); }
  function pushUndo() {
    undoStack.push(bodySnapshot());
    if (undoStack.length > 80) undoStack.shift();
    redoStack = [];
    markDirty();
  }
  function restore(html) {
    cleanupUI();
    doc.body.innerHTML = html;
    bindAll();
  }
  function undo() { if (undoStack.length) { redoStack.push(bodySnapshot()); restore(undoStack.pop()); markDirty(); } }
  function redo() { if (redoStack.length) { undoStack.push(bodySnapshot()); restore(redoStack.pop()); markDirty(); } }

  /* ================= serializer ================= */
  function serialize() {
    const clone = doc.documentElement.cloneNode(true);
    clone.querySelectorAll('[data-ospace]').forEach((n) => n.remove());
    clone.querySelectorAll('script[src*="editor.js"]').forEach((n) => n.remove());
    clone.querySelectorAll('*').forEach((n) => {
      ['ospace-hover','ospace-selected','ospace-sec-hover','ospace-dragging','ospace-drop-above','ospace-drop-below','ospace-in','ospace-panel-open'].forEach((c) => n.classList && n.classList.remove(c));
      if (n.classList && !n.classList.length) n.removeAttribute('class');
      n.removeAttribute && (n.removeAttribute('contenteditable'), n.removeAttribute('draggable'));
    });
    // keep anim runtime only if something still uses it
    if (!clone.querySelector('[data-anim],[data-hover]')) {
      clone.querySelectorAll('#ospace-anim-css,#ospace-anim-js').forEach((n) => n.remove());
    }
    return '<!DOCTYPE html>\n' + clone.outerHTML;
  }

  /* ================= selection / hover ================= */
  function isEditorUI(el) { return !!(el.closest && el.closest('[data-ospace]')); }
  function topSection(el) {
    let n = el;
    while (n && n.parentElement !== doc.body) n = n.parentElement;
    return n && n !== doc.body && ['SECTION','HEADER','FOOTER','DIV','MAIN'].includes(n.tagName) ? n : null;
  }

  doc.addEventListener('mouseover', (e) => {
    if (isEditorUI(e.target) || dragSec) return;
    e.target.classList.add('ospace-hover');
    const sec = topSection(e.target);
    if (sec) { showSecTools(sec); sec.classList.add('ospace-sec-hover'); showAddLines(sec); }
  });
  doc.addEventListener('mouseout', (e) => {
    e.target.classList && e.target.classList.remove('ospace-hover');
    const sec = topSection(e.target);
    if (sec) sec.classList.remove('ospace-sec-hover');
  });
  doc.addEventListener('click', (e) => {
    if (isEditorUI(e.target)) return;
    const a = e.target.closest && e.target.closest('a');
    if (a && !a.isContentEditable) e.preventDefault();
    select(e.target);
  }, true);
  doc.addEventListener('dblclick', (e) => {
    if (isEditorUI(e.target)) return;
    e.preventDefault();
    const el = e.target;
    if (TEXT_TAGS.includes(el.tagName) && !el.querySelector('img,video,section')) startTextEdit(el);
  });

  function select(el, withPanel = true) {
    if (el === doc.body || el === doc.documentElement) return;
    if (selected) selected.classList.remove('ospace-selected');
    selected = el;
    el.classList.add('ospace-selected');
    showBadge(el);
    showToolbar(el);
    showCrumb(el);
    mountHandles(el);
    if (withPanel) openPanelFor(el);
  }
  function deselect() {
    if (selected) selected.classList.remove('ospace-selected');
    selected = null;
    hideBadge(); hideToolbar(); hideCrumb(); closePanel(); clearHandles(); hideLattice();
  }

  doc.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeCtx(); closeFind(); closeModals(); finishTextEdit(); deselect(); }
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
    if (mod && e.key.toLowerCase() === 'f') { e.preventDefault(); openFind(); }
    if (e.key === '?' && !editingEl) { e.preventDefault(); openKeys(); }
    if ((e.key === 'Delete' || e.key === 'Backspace') && selected && !selected.isContentEditable && !editingEl) {
      e.preventDefault(); pushUndo(); selected.remove(); deselect();
    }
    if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown') && selected) {
      e.preventDefault();
      const sec = topSection(selected) || selected;
      pushUndo();
      if (e.key === 'ArrowUp' && sec.previousElementSibling) sec.previousElementSibling.before(sec);
      if (e.key === 'ArrowDown' && sec.nextElementSibling) sec.nextElementSibling.after(sec);
      sec.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });

  /* ================= badge + breadcrumb ================= */
  const badge = mkUI('div', 'ospace-badge');
  function labelFor(el) {
    const names = { H1:'Heading 1', H2:'Heading 2', H3:'Heading 3', P:'Paragraph', A:'Link', IMG:'Image', VIDEO:'Video', SECTION:'Section', BUTTON:'Button', FOOTER:'Footer', HEADER:'Header', DIV:'Box', SPAN:'Text', LI:'List item', UL:'List' };
    return names[el.tagName] || el.tagName.toLowerCase();
  }
  function showBadge(el) {
    const r = el.getBoundingClientRect();
    badge.textContent = labelFor(el);
    badge.style.display = 'block';
    badge.style.left = Math.max(4, r.left) + 'px';
    badge.style.top = Math.max(4, r.top - 22) + 'px';
  }
  function hideBadge() { badge.style.display = 'none'; }

  const crumb = mkUI('div', 'ospace-crumb ospace-ui');
  function showCrumb(el) {
    crumb.style.display = 'flex';
    crumb.innerHTML = '';
    const chain = [];
    let n = el;
    while (n && n !== doc.body) { chain.unshift(n); n = n.parentElement; }
    chain.slice(-4).forEach((node, i, arr) => {
      const b = doc.createElement('button');
      b.textContent = labelFor(node);
      if (i === arr.length - 1) b.className = 'last';
      b.onclick = () => select(node);
      crumb.appendChild(b);
    });
  }
  function hideCrumb() { crumb.style.display = 'none'; }

  /* ================= text editing ================= */
  let editingEl = null;
  function startTextEdit(el) {
    finishTextEdit();
    pushUndo();
    editingEl = el;
    el.setAttribute('contenteditable', 'true');
    el.focus();
    showToolbar(el, true);
  }
  function finishTextEdit() {
    if (!editingEl) return;
    editingEl.removeAttribute('contenteditable');
    editingEl = null;
  }
  doc.addEventListener('input', (e) => { if (e.target === editingEl) markDirty(); });

  /* ================= floating toolbar ================= */
  const bar = mkUI('div', 'ospace-toolbar ospace-ui');
  function tbtn(html, fn, title, cls) {
    const b = doc.createElement('button');
    b.innerHTML = html;
    if (title) b.title = title;
    if (cls) b.className = cls;
    b.onmousedown = (ev) => ev.preventDefault();
    b.onclick = fn;
    return b;
  }
  function showToolbar(el, textMode) {
    bar.innerHTML = '';
    const isText = TEXT_TAGS.includes(el.tagName) && !el.querySelector('img,video');
    if (textMode || el.isContentEditable) {
      bar.append(
        tbtn(IC.bold, () => doc.execCommand('bold'), 'Bold'),
        tbtn(IC.italic, () => doc.execCommand('italic'), 'Italic'),
        tbtn(IC.under, () => doc.execCommand('underline'), 'Underline'),
        tbtn(IC.link, () => { const u = prompt('Link URL:'); if (u) doc.execCommand('createLink', false, u); }, 'Add link'),
        sep(),
        tbtn(IC.check, () => { finishTextEdit(); hideToolbar(); }, 'Done editing')
      );
    } else {
      if (isText) bar.append(tbtn(IC.edit, () => startTextEdit(el), 'Edit text'));
      bar.append(
        tbtn(IC.dup, () => { pushUndo(); const c = el.cloneNode(true); c.classList.remove('ospace-selected'); el.after(c); bindAll(); }, 'Duplicate'),
        tbtn(IC.parent, () => { if (el.parentElement && el.parentElement !== doc.body) select(el.parentElement); }, 'Select parent')
      );
      const a = el.tagName === 'A' ? el : el.closest && el.closest('a');
      if (a) bar.append(tbtn(IC.link, () => { const u = prompt('Link URL:', a.getAttribute('href') || ''); if (u !== null) { pushUndo(); a.setAttribute('href', u); } }, 'Edit link'));
      bar.append(tbtn(IC.plus, () => openElements(el, 'after'), 'Insert element below'));
      bar.append(sep(), tbtn(IC.del, () => { pushUndo(); el.remove(); deselect(); }, 'Delete', 'danger'));
    }
    const r = el.getBoundingClientRect();
    bar.style.display = 'flex';
    bar.style.left = Math.max(8, Math.min(innerWidth - 280, r.left)) + 'px';
    bar.style.top = (r.top > 90 ? r.top - 48 : r.bottom + 10) + 'px';
  }
  function sep() { const s = doc.createElement('div'); s.className = 'sep'; return s; }
  function hideToolbar() { bar.style.display = 'none'; }

  /* ================= section tools + add lines ================= */
  const secTools = mkUI('div', 'ospace-sec-tools ospace-ui');
  let secTarget = null;
  function showSecTools(sec) {
    secTarget = sec;
    const r = sec.getBoundingClientRect();
    secTools.style.display = 'flex';
    secTools.style.left = Math.max(6, r.left + 10) + 'px';
    secTools.style.top = Math.max(64, r.top + 10) + 'px';
    secTools.innerHTML = '';
    const grab = tbtn(IC.drag, () => {}, 'Drag to reorder', 'grab');
    grab.draggable = true;
    grab.addEventListener('dragstart', (e) => startSecDrag(e, sec));
    secTools.append(
      grab,
      tbtn(IC.up, () => { if (sec.previousElementSibling) { pushUndo(); sec.previousElementSibling.before(sec); sec.scrollIntoView({behavior:'smooth',block:'center'}); } }, 'Move up (⌥↑)'),
      tbtn(IC.down, () => { if (sec.nextElementSibling) { pushUndo(); sec.nextElementSibling.after(sec); sec.scrollIntoView({behavior:'smooth',block:'center'}); } }, 'Move down (⌥↓)'),
      tbtn(IC.dup, () => { pushUndo(); const c = sec.cloneNode(true); c.classList.remove('ospace-sec-hover'); sec.after(c); bindAll(); }, 'Duplicate section'),
      tbtn(IC.style, () => select(sec), 'Section style'),
      tbtn(IC.del, () => { if (confirm('Delete this whole section?')) { pushUndo(); sec.remove(); secTools.style.display = 'none'; hideAddLines(); } }, 'Delete section', 'danger')
    );
  }

  const addTop = mkAddLine(); const addBot = mkAddLine();
  function mkAddLine() {
    const w = doc.createElement('div');
    w.className = 'ospace-addline'; w.dataset.ospace = '1'; w.style.display = 'none';
    const b = doc.createElement('button');
    b.innerHTML = IC.plus + ' Add section';
    w.appendChild(b);
    doc.body.appendChild(w);
    return w;
  }
  function showAddLines(sec) {
    const r = sec.getBoundingClientRect();
    [[addTop, r.top, 'before'], [addBot, r.bottom, 'after']].forEach(([line, y, where]) => {
      if (y < 40 || y > innerHeight - 8) { line.style.display = 'none'; return; }
      line.style.display = 'flex';
      line.style.top = y + 'px';
      line.querySelector('button').onclick = () => openTemplates(sec, where);
    });
  }
  function hideAddLines() { addTop.style.display = 'none'; addBot.style.display = 'none'; }
  doc.addEventListener('scroll', () => {
    if (secTarget) { showSecTools(secTarget); showAddLines(secTarget); }
    if (selected) { showBadge(selected); positionAllHandles(selected); }
    hideToolbar();
  }, true);

  /* ================= drag & drop: sections ================= */
  let dragSec = null;
  function startSecDrag(e, sec) {
    dragSec = sec;
    sec.classList.add('ospace-dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', 'ospace-section');
  }
  doc.addEventListener('dragover', (e) => {
    if (!dragSec) return;
    e.preventDefault();
    const over = topSection(e.target);
    doc.querySelectorAll('.ospace-drop-above,.ospace-drop-below').forEach((n) => n.classList.remove('ospace-drop-above','ospace-drop-below'));
    if (over && over !== dragSec) {
      const r = over.getBoundingClientRect();
      over.classList.add(e.clientY < r.top + r.height / 2 ? 'ospace-drop-above' : 'ospace-drop-below');
    }
    if (e.clientY < 70) scrollBy(0, -14);
    if (e.clientY > innerHeight - 70) scrollBy(0, 14);
  });
  doc.addEventListener('drop', (e) => {
    if (!dragSec) return;
    e.preventDefault();
    const over = topSection(e.target);
    if (over && over !== dragSec) {
      pushUndo();
      const r = over.getBoundingClientRect();
      if (e.clientY < r.top + r.height / 2) over.before(dragSec); else over.after(dragSec);
    }
    endSecDrag();
  });
  doc.addEventListener('dragend', endSecDrag);
  function endSecDrag() {
    if (dragSec) dragSec.classList.remove('ospace-dragging');
    dragSec = null;
    doc.querySelectorAll('.ospace-drop-above,.ospace-drop-below').forEach((n) => n.classList.remove('ospace-drop-above','ospace-drop-below'));
  }

  /* ================= drag & drop: grid items ================= */
  function bindGridDrag() {
    doc.querySelectorAll('.fgrid img, .others-grid img, .trusted-row img').forEach((img) => {
      if (img.style.gridArea) { img.draggable = false; return; } // fluid grid engine handles these
      img.draggable = true;
      img.ondragstart = (e) => { e.dataTransfer.setData('text/plain', 'ospace-grid-item'); window.__ospaceDragItem = img; img.classList.add('ospace-dragging'); };
      img.ondragend = () => { img.classList.remove('ospace-dragging'); window.__ospaceDragItem = null; };
      img.ondragover = (e) => { if (window.__ospaceDragItem && window.__ospaceDragItem !== img) e.preventDefault(); };
      img.ondrop = (e) => {
        const src = window.__ospaceDragItem;
        if (!src || src === img) return;
        e.preventDefault(); e.stopPropagation();
        pushUndo();
        const a = src.getAttribute('style'), b = img.getAttribute('style');
        if (b) src.setAttribute('style', b); else src.removeAttribute('style');
        if (a) img.setAttribute('style', a); else img.removeAttribute('style');
        const tmp = doc.createComment('ospace-swap');
        src.replaceWith(tmp); img.replaceWith(src); tmp.replaceWith(img);
      };
    });
  }

  /* ================= side panel ================= */
  let panel = null;
  function closePanel() { if (panel) { panel.remove(); panel = null; doc.body.classList.remove('ospace-panel-open'); } }
  function mkPanel(titleTxt, subTxt) {
    closePanel();
    panel = doc.createElement('div');
    panel.className = 'ospace-panel ospace-ui';
    panel.dataset.ospace = '1';
    panel.innerHTML = `<button class="close">${IC.x}</button><div class="title">${titleTxt}</div><div class="sub">${subTxt || ''}</div>`;
    panel.querySelector('.close').onclick = () => deselect();
    doc.body.appendChild(panel);
    doc.body.classList.add('ospace-panel-open');
    return panel;
  }
  function h4(p, txt) { const h = doc.createElement('h4'); h.textContent = txt; p.appendChild(h); return h; }
  function field(p, labelTxt, value, oninput) {
    const l = doc.createElement('label'); l.textContent = labelTxt; p.appendChild(l);
    const i = doc.createElement('input'); i.type = 'text'; i.value = value ?? '';
    i.addEventListener('change', () => { pushUndo(); oninput(i.value); });
    p.appendChild(i); return i;
  }
  function colorField(p, labelTxt, value, fn) {
    const l = doc.createElement('label'); l.textContent = labelTxt; p.appendChild(l);
    const row = doc.createElement('div'); row.className = 'rowc';
    const c = doc.createElement('input'); c.type = 'color'; c.value = value || '#ffffff';
    const t = doc.createElement('input'); t.type = 'text'; t.value = value || ''; t.style.flex = '1';
    c.oninput = () => { t.value = c.value; };
    c.onchange = () => { pushUndo(); fn(c.value); };
    t.onchange = () => { pushUndo(); fn(t.value); if (/^#[0-9a-f]{6}$/i.test(t.value)) c.value = t.value; };
    row.append(c, t); p.appendChild(row);
    const sw = doc.createElement('div'); sw.className = 'swatches';
    ['#ffffff','#000000','#f0523d','#79b8e8','#34d68b','#e8c34a'].forEach((hex) => {
      const b = doc.createElement('button'); b.style.background = hex; b.title = hex;
      b.onclick = () => { pushUndo(); fn(hex); c.value = hex; t.value = hex; };
      sw.appendChild(b);
    });
    p.appendChild(sw);
  }
  function rangeField(p, labelTxt, value, min, max, step, fmt, fn) {
    const l = doc.createElement('label'); l.textContent = labelTxt; p.appendChild(l);
    const row = doc.createElement('div'); row.className = 'rowc';
    const r = doc.createElement('input'); r.type = 'range'; r.min = min; r.max = max; r.step = step; r.value = value;
    const v = doc.createElement('span'); v.className = 'rangeval'; v.textContent = fmt(value);
    let pushed = false;
    r.oninput = () => { if (!pushed) { pushUndo(); pushed = true; } v.textContent = fmt(r.value); fn(r.value); };
    r.onchange = () => { pushed = false; };
    row.append(r, v); p.appendChild(row);
  }
  function selectField(p, labelTxt, value, options, fn) {
    const l = doc.createElement('label'); l.textContent = labelTxt; p.appendChild(l);
    const s = doc.createElement('select');
    options.forEach((o) => {
      const [val, lab] = Array.isArray(o) ? o : [o, o];
      const op = doc.createElement('option'); op.value = val; op.textContent = lab;
      if (val === value) op.selected = true;
      s.appendChild(op);
    });
    s.onchange = () => { pushUndo(); fn(s.value); };
    p.appendChild(s); return s;
  }
  function checkField(p, labelTxt, value, fn) {
    const l = doc.createElement('label'); l.className = 'ospace-check';
    const c = doc.createElement('input'); c.type = 'checkbox'; c.checked = !!value;
    c.onchange = () => { pushUndo(); fn(c.checked); };
    l.append(c, doc.createTextNode(labelTxt)); p.appendChild(l);
  }
  function btn(p, html, fn, cls) {
    const b = doc.createElement('button'); b.className = 'btn' + (cls ? ' ' + cls : '');
    b.innerHTML = html; b.onclick = fn; p.appendChild(b); return b;
  }

  function openPanelFor(el) {
    if (el.tagName === 'IMG') return imagePanel(el);
    if (el.tagName === 'VIDEO') return videoPanel(el);
    return stylePanel(el);
  }

  /* ---- filters helper ---- */
  function getFilterVal(el, name, dflt) {
    const m = (el.style.filter || '').match(new RegExp(name + '\\(([\\d.]+)'));
    return m ? parseFloat(m[1]) : dflt;
  }
  function setFilterVal(el, name, val, unit) {
    const parts = (el.style.filter || '').split(/\s+/).filter((s) => s && !s.startsWith(name + '('));
    parts.push(`${name}(${val}${unit || ''})`);
    el.style.filter = parts.join(' ');
  }

  /* ---- image panel ---- */
  function imagePanel(img) {
    const p = mkPanel('Image', img.getAttribute('src')?.split('/').pop()?.split('?')[0] || '');
    h4(p, 'Source');
    field(p, 'Image URL', img.getAttribute('src'), (v) => { img.src = v; });
    field(p, 'Alt text (SEO + accessibility)', img.getAttribute('alt'), (v) => img.setAttribute('alt', v));
    btn(p, IC.img + ' Upload replacement…', () => pickFile('image/*', async (file) => {
      const url = await upload(file);
      if (url) { pushUndo(); img.src = url; }
    }));
    btn(p, IC.search + ' Media library…', () => mediaLibrary((url) => { pushUndo(); img.src = url; }));
    h4(p, 'Crop & Fit');
    selectField(p, 'Object fit', getComputedStyle(img).objectFit, ['cover','contain','fill','none'], (v) => img.style.objectFit = v);
    rangeField(p, 'Corner radius', parseInt(img.style.borderRadius) || 0, 0, 60, 1, (v) => v + 'px', (v) => img.style.borderRadius = v + 'px');
    h4(p, 'Adjust');
    rangeField(p, 'Brightness', getFilterVal(img, 'brightness', 1), 0.2, 2, 0.05, (v) => Math.round(v * 100) + '%', (v) => setFilterVal(img, 'brightness', v));
    rangeField(p, 'Contrast', getFilterVal(img, 'contrast', 1), 0.2, 2, 0.05, (v) => Math.round(v * 100) + '%', (v) => setFilterVal(img, 'contrast', v));
    rangeField(p, 'Saturation', getFilterVal(img, 'saturate', 1), 0, 2, 0.05, (v) => Math.round(v * 100) + '%', (v) => setFilterVal(img, 'saturate', v));
    rangeField(p, 'Opacity', parseFloat(img.style.opacity || 1), 0.1, 1, 0.05, (v) => Math.round(v * 100) + '%', (v) => img.style.opacity = v);
    btn(p, 'Reset adjustments', () => { pushUndo(); img.style.filter = ''; img.style.opacity = ''; });
    animControls(p, img);
    commonActions(p, img);
  }

  /* ---- video panel ---- */
  function videoPanel(vid) {
    const p = mkPanel('Video', (vid.getAttribute('src') || '').split('/').pop());
    h4(p, 'Source');
    field(p, 'Video URL', vid.getAttribute('src') || vid.querySelector('source')?.src || '', (v) => {
      vid.removeAttribute('src');
      vid.querySelectorAll('source').forEach((s) => s.remove());
      vid.src = v; vid.load(); vid.play().catch(() => {});
    });
    btn(p, IC.play + ' Upload replacement…', () => pickFile('video/*', async (file) => {
      const url = await upload(file);
      if (url) { pushUndo(); vid.src = url; vid.load(); vid.play().catch(() => {}); }
    }));
    btn(p, IC.search + ' Media library…', () => mediaLibrary((url) => { pushUndo(); vid.src = url; vid.load(); }));
    h4(p, 'Playback');
    checkField(p, 'Autoplay (muted)', vid.autoplay, (v) => { vid.autoplay = v; if (v) { vid.muted = true; vid.play().catch(() => {}); } });
    checkField(p, 'Loop', vid.loop, (v) => vid.loop = v);
    checkField(p, 'Muted', vid.muted, (v) => vid.muted = v);
    checkField(p, 'Show controls', vid.controls, (v) => vid.controls = v);
    h4(p, 'Adjust');
    rangeField(p, 'Brightness', getFilterVal(vid, 'brightness', 1), 0.2, 2, 0.05, (v) => Math.round(v * 100) + '%', (v) => setFilterVal(vid, 'brightness', v));
    animControls(p, vid);
    commonActions(p, vid);
  }

  /* ---- generic style panel ---- */
  function stylePanel(el) {
    const cls = typeof el.className === 'string' ? el.className.split(' ').filter((c) => c && !c.startsWith('ospace'))[0] : '';
    const p = mkPanel(labelFor(el), cls ? '.' + cls : '');
    const cs = getComputedStyle(el);
    h4(p, 'Typography');
    field(p, 'Font size (px / rem / clamp)', el.style.fontSize, (v) => el.style.fontSize = v);
    colorField(p, 'Text color', el.style.color || rgbToHex(cs.color), (v) => el.style.color = v);
    selectField(p, 'Alignment', cs.textAlign, [['left','Left'],['center','Center'],['right','Right'],['justify','Justify']], (v) => el.style.textAlign = v);
    selectField(p, 'Weight', cs.fontWeight, [['400','Regular'],['500','Medium'],['600','Semibold'],['700','Bold'],['800','Extrabold']], (v) => el.style.fontWeight = v);
    checkField(p, 'Italic', cs.fontStyle === 'italic', (v) => el.style.fontStyle = v ? 'italic' : 'normal');
    h4(p, 'Background');
    colorField(p, 'Background color', el.style.backgroundColor ? rgbToHex(cs.backgroundColor) : '#000000', (v) => el.style.backgroundColor = v);
    btn(p, 'Clear background color', () => { pushUndo(); el.style.backgroundColor = ''; });
    bgMediaControls(p, el);
    h4(p, 'Spacing & Size');
    const r2 = doc.createElement('div'); r2.className = 'row2'; p.appendChild(r2);
    field(r2, 'Padding', el.style.padding, (v) => el.style.padding = v);
    field(r2, 'Margin', el.style.margin, (v) => el.style.margin = v);
    field(p, 'Min height (e.g. 60vh)', el.style.minHeight, (v) => el.style.minHeight = v);
    rangeField(p, 'Corner radius', parseInt(el.style.borderRadius) || 0, 0, 60, 1, (v) => v + 'px', (v) => el.style.borderRadius = v + 'px');
    animControls(p, el);
    commonActions(p, el);
  }

  /* ================= fluid grid engine =================
     Squarespace-style editing for CSS-grid children that carry explicit
     grid-area (e.g. the 26-track photo grids): drag anywhere to move with
     snap-to-cell + live lattice, and resize via corner/edge handles. */
  function gridCtx(el) {
    const parent = el.parentElement;
    if (!parent || parent === doc.body) return null;
    const pcs = getComputedStyle(parent);
    if (pcs.display !== 'grid') return null;
    const rowStart = getComputedStyle(el).gridRowStart;
    if (rowStart === 'auto' || !/^\d+$/.test(rowStart)) return null;
    const cols = pcs.gridTemplateColumns.split(' ').map(parseFloat);
    const rowH = parseFloat(pcs.gridAutoRows) || parseFloat(pcs.gridTemplateRows.split(' ')[0]) || 24;
    return {
      parent, cols, nCols: cols.length, rowH,
      colGap: parseFloat(pcs.columnGap) || 0,
      rowGap: parseFloat(pcs.rowGap) || 0,
      padL: parseFloat(pcs.paddingLeft) || 0,
      padT: parseFloat(pcs.paddingTop) || 0,
    };
  }
  function areaOf(el) {
    const cs = getComputedStyle(el);
    const r1 = parseInt(cs.gridRowStart), c1 = parseInt(cs.gridColumnStart);
    let r2 = cs.gridRowEnd, c2 = cs.gridColumnEnd;
    r2 = /^\d+$/.test(r2) ? parseInt(r2) : r1 + 1;
    c2 = /^\d+$/.test(c2) ? parseInt(c2) : c1 + 1;
    return { r1, c1, r2, c2 };
  }
  function setArea(el, a) { el.style.gridArea = `${a.r1}/${a.c1}/${a.r2}/${a.c2}`; }
  function cellFromPoint(ctx, clientX, clientY) {
    const pr = ctx.parent.getBoundingClientRect();
    const x = clientX - pr.left - ctx.padL;
    const y = clientY - pr.top - ctx.padT;
    let acc = 0, col = 1;
    for (let i = 0; i < ctx.nCols; i++) {
      acc += ctx.cols[i] + ctx.colGap;
      if (x < acc) { col = i + 1; break; }
      col = i + 2;
    }
    const row = Math.max(1, Math.floor(y / (ctx.rowH + ctx.rowGap)) + 1);
    return { row, col: Math.min(Math.max(col, 1), ctx.nCols) };
  }
  let lattice = null, posBadge = null;
  function showLattice(ctx) {
    hideLattice();
    const pr = ctx.parent.getBoundingClientRect();
    lattice = doc.createElement('div');
    lattice.className = 'ospace-lattice';
    lattice.dataset.ospace = '1';
    const cellw = ctx.cols[0] + ctx.colGap, cellh = ctx.rowH + ctx.rowGap;
    lattice.style.cssText += `;left:${pr.left + scrollX + ctx.padL}px;top:${pr.top + scrollY + ctx.padT}px;width:${pr.width - ctx.padL * 2}px;height:${pr.height - ctx.padT * 2}px;--cellw:${cellw}px;--cellh:${cellh}px`;
    doc.body.appendChild(lattice);
    posBadge = doc.createElement('div');
    posBadge.className = 'ospace-posbadge';
    posBadge.dataset.ospace = '1';
    doc.body.appendChild(posBadge);
  }
  function hideLattice() {
    lattice && lattice.remove(); lattice = null;
    posBadge && posBadge.remove(); posBadge = null;
  }
  function updatePosBadge(el, a) {
    if (!posBadge) return;
    const r = el.getBoundingClientRect();
    posBadge.textContent = `${a.c2 - a.c1} × ${a.r2 - a.r1} cells`;
    posBadge.style.left = r.left + 'px';
    posBadge.style.top = (r.top - 24) + 'px';
  }

  /* ---- drag to move ---- */
  let gd = null; // {el, ctx, startArea, grabRow, grabCol, moved, pushed}
  doc.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || editingEl || isEditorUI(e.target)) return;
    const el = e.target.closest && e.target.closest('[style*="grid-area"]');
    const target = el && el.parentElement ? el : e.target;
    const ctx = gridCtx(target);
    if (!ctx) return;
    const cell = cellFromPoint(ctx, e.clientX, e.clientY);
    gd = { el: target, ctx, startArea: areaOf(target), grab: cell, moved: false, pushed: false };
  }, true);
  doc.addEventListener('pointermove', (e) => {
    if (!gd) return;
    if (!gd.moved) {
      const cell = cellFromPoint(gd.ctx, e.clientX, e.clientY);
      if (cell.row === gd.grab.row && cell.col === gd.grab.col) return;
      gd.moved = true;
      if (!gd.pushed) { pushUndo(); gd.pushed = true; }
      try { doc.getSelection().removeAllRanges(); } catch {}
      gd.el.classList.add('ospace-griditem-dragging');
      showLattice(gd.ctx);
      hideToolbar(); hideBadge(); closePanel();
    }
    e.preventDefault();
    const cell = cellFromPoint(gd.ctx, e.clientX, e.clientY);
    const a = gd.startArea;
    const w = a.c2 - a.c1, h = a.r2 - a.r1;
    let c1 = cell.col - (gd.grab.col - a.c1);
    let r1 = cell.row - (gd.grab.row - a.r1);
    c1 = Math.min(Math.max(1, c1), gd.ctx.nCols + 1 - w);
    r1 = Math.max(1, r1);
    const next = { r1, c1, r2: r1 + h, c2: c1 + w };
    setArea(gd.el, next);
    updatePosBadge(gd.el, next);
  });
  doc.addEventListener('pointerup', () => {
    if (!gd) return;
    if (gd.moved) {
      gd.el.classList.remove('ospace-griditem-dragging');
      hideLattice();
      markDirty();
      const el = gd.el;
      setTimeout(() => select(el, false), 0);
    }
    gd = null;
  });

  /* ---- resize handles ---- */
  let handles = [];
  function clearHandles() { handles.forEach((h) => h.remove()); handles = []; }
  function mountHandles(el) {
    clearHandles();
    const ctx = gridCtx(el);
    const isMedia = el.tagName === 'IMG' || el.tagName === 'VIDEO';
    const isSection = el.parentElement === doc.body;
    if (!ctx && !isMedia && !isSection) return;
    const specs = ctx ? [['se','nwse'],['e','ew'],['s','ns']] : isMedia ? [['se','nwse']] : [['s','ns']];
    const r = el.getBoundingClientRect();
    specs.forEach(([pos]) => {
      const h = doc.createElement('div');
      h.className = 'ospace-handle ' + pos;
      h.dataset.ospace = '1';
      positionHandle(h, pos, r);
      doc.body.appendChild(h);
      handles.push(h);
      h.addEventListener('pointerdown', (e) => {
        e.preventDefault(); e.stopPropagation();
        try { doc.getSelection().removeAllRanges(); } catch {}
        pushUndo();
        const start = { x: e.clientX, y: e.clientY, area: ctx ? areaOf(el) : null, w: r.width, h: r.height, minH: parseFloat(getComputedStyle(el).minHeight) || r.height };
        if (ctx) showLattice(ctx);
        const move = (ev) => {
          if (ctx) {
            const cell = cellFromPoint(ctx, ev.clientX, ev.clientY);
            const a = { ...areaOf(el) };
            if (pos === 'se' || pos === 'e') a.c2 = Math.min(Math.max(cell.col + 1, start.area.c1 + 1), ctx.nCols + 1);
            if (pos === 'se' || pos === 's') a.r2 = Math.max(cell.row + 1, start.area.r1 + 1);
            setArea(el, a);
            updatePosBadge(el, a);
          } else if (isMedia) {
            const w = Math.max(40, start.w + (ev.clientX - start.x));
            el.style.width = Math.round(w) + 'px';
            el.style.maxWidth = 'none';
            el.style.height = 'auto';
          } else {
            el.style.minHeight = Math.round(Math.max(40, start.minH + (ev.clientY - start.y))) + 'px';
          }
          positionAllHandles(el);
        };
        const up = () => {
          doc.removeEventListener('pointermove', move);
          doc.removeEventListener('pointerup', up);
          hideLattice();
          markDirty();
          select(el, false);
        };
        doc.addEventListener('pointermove', move);
        doc.addEventListener('pointerup', up);
      });
    });
  }
  function positionHandle(h, pos, r) {
    if (pos === 'se') { h.style.left = (r.right - 7) + 'px'; h.style.top = (r.bottom - 7) + 'px'; }
    if (pos === 'e') { h.style.left = (r.right - 7) + 'px'; h.style.top = (r.top + r.height / 2 - 6) + 'px'; }
    if (pos === 's') { h.style.left = (r.left + r.width / 2 - 6) + 'px'; h.style.top = (r.bottom - 7) + 'px'; }
  }
  function positionAllHandles(el) {
    const r = el.getBoundingClientRect();
    handles.forEach((h) => positionHandle(h, h.classList.contains('e') ? 'e' : h.classList.contains('s') ? 's' : 'se', r));
  }

  /* ---- background media: image/video cover + legibility overlay ---- */
  const BG_MEDIA_CSS = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:-2;pointer-events:none';
  function bgParts(el) {
    const kids = [...el.children];
    return {
      video: kids.find((c) => c.tagName === 'VIDEO' && c.hasAttribute('data-bgvideo')) || null,
      img: kids.find((c) => c.tagName === 'IMG' && c.hasAttribute('data-bgimg')) || null,
      overlay: kids.find((c) => c.hasAttribute && c.hasAttribute('data-bgoverlay')) || null,
    };
  }
  function ensureBgHost(el) {
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    el.style.overflow = 'hidden';
  }
  function setBgMedia(el, kind, url) {
    pushUndo();
    ensureBgHost(el);
    const parts = bgParts(el);
    parts.video && parts.video.remove();
    parts.img && parts.img.remove();
    el.style.backgroundImage = '';
    let node;
    if (kind === 'video') {
      node = doc.createElement('video');
      node.setAttribute('data-bgvideo', '');
      node.autoplay = true; node.muted = true; node.loop = true;
      node.setAttribute('playsinline', '');
      node.src = url;
    } else {
      node = doc.createElement('img');
      node.setAttribute('data-bgimg', '');
      node.alt = '';
      node.src = url;
    }
    node.style.cssText = BG_MEDIA_CSS;
    el.prepend(node);
    if (kind === 'video') node.play && node.play().catch(() => {});
    if (!bgParts(el).overlay) setOverlay(el, 0.4, '#000000', true);
    markDirty();
  }
  function setOverlay(el, opacity, color, skipUndo) {
    if (!skipUndo) pushUndo();
    ensureBgHost(el);
    let ov = bgParts(el).overlay;
    if (opacity <= 0.01) { ov && ov.remove(); markDirty(); return; }
    if (!ov) {
      ov = doc.createElement('div');
      ov.setAttribute('data-bgoverlay', '');
      ov.style.cssText = 'position:absolute;inset:0;z-index:-1;pointer-events:none';
      el.prepend(ov);
    }
    ov.style.background = color || '#000000';
    ov.style.opacity = String(opacity);
    markDirty();
  }
  function clearBgMedia(el) {
    pushUndo();
    const parts = bgParts(el);
    parts.video && parts.video.remove();
    parts.img && parts.img.remove();
    parts.overlay && parts.overlay.remove();
    el.style.backgroundImage = '';
    markDirty();
  }
  function bgMediaControls(p, el) {
    h4(p, 'Background Media');
    const parts = bgParts(el);
    const cssUrl = extractBgUrl(el.style.backgroundImage);
    const cur = parts.video ? 'video' : (parts.img || cssUrl) ? 'image' : 'none';
    const status = doc.createElement('div');
    status.style.cssText = 'font-size:10.5px;color:var(--ospaceD);margin:2px 0 6px';
    status.textContent = cur === 'none' ? 'No background media yet — pick an image or video below.' : 'Background: ' + cur;
    p.appendChild(status);
    const r = doc.createElement('div'); r.className = 'row2'; p.appendChild(r);
    btn(r, IC.img + ' Image…', () => pickFile('image/*', async (f) => { const u = await upload(f); if (u) { setBgMedia(el, 'image', u); select(el); } }));
    btn(r, IC.play + ' Video…', () => pickFile('video/*', async (f) => { const u = await upload(f); if (u) { setBgMedia(el, 'video', u); select(el); } }));
    btn(p, IC.search + ' Choose from media library…', () => mediaLibrary((u) => {
      setBgMedia(el, /\.(mp4|webm|mov|m4v)(\?|$)/i.test(u) ? 'video' : 'image', u);
      select(el);
    }));
    field(p, 'Or paste a media URL', parts.video?.getAttribute('src') || parts.img?.getAttribute('src') || cssUrl, (v) => {
      if (!v) { clearBgMedia(el); select(el); return; }
      setBgMedia(el, /\.(mp4|webm|mov|m4v)(\?|$)/i.test(v) ? 'video' : 'image', v);
      select(el);
    });
    rangeField(p, 'Overlay darkness (text legibility)', parts.overlay ? parseFloat(parts.overlay.style.opacity || 0) : 0, 0, 0.9, 0.05,
      (v) => Math.round(v * 100) + '%',
      (v) => setOverlay(el, parseFloat(v), bgParts(el).overlay?.style.background || '#000000', true));
    colorField(p, 'Overlay color', '#000000', (v) => {
      const o = bgParts(el).overlay;
      setOverlay(el, o ? parseFloat(o.style.opacity || 0.4) : 0.4, v, true);
    });
    if (cur !== 'none') btn(p, 'Remove background media', () => { clearBgMedia(el); select(el); }, 'red');
  }

  /* ---- entrance animation + hover controls ---- */
  const EASES = [
    ['', 'Smooth (default)'],
    ['cubic-bezier(.34,1.56,.64,1)', 'Springy'],
    ['ease-out', 'Ease out'],
    ['linear', 'Linear'],
  ];
  function replayAnim(el) {
    ensureAnimRuntime();
    el.classList.remove('ospace-in'); void el.offsetWidth; el.classList.add('ospace-in');
  }
  function animControls(p, el) {
    h4(p, 'Entrance Animation');
    selectField(p, 'When scrolled into view', el.getAttribute('data-anim') || '', [
      ['','None'],['fade-up','Fade up'],['fade-in','Fade in'],['slide-left','Slide from left'],['slide-right','Slide from right'],['zoom','Zoom in'],
    ], (v) => {
      if (v) { el.setAttribute('data-anim', v); replayAnim(el); }
      else { el.removeAttribute('data-anim'); el.classList.remove('ospace-in'); el.style.removeProperty('--anim-dur'); el.style.removeProperty('--anim-delay'); el.style.removeProperty('--anim-ease'); }
    });
    rangeField(p, 'Duration', parseFloat(el.style.getPropertyValue('--anim-dur')) || 0.8, 0.2, 2.5, 0.05, (v) => v + 's', (v) => { el.style.setProperty('--anim-dur', v + 's'); if (el.getAttribute('data-anim')) replayAnim(el); });
    rangeField(p, 'Delay', parseFloat(el.style.getPropertyValue('--anim-delay')) || 0, 0, 1.5, 0.05, (v) => v + 's', (v) => { el.style.setProperty('--anim-delay', v + 's'); if (el.getAttribute('data-anim')) replayAnim(el); });
    selectField(p, 'Easing', el.style.getPropertyValue('--anim-ease').trim(), EASES, (v) => {
      v ? el.style.setProperty('--anim-ease', v) : el.style.removeProperty('--anim-ease');
      if (el.getAttribute('data-anim')) replayAnim(el);
    });
    const kids = [...el.children].filter((c) => !isEditorUI(c) && c.tagName !== 'SCRIPT' && c.tagName !== 'STYLE');
    if (kids.length > 1) {
      btn(p, IC.anim + ' Stagger children in', () => {
        pushUndo();
        const type = el.getAttribute('data-anim') || 'fade-up';
        kids.forEach((c, i) => {
          c.setAttribute('data-anim', type);
          c.style.setProperty('--anim-delay', (i * 0.12).toFixed(2) + 's');
          replayAnim(c);
        });
        el.removeAttribute('data-anim'); el.classList.remove('ospace-in');
      });
    }
    h4(p, 'Hover Effect');
    selectField(p, 'When the cursor is over it', el.getAttribute('data-hover') || '', [
      ['','None'],['lift','Lift'],['zoom','Zoom'],['glow','Glow'],['fade','Fade'],
    ], (v) => {
      if (v) { el.setAttribute('data-hover', v); ensureAnimRuntime(); }
      else el.removeAttribute('data-hover');
    });
  }

  function commonActions(p, el) {
    h4(p, 'Element');
    btn(p, IC.dup + ' Duplicate', () => { pushUndo(); const c = el.cloneNode(true); c.classList.remove('ospace-selected'); el.after(c); bindAll(); });
    btn(p, IC.parent + ' Select parent', () => { if (el.parentElement && el.parentElement !== doc.body) select(el.parentElement); });
    btn(p, IC.del + ' Delete element', () => { pushUndo(); el.remove(); deselect(); }, 'red');
  }

  function rgbToHex(rgb) {
    const m = rgb && rgb.match(/\d+/g);
    if (!m) return '#ffffff';
    return '#' + m.slice(0, 3).map((n) => (+n).toString(16).padStart(2, '0')).join('');
  }
  function extractBgUrl(bg) { const m = bg && bg.match(/url\(["']?(.*?)["']?\)/); return m ? m[1] : ''; }

  /* ================= uploads & media library ================= */
  function pickFile(accept, cb) {
    const i = doc.createElement('input');
    i.type = 'file'; i.accept = accept;
    i.onchange = () => { if (i.files[0]) cb(i.files[0]); };
    i.click();
  }
  async function upload(file) {
    try {
      const r = await fetch(`/api/upload?name=${encodeURIComponent(file.name)}`, {
        method: 'POST',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file,
      });
      const d = await r.json();
      if (!r.ok) { alert('Upload failed: ' + d.error); return null; }
      return d.url;
    } catch (e) { alert('Upload failed: ' + e.message); return null; }
  }
  async function mediaLibrary(onPick) {
    const wrap = mkModal(`<h3>Media Library</h3><div class="bsub">Everything you've uploaded — click to use, hover for details.</div><div class="ospace-media-top"><input type="text" placeholder="Search by filename…"></div><div class="ospace-media-grid"><div style="color:#8b94a1;font-size:11px">Loading…</div></div>`);
    const grid = wrap.querySelector('.ospace-media-grid');
    const search = wrap.querySelector('.ospace-media-top input');
    let items = [];
    try {
      const r = await fetch('/api/upload');
      items = (await r.json()).media || [];
    } catch {}
    function niceName(m) { return m.pathname.replace('media/', '').replace(/^\d+-/, ''); }
    function render(q) {
      grid.innerHTML = '';
      const shown = items.filter((m) => !q || niceName(m).toLowerCase().includes(q.toLowerCase()));
      if (!shown.length) {
        grid.innerHTML = `<div style="color:#8b94a1;font-size:11px;grid-column:1/-1">${items.length ? 'Nothing matches that search.' : 'No uploads yet — use “Upload replacement” on any image.'}</div>`;
        return;
      }
      shown.forEach((m, i) => {
        const isVid = /\.(mp4|webm|mov|m4v)$/i.test(m.pathname);
        const isDoc = /\.(pdf|mp3|wav|ico)$/i.test(m.pathname);
        const cell = doc.createElement('div'); cell.className = 'cell';
        cell.style.animationDelay = Math.min(i * 22, 300) + 'ms';
        if (isDoc) {
          const ph = doc.createElement('div');
          ph.style.cssText = 'width:100%;height:100%;display:grid;place-items:center;color:#5b636f;font:600 10px Poppins';
          ph.textContent = niceName(m).split('.').pop().toUpperCase();
          cell.appendChild(ph);
        } else {
          const node = doc.createElement(isVid ? 'video' : 'img');
          node.src = m.url; node.loading = 'lazy';
          if (isVid) { node.muted = true; node.preload = 'metadata'; }
          cell.appendChild(node);
        }
        const when = m.uploadedAt ? new Date(m.uploadedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '';
        const size = m.size ? (m.size / 1024 > 900 ? (m.size / 1048576).toFixed(1) + ' MB' : Math.round(m.size / 1024) + ' KB') : '';
        const veil = doc.createElement('div'); veil.className = 'veil';
        veil.innerHTML = `<div class="nm"></div><div class="dt">${when}${size ? ' · ' + size : ''}</div>`;
        veil.querySelector('.nm').textContent = niceName(m);
        cell.appendChild(veil);
        if (isVid || isDoc) {
          const kind = doc.createElement('div'); kind.className = 'kind';
          kind.textContent = isVid ? 'Video' : 'File';
          cell.appendChild(kind);
        }
        const rm = doc.createElement('button'); rm.className = 'rm'; rm.title = 'Delete from library';
        rm.innerHTML = IC.del;
        rm.onclick = async (e) => {
          e.stopPropagation();
          if (!confirm(`Delete ${niceName(m)} from the media library? Pages already using it keep working until republished.`)) return;
          const dr = await fetch('/api/upload?url=' + encodeURIComponent(m.url), { method: 'DELETE' });
          if (dr.ok) { items = items.filter((x) => x !== m); render(search.value); }
          else alert('Delete failed');
        };
        cell.appendChild(rm);
        cell.onclick = () => { onPick(m.url); wrap.remove(); };
        grid.appendChild(cell);
      });
    }
    search.oninput = () => render(search.value);
    render('');
  }

  /* ================= modals ================= */
  function mkModal(inner) {
    const wrap = doc.createElement('div');
    wrap.className = 'ospace-modal'; wrap.dataset.ospace = '1';
    const box = doc.createElement('div'); box.className = 'ospace-box';
    box.innerHTML = inner;
    wrap.appendChild(box);
    wrap.onclick = (e) => { if (e.target === wrap) wrap.remove(); };
    doc.body.appendChild(wrap);
    return wrap;
  }
  function closeModals() { doc.querySelectorAll('.ospace-modal').forEach((m) => m.remove()); }

  /* ================= section templates (categorized, live previews) ================= */
  const IMGS = {
    photo1: 'https://images.squarespace-cdn.com/content/v1/61e1f4ef472914681c085004/297236b2-dd02-4ee9-90ef-e916df0cdafb/IMG_4616.jpg?format=1500w',
    photo2: 'https://images.squarespace-cdn.com/content/v1/61e1f4ef472914681c085004/b425ce6e-9025-42dc-8d24-e5503289f227/848A5305.jpg?format=750w',
    photo3: 'https://images.squarespace-cdn.com/content/v1/61e1f4ef472914681c085004/5160908d-2941-4e6f-8b68-55161b35b0a9/848A2680.jpg?format=750w',
    photo4: 'https://images.squarespace-cdn.com/content/v1/61e1f4ef472914681c085004/76a7cc10-f3b2-445b-bc16-9c225bf30197/BR5_1571.jpg?format=750w',
    logo1: 'https://images.squarespace-cdn.com/content/v1/61e1f4ef472914681c085004/f77cd591-ecc9-40c7-a37a-cff3076636a2/logo.png?format=750w',
    logo2: 'https://images.squarespace-cdn.com/content/v1/61e1f4ef472914681c085004/b5f948c0-6078-4a02-94f2-1898f0a2308c/TWC%2BNetwork.png?format=750w',
    logo3: 'https://images.squarespace-cdn.com/content/v1/61e1f4ef472914681c085004/45e7d246-368b-47f6-ab70-be3b6d574d42/The_Atlanta_Journal-Constitution_%2804.2021%29.svg.png?format=750w',
    logo4: 'https://images.squarespace-cdn.com/content/v1/61e1f4ef472914681c085004/43212666-26e6-446c-945d-fdd32259650e/252115BB-4D0C-4986-9D53-31ACB3C11766.png?format=750w',
  };
  const TEMPLATES = [
    { cat: 'Hero', name: 'Hero — Backdrop', desc: 'Headline + button over a photo', html: `
      <section style="position:relative;min-height:88vh;display:flex;align-items:center;justify-content:center;text-align:center;overflow:hidden">
        <img src="${IMGS.photo1}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:brightness(.5)">
        <div style="position:relative;max-width:760px;padding:3rem 6vw">
          <h1 style="font-weight:700;font-style:italic;font-size:3.2rem;line-height:1.2;margin-bottom:1.2rem">A headline that stops the scroll.</h1>
          <p style="font-size:1.15rem;margin-bottom:2rem">One supporting sentence that earns the click.</p>
          <a href="#" style="display:inline-block;background:#fff;color:#000;font-weight:600;padding:.95rem 2.5rem;border-radius:8px;text-decoration:none">Get Started</a>
        </div>
      </section>` },
    { cat: 'Hero', name: 'Hero — Split', desc: 'Copy left, image right', html: `
      <section style="display:grid;grid-template-columns:1fr 1fr;align-items:center;background:#000;min-height:70vh">
        <div style="padding:4rem 3rem 4rem 6vw">
          <h1 style="font-weight:700;font-style:italic;font-size:2.8rem;line-height:1.2;margin-bottom:1.2rem">Your story, told powerfully.</h1>
          <p style="margin-bottom:2rem">Explain the promise in one warm, confident sentence.</p>
          <a href="#" style="display:inline-block;background:#f0523d;color:#fff;font-weight:600;padding:.9rem 2.2rem;border-radius:8px;text-decoration:none">Book a Shoot</a>
        </div>
        <img src="${IMGS.photo2}" alt="" style="width:100%;height:100%;object-fit:cover;min-height:420px">
      </section>` },
    { cat: 'Content', name: 'Heading + Text', desc: 'Centered title & paragraph', html: `
      <section style="padding:5rem 6vw;text-align:center;background:#000">
        <h2 style="font-weight:700;font-style:italic;font-size:2.4rem;margin-bottom:1.2rem">New Section</h2>
        <p style="max-width:640px;margin:0 auto;font-size:1.05rem">Write something compelling here.</p>
      </section>` },
    { cat: 'Content', name: 'Text + Image', desc: 'Split copy and photo', html: `
      <section style="display:grid;grid-template-columns:1fr 1fr;align-items:center;background:#000">
        <div style="padding:4rem 3rem 4rem 6vw">
          <h2 style="font-weight:700;font-style:italic;font-size:2.2rem;margin-bottom:1rem">Your headline</h2>
          <p>Tell the story behind the image.</p>
        </div>
        <img src="${IMGS.photo1}" alt="" style="width:100%;height:100%;object-fit:cover;min-height:380px">
      </section>` },
    { cat: 'Content', name: 'Big Statement', desc: 'One huge line', html: `
      <section style="padding:7rem 6vw;text-align:center;background:#000">
        <h2 style="font-weight:700;font-style:italic;font-size:clamp(2rem,5vw,3.6rem);max-width:900px;margin:0 auto;line-height:1.3">Make one bold claim you can back up.</h2>
      </section>` },
    { cat: 'Content', name: 'Stats Row', desc: 'Three proud numbers', html: `
      <section style="padding:5rem 6vw;background:#000">
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:2rem;max-width:1000px;margin:0 auto;text-align:center">
          <div><div style="font-size:3rem;font-weight:700;font-style:italic">4+</div><div style="letter-spacing:.15em;font-size:.8rem;text-transform:uppercase;opacity:.7">Years of stories</div></div>
          <div><div style="font-size:3rem;font-weight:700;font-style:italic">13</div><div style="letter-spacing:.15em;font-size:.8rem;text-transform:uppercase;opacity:.7">States served</div></div>
          <div><div style="font-size:3rem;font-weight:700;font-style:italic">17+</div><div style="letter-spacing:.15em;font-size:.8rem;text-transform:uppercase;opacity:.7">Collaborators</div></div>
        </div>
      </section>` },
    { cat: 'Media', name: 'Full-bleed Image', desc: 'Edge-to-edge banner', html: `
      <section style="height:70vh;overflow:hidden;background:#000">
        <img src="${IMGS.photo1}" alt="" style="width:100%;height:100%;object-fit:cover">
      </section>` },
    { cat: 'Media', name: 'Full-bleed Video', desc: 'Looping showcase', html: `
      <section style="height:80vh;overflow:hidden;background:#000">
        <video autoplay muted loop playsinline src="assets/hero.mp4" style="width:100%;height:100%;object-fit:cover"></video>
      </section>` },
    { cat: 'Media', name: 'Photo Grid', desc: 'Three photos in a row', html: `
      <section style="padding:4rem 6vw;background:#000">
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px">
          <img src="${IMGS.photo2}" alt="" style="width:100%;aspect-ratio:4/5;object-fit:cover">
          <img src="${IMGS.photo3}" alt="" style="width:100%;aspect-ratio:4/5;object-fit:cover">
          <img src="${IMGS.photo4}" alt="" style="width:100%;aspect-ratio:4/5;object-fit:cover">
        </div>
      </section>` },
    { cat: 'Media', name: 'Gallery Duo', desc: 'Two wide photos', html: `
      <section style="padding:4rem 6vw;background:#000">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
          <img src="${IMGS.photo3}" alt="" style="width:100%;aspect-ratio:4/3;object-fit:cover">
          <img src="${IMGS.photo4}" alt="" style="width:100%;aspect-ratio:4/3;object-fit:cover">
        </div>
      </section>` },
    { cat: 'Proof', name: 'Testimonial', desc: 'Quote over a photo', html: `
      <section style="position:relative;min-height:70vh;display:flex;align-items:center;justify-content:center;text-align:center;overflow:hidden">
        <img src="${IMGS.photo2}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:brightness(.45)">
        <div style="position:relative;max-width:700px;padding:3rem 6vw">
          <div style="font-weight:700;font-style:italic;font-size:1.9rem;margin-bottom:1rem">Client Name</div>
          <p style="font-size:1.15rem;line-height:1.7">&ldquo;Add the testimonial quote here.&rdquo;</p>
        </div>
      </section>` },
    { cat: 'Proof', name: 'Logo Row', desc: 'Clients & partners', html: `
      <section style="padding:4rem 6vw;text-align:center;background:#000">
        <h2 style="font-weight:700;font-style:italic;font-size:1.8rem;margin-bottom:2.5rem">Trusted By:</h2>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:3rem;align-items:center;max-width:1100px;margin:0 auto">
          <img src="${IMGS.logo1}" alt="" style="max-height:110px;width:auto;max-width:100%;margin:0 auto;object-fit:contain">
          <img src="${IMGS.logo2}" alt="" style="max-height:110px;width:auto;max-width:100%;margin:0 auto;object-fit:contain">
          <img src="${IMGS.logo3}" alt="" style="max-height:110px;width:auto;max-width:100%;margin:0 auto;object-fit:contain">
          <img src="${IMGS.logo4}" alt="" style="max-height:110px;width:auto;max-width:100%;margin:0 auto;object-fit:contain">
        </div>
      </section>` },
    { cat: 'CTA', name: 'Call to Action', desc: 'Headline + button', html: `
      <section style="padding:6rem 6vw;text-align:center;background:#000">
        <h2 style="font-weight:700;font-style:italic;font-size:2.4rem;margin-bottom:2rem">Ready to tell your story?</h2>
        <a href="book.html" style="display:inline-block;background:#fff;color:#000;font-weight:600;padding:.9rem 2.4rem;border-radius:8px;text-decoration:none">Book a Shoot</a>
      </section>` },
    { cat: 'CTA', name: 'Double CTA', desc: 'Primary + secondary action', html: `
      <section style="padding:6rem 6vw;text-align:center;background:#000">
        <h2 style="font-weight:700;font-style:italic;font-size:2.4rem;margin-bottom:.8rem">Let&rsquo;s make something great.</h2>
        <p style="opacity:.8;margin-bottom:2.2rem">Pick whichever feels right — we&rsquo;ll take it from there.</p>
        <div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap">
          <a href="book.html" style="display:inline-block;background:#f0523d;color:#fff;font-weight:600;padding:.9rem 2.4rem;border-radius:8px;text-decoration:none">Book a Shoot</a>
          <a href="#" style="display:inline-block;border:1.5px solid #fff;color:#fff;font-weight:600;padding:.9rem 2.4rem;border-radius:8px;text-decoration:none">See the Work</a>
        </div>
      </section>` },
    { cat: 'Utility', name: 'Spacer', desc: 'Vertical breathing room', html: `<section style="height:6rem;background:#000"></section>` },
    { cat: 'Utility', name: 'Divider', desc: 'Subtle separator line', html: `
      <section style="padding:2.5rem 6vw;background:#000">
        <div style="max-width:1100px;margin:0 auto;border-top:1px solid rgba(255,255,255,.18)"></div>
      </section>` },
  ];
  const TPL_CATS = ['All', ...[...new Set(TEMPLATES.map((t) => t.cat))]];

  function openTemplates(refSec, where) {
    const wrap = mkModal(`<h3>Add a section</h3><div class="bsub">Real previews — every block is fully editable once placed.</div><div class="ospace-cats"></div><div class="ospace-tpl-grid v3"></div>`);
    wrap.querySelector('.ospace-box').style.width = 'min(760px,94vw)';
    const catsBar = wrap.querySelector('.ospace-cats');
    const grid = wrap.querySelector('.ospace-tpl-grid');
    let activeCat = 'All';
    function renderCats() {
      catsBar.innerHTML = '';
      TPL_CATS.forEach((c) => {
        const b = doc.createElement('button');
        b.textContent = c;
        if (c === activeCat) b.className = 'on';
        b.onclick = () => { activeCat = c; renderCats(); renderGrid(); };
        catsBar.appendChild(b);
      });
    }
    function renderGrid() {
      grid.innerHTML = '';
      TEMPLATES.filter((t) => activeCat === 'All' || t.cat === activeCat).forEach((t, i) => {
        const b = doc.createElement('button');
        b.style.animationDelay = (i * 30) + 'ms';
        const preview = t.html.replace(/autoplay/g, '').replace(/<video /g, '<video preload="metadata" ');
        b.innerHTML = `<div class="ospace-live-thumb"><div>${preview}</div></div><div class="t">${t.name}</div><div class="d">${t.desc}</div>`;
        b.onclick = () => {
          pushUndo();
          const tmp = doc.createElement('div');
          tmp.innerHTML = t.html.trim();
          const node = tmp.firstElementChild;
          if (refSec) (where === 'before' ? refSec.before(node) : refSec.after(node));
          else doc.body.appendChild(node);
          wrap.remove();
          bindAll();
          node.scrollIntoView({ behavior: 'smooth', block: 'center' });
          select(node, false);
        };
        grid.appendChild(b);
      });
    }
    renderCats(); renderGrid();
  }

  /* ================= element palette — add anything, anywhere ================= */
  const ELEMENTS = [
    { name: 'Heading', icon: IC.text, edit: true, html: '<h2 style="font-weight:700;font-style:italic;font-size:2.2rem;margin:1rem 0">New heading</h2>' },
    { name: 'Subheading', icon: IC.text, edit: true, html: '<h3 style="font-weight:600;font-size:1.4rem;margin:.8rem 0">New subheading</h3>' },
    { name: 'Paragraph', icon: IC.edit, edit: true, html: '<p style="margin:.8rem 0;line-height:1.7">Write your paragraph here.</p>' },
    { name: 'Button', icon: IC.btnEl, edit: true, html: '<a href="#" style="display:inline-block;background:#f0523d;color:#fff;font-weight:600;padding:.85rem 2.2rem;border-radius:8px;text-decoration:none;margin:.8rem 0">Button text</a>' },
    { name: 'Image', icon: IC.img, html: `<img src="${IMGS.photo1}" alt="" style="width:100%;max-width:640px;border-radius:6px;margin:.8rem 0">` },
    { name: 'Video', icon: IC.play, html: '<video controls playsinline src="assets/hero.mp4" style="width:100%;max-width:720px;border-radius:6px;margin:.8rem 0"></video>' },
    { name: 'Quote', icon: IC.quote, edit: true, html: '<blockquote style="border-left:3px solid #f0523d;padding:.4rem 0 .4rem 1.2rem;margin:1rem 0;font-style:italic;font-size:1.15rem">&ldquo;A line worth quoting.&rdquo;</blockquote>' },
    { name: 'List', icon: IC.divider, edit: true, html: '<ul style="margin:.8rem 0 .8rem 1.4rem;line-height:2"><li>First point</li><li>Second point</li><li>Third point</li></ul>' },
    { name: 'Divider', icon: IC.divider, html: '<div style="border-top:1px solid rgba(255,255,255,.2);margin:2rem 0"></div>' },
    { name: 'Spacer', icon: IC.spacer, html: '<div style="height:3rem"></div>' },
  ];

  function openElements(target, where) {
    const wrap = mkModal(`<h3>Insert element</h3><div class="bsub">Dropped ${where === 'before' ? 'above' : where === 'inside' ? 'inside' : 'below'} the selected ${labelFor(target).toLowerCase()} — then just start typing.</div><div class="ospace-elem-grid"></div>`);
    const grid = wrap.querySelector('.ospace-elem-grid');
    ELEMENTS.forEach((el) => {
      const b = doc.createElement('button');
      b.innerHTML = `<div class="ic">${el.icon}</div>${el.name}`;
      b.onclick = () => {
        pushUndo();
        const tmp = doc.createElement('div');
        tmp.innerHTML = el.html.trim();
        const node = tmp.firstElementChild;
        if (where === 'before') target.before(node);
        else if (where === 'inside') target.appendChild(node);
        else target.after(node);
        wrap.remove();
        bindAll();
        node.scrollIntoView({ behavior: 'smooth', block: 'center' });
        select(node, false);
        if (el.edit) startTextEdit(node);
      };
      grid.appendChild(b);
    });
  }

  /* ================= custom right-click menu ================= */
  let ctxEl = null;
  let copiedStyle = null;
  function closeCtx() { if (ctxEl) { ctxEl.remove(); ctxEl = null; } }

  function ctxItem(it) {
    if (it === 'div') { const d = doc.createElement('div'); d.className = 'div'; return d; }
    if (it.lbl) { const l = doc.createElement('div'); l.className = 'lbl'; l.textContent = it.lbl; return l; }
    const b = doc.createElement('div');
    b.className = 'it' + (it.danger ? ' danger' : '');
    b.innerHTML = `${it.icon || ''}<span>${it.label}</span>${it.k ? `<span class="k">${it.k}</span>` : ''}${it.sub ? `<span class="k">${IC.chev}</span>` : ''}`;
    if (it.sub) {
      const sub = doc.createElement('div');
      sub.className = 'sub';
      it.sub.forEach((s) => sub.appendChild(ctxItem(s)));
      b.appendChild(sub);
    } else if (it.fn) {
      b.onclick = (e) => { e.stopPropagation(); closeCtx(); it.fn(); };
    }
    return b;
  }

  function openCtx(el, x, y) {
    closeCtx();
    const isText = TEXT_TAGS.includes(el.tagName) && !el.querySelector('img,video');
    const sec = topSection(el);
    const container = ['DIV','SECTION','HEADER','FOOTER','MAIN','UL'].includes(el.tagName);
    const animOpts = [['', 'None'], ['fade-up', 'Fade up'], ['fade-in', 'Fade in'], ['slide-left', 'Slide left'], ['slide-right', 'Slide right'], ['zoom', 'Zoom in']];
    const items = [
      { lbl: labelFor(el) },
      isText && { label: 'Edit text', icon: IC.edit, k: 'dbl-click', fn: () => startTextEdit(el) },
      el.tagName === 'IMG' && { label: 'Replace image…', icon: IC.img, fn: () => { select(el); } },
      el.tagName === 'VIDEO' && { label: 'Replace video…', icon: IC.play, fn: () => { select(el); } },
      { label: 'Insert', icon: IC.plus, sub: [
        { label: 'Element above', icon: IC.up, fn: () => openElements(el, 'before') },
        { label: 'Element below', icon: IC.down, fn: () => openElements(el, 'after') },
        container && { label: 'Element inside', icon: IC.plus, fn: () => openElements(el, 'inside') },
        'div',
        sec && { label: 'Section above', icon: IC.up, fn: () => openTemplates(sec, 'before') },
        sec && { label: 'Section below', icon: IC.down, fn: () => openTemplates(sec, 'after') },
      ].filter(Boolean) },
      { label: 'Animate', icon: IC.anim, sub: animOpts.map(([v, lab]) => ({ label: lab, icon: IC.anim, fn: () => {
        pushUndo();
        if (v) { el.setAttribute('data-anim', v); ensureAnimRuntime(); el.classList.remove('ospace-in'); void el.offsetWidth; el.classList.add('ospace-in'); }
        else { el.removeAttribute('data-anim'); }
      } })) },
      'div',
      { label: 'Duplicate', icon: IC.dup, fn: () => { pushUndo(); const c = el.cloneNode(true); c.classList.remove('ospace-selected'); el.after(c); bindAll(); } },
      { label: 'Copy style', icon: IC.copy, fn: () => {
        const cs = getComputedStyle(el);
        copiedStyle = {
          inline: el.getAttribute('style') || '',
          anim: el.getAttribute('data-anim'),
          computed: { color: cs.color, fontSize: cs.fontSize, fontWeight: cs.fontWeight, fontStyle: cs.fontStyle, textAlign: cs.textAlign, backgroundColor: cs.backgroundColor, borderRadius: cs.borderRadius, letterSpacing: cs.letterSpacing, textTransform: cs.textTransform },
        };
      } },
      copiedStyle !== null && { label: 'Paste style', icon: IC.paste, fn: () => {
        pushUndo();
        if (copiedStyle.inline) el.setAttribute('style', copiedStyle.inline);
        else Object.entries(copiedStyle.computed).forEach(([k, v]) => {
          if (v && v !== 'rgba(0, 0, 0, 0)' && v !== 'none' && v !== 'normal' && v !== '0px') el.style[k] = v;
        });
        copiedStyle.anim ? (el.setAttribute('data-anim', copiedStyle.anim), ensureAnimRuntime(), el.classList.add('ospace-in')) : el.removeAttribute('data-anim');
      } },
      'div',
      { label: 'Move up', icon: IC.up, k: '⌥↑', fn: () => { const t = sec && sec === el ? sec : el; if (t.previousElementSibling && !isEditorUI(t.previousElementSibling)) { pushUndo(); t.previousElementSibling.before(t); } } },
      { label: 'Move down', icon: IC.down, k: '⌥↓', fn: () => { const t = sec && sec === el ? sec : el; if (t.nextElementSibling && !isEditorUI(t.nextElementSibling)) { pushUndo(); t.nextElementSibling.after(t); } } },
      { label: 'Select parent', icon: IC.parent, fn: () => { if (el.parentElement && el.parentElement !== doc.body) select(el.parentElement); } },
      { label: 'Style panel', icon: IC.style, fn: () => select(el) },
      'div',
      { label: 'Delete', icon: IC.del, k: '⌫', danger: true, fn: () => { pushUndo(); el.remove(); deselect(); } },
    ].filter(Boolean);

    ctxEl = doc.createElement('div');
    ctxEl.className = 'ospace-ctx ospace-ui';
    ctxEl.dataset.ospace = '1';
    items.forEach((it) => ctxEl.appendChild(ctxItem(it)));
    doc.body.appendChild(ctxEl);
    const r = ctxEl.getBoundingClientRect();
    ctxEl.style.left = Math.min(x, innerWidth - r.width - 10) + 'px';
    ctxEl.style.top = Math.min(y, innerHeight - r.height - 10) + 'px';
  }

  doc.addEventListener('contextmenu', (e) => {
    if (editingEl) return; // native menu while typing (spellcheck etc.)
    if (isEditorUI(e.target)) { e.preventDefault(); return; }
    e.preventDefault();
    select(e.target, false);
    openCtx(e.target, e.clientX, e.clientY);
  });
  doc.addEventListener('click', () => closeCtx(), true);
  doc.addEventListener('scroll', () => closeCtx(), true);

  /* ================= find & replace ================= */
  let findBox = null;
  function openFind() {
    if (findBox) { findBox.querySelector('input').focus(); return; }
    findBox = doc.createElement('div');
    findBox.className = 'ospace-find'; findBox.dataset.ospace = '1';
    findBox.innerHTML = `<input placeholder="Find text…"><input placeholder="Replace with…"><button class="go">Replace all</button><div class="count"></div><button class="x">${IC.x}</button>`;
    doc.body.appendChild(findBox);
    const [fi, ri] = findBox.querySelectorAll('input');
    fi.focus();
    const count = findBox.querySelector('.count');
    fi.oninput = () => {
      const q = fi.value;
      count.textContent = q ? countMatches(q) + ' found' : '';
    };
    findBox.querySelector('.go').onclick = () => {
      const q = fi.value; if (!q) return;
      const n = replaceAll(q, ri.value);
      count.textContent = n + ' replaced';
    };
    findBox.querySelector('.x').onclick = closeFind;
  }
  function closeFind() { if (findBox) { findBox.remove(); findBox = null; } }
  function textNodes() {
    const out = [];
    const w = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (isEditorUI(n.parentElement) || !n.nodeValue.trim()) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
    });
    while (w.nextNode()) out.push(w.currentNode);
    return out;
  }
  function countMatches(q) {
    let c = 0;
    textNodes().forEach((n) => { c += n.nodeValue.split(q).length - 1; });
    return c;
  }
  function replaceAll(q, r) {
    let c = 0;
    pushUndo();
    textNodes().forEach((n) => {
      if (n.nodeValue.includes(q)) {
        c += n.nodeValue.split(q).length - 1;
        n.nodeValue = n.nodeValue.split(q).join(r);
      }
    });
    return c;
  }

  /* ================= shortcuts sheet ================= */
  function openKeys() {
    mkModal(`<h3>Keyboard shortcuts</h3><div class="bsub">Work faster in the editor.</div>
    <div class="ospace-keys"><table>
      <tr><td>Edit text</td><td><kbd>double-click</kbd></td></tr>
      <tr><td>Save draft</td><td><kbd>⌘S</kbd></td></tr>
      <tr><td>Undo / Redo</td><td><kbd>⌘Z</kbd> / <kbd>⌘⇧Z</kbd></td></tr>
      <tr><td>Find &amp; replace</td><td><kbd>⌘F</kbd></td></tr>
      <tr><td>Move section up / down</td><td><kbd>⌥↑</kbd> / <kbd>⌥↓</kbd></td></tr>
      <tr><td>Delete selected element</td><td><kbd>⌫</kbd></td></tr>
      <tr><td>Deselect / close</td><td><kbd>Esc</kbd></td></tr>
      <tr><td>Everything menu</td><td><kbd>right-click</kbd></td></tr>
      <tr><td>This sheet</td><td><kbd>?</kbd></td></tr>
    </table></div>`);
  }

  /* ================= util ================= */
  function mkUI(tag, cls) {
    const el = doc.createElement(tag);
    el.className = cls;
    el.dataset.ospace = '1';
    el.style.display = 'none';
    doc.body.appendChild(el);
    return el;
  }
  function cleanupUI() {
    hideToolbar(); closePanel(); hideBadge(); hideCrumb(); hideAddLines(); closeFind(); clearHandles(); hideLattice();
    secTools.style.display = 'none';
    selected = null; editingEl = null;
  }
  function bindAll() {
    bindGridDrag();
    [css, bar, secTools, badge, crumb, addTop, addBot].forEach((n) => { if (!n.isConnected) doc.body.appendChild(n); });
    if (doc.querySelector('[data-anim]')) {
      ensureAnimRuntime();
      doc.querySelectorAll('[data-anim]').forEach((n) => n.classList.add('ospace-in'));
    }
  }
  bindAll();
  doc.addEventListener('submit', (e) => e.preventDefault(), true);

  /* ================= slot mode (framework-site integration) ================= */
  // Pages that mark regions with data-ospace-slot="name" are "slot pages": the shell
  // saves per-slot HTML as JSON instead of a full-page override.
  const slotEls = () => [...doc.querySelectorAll('[data-ospace-slot]')];
  const isSlotPage = () => slotEls().length > 0;
  if (isSlotPage()) {
    const slotCss = doc.createElement('style');
    slotCss.dataset.ospace = '1';
    slotCss.textContent = `[data-ospace-slot]{outline:1px dashed rgba(52,214,139,.5);outline-offset:2px;position:relative}
    [data-ospace-slot]::before{content:attr(data-ospace-slot);position:absolute;top:-9px;left:6px;background:#34d68b;color:#06301c;font:600 9px Poppins,sans-serif;padding:2px 7px;border-radius:4px;z-index:10;letter-spacing:.05em}`;
    doc.head.appendChild(slotCss);
  }
  function serializeSlots() {
    const out = {};
    slotEls().forEach((el) => {
      const clone = el.cloneNode(true);
      clone.querySelectorAll('[data-ospace]').forEach((n) => n.remove());
      clone.querySelectorAll('*').forEach((n) => {
        ['ospace-hover','ospace-selected','ospace-sec-hover','ospace-dragging','ospace-in'].forEach((c) => n.classList && n.classList.remove(c));
        if (n.classList && !n.classList.length) n.removeAttribute('class');
        n.removeAttribute && (n.removeAttribute('contenteditable'), n.removeAttribute('draggable'));
      });
      clone.classList.remove('ospace-hover','ospace-selected','ospace-sec-hover','ospace-in');
      if (clone.classList && !clone.classList.length) clone.removeAttribute('class');
      clone.removeAttribute('contenteditable');
      out[el.getAttribute('data-ospace-slot')] = clone.innerHTML;
    });
    return out;
  }

  /* ================= bridge ================= */
  window.addEventListener('message', (e) => {
    const m = e.data || {};
    if (m.type === 'ospace-get-html') {
      finishTextEdit();
      if (isSlotPage()) {
        parent.postMessage({ type: 'ospace-slots', slots: serializeSlots(), html: serialize() }, '*');
      } else {
        parent.postMessage({ type: 'ospace-html', html: serialize() }, '*');
      }
    }
    if (m.type === 'ospace-undo') undo();
    if (m.type === 'ospace-redo') redo();
    if (m.type === 'ospace-find') openFind();
    if (m.type === 'ospace-seo') {
      pushUndo();
      doc.title = m.title || doc.title;
      const setMeta = (attr, key, val) => {
        let meta = doc.querySelector(`meta[${attr}="${key}"]`);
        if (val == null || val === '') { if (meta) meta.remove(); return; }
        if (!meta) { meta = doc.createElement('meta'); meta.setAttribute(attr, key); doc.head.appendChild(meta); }
        meta.setAttribute('content', val);
      };
      setMeta('name', 'description', m.description || '');
      setMeta('property', 'og:title', m.title || '');
      setMeta('property', 'og:description', m.description || '');
      if (m.image !== undefined) {
        setMeta('property', 'og:image', m.image || null);
        setMeta('name', 'twitter:card', m.image ? 'summary_large_image' : null);
      }
      markDirty();
    }
  });
})();
