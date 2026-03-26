/**
 * Comprehensive API Test Suite - Alumni Notes Backend
 * Tests all endpoints: Auth + Notes (ASCII-only output for PowerShell)
 * Run: node test_api.mjs
 */

const BASE_URL = "http://localhost:5000";
let token1 = "";
let token2 = "";
let userId1 = null;
let userId2 = null;
let noteId1 = null;
let noteId2 = null;
let shareId1 = "";

let passed = 0;
let failed = 0;
const results = [];

// ---------- Helper ----------------------------------------------------------
async function req(method, path, body = null, token = null) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${path}`, opts);
  let data;
  try { data = await res.json(); } catch { data = {}; }
  return { status: res.status, data };
}

function assert(label, condition, got) {
  const prefix = condition ? "[PASS]" : "[FAIL]";
  const line = condition
    ? `  ${prefix} ${label}`
    : `  ${prefix} ${label} | got: ${JSON.stringify(got)}`;
  results.push(line);
  console.log(line);
  condition ? passed++ : failed++;
}

function section(title) {
  const sep = "=".repeat(65);
  const msg = `\n${sep}\n  ${title}\n${sep}`;
  results.push(msg);
  console.log(msg);
}

// ---------- Auth Tests-------------------------------------------------------
async function testAuth() {
  section("AUTH ENDPOINTS");

  // -- Register --
  console.log("\n[POST] /api/auth/register");

  let r = await req("POST", "/api/auth/register", { email: "nopass@test.com" });
  assert("Register without password returns 400", r.status === 400, r.status);

  r = await req("POST", "/api/auth/register", {
    email: "testuser1@notes.com",
    password: "Test@1234",
    name: "Test User One"
  });
  if (r.status === 400 && r.data.message === "User already exists") {
    console.log("  [INFO] User1 already exists in DB - continuing");
    results.push("  [INFO] User1 already exists in DB - continuing");
  } else {
    assert("Register User1 (201)", r.status === 201, r.status);
    assert("Register User1 returns userId", !!r.data.userId, r.data);
  }

  r = await req("POST", "/api/auth/register", {
    email: "testuser2@notes.com",
    password: "Test@5678",
    name: "Test User Two"
  });
  if (r.status === 400 && r.data.message === "User already exists") {
    console.log("  [INFO] User2 already exists in DB - continuing");
    results.push("  [INFO] User2 already exists in DB - continuing");
  } else {
    assert("Register User2 (201)", r.status === 201, r.status);
  }

  // Duplicate register
  r = await req("POST", "/api/auth/register", {
    email: "testuser1@notes.com",
    password: "Test@1234",
    name: "Duplicate"
  });
  assert("Duplicate register returns 400", r.status === 400, r.status);
  assert("Duplicate register error message", r.data.message === "User already exists", r.data.message);

  // -- Login --
  console.log("\n[POST] /api/auth/login");

  r = await req("POST", "/api/auth/login", { email: "testuser1@notes.com" });
  assert("Login without password returns 400", r.status === 400, r.status);

  r = await req("POST", "/api/auth/login", {
    email: "testuser1@notes.com",
    password: "WrongPassword"
  });
  assert("Login wrong password returns 401", r.status === 401, r.status);

  r = await req("POST", "/api/auth/login", {
    email: "nobody@nowhere.com",
    password: "anything"
  });
  assert("Login unknown user returns 404", r.status === 404, r.status);

  r = await req("POST", "/api/auth/login", {
    email: "testuser1@notes.com",
    password: "Test@1234"
  });
  assert("Login User1 returns 200", r.status === 200, r.status);
  assert("Login User1 has token", !!r.data.token, r.data);
  assert("Login User1 has userId", !!r.data.userId, r.data);
  assert("Login User1 success message", r.data.message === "Login successful", r.data.message);
  token1 = r.data.token;
  userId1 = r.data.userId;

  r = await req("POST", "/api/auth/login", {
    email: "testuser2@notes.com",
    password: "Test@5678"
  });
  assert("Login User2 returns 200", r.status === 200, r.status);
  token2 = r.data.token;
  userId2 = r.data.userId;
}

// ---------- Notes Tests -----------------------------------------------------
async function testNotes() {
  section("NOTES ENDPOINTS");

  // -- Create Note --
  console.log("\n[POST] /api/notes/create");

  let r = await req("POST", "/api/notes/create",
    { title: "No Auth Note", content: "<p>test</p>", isPublic: false }
  );
  assert("Create note without token rejected", r.status === 401 || r.status === 403, r.status);

  r = await req("POST", "/api/notes/create",
    { title: "Private Note #1", content: "<p>Secret content</p>", isPublic: false },
    token1
  );
  assert("Create private note returns 200", r.status === 200, r.status);
  assert("Create private note returns noteId", !!r.data.noteId, r.data);
  assert("Create private note returns shareId", !!r.data.shareId, r.data);
  assert("Create private note success message", r.data.message === "Note created successfully", r.data.message);
  noteId1 = r.data.noteId;
  shareId1 = r.data.shareId;

  r = await req("POST", "/api/notes/create",
    { title: "Public Note #1", content: "<p>Public content for all</p>", isPublic: true },
    token1
  );
  assert("Create public note returns 200", r.status === 200, r.status);
  noteId2 = r.data.noteId;

  // -- Get My Notes --
  console.log("\n[GET] /api/notes/my-notes");

  r = await req("GET", "/api/notes/my-notes");
  assert("Get my notes without token rejected", r.status === 401 || r.status === 403, r.status);

  r = await req("GET", "/api/notes/my-notes", null, token1);
  assert("Get my notes returns 200", r.status === 200, r.status);
  assert("Get my notes returns array", Array.isArray(r.data), typeof r.data);
  assert("Get my notes has at least 2 notes", r.data.length >= 2, r.data.length);
  assert("Notes have title field", !!r.data[0]?.title, r.data[0]);
  assert("Notes have content field", r.data[0]?.content !== undefined, r.data[0]);

  // -- Get Note By ID --
  console.log("\n[GET] /api/notes/:id");

  r = await req("GET", `/api/notes/${noteId1}`, null, token1);
  assert("Owner gets own note (200)", r.status === 200, r.status);
  assert("Note title matches", r.data.title === "Private Note #1", r.data.title);

  r = await req("GET", `/api/notes/${noteId1}`, null, token2);
  assert("Non-owner gets 403 on private note", r.status === 403, r.status);

  r = await req("GET", "/api/notes/9999999", null, token1);
  assert("Non-existent note ID returns 404", r.status === 404, r.status);

  // -- Public Notes --
  console.log("\n[GET] /api/notes/public/all");

  r = await req("GET", "/api/notes/public/all");
  assert("Public notes accessible without auth (200)", r.status === 200, r.status);
  assert("Public notes returns array", Array.isArray(r.data), typeof r.data);
  const publicTitles = r.data.map(n => n.title);
  assert("Public note appears in list", publicTitles.includes("Public Note #1"), publicTitles.slice(0,3));
  assert("All returned notes are public", r.data.every(n => n.is_public === 1 || n.is_public === true), "has private");

  // -- Get Note By Share ID --
  console.log("\n[GET] /api/notes/share/:shareId");

  r = await req("GET", `/api/notes/share/${shareId1}`);
  assert("Private note via shareId blocked without auth (403)", r.status === 403, r.status);

  r = await req("GET", `/api/notes/share/${shareId1}`, null, token1);
  assert("Owner accesses private note via shareId (200)", r.status === 200, r.status);
  assert("ShareId note data matches", r.data.share_id === shareId1, r.data.share_id);

  r = await req("GET", "/api/notes/share/totally-invalid-share-id-xyz-000");
  assert("Invalid shareId returns 404", r.status === 404, r.status);

  // -- Update Note --
  console.log("\n[PUT] /api/notes/update/:id");

  r = await req("PUT", `/api/notes/update/${noteId1}`,
    { title: "Hacked", content: "<p>hacked</p>", isPublic: false }
  );
  assert("Update note without token rejected", r.status === 401 || r.status === 403, r.status);

  r = await req("PUT", `/api/notes/update/${noteId1}`,
    { title: "Hacked by U2", content: "<p>bad</p>", isPublic: false },
    token2
  );
  assert("Non-owner update returns 403", r.status === 403, r.status);

  r = await req("PUT", `/api/notes/update/${noteId1}`,
    { title: "Private Note #1 (Updated)", content: "<p>Updated content</p>", isPublic: false },
    token1
  );
  assert("Owner updates note (200)", r.status === 200, r.status);
  assert("Update returns success message", r.data.message === "Note saved successfully", r.data.message);

  // Verify update
  r = await req("GET", `/api/notes/${noteId1}`, null, token1);
  assert("Updated title persisted", r.data.title === "Private Note #1 (Updated)", r.data.title);

  r = await req("PUT", "/api/notes/update/9999999",
    { title: "Ghost", content: "<p>ghost</p>", isPublic: false },
    token1
  );
  assert("Update non-existent note returns 404", r.status === 404, r.status);

  // -- Share Note --
  console.log("\n[POST] /api/notes/share/:noteId");

  r = await req("POST", `/api/notes/share/${noteId1}`,
    { sharedWith: userId2, isPublic: false }
  );
  assert("Share note without token rejected", r.status === 401 || r.status === 403, r.status);

  r = await req("POST", `/api/notes/share/${noteId1}`,
    { sharedWith: userId2, isPublic: false },
    token1
  );
  assert("Share note with User2 (200)", r.status === 200, r.status);
  assert("Share note success message", r.data.message === "Note shared with user", r.data.message);

  // -- Shared With Me --
  console.log("\n[GET] /api/notes/shared-with-me");

  r = await req("GET", "/api/notes/shared-with-me");
  assert("Shared-with-me without token rejected", r.status === 401 || r.status === 403, r.status);

  r = await req("GET", "/api/notes/shared-with-me", null, token2);
  assert("User2 gets shared notes (200)", r.status === 200, r.status);
  assert("Shared-with-me returns array", Array.isArray(r.data), typeof r.data);
  const sharedIds = r.data.map(n => n.id);
  assert("Shared note appears for User2", sharedIds.includes(noteId1), sharedIds);

  r = await req("GET", "/api/notes/shared-with-me", null, token1);
  assert("User1 shared-with-me returns 200 (empty owner)", r.status === 200, r.status);

  // -- Delete Note --
  console.log("\n[DELETE] /api/notes/:id");

  r = await req("DELETE", `/api/notes/${noteId2}`);
  assert("Delete note without token rejected", r.status === 401 || r.status === 403, r.status);

  r = await req("DELETE", `/api/notes/${noteId1}`, null, token2);
  assert("Non-owner delete returns 403", r.status === 403, r.status);

  r = await req("DELETE", `/api/notes/${noteId2}`, null, token1);
  assert("Owner deletes public note (200)", r.status === 200, r.status);
  assert("Delete success message", r.data.message === "Note deleted successfully", r.data.message);

  r = await req("GET", `/api/notes/${noteId2}`, null, token1);
  assert("Deleted note is now 404", r.status === 404, r.status);

  r = await req("DELETE", "/api/notes/9999999", null, token1);
  assert("Delete non-existent note returns 404", r.status === 404, r.status);

  // Cleanup
  await req("DELETE", `/api/notes/${noteId1}`, null, token1);
  console.log("\n  [INFO] Cleanup: test notes removed from DB");
}

// ---------- Main ------------------------------------------------------------
async function runTests() {
  console.log("\nAPI Test Suite - Alumni Notes Backend");
  console.log(`Base URL : ${BASE_URL}`);
  console.log(`Time     : ${new Date().toISOString()}`);

  try {
    await testAuth();
    await testNotes();
  } catch (err) {
    console.error("\n[CRASH] Unexpected error:", err.message);
    console.error(err.stack);
    failed++;
  }

  section("TEST SUMMARY");
  console.log(`\n  Total Passed : ${passed}`);
  console.log(`  Total Failed : ${failed}`);
  console.log(`  Total Tests  : ${passed + failed}`);
  console.log(failed === 0
    ? "\n  ALL TESTS PASSED!"
    : `\n  WARNING: ${failed} test(s) failed.`
  );
  console.log("");
}

runTests();
