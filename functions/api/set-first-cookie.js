export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const testId = url.searchParams.get("test_id") || `test_${Date.now()}`;

  return new Response(
    JSON.stringify({
      ok: true,
      cookieName: "fp_cookie_server",
      cookieValue: testId,
      note: "First-party cookie set by server response"
    }),
    {
      headers: {
        "content-type": "application/json; charset=UTF-8",
        "cache-control": "no-store",
        "set-cookie": `fp_cookie_server=${testId}; Path=/; Max-Age=1800; Secure; SameSite=Lax`
      }
    }
  );
}
