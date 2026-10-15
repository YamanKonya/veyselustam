@echo off
chcp 65001 >nul
echo Hosts dosyasi guncelleniyor...
echo. >> C:\Windows\System32\drivers\etc\hosts
echo 104.247.168.18 veyselustam.com >> C:\Windows\System32\drivers\etc\hosts
echo 104.247.168.18 www.veyselustam.com >> C:\Windows\System32\drivers\etc\hosts
ipconfig /flushdns
echo.
echo ========================================================
echo BASARILI! Hosts dosyasina Güzel Hosting IP'si eklendi.
echo Artik tarayicinizdan http://veyselustam.com adresine
echo girerek Guzel Hosting uzerindeki yeni sitenizi gorebilirsiniz!
echo ========================================================
pause
