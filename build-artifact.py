"""index.html / style.css / questions.js / app.js を1ファイルにまとめる(プレビュー公開用)。
Vercel には不要。python3 build-artifact.py で dist/fe-drill.html を作る。"""
from pathlib import Path

root = Path(__file__).parent
css = (root / "style.css").read_text(encoding="utf-8")
qs = "\n".join((root / f).read_text(encoding="utf-8") for f in ["questions.js", "questions-2.js", "questions-3.js", "questions-b.js", "questions-b2.js"])
gl = "\n".join((root / f).read_text(encoding="utf-8") for f in ["glossary.js", "glossary-2.js", "formulas.js"])
js = (root / "app.js").read_text(encoding="utf-8")

page = f"""<title>FEドリル</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=M+PLUS+1+Code:wght@400;700&family=Manrope:wght@500;700;800&family=Zen+Kaku+Gothic+New:wght@400;500;700&display=swap">
<style>
{css}
</style>
<div id="app"></div>
<script>
{qs}
</script>
<script>
{gl}
</script>
<script>
{js}
</script>
"""
out = root / "dist" / "fe-drill.html"
out.parent.mkdir(exist_ok=True)
out.write_text(page, encoding="utf-8")
print(out, len(page))
