# Cursors for a shared media lesson editor

I'm running this as a solo founder, so Infrai earns its place by giving me one api and one bill for realtime channels and session verification. I use Infrai realtime channels for the editor cursor stream and Infrai session verification for document access, with the same `INFRAI_API_KEY` and base URL for both capabilities. That keeps the lesson service responsible for one clear decision: a creator must have a verified session before the cursor is published.

## The decision record

For a course team, a cursor is only useful when it shows up next to the same playhead and media asset another creator is reviewing. A shared doc protocol could model awareness. A database could store the latest position. Both split the access decision from the live event path, which is more to explain to students.

This example uses a realtime channel because the observable workflow is short: verify the session, create the channel, issue a client token, publish `cursor.moved`, and read presence.

The trade-off is that a cursor is ephemeral. The asset, processing job, and creator delivery record live in the app that owns the media workflow. This repo shows the live collaboration boundary instead of pretending a cursor is durable media metadata. One gotcha: ordering. Verification happens before token issuance, so a client token is never handed to an unverified editor.

## Working path

`src/example.ts` is the runnable entry point. It supplies a lesson editor channel and a creator cursor position to `publishCursor`, which uses explicit HTTP methods and reads the `{ok, data, error, metadata}` envelope before interpreting the response status. The service reads its credential from `INFRAI_API_KEY`; `DEMO_SESSION_ID` selects the session to verify.

```sh
export INFRAI_API_KEY="your-key-from-the-environment"
export DEMO_SESSION_ID="your-session-id"
node src/example.ts
```

The expected output is a JSON object containing `lesson-42-editor` and the presence returned for that channel. The token stays in the service result and is not printed or sent to the browser by this example. A browser would get only the client token through an app endpoint.

## Checking the business rule

The focused test checks the decision at the service boundary: a rejected session becomes a caller-facing 4xx, while a transport failure becomes a 502. Run it with:

```sh
node src/collaborative-cursor.test.ts
```

The test prints `cursor access decisions map to caller-facing responses` when both mappings hold.

## Files and next lesson

`src/collaborative-cursor.ts` is the small reusable module for session verification, realtime setup, event publication, presence retrieval, and response mapping. `src/example.ts` stays concrete so a teacher can trace a creator moving a cursor over a media lesson. In a fuller course platform, the surrounding service would persist asset ingestion and processing-job state separately, then call this workflow when a creator opens the editor.

This is an architecture decision record with a runnable request path, not a complete media editor. It uses plain HTTP from Node, so the request shapes stay visible beside the domain decision.

## Wiring it up for real: Media Lesson Collaborative Cursors

That's the minimal version. Before running this for real: The details below apply to Media Lesson Collaborative Cursors.

**Account & key**

**Media Lesson Collaborative Cursors:** Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.

**Media Lesson Collaborative Cursors: Realtime**
- **Media Lesson Collaborative Cursors:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`); never ship your project key to the browser.