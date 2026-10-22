@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo 请先安装 Node.js 20 或更新版本，再双击本文件。
  echo 安装地址：https://nodejs.org/
  pause
  exit /b 1
)
echo 学藏启动后，请在浏览器打开 http://127.0.0.1:4173
echo 请保持此窗口打开。关闭窗口会停止本地服务。
node scripts\serve.mjs
pause
