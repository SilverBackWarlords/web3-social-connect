# Cloud Shell Default Environment Setup
source /google/devshell/bashrc.google

# --- START CUSTOM USER PATHS ---

# 1. Custom Binary Path: Add ~/bin directory for personal scripts
export PATH="$HOME/bin:$PATH"

# 2. Local Node Path: For local npm installs
export PATH="$HOME/.local/nodejs/bin:$PATH"

# --- END CUSTOM USER PATHS ---

# SDKMAN (MUST BE AT THE END OF THE FILE FOR SDKMAN TO WORK)
export SDKMAN_DIR="$HOME/.sdkman"
[[ -s "$HOME/.sdkman/bin/sdkman-init.sh" ]] && source "$HOME/.sdkman/bin/sdkman-init.sh"

# NVM (Node Version Manager)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"     # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
