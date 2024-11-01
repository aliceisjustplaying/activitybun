import fs from 'node:fs';
import os from 'node:os';

// Type the @ username that you want. Do not include an "@".
const apUsername = encodeURIComponent(process.env.USERNAME!);

// This is the user's "real" name.
const realName = process.env.REALNAME!;

// This is the bio of your user.
const summary = process.env.SUMMARY!;

// Generate locally or from https://cryptotools.net/rsagen
// Newlines must be replaced with "\n"
const keyPrivate = process.env.KEY_PRIVATE!.replace('\n', '\n');
const keyPublic = process.env.KEY_PUBLIC!.replace('\n', '\n');

// Password for sending messages
const password = process.env.PASSWORD!;

// Internal data
const serverHostName = os.hostname(); // Do not change this!

const APP_NAME = 'activitybun-single-ts-file';
const APP_VERSION = '0.0';
const APP_DESCRIPTION = 'Single File ActivityPub Server in TypeScript';
// Some requests require a User-Agent string.
const USERAGENT = `${APP_NAME}/${APP_VERSION}`;

// Set up where to save logs, posts, and images.
// You can change these directories to something more suitable if you like.
const data = 'data';
const directories = {
  inbox: `${data}/inbox`,
  followers: `${data}/followers`,
  following: `${data}/following`,
  logs: `${data}/logs`,
  posts: 'posts',
  images: 'images',
};

if (!fs.existsSync(data)) fs.mkdirSync(data);

// Create the directories if they don't already exist.
for (const directory of Object.values(directories)) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory);
  }
}

//	The WebFinger Protocol is used to identify accounts.
//	It is requested with `example.com/.well-known/webfinger?resource=acct:username@example.com`
//	This server only has one user, so it ignores the query string and always returns the same details.
function webfinger() {
  const webfinger = {
    subject: `acct:${username}@${serverHostName}`,
    links: [
      {
        rel: 'self',
        type: 'application/activity+json',
        href: `https://${serverHostName}/${username}`,
      },
    ],
  };

  return new Response(JSON.stringify(webfinger), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

// The NodeInfo Protocol is used to identify servers.
// It is looked up with `example.com/.well-known/nodeinfo`
// See https://nodeinfo.diaspora.software/
function wk_nodeinfo() {
  const nodeinfo = {
    links: [
      {
        rel: 'self',
        type: 'http://nodeinfo.diaspora.software/ns/schema/2.1',
        href: `https://${serverHostName}/nodeinfo/2.1`,
      },
    ],
  };

  return new Response(JSON.stringify(nodeinfo), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

// The NodeInfo Protocol is used to identify servers.
// It is looked up with `example.com/.well-known/nodeinfo` which points to this resource
// See http://nodeinfo.diaspora.software/docson/index.html#/ns/schema/2.0#$$expand
function nodeinfo() {
  // Get all posts
  const posts = fs.readdirSync(directories.posts).filter((file) => file.endsWith('.json'));
  // Number of posts
  const totalItems = posts.length;

  const nodeinfo = {
    version: '2.1', // Version of the schema, not the software
    software: {
      name: APP_DESCRIPTION,
      version: APP_VERSION,
      repository: 'https://github.com/aliceisjustplaying/ap.mosphere.at',
    },
    protocols: ['activitypub'],
    services: {
      inbound: [],
      outbound: [],
    },
    openRegistrations: false,
    usage: {
      users: {
        total: 1,
      },
      localPosts: totalItems,
    },
    metadata: {
      nodeName: APP_NAME,
      nodeDescription: 'This is a single TypeScript file which acts as an extremely basic ActivityPub server.',
      spdx: 'AGPL-3.0-or-later',
    },
  };

  return new Response(JSON.stringify(nodeinfo), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

//	User:
//	Requesting `example.com/username` returns a JSON document with the user's information.
function username(req: Request) {
  // Check if HTML was requested
  // If so, probably a browser - redirect to homepage
  const headers = req.headers;
  const accept = headers.get('Accept');
  if (accept && accept.split(',')[0] === 'text/html') {
    return new Response(null, {
      status: 302,
      headers: {
        'Location': `https://${serverHostName}/`
      }
    });
  }

  const user = {
    "@context": [
      "https://www.w3.org/ns/activitystreams",
      "https://w3id.org/security/v1"
    ],
    "id": `https://${serverHostName}/${apUsername}`,
    "type": "Application", 
    "following": `https://${serverHostName}/following`,
    "followers": `https://${serverHostName}/followers`,
    "inbox": `https://${serverHostName}/inbox`,
    "outbox": `https://${serverHostName}/outbox`,
    "preferredUsername": decodeURIComponent(apUsername),
    "name": realName,
    "summary": summary,
    "url": `https://${serverHostName}/${apUsername}`,
    "manuallyApprovesFollowers": false,
    "discoverable": true,
    "published": "2024-02-29T12:34:56Z",
    "icon": {
      "type": "Image",
      "mediaType": "image/png", 
      "url": `https://${serverHostName}/icon.png`
    },
    "image": {
      "type": "Image",
      "mediaType": "image/png",
      "url": `https://${serverHostName}/banner.png`
    },
    "publicKey": {
      "id": `https://${serverHostName}/${apUsername}#main-key`,
      "owner": `https://${serverHostName}/${apUsername}`,
      "publicKeyPem": keyPublic
    }
  };

  return new Response(JSON.stringify(user), {
    headers: {
      'Content-Type': 'application/activity+json'
    }
  });
}


const server = Bun.serve({
  port: 3003,
  fetch(req, server) {
    const path = new URL(req.url).pathname;
    if (path === '/.well-known/webfinger') {
      return webfinger(); //	Mandatory. Static.
    } else if (path === '/.well-known/nodeinfo') {
      return wk_nodeinfo(); //	Optional. Static.
    } else if (path === '/nodeinfo/2.1') {
      return nodeinfo(); //	Optional. Static.
    } else if (path === `/${decodeURIComponent(apUsername)}` || path === `/@${decodeURIComponent(apUsername)}`) {
      return username(req); //	Mandatory. Static
    } else if (path === '/following') {
      return following(); //	Mandatory. Can be static or dynamic.
    } else if (path === '/followers') {
      return followers(); //	Mandatory. Can be static or dynamic.
    } else if (path === '/inbox') {
      return inbox(); //	Mandatory.
    } else if (path === '/outbox') {
      return outbox(); //	Optional. Dynamic.
    } else if (path === '/action/send') {
      return send(); //	API for posting content to the Fediverse.
    } else if (path === '/action/follow') {
      return follow(); // API for following other accounts
    } else if (path === '/action/unfollow') {
      return unfollow(); // API for unfollowing accounts
    } else if (path === '/') {
      return view('home'); // User interface for seeing what the user has posted.
    } else {
      return new Response('HTTP/1.1 404 Not Found');
    }

    // return new Response(`Your path is ${path}`);
  },
});

console.log(`Server running at http://${serverHostName}:${server.port}`);
