// s_config.js - constants shared by every server module.
const path=require('path');
module.exports={
  PORT:process.env.PORT||3000,
  DIR:process.env.DATA_DIR||path.join(__dirname,'data'),   // where db.json and uploads live (use a Render Disk at /data to keep data)
  PUB:__dirname,                                           // static files sit next to server.js
  DAY:864e5,
  ITUNES:process.env.ITUNES_BASE||'https://itunes.apple.com',
  // collection name -> field that holds the author's id (the server forces it to the logged-in user)
  OWN:{cfriends:'a',reads:'u',reports:'u',blocks:'a',posts:'uid',stories:'uid',comments:'u',likes:'u',saves:'u',follows:'a',messages:'a',views:'u',votes:'u',profiles:'uid'},
  MIME:{'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webmanifest':'application/manifest+json','.png':'image/png','.svg':'image/svg+xml','.jpg':'image/jpeg','.gif':'image/gif','.webp':'image/webp','.mp4':'video/mp4','.webm':'video/webm','.mp3':'audio/mpeg','.ogg':'audio/ogg','.wav':'audio/wav'},
  // the only files the web server will hand out (keeps server code and db.json private)
  PUBLIC_RE:/^(index\.html|app\.css|c_[a-z_]+\.js|sw\.js|manifest\.webmanifest|icon-(192|512)\.png)$/
};
