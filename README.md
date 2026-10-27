# Vang: Instagram-style social app (Node.js, no dependencies)

Run it: `node server.js` then open http://localhost:3000. Deploy: upload every file in this folder to one GitHub repo (no sub-folders)
and connect the repo to Render (build: `npm install`, start: `node server.js`). To keep data, add a Render Disk at `/data` and set `DATA_DIR=/data`.

## Server files (the brain, 10 files)
| File | What it does |
|---|---|
| `server.js` | Entry point. Starts the web server, adds security headers, sends each request to the right module. |
| `s_config.js` | Settings: port, data folder, file types, which website files may be shown. |
| `s_store.js` | The database (one JSON file), saving, and the live-update broadcast (Server-Sent Events). |
| `s_http.js` | Tiny helpers to read request bodies and send JSON. |
| `s_auth.js` | Passwords (scrypt), login sessions (1 year), login rate limit, recovery codes. |
| `s_privacy.js` | THE privacy rules: private accounts, blocks, Close Friends, 24-hour stories, archived posts, hidden like counts, who sees what. |
| `s_routes_auth.js` | Sign up, log in, forgot password, log out, change password, delete account. |
| `s_routes_data.js` | The data API with write checks (own-only edits, comments off, private posts, blocked users, one like per person). |
| `s_media.js` | Uploads (photo/video/audio, type checked by file contents) and streaming them back with Range support. |
| `s_music.js` | Music search and 30-second audio streaming THROUGH the server (so it works on any phone network). |
| `s_static.js` | Serves the website files, and only those. |

## Website files (what people see, 21 files)
| File | What it does |
|---|---|
| `index.html` | The page shell. Loads the CSS and every `c_*.js` file in order. |
| `app.css` | All styling: Instagram look, dark mode, story editor, sheets. |
| `c_core.js` | Shared state, data sync, API calls, small helpers, the click/keyboard dispatcher. |
| `c_ui.js` | Bottom sheets, full-screen pages, overlay stack. |
| `c_media.js` | Checks files before upload, upload with progress + auto-retry, photo crop, filter/adjust CSS. |
| `c_music.js` | Music picker (Search / Vang Sounds / Your audio), clip start+length, volume, playback, free built-in sounds. |
| `c_feed.js` | How a post looks: carousel, likes line, caption, tags, location. |
| `c_post_menu.js` | Post menu, block menu, send-to-friend, comments page (replies, likes), people lists. |
| `c_actions.js` | What each tap does: tabs, like, save, follow/unfollow, share, open post, create. |
| `c_search.js` | Explore: ranked search, tags, places, history, empty states. |
| `c_reels.js` | Reels tab: vertical video, tap to pause, mute, progress, retry. |
| `c_profile.js` | Profile page, follow states, highlights, grid/reels/saved/tagged tabs. |
| `c_stories.js` | Story tray + viewer: hold to pause, swipe down, reactions, polls, questions, highlights. |
| `c_story_editor.js` | Story maker: text fonts/colours, stickers, drag to place, camera, Close Friends. |
| `c_create.js` | New post flow: select, crop 1:1/4:5, filters, adjust, caption, tag people, location, music, alt text. |
| `c_chat.js` | Messages: groups, photo/video/voice, emoji reactions, Seen, unsend, Notes. |
| `c_notifs.js` | Notifications grouped by Today / This week / Earlier, unread highlight, preferences. |
| `c_settings.js` | Edit profile, settings, Close Friends, archives, password, recovery code, delete account. |
| `c_main.js` | Builds each tab, suggested people, "all caught up", redraws without losing your place. |
| `c_boot.js` | Login / sign-up / forgot-password screens and app start-up. |
| `sw.js`, `manifest.webmanifest`, `icon-192.png`, `icon-512.png`, `package.json` | Phone install (PWA), icons, and the start command. |
