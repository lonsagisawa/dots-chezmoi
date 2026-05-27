# dots-chezmoi

My dotfiles managed by [chezmoi](https://www.chezmoi.io/).

## matugen

```
cd ~/.config/matugen
git clone https://github.com/InioX/matugen-themes

matugen image {wallpaper}.jpg
```

## pi-coding-agent

### Self-hosted Firecrawl

It complains if FIRECRAWL_API_KEY is unset, even specified FIRECRAWL_API_KEY!

```
set -Ux FIRECRAWL_API_KEY hoge
set -Ux FIRECRAWL_API_URL https://{firecrawl instance domain}/v2
```
