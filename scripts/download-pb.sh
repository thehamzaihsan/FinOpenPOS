#!/bin/bash

PB_VERSION="0.22.14"
TARGET_DIR="src-tauri/bin"

mkdir -p "$TARGET_DIR"

download_and_extract() {
    local PLATFORM_NAME=$1
    local URL=$2
    local ZIP_FILE="$TARGET_DIR/$PLATFORM_NAME.zip"
    local BIN_NAME=$1

    echo "Downloading $PLATFORM_NAME from $URL..."
    curl -L "$URL" -o "$ZIP_FILE"

    echo "Extracting $PLATFORM_NAME..."
    unzip -o "$ZIP_FILE" -d "$TARGET_DIR"

    if [[ "$PLATFORM_NAME" == *"windows"* ]]; then
        mv "$TARGET_DIR/pocketbase.exe" "$TARGET_DIR/$BIN_NAME"
    else
        mv "$TARGET_DIR/pocketbase" "$TARGET_DIR/$BIN_NAME"
        chmod +x "$TARGET_DIR/$BIN_NAME"
    fi

    rm "$ZIP_FILE"
    echo "Successfully prepared $PLATFORM_NAME"
}

# Linux
download_and_extract "pocketbase-x86_64-unknown-linux-gnu" "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip"

# Windows
download_and_extract "pocketbase-x86_64-pc-windows-msvc.exe" "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_windows_amd64.zip"

# macOS Intel
download_and_extract "pocketbase-x86_64-apple-darwin" "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_darwin_amd64.zip"

# macOS Silicon
download_and_extract "pocketbase-aarch64-apple-darwin" "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_darwin_arm64.zip"
