@REM первый корабль
node.exe ship-scraper.js --search="Nu Sakura" --page=50 --limit=0 --type=0 --timeout=5000 --hidden=true --dateformat="dd.mm.yyyy"
@REM второй корабль
node.exe ship-scraper.js --search="Next Name" --page=50 --limit=0 --type=0 --timeout=5000 --hidden=true --dateformat="dd.mm.yyyy"
pause
