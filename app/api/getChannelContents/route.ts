// app/api/getChannelContents/route.ts

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const channelId = searchParams.get("channelId");
  const per = searchParams.get("per") || "5";
  const page = searchParams.get("page") || "1";
  const auth = req.headers.get("authorization");

  if (!channelId)
    return Response.json({ error: "Missing 'channelId' param" }, { status: 400 });
  if (!auth?.toLowerCase().startsWith("bearer "))
    return Response.json({ error: "Missing Bearer token" }, { status: 401 });

  const url = `http://api.are.na/v2/channels/${encodeURIComponent(channelId)}/contents?per=${per}&page=${page}`;
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
