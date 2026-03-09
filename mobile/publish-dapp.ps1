# Script to publish the app using the dApp Store CLI

# Prerequisites:
# - Ensure your solana CLI is correctly configured with your wallet (`solana address`, `solana balance`)
# - Place at least 4 screenshots in `e:\ItsU\mobile\screenshots\`
# - App logo is mapped to `./src/assets/images/logo.png`
# - APK is mapped to `.\android\app\build\outputs\apk\release\app-release.apk`

Write-Host "Please confirm your Solana wallet has at least 0.3 SOL before running this."

# Step 1: Create Publisher
# Note: Record the <PUBLISHER_MINT_ADDRESS> output by this command to use in the next step
# npx -y @solana-mobile/dapp-store-cli create publisher --name "ItsU" --url "https://github.com/HarmishTervadiya/ItsU" --icon ./src/assets/images/logo.png

# Step 2: Create App
# npx -y @solana-mobile/dapp-store-cli create app --publisher <PUBLISHER_MINT_ADDRESS> --name "ItsU" 

# Step 3: Create Release
# npx -y @solana-mobile/dapp-store-cli create release --app <APP_MINT_ADDRESS> --apk .\android\app\build\outputs\apk\release\app-release.apk --icon .\src\assets\images\logo.png --screenshots .\screenshots\
