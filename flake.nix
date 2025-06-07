{
  description = "WebInsight - SvelteKit project with Effect, SQLite and Python services";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
          # Enable non-free packages for Playwright dependencies
          config = { 
            allowUnfree = true;
          };
        };
        
        # Define package versions
        nodeVersion = pkgs.nodejs_22;
        bunVersion = pkgs.bun;
        
        # Python environment with dependencies
        pythonEnv = pkgs.python311.withPackages (ps: with ps; [
          # Core requirements from requirements.txt
          fastapi
          uvicorn
          pydantic
          python-dotenv
          httpx
          playwright
          
          # Additional useful packages
          pip
          pytest
          black
          isort
          
          # If crawl4ai is not in nixpkgs, we'll install it via pip in shellHook
        ]);
        
        # SQLite and other tools
        sqliteTools = [
          pkgs.sqlite
          pkgs.sqlite-interactive
        ];
        
        # Development tools
        devTools = [
          pkgs.git
          pkgs.gnumake
        ];
        
        # Playwright dependencies
        playwrightDeps = with pkgs; [
          # Browser dependencies
          xvfb-run
          chromium
          firefox
          
          # System dependencies that might be needed
          glib
          nss
          nspr
          atk
          at-spi2-atk
          cups
          dbus
          expat
          fontconfig
          freetype
          gtk3
          libdrm
          libxkbcommon
          mesa
          pango
          xorg.libX11
          xorg.libXcomposite
          xorg.libXdamage
          xorg.libXext
          xorg.libXfixes
          xorg.libXrandr
        ];
        
      in {
        devShells.default = pkgs.mkShell {
          buildInputs = [
            # Node.js and Bun
            nodeVersion
            bunVersion
            
            # Python environment
            pythonEnv
            
            # SQLite for database operations
            pkgs.sqlite
            pkgs.sqlite-interactive
            
            # Development tools
            pkgs.git
            
            # Playwright dependencies
            playwrightDeps
          ];
          
          shellHook = ''
            # Set up environment variables
            export PATH="$PWD/node_modules/.bin:$PATH"
            export DATABASE_URL="file:$PWD/data.db"
            
            # Create Python virtual environment if it doesn't exist
            VENV_DIR="$PWD/.venv"
            if [ ! -d "$VENV_DIR" ]; then
              echo "Creating Python virtual environment..."
              python -m venv $VENV_DIR
              source $VENV_DIR/bin/activate
              pip install -r $PWD/services/Crawl4AI/requirements.txt
              playwright install
            else
              source $VENV_DIR/bin/activate
            fi
            
            # Add virtual environment to PATH
            export PATH="$VENV_DIR/bin:$PATH"
            
            # Set custom prompt
            export PS1='\[\033[1;34m\][webinsight:\w]\$\[\033[0m\] '
            
            # Print welcome message
            echo "🚀 WebInsight development environment"
            echo "Node.js: $(node --version)"
            echo "Bun: $(bun --version)"
            echo "Python: $(python --version)"
            echo ""
            echo "Available commands:"
            echo "  bun run dev      - Start development server"
            echo "  bun run build    - Build for production"
            echo "  bun run test     - Run tests"
            echo "  python services/Crawl4AI/run.py - Start Crawl4AI service"
            echo ""
            echo "To install JS dependencies: bun install"
            echo "To install Python dependencies: pip install -r services/Crawl4AI/requirements.txt"
            echo ""
          '';

        };
        
        # For CI/CD or production builds
        packages.default = pkgs.stdenv.mkDerivation {
          name = "webinsight";
          src = ./.;
          
          buildInputs = [
            nodeVersion
            bunVersion
            pythonEnv
          ];
          
          buildPhase = ''
            # Build JS application
            export HOME=$(mktemp -d)
            bun install
            bun run build
            
            # Set up Python environment
            python -m venv $HOME/.venv
            source $HOME/.venv/bin/activate
            pip install -r services/Crawl4AI/requirements.txt
          '';
          
          installPhase = ''
            # Copy JS build
            mkdir -p $out/js
            cp -r build/* $out/js/
            
            # Copy Python service
            mkdir -p $out/services/Crawl4AI
            cp -r services/Crawl4AI/* $out/services/Crawl4AI/
            
            # Create wrapper scripts
            mkdir -p $out/bin
            cat > $out/bin/start-webinsight << EOF
            #!/bin/sh
            cd $out/js && node index.js
            EOF
            
            cat > $out/bin/start-crawl4ai << EOF
            #!/bin/sh
            cd $out/services/Crawl4AI && python run.py
            EOF
            
            chmod +x $out/bin/start-webinsight
            chmod +x $out/bin/start-crawl4ai
          '';
        };
      }
    );
}