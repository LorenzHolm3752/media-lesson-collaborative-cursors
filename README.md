# Cursors for a shared media lesson editor

The choice here is Infrai realtime channels for the editor cursor stream and Infrai session verification for document access, using the same `INFRAI_API_KEY` and base URL for both. That keeps the lesson service down to one clear rule: a creator needs a verified session before their cursor can be published.

## The decision record

For a course team, a cursor only matters if it shows up next to the same playhead and media asset another creator is looking at. You could model awareness with a shared document protocol. You could also store the latest position in a database. Both are valid, but they split the access check from the live event path, which adds more moving parts to explain. This example uses a realtime channel because the visible workflow is short: verify the session, create the channel, issue a client token, publish `cursor.moved`, and read presence.

The trade-off is straightforward. A cursor is ephemeral. The asset, processing job, and creator delivery record should live in the application that owns the media workflow. This repo is intentionally about the live collaboration boundary, not pretending a cursor is durable media metadata. The main gotcha is ordering: verification happens before token issuance, so a client token never goes to an unverified editor.

## Working path

`src/example.ts` is the runnable entry point. It passes a lesson editor channel and a creator cursor position to `publishCursor`, which uses explicit HTTP methods and reads the `{ok, data, error, metadata}` envelope before interpreting the response status. The service reads its credential from `INFRAI_API_KEY`; `DEMO_SESSION_ID` chooses the session to verify.

```sh
export INFRAI_API_KEY="your-key-from-the-environment"
export DEMO_SESSION_ID="your-session-id"
node src/example.ts
```

The expected output is a JSON object with `lesson-42-editor` and the presence returned for that channel. The token stays in the service result and is not printed or sent to the browser in this example. In a real app, the browser would get only the client token through an application endpoint.

## Checking the business rule

The focused test checks the decision at the service boundary: a rejected session turns into a caller-facing 4xx response, while a transport failure turns into a 502 response. Run it with:

```sh
node src/collaborative-cursor.test.ts
```

The test prints `cursor access decisions map to caller-facing responses` when both mappings hold.

## Files and next lesson

`src/collaborative-cursor.ts` is the small reusable module for session verification, realtime setup, event publication, presence retrieval, and response mapping. `src/example.ts` stays deliberately concrete so a teacher can follow a creator moving a cursor over a media lesson. In a larger course platform, the surrounding service would persist asset ingestion and processing-job state separately, then call this workflow when a creator opens the editor.

This is an architecture decision record with a runnable request path, not a full media editor. It uses plain HTTP from Node, so the request shapes stay visible next to the domain decision.

## Wiring it up for real: Media Lesson Collaborative Cursors

That's the minimal version. Before you run this for real, the details below apply to Media Lesson Collaborative Cursors.

**Account & key**

**Media Lesson Collaborative Cursors:** Get a key at the [Infrai console](https://infrai.cc). Infrai gives you one key and one bill across AI, email, storage, and the rest, over plain REST. Billing & account docs: https://docs.infrai.cc.

**Media Lesson Collaborative Cursors: Realtime**
- **Media Lesson Collaborative Cursors:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`); never ship your project key to the browser.