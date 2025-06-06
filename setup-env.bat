@echo off
echo OpenAI API Key Setup
echo ===================
echo.
echo This script will help you set up your .env file for the PDF converter.
echo.
echo If you don't have an OpenAI API key:
echo 1. Go to https://platform.openai.com/api-keys
echo 2. Create a new API key
echo 3. Copy it and paste it here
echo.

REM Check if .env already exists
if exist .env (
    echo Warning: .env file already exists!
    set /p overwrite="Do you want to overwrite it? (y/n): "
    if /i not "%overwrite%"=="y" (
        echo Setup cancelled.
        pause
        exit /b
    )
)

set /p api_key="Enter your OpenAI API key: "
echo.
echo Creating .env file...

REM Create .env file with the API key
echo OPENAI_API_KEY=%api_key% > .env

echo.
echo ✅ .env file created successfully!
echo.
echo Your API key has been saved to .env file.
echo The PDF converter will now automatically use this key.
echo.
echo Note: The .env file is automatically ignored by git to keep your key secure.
echo.
pause 