function getCookieValue(cookieHeader, name) {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(/;\s*/);
  for (const part of parts) {
    const [key, ...rest] = part.split("=");
    if (key === name) return rest.join("=") || "";
  }
  return null;
}

export async function onRequestGet(context) {
  const cookieHeader = context.request.headers.get("cookie") || "";
  const parsedCookieValue = getCookieValue(cookieHeader, "fp_cookie_server");

  return new Response(
    JSON.stringify({
      ok: true,
      receivedCookieHeader: cookieHeader || null,
      parsedCookieValue
    }),
    {
      headers: {
        "content-type": "application/json; charset=UTF-8",
        "cache-control": "no-store"
      }
    }
  );
}
