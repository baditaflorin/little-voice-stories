# Privacy

Little Voice Stories is designed to be local-first.

## What Stays Local

- Kid drawing uploads.
- Drawing analysis results.
- Parent voice recordings.
- Parent voice profile measurements.
- Story drafts.
- Narration playback settings.

## What Is Sent To Servers

In the default v1 happy path, none of the above is sent to project servers because there are no project servers.

If the user opts into the experimental local LLM path, the browser may download model/runtime assets from the package's configured public model host. The story prompt and private media are still processed locally by that browser runtime.

## Analytics

No analytics are shipped in v1.

## Clearing Data

Use the in-app reset control or clear site data for https://baditaflorin.github.io/little-voice-stories/ in the browser.
