if not functions --query fisher
    curl -sL https://raw.githubusercontent.com/jorgebucaran/fisher/main/functions/fisher.fish | source
    echo "Run fisher update to install plugins"
end

if status --is-interactive
    fenv source /etc/profile
end

switch (uname)
    case Linux
        # Deno
        set -gx DENO_INSTALL $HOME/.deno
        fish_add_path --path $DENO_INSTALL/bin
    case Darwin
        # macOS specific configuration

        # Homebrew
        fish_add_path --path /opt/homebrew/bin
        fish_add_path --path /opt/homebrew/sbin

        # miniforge
        if test -f /opt/homebrew/Caskroom/miniforge/base/bin/conda
            status is-interactive && eval /opt/homebrew/Caskroom/miniforge/base/bin/conda "shell.fish" "hook" $argv | source
        end
end

set fish_greeting

# catppuccin theme
set --global theme_color_scheme "Catppuccin Mocha"

# bun
set -gx BUN_INSTALL $HOME/.bun
fish_add_path --path $BUN_INSTALL/bin

# cargo
fish_add_path --path $HOME/.cargo/bin

# composer
fish_add_path --path $HOME/.composer/vendor/bin

# mise
if type -q mise
    mise activate fish | source
    mise completion fish > $HOME/.config/fish/completions/mise.fish
end

# fzf
set -x FZF_DEFAULT_OPTS "\
--color=bg+:#313244,bg:#1e1e2e,spinner:#f5e0dc,hl:#f38ba8 \
--color=fg:#cdd6f4,header:#f38ba8,info:#cba6f7,pointer:#f5e0dc \
--color=marker:#b4befe,fg+:#cdd6f4,prompt:#cba6f7,hl+:#f38ba8 \
--color=selected-bg:#45475a \
--color=border:#313244,label:#cdd6f4 \
--multi"

# aliases
alias g="git"
alias gs="git status"
alias gd="git diff"
alias ga="git add"
alias gc="git commit"
alias gp="git push"
alias lg="lazygit"

alias ls="eza -l"
alias la="eza -la"
