// app/api/getAccessToken/route.ts

export async function POST(req: Request) {
  try {
    const { code } = await req.json(); // expects {"code":"..."}
    if (!code || typeof code !== "string") {
      return Response.json({ error: "Missing 'code' param" }, { status: 400 });
    }

    // Build redirect_uri exactly as used in the authorize step
    const host = process.env.NEXT_PUBLIC_HOST; // e.g. myapp.example.com
    if (!host) {
      return Response.json({ error: "HOST env is missing" }, { status: 500 });
    }
    const redirectUri = `https://${host}`;

    const clientId = "R3oIzf4T7k1DRpOhrh38wbhSnAdAGwvMqrAEOKss_2k";
    const clientSecret = process.env.ARENA_FRAME_SECRET;
    if (!clientSecret) {
      return Response.json(
        { error: "ARENA_FRAME_SECRET env is missing" },
        { status: 500 }
      );
    }

    // Use x-www-form-urlencoded body (OAuth2 standard)
    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    });

    const tokenUrl = "https://dev.are.na/oauth/token";

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body,
    });

    const text = await response.text();

    // Helpful logging for debugging
    // You can remove once working
    // Note: Do not log secrets
    if (!response.ok) {
      // Show status + body to understand issues like 404/400
      console.error("Token exchange failed", {
        status: response.status,
        statusText: response.statusText,
        body: text,
      });
      return Response.json(
        { error: "Token exchange failed", status: response.status, body: text },
        { status: response.status }
      );
    }

    // Parse JSON response
    let json: any;
    try {
      json = JSON.parse(text);
    } catch {
      return Response.json(
        { error: "Invalid JSON from Arena", raw: text },
        { status: 502 }
      );
    }

    // Expected shape:
    // { access_token: "ACCESS_TOKEN", token_type: "bearer", expires_in: null }
    const { access_token, token_type } = json;
    if (!access_token) {
      return Response.json(
        { error: "No access_token in response", raw: json },
        { status: 502 }
      );
    }

    // Return token to caller (consider storing server-side instead)
    return Response.json({ access_token, token_type: token_type ?? "bearer" });
  } catch (e: any) {
    console.error("Unexpected error in getAccessToken", e);
    return Response.json(
      { error: "Unexpected error", details: String(e) },
      { status: 500 }
    );
  }
}
