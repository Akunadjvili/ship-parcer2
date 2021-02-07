@REM первый корабль нестрогий режим, рекомендую --strict=true
node.exe ship-scraper.js --search="	Nm Sakura	" --page=50 --limit=0 --type=0 --timeout=5000 --hidden=true --dateformat="dd.mm.yyyy" --strict=false
@REM второй корабль нестрогий режим, рекомендую --strict=true
node.exe ship-scraper.js --search="	Pure Vision	" --page=50 --limit=0 --type=0 --timeout=5000 --hidden=true --dateformat="dd.mm.yyyy" --strict=false

pause
