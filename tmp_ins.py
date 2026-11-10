import io

p = "src/components/ProjectPage.tsx"
s = io.open(p, encoding="utf-8").read()
anchor = '          <button\n            type="button"\n            onClick={openShare}'
insert = '          <ClipControl previewRef={previewRef} sceneName={sceneName} disabled={!html} />\n'
assert anchor in s, "anchor missing"
s = s.replace(anchor, insert + anchor, 1)
io.open(p, "w", encoding="utf-8", newline="\n").write(s)
print("inserted")
