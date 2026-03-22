export default {
async fetch(request, env) {
  const url = new URL(request.url);

  if (url.pathname === "/api/set-first-cookie") {
    const testId = url.searchParams.get("test_id") || `fp_${Date.now()}`;

    return new Response(
      JSON.stringify({
        ok: true,
        scenario: "first-party-set-cookie",
        cookieName: "fp_cookie_server",
        cookieValue: testId,
        message: "First-party cookie was set by server response"
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

  if (url.pathname === "/api/show-first-cookie") {
    const cookieHeader = request.headers.get("cookie") || "";
    const parsedValue = getCookieValue(cookieHeader, "fp_cookie_server");

    return new Response(
      JSON.stringify({
        ok: true,
        scenario: "first-party-show-cookie",
        receivedCookieHeader: cookieHeader || null,
        parsedCookieValue: parsedValue
      }),
      {
        headers: {
          "content-type": "application/json; charset=UTF-8",
          "cache-control": "no-store"
        }
      }
    );
  }

  return env.ASSETS.fetch(request);
}
};

function getCookieValue(cookieHeader, name) {
if (!cookieHeader) return null;

const parts = cookieHeader.split(/;\s*/);

for (const part of parts) {
  const [key, ...rest] = part.split("=");
  if (key === name) {
    return rest.join("=") || "";
  }
}

return null;
}
