@REM подключение списка нестрогий режим, рекомендую --strict=true

node.exe ship-scraper.js --search="ship-list.txt" --list=true --page=50 --limit=0 --type=0 --timeout=5000 --hidden=true --dateformat="dd.mm.yyyy" --strict=false

pause
