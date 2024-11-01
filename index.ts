import fs from 'node:fs';
import os from 'node:os';

// Type the @ username that you want. Do not include an "@".
const username = encodeURI(process.env.USERNAME!);

// This is the user's "real" name.
const realName = process.env.REALNAME!;

// This is the bio of your user.
const summary = process.env.SUMMARY!;

// Generate locally or from https://cryptotools.net/rsagen
// Newlines must be replaced with "\n"
const key_private = process.env.KEY_PRIVATE!.replace('\n', '\n');
const key_public = process.env.KEY_PUBLIC!.replace('\n', '\n');

// Password for sending messages
const password = process.env.PASSWORD!;

// Internal data
const server = os.hostname(); // Do not change this!

// Some requests require a User-Agent string.
const USERAGENT = 'activitybun-single-ts-file/0.0';

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

// Get the information sent to this server
// $input = file_get_contents('php://input');
// $body = json_decode($input, true);
// $bodyData = print_r($body, true);


