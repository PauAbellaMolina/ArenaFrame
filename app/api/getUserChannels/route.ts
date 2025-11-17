// app/api/searchUsers/route.ts

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const auth = req.headers.get("authorization");

  if (!userId)
    return Response.json({ error: "Missing 'userId' param" }, { status: 400 });
  if (!auth?.toLowerCase().startsWith("bearer "))
    return Response.json({ error: "Missing Bearer token" }, { status: 401 });

  const url = `http://api.are.na/v2/users/${encodeURIComponent(userId)}/channels`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: auth,
    },
  });

  if (!res.ok)
    return Response.json({ error: "Upstream error" }, { status: res.status });

  const data = await res.json();
  return Response.json(data);
}
