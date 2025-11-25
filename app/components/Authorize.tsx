import { useEffect, useRef } from "react";

export default function Authorize({
  onSuccess,
  onFailure,
}: {
  onSuccess: (token: string) => void;
  onFailure: () => void;
}) {
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const arenaCode = localStorage.getItem("arena-code");
    if (!arenaCode) return;

    fetch("/api/getAccessToken", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ code: arenaCode }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.access_token)
          throw new Error(data.error || "Token request failed");
        localStorage.setItem("arena-access-token", data.access_token);
        localStorage.removeItem("arena-code");
        onSuccess(data.access_token);
      })
      .catch((e) => {
        localStorage.removeItem("arena-code");
        localStorage.removeItem("arena-access-token");
        onFailure();
        console.error("Error:", e);
      });
  }, [onSuccess, onFailure]);

  return null;
}