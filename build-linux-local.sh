#!/bin/bash

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         FinOpenPOS - Linux Build Script                       ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found!${NC}"
    echo "Please run this script from the project root directory."
    exit 1
fi

echo -e "${BLUE}📋 Prerequisites Check${NC}"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js $(node --version)${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found${NC}"
    exit 1
fi
echo -e "${GREEN}✅ npm $(npm --version)${NC}"

# Check Rust
if ! command -v cargo &> /dev/null; then
    echo -e "${RED}❌ Rust/Cargo not found${NC}"
    echo "Install Rust from: https://rustup.rs/"
    exit 1
fi
echo -e "${GREEN}✅ Rust $(rustc --version)${NC}"

# Check system dependencies for Linux
echo ""
echo -e "${BLUE}📦 Checking Linux system dependencies${NC}"
echo ""

MISSING_DEPS=""

# Check for libgtk-3-dev
if ! dpkg-query -W libgtk-3-dev &> /dev/null; then
    MISSING_DEPS="$MISSING_DEPS libgtk-3-dev"
fi

# Check for webkit2gtk (try 4.1 first, fallback to 4.0)
if ! dpkg-query -W libwebkit2gtk-4.1-dev &> /dev/null && ! dpkg-query -W libwebkit2gtk-4.0-dev &> /dev/null; then
    if apt-cache show libwebkit2gtk-4.1-dev &> /dev/null; then
        MISSING_DEPS="$MISSING_DEPS libwebkit2gtk-4.1-dev"
    elif apt-cache show libwebkit2gtk-4.0-dev &> /dev/null; then
        MISSING_DEPS="$MISSING_DEPS libwebkit2gtk-4.0-dev"
    else
        echo -e "${RED}❌ No compatible libwebkit2gtk found in apt repos!${NC}"
        echo "You may need to add a PPA or upgrade your distro."
        exit 1
    fi
fi

# Check for appindicator (handle both old and new package names)
if ! dpkg-query -W libayatana-appindicator3-dev &> /dev/null && ! dpkg-query -W libappindicator3-dev &> /dev/null; then
    if apt-cache show libayatana-appindicator3-dev &> /dev/null; then
        MISSING_DEPS="$MISSING_DEPS libayatana-appindicator3-dev"
    else
        MISSING_DEPS="$MISSING_DEPS libappindicator3-dev"
    fi
fi

# Check for librsvg2-dev
if ! dpkg-query -W librsvg2-dev &> /dev/null; then
    MISSING_DEPS="$MISSING_DEPS librsvg2-dev"
fi

# Check for patchelf
if ! dpkg-query -W patchelf &> /dev/null; then
    MISSING_DEPS="$MISSING_DEPS patchelf"
fi

# Check for libssl-dev (required by Tauri)
if ! dpkg-query -W libssl-dev &> /dev/null; then
    MISSING_DEPS="$MISSING_DEPS libssl-dev"
fi

# Check for libxdo-dev (required by Tauri)
if ! dpkg-query -W libxdo-dev &> /dev/null; then
    MISSING_DEPS="$MISSING_DEPS libxdo-dev"
fi

if [ -n "$MISSING_DEPS" ]; then
    echo -e "${YELLOW}⚠️  Missing system dependencies:$MISSING_DEPS${NC}"
    echo ""
    echo "Install with:"
    echo -e "${BLUE}sudo apt-get install -y$MISSING_DEPS${NC}"
    echo ""
    read -p "Do you want to install them now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sudo apt-get install -y $MISSING_DEPS
    else
        echo -e "${RED}❌ Cannot proceed without system dependencies${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ All system dependencies installed${NC}"
fi

echo ""
echo "════════════════════════════════════════════════════════════════"
echo ""

# Step 1: Install npm dependencies
echo -e "${BLUE}📥 Step 1: Installing npm dependencies${NC}"
if npm install; then
    echo -e "${GREEN}✅ npm dependencies installed${NC}"
else
    echo -e "${RED}❌ Failed to install npm dependencies${NC}"
    exit 1
fi

echo ""

# Step 2: Build Next.js
echo -e "${BLUE}🔨 Step 2: Building Next.js frontend (standalone mode)${NC}"
if npm run build; then
    echo -e "${GREEN}✅ Next.js build completed${NC}"
else
    echo -e "${RED}❌ Next.js build failed${NC}"
    exit 1
fi

echo ""

# Step 3: Build Tauri Linux app
echo -e "${BLUE}🚀 Step 3: Building Tauri Linux application${NC}"
if npm run tauri build; then
    echo -e "${GREEN}✅ Tauri build completed${NC}"
else
    echo -e "${RED}❌ Tauri build failed${NC}"
    exit 1
fi

echo ""
echo "════════════════════════════════════════════════════════════════"
echo ""
echo -e "${GREEN}✅ BUILD SUCCESSFUL!${NC}"
echo ""
echo -e "${BLUE}📦 Build Artifacts:${NC}"
echo ""

# Show build outputs
if ls src-tauri/target/release/bundle/appimage/*.AppImage 1> /dev/null 2>&1; then
    echo -e "${GREEN}✅ AppImage:${NC}"
    ls -lh src-tauri/target/release/bundle/appimage/*.AppImage
else
    echo -e "${YELLOW}⚠️  No AppImage found${NC}"
fi

echo ""

if ls src-tauri/target/release/bundle/deb/*.deb 1> /dev/null 2>&1; then
    echo -e "${GREEN}✅ Debian Package:${NC}"
    ls -lh src-tauri/target/release/bundle/deb/*.deb
else
    echo -e "${YELLOW}⚠️  No Debian package found${NC}"
fi

echo ""

# Installation/Test instructions
echo -e "${BLUE}📝 Next Steps:${NC}"
echo ""
echo "1. To run the AppImage directly:"
echo -e "   ${YELLOW}./src-tauri/target/release/bundle/appimage/POS-SYSS_*.AppImage${NC}"
echo ""
echo "2. To install the Debian package:"
echo -e "   ${YELLOW}sudo dpkg -i src-tauri/target/release/bundle/deb/pos-syss_*.deb${NC}"
echo ""
echo "3. For full system integration:"
echo -e "   ${YELLOW}sudo apt install ./src-tauri/target/release/bundle/deb/pos-syss_*.deb${NC}"
echo ""
