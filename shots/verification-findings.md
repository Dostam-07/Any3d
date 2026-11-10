# Share/remix flow verification — findings (built-in browser, 1440x900)

1. #/project/sess-cafe renders: conversation (10 versions) + iframe scene "Corner coffee". Sidebar RECENT DIORAMAS = 4.
2. Share dialog: title "Share this scene"; sub "The whole scene travels inside the link — no account, no upload.";
   link first60 = http://localhost:5173/#/s/rlVjrj-LIEf9XKki5MTtNxw8MjFmyustES
   total length = 2867; hint = "2,867 characters — safe to paste in a chat message."
   Buttons: Done | Open | Copy link
3. Copy link: label changes to "Copied" (~2 s), then reverts to "Copy link".
4. "Open" link opened new tab; gate BEFORE load: "Open shared scene?" + "This link carries scene code (2,841 characters)
   that will run in the preview. Only open links from people you trust."; iframes 0, canvas 0 (preview empty).
   Gate persisted >5 s (no auto-open).
5. "Open scene": gate gone, iframe present (1 SVG, 182 KB body), prompt bubble "Load preset: Corner coffee",
   subtitle "shared scene", no error banner.
6. Sent "remove the trees": reply "Removed the tree"; URL -> #/project/sess-1794303773094;
   sidebar before 4 -> after 5 (new "remove the trees" at top; source sess-cafe untouched).
7. Re-opened step-2 share URL in new tab: gate shown again, 0 iframes/canvas; sidebar 5 (unchanged).
8. #/project/sess-cafe + Share + Done: dialog closed (0 role=dialog), hash #/project/sess-cafe, iframe scene intact,
   prompt textarea enabled (typed "test", cleared back to ""), Share button present.

Files: shots/step4-trust-gate.jpg, shots/step5-shared-open.jpg, shots/step6-remix-reply.jpg
