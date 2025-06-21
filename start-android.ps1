# ===================================================
# XHere Android Development Starter Script
# ===================================================
# This script automates the Android development workflow:
# - Checks if backend is running (port 3000)
# - Starts backend if needed
# - Builds React app for mobile
# - Syncs with Android platform
# - Opens Android Studio
# ===================================================

# Set error action preference to stop on errors
$ErrorActionPreference = "Stop"

# Define colors for console output
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    else {
        $input | Write-Output
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Write-Success($message) {
    Write-ColorOutput Green "[SUCCESS] $message"
}

function Write-Info($message) {
    Write-ColorOutput Cyan "[INFO] $message"
}

function Write-Warning($message) {
    Write-ColorOutput Yellow "[WARNING] $message"
}

function Write-Error($message) {
    Write-ColorOutput Red "[ERROR] $message"
}

# Define paths
$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Join-Path -Path $rootDir -ChildPath "backend"
$frontendDir = Join-Path -Path $rootDir -ChildPath "frontend"
$androidDir = Join-Path -Path $frontendDir -ChildPath "android"

# Display header
Write-Output ""
Write-ColorOutput Magenta "========================================"
Write-ColorOutput Magenta "   XHere Android Development Starter   "
Write-ColorOutput Magenta "========================================"
Write-Output ""

# Step 1: Check if backend is running on port 3000
Write-Info "Checking if backend is running on port 3000..."
$backendRunning = $false

try {
    $connection = New-Object System.Net.Sockets.TcpClient("localhost", 3000)
    if ($connection.Connected) {
        $backendRunning = $true
        $connection.Close()
        Write-Success "Backend is already running on port 3000."
    }
}
catch {
    $backendRunning = $false
    Write-Warning "Backend is not running on port 3000."
}

# Step 2: Start backend if not running
if (-not $backendRunning) {
    Write-Info "Starting backend server..."
    try {
        # Check if backend directory exists
        if (-not (Test-Path $backendDir)) {
            throw "Backend directory not found at: $backendDir"
        }

        # Start backend in a new PowerShell window
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendDir'; npm run dev"
        
        # Wait for backend to start (give it a few seconds)
        Write-Info "Waiting for backend to initialize (10 seconds)..."
        Start-Sleep -Seconds 10
        
        # Verify backend is now running
        try {
            $connection = New-Object System.Net.Sockets.TcpClient("localhost", 3000)
            if ($connection.Connected) {
                $connection.Close()
                Write-Success "Backend started successfully on port 3000."
            } else {
                Write-Warning "Backend may not have started correctly. Check the backend window for errors."
            }
        } catch {
            Write-Warning "Could not verify if backend started. Continuing anyway..."
        }
    }
    catch {
        Write-Error "Failed to start backend: $_"
        exit 1
    }
}

# Step 3: Build React app for mobile
Write-Info "Building React app for mobile..."
try {
    # Check if frontend directory exists
    if (-not (Test-Path $frontendDir)) {
        throw "Frontend directory not found at: $frontendDir"
    }

    # Navigate to frontend directory and build
    Push-Location $frontendDir
    Write-Info "Running npm run android:build..."
    npm run android:build
    if ($LASTEXITCODE -ne 0) {
        throw "React build failed with exit code: $LASTEXITCODE"
    }
    Write-Success "React app built successfully for mobile."
}
catch {
    Write-Error "Failed to build React app: $_"
    if ($(Get-Location).Path -eq $frontendDir) {
        Pop-Location
    }
    exit 1
}

# Step 4: Sync with Android platform
Write-Info "Syncing with Android platform..."
try {
    # We're already in the frontend directory from the previous step
    Write-Info "Running npx cap sync android..."
    npx cap sync android
    if ($LASTEXITCODE -ne 0) {
        throw "Android sync failed with exit code: $LASTEXITCODE"
    }
    Write-Success "Android platform synced successfully."
}
catch {
    Write-Error "Failed to sync Android platform: $_"
    if ($(Get-Location).Path -eq $frontendDir) {
        Pop-Location
    }
    exit 1
}

# Step 5: Open Android Studio
Write-Info "Opening Android Studio..."
try {
    # Check if Android directory exists
    if (-not (Test-Path $androidDir)) {
        throw "Android directory not found at: $androidDir"
    }

    # Open Android Studio with the project
    Write-Info "Running npx cap open android..."
    npx cap open android
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to open Android Studio with exit code: $LASTEXITCODE"
    }
    Write-Success "Android Studio opened with XHere project."
    
    # Return to original directory
    Pop-Location
}
catch {
    Write-Error "Failed to open Android Studio: $_"
    if ($(Get-Location).Path -eq $frontendDir) {
        Pop-Location
    }
    exit 1
}

# Step 6: Final instructions
Write-Output ""
Write-ColorOutput Magenta "========================================"
Write-ColorOutput Green "✓ XHere Android setup complete!"
Write-ColorOutput Magenta "========================================"
Write-Output ""
Write-Info "Next steps:"
Write-Output "  1. In Android Studio, wait for Gradle sync to complete"
Write-Output "  2. Connect a device or start an emulator"
Write-Output "  3. Click the green 'Run' button to install and launch the app"
Write-Output ""
Write-Info "For live reload development:"
Write-Output "  npx cap run android -l --external"
Write-Output ""
Write-ColorOutput Magenta "Happy coding! 📱✨"
Write-Output ""
