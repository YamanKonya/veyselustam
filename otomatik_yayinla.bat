@echo off
chcp 65001 >nul
title VeyselUstam - Otomatik Guncelleme ve Canliya Alma

echo ========================================================
echo       VEYSEL USTAM - TEK TIKLA CANLIYA AKTARMA
echo ========================================================
echo.
echo [1/3] Urun havuzu kontrol ediliyor ve platformlara hazirlaniyor...
call npm run oto-urun

echo.
echo [2/3] Degisiklikler paketleniyor...
git add .
git commit -m "Site guncellemesi: %date% %time%"

echo.
echo [3/3] Canli sunucuya (GitHub / Vercel) gonderiliyor...
git push origin main

echo.
echo ========================================================
echo  ISLEM TAMAMLANDI! 
echo  Canli siteniz birkac saniye icinde otomatik guncellenecektir.
echo ========================================================
echo.
pause
